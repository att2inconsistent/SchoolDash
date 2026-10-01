import { z } from 'zod';

// Pesan di sini tampil verbatim di UI (context memanggil reject(message)),
// jadi isi kalimatnya kontrak dengan frontend.

export const createOrderSchema = z.object({
  // Client hanya boleh mengirim id menu + jumlah. Harga, nama, dan kantin
  // SELALU dibaca ulang dari database — kalau harga dipercaya dari client,
  // siswa bisa memesan dengan harga 1 rupiah.
  items: z
    .array(
      z.object({
        menuItemId: z.coerce
          .number({ error: 'Menu id tidak valid.' })
          .int('Menu id tidak valid.')
          .positive('Menu id tidak valid.'),
        qty: z.coerce
          .number({ error: 'Jumlah tidak valid.' })
          .int('Jumlah pesanan harus bilangan bulat.')
          .min(1, 'Jumlah pesanan minimal 1.')
          .max(50, 'Jumlah pesanan maksimal 50 per menu.'),
      })
    )
    .min(1, 'Keranjang masih kosong.')
    .max(30, 'Pesanan maksimal 30 item berbeda.'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const orderQuerySchema = z.object({
  status: z
    .enum(['Menunggu', 'Sedang Dibuat', 'Selesai'], { error: 'Status tidak dikenal.' })
    .optional(),
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

export type OrderQuery = z.infer<typeof orderQuerySchema>;

export const orderIdParamsSchema = z.object({
  orderId: z
    .string({ error: 'Id pesanan wajib diisi.' })
    .trim()
    .min(1, 'Id pesanan wajib diisi.')
    .max(40, 'Id pesanan tidak valid.'),
});

// Seller boleh memindahkan status ke tahap berikutnya saja, tidak Mundur.
export const orderStatusSchema = z.object({
  status: z.enum(['Sedang Dibuat', 'Selesai'], {
    error: 'Status harus "Sedang Dibuat" atau "Selesai".',
  }),
});

export type OrderStatusInput = z.infer<typeof orderStatusSchema>;
