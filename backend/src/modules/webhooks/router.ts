import { Router } from 'express';
import { z } from 'zod';
import { processNotification, verifySignature } from './service.js';

const router = Router();

/**
 * Midtrans webhook — dipanggil Midtrans saat status pembayaran berubah.
 * https://docs.midtrans.com/reference/notification-webhooks
 *
 * Signature SHA512: order_id+status_code+gross_amount+server_key
 */
router.post('/midtrans', async (req, res) => {
  try {
    // Signature dikirim via header X-Signature atau query param ?signature
    const signature = req.headers['x-signature'] || req.query.signature;
    if (typeof signature !== 'string') {
      return res.status(401).json({ pesan: 'Signature tidak ditemukan.' });
    }

    const payload = req.body;

    // Validasi dasar struktur
    const notificationSchema = z.object({
      order_id: z.string(),
      status_code: z.string(),
      gross_amount: z.string(),
      transaction_status: z.string(),
      fraud_status: z.string().optional(),
    });

    const parsed = notificationSchema.safeParse(payload);
    if (!parsed.success) {
      return res.status(400).json({ pesan: 'Payload tidak valid.' });
    }

    const notification = parsed.data;

    // Verifikasi signature
    const valid = verifySignature(notification, signature);
    if (!valid) {
      return res.status(401).json({ pesan: 'Signature tidak cocok.' });
    }

    // Proses notifikasi (idempoten)
    await processNotification(notification);

    // Midtrans expects 200 OK
    res.json({ status: 'OK' });
  } catch (err: any) {
    console.error('[webhook/midtrans]', err);
    res.status(500).json({ pesan: 'Terjadi kesalahan server.' });
  }
});

export default router;
