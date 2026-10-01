import { z } from 'zod';

const CATEGORY_KEYS = ['berat', 'minuman', 'cemilan', 'sehat'] as const;

// 'semua' bukan nilai enum di DB — hanya keadaan UI "tanpa filter", jadi
// diterima di sini lalu diperlakukan sebagai tanpa filter di service.
export const catalogQuerySchema = z.object({
  q: z
    .string({ error: 'Kata kunci tidak valid.' })
    .trim()
    .max(80, 'Kata kunci maksimal 80 karakter.')
    .optional(),
  category: z.enum([...CATEGORY_KEYS, 'semua'], {
    error: 'Kategori tidak dikenal.',
  }).optional(),
  // Query string selalu string, jadi vendorId perlu dikonversi ke number.
  // String kosong / "undefined" diperlakukan sebagai tidak ada filter —
  // frontend yang menyusun URL tidak selalu membersihkan param kosong.
  vendorId: z.preprocess(
    (value) => (value === '' || value === 'undefined' ? undefined : value),
    z.coerce
      .number({ error: 'Vendor id tidak valid.' })
      .int('Vendor id tidak valid.')
      .positive('Vendor id tidak valid.')
      .optional()
  ),
});

export type CatalogQuery = z.infer<typeof catalogQuerySchema>;

export const vendorParamsSchema = z.object({
  vendorId: z.coerce
    .number({ error: 'Vendor id tidak valid.' })
    .int('Vendor id tidak valid.')
    .positive('Vendor id tidak valid.'),
});

export const menuParamsSchema = z.object({
  menuId: z.coerce
    .number({ error: 'Menu id tidak valid.' })
    .int('Menu id tidak valid.')
    .positive('Menu id tidak valid.'),
});
