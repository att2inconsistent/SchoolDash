import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { menuItems, orderItems, orders, students, vendors } from '../../db/schema/index.js';
import { adjustBalance, lockWallet, newId, recordTransaction } from '../../utils/money.js';
import type { CreateOrderInput, OrderQuery } from './schema.js';

type AppError = { status: number; message: string };

function fail(status: number, message: string): never {
  throw { status, message } satisfies AppError;
}

// Satu pesanan hanya boleh untuk satu kantin: kolom orders.vendor_id tidak
// nullable, dan-seller juga menerima satu pesanan per klik Terima. Keranjang
// yang campur harus dipecah di sisi frontend sebelum dikirim.
const MAX_QTY_PER_ITEM = 50;

/**
 * Buat pesanan + potong saldo dalam SATU transaksi.
 *
 * Kalau dipecah jadi dua, ada dua kemungkinan buruk: order masuk tapi saldo
 * tidak terpotong (pesanan gratis), atau saldo terpotong tapi order hilang.
 * Karena itu wallet dikunci FOR UPDATE lebih dulu — lihat utils/money.ts.
 */
export async function createOrder(studentId: number, input: CreateOrderInput) {
  const menuIds = [...new Set(input.items.map((item) => item.menuItemId))];

  // Harga & nama SELALU dari database. Kalau mempercayai price dari client,
  // siswa bisa memesan semua menu dengan harga 1 rupiah.
  const rows = await db
    .select({
      id: menuItems.id,
      name: menuItems.name,
      price: menuItems.price,
      active: menuItems.active,
      vendorId: menuItems.vendorId,
      vendorName: vendors.name,
    })
    .from(menuItems)
    .innerJoin(vendors, eq(menuItems.vendorId, vendors.id))
    .where(inArray(menuItems.id, menuIds));

  const byId = new Map(rows.map((row) => [row.id, row]));

  for (const item of input.items) {
    const menu = byId.get(item.menuItemId);
    if (!menu) {
      fail(404, 'Menu tidak ditemukan.');
    }
    if (!menu.active) {
      fail(400, `"${menu.name}" sedang tidak tersedia.`);
    }
    if (item.qty > MAX_QTY_PER_ITEM) {
      fail(400, `Jumlah pesanan "${menu.name}" maksimal ${MAX_QTY_PER_ITEM}.`);
    }
  }

  const vendorIds = new Set(rows.map((row) => row.vendorId));
  if (vendorIds.size !== 1) {
    fail(400, 'Semua menu dalam pesanan harus dari kantin yang sama.');
  }

  const vendorId = rows[0]!.vendorId;

  return db.transaction(async (tx) => {
    const [student] = await tx
      .select({ id: students.id, name: students.name, kelas: students.kelas })
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!student) {
      fail(404, 'Akun tidak ditemukan.');
    }

    const wallet = await lockWallet(tx, 'student', studentId);

    // subtotal dihitung dari harga DB, bukan dari total yang dikirim frontend.
    let subtotal = 0;
    let totalItems = 0;
    const snapshots = input.items.map((item) => {
      const menu = byId.get(item.menuItemId)!;
      subtotal += menu.price * item.qty;
      totalItems += item.qty;
      return { menu, qty: item.qty };
    });

    if (subtotal <= 0) {
      fail(400, 'Total pesanan tidak valid.');
    }

    if (wallet.balance < subtotal) {
      fail(400, 'Saldo tidak mencukupi.');
    }

    const orderId = newId('ORD');

    await tx.insert(orders).values({
      id: orderId,
      studentId,
      // snapshot: nama & kelas tidak ikut berubah kalau siswa ganti profil.
      studentName: student.name,
      studentKelas: student.kelas,
      vendorId,
      status: 'Menunggu',
      totalItems,
      total: subtotal,
    });

    await tx.insert(orderItems).values(
      snapshots.map(({ menu, qty }) => ({
        orderId,
        menuItemId: menu.id,
        // snapshot: nama & harga tidak ikut berubah kalau seller ubah menu.
        name: menu.name,
        price: menu.price,
        qty,
      }))
    );

    await adjustBalance(tx, wallet.id, -subtotal);
    await recordTransaction(tx, {
      walletId: wallet.id,
      orderId,
      amount: -subtotal,
      kind: 'order',
      status: 'Berhasil',
      note: `Pesanan ${orderId}`,
    });

    // Balasannya harus dibangun dari `tx`, bukan lewat getOrderById() — fungsi
    // itu membaca lewat `db` (koneksi lain) sehingga baris yang belum commit
    // tidak terlihat dan pesanan yang baru dibuat akan terbaca "tidak ada".
    const [created] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);

    return {
      ...created!,
      items: snapshots.map(({ menu, qty }) => ({
        menuItemId: menu.id,
        name: menu.name,
        price: menu.price,
        qty,
      })),
    };
  });
}

export async function listStudentOrders(studentId: number, query: OrderQuery) {
  const conditions = [eq(orders.studentId, studentId)];

  if (query.status) {
    conditions.push(eq(orders.status, query.status));
  }

  const rows = await db
    .select()
    .from(orders)
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt))
    .limit(query.limit);

  return attachItems(rows);
}

export async function getOrderById(orderId: string, studentId: number) {
  const [row] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.studentId, studentId)))
    .limit(1);

  if (!row) {
    fail(404, 'Pesanan tidak ditemukan.');
  }

  const [withItems] = await attachItems([row]);
  return withItems!;
}

type OrderRow = typeof orders.$inferSelect;

async function attachItems(rows: OrderRow[]) {
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const items = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, ids));

  const byOrder = new Map<string, typeof items>();
  for (const item of items) {
    const list = byOrder.get(item.orderId);
    if (list) list.push(item);
    else byOrder.set(item.orderId, [item]);
  }

  return rows.map((row) => ({
    ...row,
    // Nama field mengikuti frontend: `items`, bukan `orderItems`.
    items: (byOrder.get(row.id) ?? []).map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      name: item.name,
      price: item.price,
      qty: item.qty,
    })),
  }));
}

/**
 * Seller memindahkan status ke tahap berikutnya.
 *
 * Hanya maju (Menunggu → Sedang Dibuat → Selesai), tidak mundur, supaya
 * Jadi penjualan tidak bisa dihitung dua kali.
 *
 * Saat status jadi 'Selesai', dompet seller dikredit di DALAM transaksi yang
 * sama. Nominalnya diambil dari orders.total, tidak pernah dari request, jadi
 * penjual tidak bisa mengarang jumlah uang masuk.
 */
export async function updateOrderStatus(
  orderId: string,
  vendorId: number,
  next: 'Sedang Dibuat' | 'Selesai'
) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.vendorId, vendorId)))
      .for('update')
      .limit(1);

    if (!row) {
      fail(404, 'Pesanan tidak ditemukan.');
    }

    const allowed: Record<OrderRow['status'], string[]> = {
      Menunggu: ['Sedang Dibuat', 'Selesai'],
      'Sedang Dibuat': ['Selesai'],
      Selesai: [],
    };

    if (!allowed[row.status].includes(next)) {
      if (row.status === 'Selesai') {
        fail(400, 'Pesanan ini sudah selesai.');
      }
      fail(400, `Status tidak bisa diubah dari "${row.status}" ke "${next}".`);
    }

    const [updated] = await tx
      .update(orders)
      .set({ status: next })
      .where(and(eq(orders.id, orderId), eq(orders.vendorId, vendorId)))
      .returning();

    if (!updated) {
      fail(404, 'Pesanan tidak ditemukan.');
    }

    // Kunci baris pesanan di atas yang membuat kredit ini idempoten: dua
    // request "Selesai" bersamaan hanya satu yang lolos cek status.
    if (next === 'Selesai') {
      const wallet = await lockWallet(tx, 'seller', vendorId);

      await adjustBalance(tx, wallet.id, updated.total);
      await recordTransaction(tx, {
        walletId: wallet.id,
        orderId,
        amount: updated.total,
        kind: 'earning',
        status: 'Berhasil',
        note: `Pesanan ${orderId}`,
      });
    }

    return updated;
  });
}

export async function listVendorOrders(vendorId: number, query: OrderQuery) {
  const conditions = [eq(orders.vendorId, vendorId)];

  if (query.status) {
    conditions.push(eq(orders.status, query.status));
  }

  const rows = await db
    .select()
    .from(orders)
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt))
    .limit(query.limit);

  return attachItems(rows);
}
