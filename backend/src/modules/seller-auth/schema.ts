import { z } from 'zod';

// Pesan di sini tampil verbatim di UI (AuthContext reject(new Error(...)) tanpa
// mengubah teks), jadi isi kalimatnya kontrak dengan frontend-seller.
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
  // Wajib, bukan optional: RegisterPage.jsx pakai minLength={3} required, dan
  // kantin dibuat dari nama ini — default '-' akan menghasilkan kantin tanpa nama.
  storeName: z
    .string({ error: 'Nama kantin wajib diisi.' })
    .trim()
    .min(3, 'Nama kantin minimal 3 karakter.')
    .max(60, 'Nama kantin maksimal 60 karakter.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email,
  // Panjang tidak dibatasi supaya password lama sebelum aturan 8 karakter
  // tetap bisa login.
  password: z.string({ error: 'Password wajib diisi.' }).min(1, 'Password wajib diisi.'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ProfilePage mengirim dua field (current, next); konfirmasi `confirm` dicek di UI.
export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ error: 'Password saat ini wajib diisi.' })
    .min(1, 'Password saat ini wajib diisi.'),
  newPassword: password,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;