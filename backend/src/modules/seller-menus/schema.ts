import { z } from 'zod';

const CATEGORY_KEYS = ['berat', 'minuman', 'cemilan', 'sehat'] as const;

// Batas nama sama dengan contract di MenuContext ("minimal 3 karakter").
const MENU_NAME_MIN = 3;

// Gambar disimpan sebagai URL hasil POST /api/seller/upload, bukan base64 —
// data URL di kolom `image` akan membengkakkan setiap row.
//
// Sengaja tanpa .transform() (lihat catatan di seller-store/schema.ts): kalau
// field punya transform, zod selalu membuat key-nya walau tidak dikirim, dan
// updateMenuSchema tidak bisa lagi membedakan "tidak dikirim" dari "dikirim
// kosong". Normalisasi string kosong -> null dilakukan di service.
const image = z
  .string({ error: 'Gambar tidak valid.' })
  .trim()
  .max(2048, 'URL gambar terlalu panjang.')
  .optional()
  .nullable();

const name = z
  .string({ error: 'Nama menu wajib diisi.' })
  .trim()
  .min(MENU_NAME_MIN, `Nama menu minimal ${MENU_NAME_MIN} karakter.`)
  .max(80, 'Nama menu maksimal 80 karakter.');

const price = z.coerce
  .number({ error: 'Harga wajib diisi.' })
  .int('Harga harus bilangan bulat tanpa titik desimal.')
  .min(1, 'Harga harus lebih dari 0.')
  .max(1_000_000, 'Harga terlalu besar.');

const category = z.enum(CATEGORY_KEYS, { error: 'Kategori tidak dikenal.' });

export const createMenuSchema = z.object({
  name,
  description: z
    .string({ error: 'Deskripsi tidak valid.' })
    .trim()
    .max(300, 'Deskripsi maksimal 300 karakter.')
    .optional()
    .default(''),
  price,
  category: category.optional().default('berat'),
  image,
  active: z.boolean({ error: 'Status aktif tidak valid.' }).optional().default(true),
});

export type CreateMenuInput = z.infer<typeof createMenuSchema>;

// Field yang boleh diubah. `vendorId` sengaja tidak ada di sini — menu selalu
// milik kantin pemanggil dan tidak bisa dipindah ke kantin lain lewat request.
//
// Semua field di sini tanpa .transform(), jadi key hasil parse sama dengan key
// yang benar-benar dikirim. Itu yang membuat pengecekan "ada perubahan" di
// bawah bisa membedakan body {} dari update yang sungguhan.
export const updateMenuSchema = z
  .object({
    name: name.optional(),
    description: z
      .string({ error: 'Deskripsi tidak valid.' })
      .trim()
      .max(300, 'Deskripsi maksimal 300 karakter.')
      .optional(),
    price: price.optional(),
    category: category.optional(),
    image,
    active: z.boolean({ error: 'Status aktif tidak valid.' }).optional(),
  })
  .superRefine((value, ctx) => {
    if (!Object.values(value).some((item) => item !== undefined)) {
      ctx.addIssue({ code: 'custom', message: 'Tidak ada perubahan yang dikirim.' });
    }
  });

export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;

// toggleMenu() di frontend hanya mengirim { active }, jadi perlu schema sendiri
// yang tidak mewajibkan nama/harga.
export const toggleMenuSchema = z.object({
  active: z.boolean({ error: 'Status aktif tidak valid.' }),
});

export const menuIdParamsSchema = z.object({
  id: z.coerce
    .number({ error: 'Menu id tidak valid.' })
    .int('Menu id tidak valid.')
    .positive('Menu id tidak valid.'),
});

export const menuQuerySchema = z.object({
  category: z.enum([...CATEGORY_KEYS, 'semua'], { error: 'Kategori tidak dikenal.' }).optional(),
  // Seller perlu melihat menu nonaktif juga; tanpa ini hanya menu aktif.
  includeInactive: z
    .enum(['true', 'false'], { error: 'Nilai includeInactive tidak valid.' })
    .optional()
    .transform((value) => value === 'true'),
});
