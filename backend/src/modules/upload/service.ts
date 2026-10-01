import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Express } from 'express';

type AppError = { status: number; message: string };

function fail(status: number, message: string): never {
  throw { status, message } satisfies AppError;
}

// Resolusi dari lokasi file, bukan process.cwd(), supaya folder uploads tetap
// sama walau server dijalankan dari direktori lain.
export const UPLOAD_DIR = path.resolve(import.meta.dirname, '../../..', 'uploads');

// Prefix URL publik. Sengaja di bawah /api supaya proxy Vite di kedua frontend
// (`server.proxy: { '/api': ... }`) langsung melayani gambar tanpa konfigurasi
// tambahan, dan tidak perlu menebak host saat generate URL.
export const UPLOAD_URL_PREFIX = '/api/uploads';

const DEFAULT_MAX_MB = 5;

function resolveMaxMb(): number {
  const raw = Number(process.env['MAX_UPLOAD_MB']);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MAX_MB;
}

export const MAX_UPLOAD_MB = resolveMaxMb();

export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

/**
 * Deteksi tipe dari ISI file, bukan dari `file.mimetype` — mimetype itu berasal
 * dari header Content-Type milik client dan bisa dipalsukan jadi apa saja.
 * Nama asli juga tidak pernah dipakai sebagai nama file di disk.
 */
const IMAGE_TYPES = [
  {
    ext: 'jpg',
    mime: 'image/jpeg',
    matches: (b: Buffer) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: 'png',
    mime: 'image/png',
    matches: (b: Buffer) =>
      b.length > 8 &&
      b.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      ),
  },
  {
    ext: 'webp',
    mime: 'image/webp',
    matches: (b: Buffer) =>
      b.length > 12 &&
      b.subarray(0, 4).toString('latin1') === 'RIFF' &&
      b.subarray(8, 12).toString('latin1') === 'WEBP',
  },
] as const;

export interface UploadResult {
  /** URL publik yang disimpan di kolom `image`. */
  url: string;
  /** Nama file di disk, keyed by content hash. */
  fileName: string;
  size: number;
  mime: string;
}

/**
 * Simpan satu gambar hasil upload multer.
 *
 * Pakai memoryStorage, bukan diskStorage: dengan begitu file harus diperiksa dulu
 * dan baru ditulis setelah lolos. Kalau pakai diskStorage, file yang tidak
 * valid sudah ada di disk saat penolakan terjadi.
 *
 * Nama file = hash isi, bukan `originalname`. Ini menutup path traversal
 * (`../../etc/passwd`), mencegah tabrakan nama, membuat file identik hanya
 * disimpan sekali, dan membuat URL tidak bisa ditebak.
 */
export async function saveUploadedImage(file: Express.Multer.File): Promise<UploadResult> {
  if (!file || file.size === 0) {
    fail(400, 'Pilih gambar dulu.');
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    fail(400, `Ukuran gambar maksimal ${MAX_UPLOAD_MB} MB.`);
  }

  const detected = IMAGE_TYPES.find((type) => type.matches(file.buffer));

  if (!detected) {
    // Pesan sama dengan yang dipakai frontend (lib/image.js) supaya user
    // tidak melihat dua kalimat berbeda untuk masalah yang sama.
    fail(400, 'File harus berupa gambar (JPG/PNG/WebP).');
  }

  const fileName = `${createHash('sha256').update(file.buffer).digest('hex').slice(0, 32)}.${detected.ext}`;
  const target = path.join(UPLOAD_DIR, fileName);

  // Nama file berasal dari hash hex, jadi tidak mungkin keluar dari UPLOAD_DIR.
  // Guard ini hanya sebagai jaring pengaman kalau formatnya nanti berubah.
  if (path.dirname(target) !== path.resolve(UPLOAD_DIR)) {
    fail(400, 'Nama file tidak valid.');
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(target, file.buffer);

  return {
    url: `${UPLOAD_URL_PREFIX}/${fileName}`,
    fileName,
    size: file.size,
    mime: detected.mime,
  };
}