import { z } from 'zod';

// Batas ini sama persis dengan TopUpPage.jsx (MIN_AMOUNT/MAX_AMOUNT) supaya
// validasi server tidak menolak nominal yang UI sendiri izinkan.
const MIN_AMOUNT = 10_000;
const MAX_AMOUNT = 1_000_000;

export const topUpSchema = z.object({
  amount: z.coerce
    .number({ error: 'Nominal top up wajib diisi.' })
    .int('Nominal top up harus bilangan bulat.')
    .min(MIN_AMOUNT, `Minimal top up Rp${MIN_AMOUNT.toLocaleString('id-ID')}.`)
    .max(MAX_AMOUNT, `Maksimal top up Rp${MAX_AMOUNT.toLocaleString('id-ID')}.`),
});

export type TopUpInput = z.infer<typeof topUpSchema>;

export const withdrawalSchema = z.object({
  bank: z
    .string({ error: 'Pilih bank tujuan.' })
    .trim()
    .min(1, 'Pilih bank tujuan.')
    .max(40, 'Nama bank terlalu panjang.'),
  accountName: z
    .string({ error: 'Nama pemilik rekening wajib diisi.' })
    .trim()
    .min(1, 'Nama pemilik rekening wajib diisi.')
    .max(60, 'Nama pemilik rekening maksimal 60 karakter.'),
  // Dikonversi ke string supaya "12345" dan 12345 sama-sama diterima; frontend
  // mengirim hasil input <input> yang selalu string.
  accountNumber: z.coerce
    .string({ error: 'Nomor rekening wajib diisi.' })
    .trim()
    .min(6, 'Nomor rekening minimal 6 digit.')
    .max(30, 'Nomor rekening maksimal 30 digit.')
    .regex(/^[0-9]+$/, 'Nomor rekening hanya boleh berisi angka.'),
  amount: z.coerce
    .number({ error: 'Nominal penarikan wajib diisi.' })
    .int('Nominal penarikan harus bilangan bulat.')
    .min(1, 'Nominal penarikan harus lebih dari 0.')
    .max(MAX_AMOUNT * 100, 'Nominal penarikan terlalu besar.'),
});

export type WithdrawalInput = z.infer<typeof withdrawalSchema>;

export const transactionIdParamsSchema = z.object({
  id: z
    .string({ error: 'Id transaksi wajib diisi.' })
    .trim()
    .min(1, 'Id transaksi wajib diisi.')
    .max(40, 'Id transaksi tidak valid.'),
});

export const transactionQuerySchema = z.object({
  limit: z.preprocess(
    (value) => (value === '' || value === 'undefined' ? undefined : value),
    z.coerce
      .number({ error: 'Limit tidak valid.' })
      .int('Limit tidak valid.')
      .min(1, 'Limit minimal 1.')
      .max(100, 'Limit maksimal 100.')
      .optional()
      .default(50)
  ),
});
