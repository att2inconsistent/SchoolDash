import { z } from 'zod';

// String pesan di sini ditampilkan verbatim oleh frontend (context memanggil
// reject(message), komponen merender err.message) — jadi isi kalimatnya kontrak.
// Tanpa { error: } zod membalas "Invalid input: ..." dalam bahasa Inggris
// saat field tidak dikirim sama sekali, jadi setiap field diberi pesan sendiri.
const email = z
  .string({ error: 'Email wajib diisi.' })
  .trim()
  .min(1, 'Email wajib diisi.')
  .email('Format email tidak valid.')
  .transform((v) => v.toLowerCase());

const password = z
  .string({ error: 'Password wajib diisi.' })
  .min(8, 'Password minimal 8 karakter.');

export const registerSchema = z.object({
  name: z
    .string({ error: 'Nama wajib diisi.' })
    .trim()
    .min(1, 'Nama wajib diisi.')
    .max(30, 'Nama maksimal 30 karakter.'),
  email,
  password,
  // RegisterPage mengirim select wajib, tapi kolom DB sudah default '-'.
  kelas: z
    .string()
    .trim()
    .max(10, 'Kelas maksimal 10 karakter.')
    .optional()
    .default('-'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email,
  // Tidak batasi panjang di sini: password lama yang dibuat sebelum aturan
  // 8 karakter harus tetap bisa login.
  password: z.string({ error: 'Password wajib diisi.' }).min(1, 'Password wajib diisi.'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// changePassword(currentPassword, newPassword) sesuai AuthContext; ProfilePage
// mengirim dua field itu saja karena konfirmasi `confirm` ditangani di UI.
export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ error: 'Password saat ini wajib diisi.' })
    .min(1, 'Password saat ini wajib diisi.'),
  newPassword: password,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
