import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { transactions, wallets } from '../../db/schema/index.js';
import { adjustBalance, lockWallet, newId, recordTransaction } from '../../utils/money.js';
import type { TopUpInput, WithdrawalInput } from './schema.js';

type AppError = { status: number; message: string };

function fail(status: number, message: string): never {
  throw { status, message } satisfies AppError;
}

// QRIS demo berlaku 15 menit, sama dengan hitung mundur TopUpPage.
const QRIS_TTL_MS = 15 * 60 * 1000;

export async function getBalance(ownerType: 'student' | 'seller', ownerId: number) {
  const [wallet] = await db
    .select({ id: wallets.id, balance: wallets.balance })
    .from(wallets)
    .where(and(eq(wallets.ownerType, ownerType), eq(wallets.ownerId, ownerId)))
    .limit(1);

  if (!wallet) {
    fail(404, 'Dompet tidak ditemukan.');
  }

  return wallet;
}

export async function listTransactions(
  ownerType: 'student' | 'seller',
  ownerId: number,
  limit: number
) {
  const wallet = await getBalance(ownerType, ownerId);

  return db
    .select({
      id: transactions.id,
      orderId: transactions.orderId,
      amount: transactions.amount,
      kind: transactions.kind,
      status: transactions.status,
      note: transactions.note,
      qrisPayload: transactions.qrisPayload,
      expiresAt: transactions.expiresAt,
      bank: transactions.bank,
      accountName: transactions.accountName,
      accountNumber: transactions.accountNumber,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .where(eq(transactions.walletId, wallet.id))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
}

/**
 * Buat permintaan top up. DUIT BELUM MASUK — hanya membuat QRIS.
 * Saldo baru bertambah setelah confirmTopUp() dan statusnya jadi 'Berhasil'.
 */
export async function createTopUp(studentId: number, input: TopUpInput) {
  const wallet = await getBalance('student', studentId);

  const id = newId('TRX');
  const expiresAt = new Date(Date.now() + QRIS_TTL_MS);

  // QRIS asli akan datang dari payment gateway. Selama belum ada gateway,
  // payload ini memakai format EMVQRIS yang bisa dibaca QRCodeSVG di frontend.
  const qrisPayload = buildDemoQris(id, input.amount);

  await recordTransaction(db, {
    walletId: wallet.id,
    amount: input.amount,
    kind: 'topup',
    status: 'Menunggu',
    note: `Top up Rp${input.amount.toLocaleString('id-ID')}`,
    qrisPayload,
    expiresAt,
    id,
  });

  return { id, amount: input.amount, qrisPayload, expiresAt: expiresAt.getTime() };
}

export async function getTopUpStatus(studentId: number, transactionId: string) {
  const wallet = await getBalance('student', studentId);

  const [row] = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.id, transactionId),
        eq(transactions.walletId, wallet.id),
        eq(transactions.kind, 'topup')
      )
    )
    .limit(1);

  if (!row) {
    fail(404, 'Transaksi tidak ditemukan.');
  }

  const expired = row.expiresAt !== null && row.expiresAt.getTime() < Date.now();

  return {
    id: row.id,
    amount: row.amount,
    status: row.status,
    kind: row.kind,
    note: row.note,
    qrisPayload: row.qrisPayload,
    expiresAt: row.expiresAt,
    expired,
  };
}

/**
 * Konfirmasi pembayaran top up → saldo bertambah.
 *
 * Idempoten: memanggilnya dua kali untuk id yang sama tidak menambah saldo dua
 * kali, karena baris yang sama dikunci FOR UPDATE lalu dicek statusnya.
 */
export async function confirmTopUp(studentId: number, transactionId: string) {
  return db.transaction(async (tx) => {
    const wallet = await lockWallet(tx, 'student', studentId);

    const [row] = await tx
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.walletId, wallet.id),
          eq(transactions.kind, 'topup')
        )
      )
      .for('update')
      .limit(1);

    if (!row) {
      fail(404, 'Transaksi tidak ditemukan.');
    }

    if (row.status === 'Berhasil') {
      // Sudah diproses sebelumnya — balas saldo sekarang, jangan tambah lagi.
      return { id: row.id, status: row.status, alreadyProcessed: true, balance: wallet.balance };
    }

    if (row.status === 'Gagal') {
      fail(400, 'Transaksi ini sudah gagal.');
    }

    if (row.expiresAt !== null && row.expiresAt.getTime() < Date.now()) {
      await tx
        .update(transactions)
        .set({ status: 'Gagal' })
        .where(eq(transactions.id, transactionId));

      fail(400, 'QRIS sudah kedaluwarsa. Silakan buat top up baru.');
    }

    await tx
      .update(transactions)
      .set({ status: 'Berhasil' })
      .where(eq(transactions.id, transactionId));

    const updated = await adjustBalance(tx, wallet.id, row.amount);

    return {
      id: row.id,
      status: 'Berhasil' as const,
      alreadyProcessed: false,
      balance: updated?.balance ?? wallet.balance,
    };
  });
}

/**
 * Tarik dana ke rekening bank. Saldo langsung terpotong dan penarikan langsung
 * berstatus 'Berhasil' — sama seperti perilaku withdraw() di frontend yang
 * sekarang. Status 'Menunggu' dipakai nanti saat benar-benar ada payment
 * gateway untuk transfer keluar.
 */
export async function withdraw(sellerId: number, input: WithdrawalInput) {
  return db.transaction(async (tx) => {
    const wallet = await lockWallet(tx, 'seller', sellerId);

    if (wallet.balance < input.amount) {
      fail(400, 'Saldo tidak mencukupi.');
    }

    const updated = await adjustBalance(tx, wallet.id, -input.amount);

    const row = await recordTransaction(tx, {
      walletId: wallet.id,
      amount: -input.amount,
      kind: 'withdrawal',
      status: 'Berhasil',
      note: `Penarikan ke ${input.bank}`,
      bank: input.bank,
      accountName: input.accountName,
      accountNumber: input.accountNumber,
    });

    return {
      id: row.id,
      bank: row.bank,
      accountName: row.accountName,
      accountNumber: row.accountNumber,
      amount: row.amount,
      status: row.status,
      createdAt: row.createdAt,
      balance: updated?.balance ?? wallet.balance,
    };
  });
}

function buildDemoQris(id: string, amount: number): string {
  const amountStr = String(amount).padStart(13, '0');
  // CRC-16/CCITT-FALSE wajib ada supaya payload dianggap QRIS valid oleh
  // scanner sungguhan.
  const payload = `00020101ID.CO.SCHOOLDASH.WEB65052003ID.SCHOOLDASH.SCH6214ID.SCHOOLDASH${amountStr}6304`;
  const crc = crc16(payload);
  return `${payload}${crc}`;
}

function crc16(input: string): string {
  let crc = 0xffff;

  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}
