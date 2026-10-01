import { and, eq, sql } from 'drizzle-orm';
import { db } from '../config/db.js';
import { transactions, wallets } from '../db/schema/index.js';

export type OwnerType = 'student' | 'seller';

// Bentuk db.transaction(tx => ...) supaya inti uang bisa dipakai dari modul
// mana saja tanpa mengarang ulang tipe. Executor = bisa jalan di dalam
// transaksi ATAU langsung di db.
export type Db = typeof db;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
export type Executor = Tx | Db;

// Id dibuat dari timestamp + acak supaya dua request bersamaan tidak mungkin
// menghasilkan id sama. Date.now() saja tidak cukup.
export function newId(prefix: string): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${stamp}${rand}`;
}

/**
 * Ambil dompet pemilik dengan baris dikunci FOR UPDATE.
 *
 * Kunci ini wajib: tanpa itu dua checkout yang jalan bersamaan bisa dua-duanya
 * membaca saldo yang sama lalu sama-sama mengurangi, sehingga saldo jadi
 * negatif. FOR UPDATE membuat transaksi kedua menunggu sampai yang pertama
 * selesai commit.
 */
export async function lockWallet(tx: Tx, ownerType: OwnerType, ownerId: number) {
  const [wallet] = await tx
    .select()
    .from(wallets)
    .where(and(eq(wallets.ownerType, ownerType), eq(wallets.ownerId, ownerId)))
    .for('update')
    .limit(1);

  if (!wallet) {
    // Dompet dibuat saat register, jadi ini hanya terjadi kalau datanya rusak.
    throw {
      status: 500,
      message: 'Dompet tidak ditemukan. Silakan hubungi admin.',
    } satisfies { status: number; message: string };
  }

  return wallet;
}

/**
 * Ubah saldo dompet yang SUDAH dikunci. amount > 0 = masuk, < 0 = keluar.
 * calling without lockWallet beforehand = celah double-spend.
 */
export async function adjustBalance(executor: Executor, walletId: number, amount: number) {
  if (amount === 0) return;

  const [updated] = await executor
    .update(wallets)
    .set({ balance: sql`${wallets.balance} + ${amount}` })
    .where(eq(wallets.id, walletId))
    .returning();

  return updated ?? null;
}

/**
 * Catat satu arus duit di tabel `transactions` (satu tabel untuk 4 jenis:
 * topup, order, earning, withdrawal).
 */
export async function recordTransaction(
  executor: Executor,
  entry: {
    walletId: number;
    orderId?: string | null;
    amount: number;
    kind: 'topup' | 'order' | 'earning' | 'withdrawal';
    status: 'Menunggu' | 'Berhasil' | 'Gagal';
    note?: string;
    qrisPayload?: string | null;
    expiresAt?: Date | null;
    bank?: string | null;
    accountName?: string | null;
    accountNumber?: string | null;
    id?: string;
  }
) {
  const [row] = await executor
    .insert(transactions)
    .values({
      id: entry.id ?? newId(prefixFor(entry.kind)),
      walletId: entry.walletId,
      orderId: entry.orderId ?? null,
      amount: entry.amount,
      kind: entry.kind,
      status: entry.status,
      note: entry.note ?? '',
      qrisPayload: entry.qrisPayload ?? null,
      expiresAt: entry.expiresAt ?? null,
      bank: entry.bank ?? null,
      accountName: entry.accountName ?? null,
      accountNumber: entry.accountNumber ?? null,
    })
    .returning();

  return row!;
}

function prefixFor(kind: 'topup' | 'order' | 'earning' | 'withdrawal'): string {
  switch (kind) {
    case 'topup':
      return 'TRX';
    case 'order':
      return 'ORDPAY';
    case 'earning':
      return 'EAR';
    case 'withdrawal':
      return 'WDR';
  }
}
