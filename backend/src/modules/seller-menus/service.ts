import { and, asc, eq } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { menuItems } from '../../db/schema/index.js';
import type { CreateMenuInput, UpdateMenuInput } from './schema.js';

type AppError = { status: number; message: string };

function fail(status: number, message: string): never {
  throw { status, message } satisfies AppError;
}

/**
 * Daftar menu kantin ini. `includeInactive` dipakai halaman seller supaya menu
 * yang sedang disembunyikan tetap bisa dinyalakan lagi.
 */
export async function listMenus(
  vendorId: number,
  options: { category?: string; includeInactive?: boolean } = {}
) {
  const conditions = [eq(menuItems.vendorId, vendorId)];

  if (!options.includeInactive) {
    conditions.push(eq(menuItems.active, true));
  }

  if (options.category && options.category !== 'semua') {
    conditions.push(
      eq(menuItems.category, options.category as (typeof menuItems.category.enumValues)[number])
    );
  }

  return db
    .select()
    .from(menuItems)
    .where(and(...conditions))
    .orderBy(asc(menuItems.id));
}

// MenuFormModal mengirim "" saat gambar dihapus; kolom image menyimpan null.
function normalizeImage(value: string | null | undefined): string | null {
  return value ? value : null;
}

export async function createMenu(vendorId: number, input: CreateMenuInput) {
  // vendorId selalu dari seller yang login, tidak pernah dari request — kalau
  // diterima dari client, seller bisa menulis menu ke kantin orang lain.
  const [row] = await db
    .insert(menuItems)
    .values({
      vendorId,
      name: input.name,
      description: input.description,
      price: input.price,
      category: input.category,
      image: normalizeImage(input.image),
      active: input.active,
    })
    .returning();

  if (!row) {
    fail(500, 'Menu gagal disimpan.');
  }

  return row;
}

/**
 * Ubah menu milik kantin ini saja. `vendorId` tidak ada di patch, jadi menu
 * tidak bisa "dipindah" ke kantin lain lewat request.
 */
export async function updateMenu(
  menuId: number,
  vendorId: number,
  input: UpdateMenuInput
) {
  const patch: Partial<typeof menuItems.$inferInsert> = {};

  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.price !== undefined) patch.price = input.price;
  if (input.category !== undefined) patch.category = input.category;
  if (input.image !== undefined) patch.image = normalizeImage(input.image);
  if (input.active !== undefined) patch.active = input.active;

  const [row] = await db
    .update(menuItems)
    .set(patch)
    .where(and(eq(menuItems.id, menuId), eq(menuItems.vendorId, vendorId)))
    .returning();

  if (!row) {
    // Menu ada tapi milik kantin lain, atau memang tidak ada. Keduanya dibalas
    // sama supaya seller tidak bisa menebak id menu kantin orang lain.
    fail(404, 'Menu tidak ditemukan.');
  }

  return row;
}

export async function toggleMenu(menuId: number, vendorId: number, active: boolean) {
  const [row] = await db
    .update(menuItems)
    .set({ active })
    .where(and(eq(menuItems.id, menuId), eq(menuItems.vendorId, vendorId)))
    .returning();

  if (!row) {
    fail(404, 'Menu tidak ditemukan.');
  }

  return row;
}

/**
 * Hapus menu. Baris di `order_items` tetap ada karena kolom `menu_item_id`
 * memakai ON DELETE SET NULL — nama & harga di sana sudah berupa snapshot,
 * jadi riwayat pesanan lama tidak ikut berubah.
 */
export async function deleteMenu(menuId: number, vendorId: number) {
  const [row] = await db
    .delete(menuItems)
    .where(and(eq(menuItems.id, menuId), eq(menuItems.vendorId, vendorId)))
    .returning({ id: menuItems.id });

  if (!row) {
    fail(404, 'Menu tidak ditemukan.');
  }

  return { id: row.id, pesan: 'Menu berhasil dihapus.' };
}
