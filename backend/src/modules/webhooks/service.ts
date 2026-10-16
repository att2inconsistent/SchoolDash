import crypto from 'crypto';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { transactions, wallets } from '../../db/schema/index.js';

interface MidtransNotification {
  order_id: string;
  status_code: string;
  gross_amount: string;
  transaction_status: string;
  fraud_status?: string;
}

/**
 * Verifikasi signature SHA512 dari Midtrans.
 * https://docs.midtrans.com/reference/notification-webhooks#notification-signature-key
 */
export function verifySignature(
  notification: MidtransNotification,
  receivedSignature: string
): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || 'test-server-key';
  const { order_id, status_code, gross_amount } = notification;

  const signatureInput = `${order_id}${status_code}${gross_amount}${serverKey}`;
  const hash = crypto.createHash('sha512').update(signatureInput).digest('hex');

  return hash === receivedSignature;
}

/**
 * Proses notifikasi Midtrans — idempoten berdasarkan gateway_ref.
 * Hanya update status jika transaksi masih Menunggu.
 */
export async function processNotification(notification: MidtransNotification) {
  const { order_id, transaction_status, fraud_status } = notification;

  // Cari transaksi berdasarkan gateway_ref
  const [txn] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.gatewayRef, order_id))
    .limit(1);

  if (!txn) {
    console.warn(`[webhook] gateway_ref ${order_id} tidak ditemukan — skip.`);
    return;
  }

  // Idempotency: kalau sudah final (Berhasil/Gagal), skip
  if (txn.status === 'Berhasil' || txn.status === 'Gagal') {
    console.log(`[webhook] ${order_id} sudah ${txn.status} — skip.`);
    return;
  }

  // Map Midtrans status ke status kita
  let newStatus: 'Menunggu' | 'Berhasil' | 'Gagal' = 'Menunggu';

  if (transaction_status === 'capture' || transaction_status === 'settlement') {
    // Cek fraud_status untuk capture (kartu kredit)
    if (transaction_status === 'capture' && fraud_status === 'challenge') {
      newStatus = 'Menunggu'; // masih di-review Midtrans
    } else {
      newStatus = 'Berhasil';
    }
  } else if (
    transaction_status === 'deny' ||
    transaction_status === 'cancel' ||
    transaction_status === 'expire'
  ) {
    newStatus = 'Gagal';
  } else if (transaction_status === 'pending') {
    newStatus = 'Menunggu';
  }

  // Update transaksi
  await db.update(transactions).set({ status: newStatus }).where(eq(transactions.id, txn.id));

  console.log(`[webhook] ${order_id} → ${newStatus}`);

  // Kalau topup berhasil, kredit wallet
  if (newStatus === 'Berhasil' && txn.kind === 'topup') {
    await db
      .update(wallets)
      .set({ balance: sql`${wallets.balance} + ${txn.amount}` })
      .where(eq(wallets.id, txn.walletId));

    console.log(`[webhook] kredit wallet ${txn.walletId} +${txn.amount}`);
  }

  // Kalau withdrawal berhasil, debit wallet (sudah di-hold saat create, tapi status baru final sekarang)
  // CATATAN: untuk Midtrans Disbursement, debit baru dilakukan DI SINI (bukan saat create)
  // karena kita tidak mau hold uang seller kalau disbursement belum approved.
  // Strategi: buat withdrawal dengan status=Menunggu, amount BELUM didebit, webhook debit saat Berhasil.
  // Untuk instant withdrawal (gateway='instant'), langsung debit + status=Berhasil saat create (existing flow).
}
