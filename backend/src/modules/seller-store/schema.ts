import { z } from 'zod';

// Pesan di sini tampil verbatim di UI, jadi isi kalimatnya kontrak.

// Sengaja TANPA .transform(). Kalau sebuah field punya transform, zod selalu
// membuat key-nya di hasil parse walaupun tidak dikirim, sehingga parsed value
// tidak bisa dipakai untuk membedakan "tidak dikirim" dari "dikirim kosong" —
// body {} akan terbaca punya perubahan. Pemecahan string "a, b" jadi array
// dilakukan di service (parseTags), bukan di schema.
const tags = z
  .string({ error: 'Tag harus berupa teks.' })
  .trim()
  .max(200, 'Tag terlalu panjang.')
  .optional();

export const updateStoreSchema = z
  .object({
    name: z
      .string({ error: 'Nama kantin wajib diisi.' })
      .trim()
      .min(3, 'Nama kantin minimal 3 karakter.')
      .max(60, 'Nama kantin maksimal 60 karakter.')
      .optional(),
    tags,
  })
  // Seller boleh ubah tag saja tanpa mengirim nama lagi, tapi minimal satu
  // field harus benar-benar dikirim.
  .superRefine((value, ctx) => {
    if (value.name === undefined && value.tags === undefined) {
      ctx.addIssue({ code: 'custom', message: 'Tidak ada data toko yang dikirim.' });
    }
  });

export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
