import express, { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB, UPLOAD_DIR, saveUploadedImage } from './service.js';

export const uploadRouter = Router();

// memoryStorage: file ditahan di memori lalu baru ditulis setelah lolos
// pemeriksaan signature di service. Dengan diskStorage, file tidak valid sudah
// ada di disk sebelum penolakan terjadi.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
});

// Multer melempar error sendiri (LIMIT_UNEXPECTED_FILE, LIMIT_FILE_SIZE, ...)
// yang TIDAK berbentuk { status, message }, jadi tanpa handler di sini semua
// jadi 500 "Terjadi kesalahan pada server." — padahal ini kesalahan input
// yang jelas harus dibalas 400 dengan pesan yang tampil ke user.
function handleMulterError(
  err: unknown,
  _req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ pesan: `Ukuran gambar maksimal ${MAX_UPLOAD_MB} MB.` });
      return;
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({ pesan: 'Field file harus bernama "image".' });
      return;
    }

    res.status(400).json({ pesan: 'Gagal mengunggah gambar.' });
    return;
  }

  next(err);
}

// Field name harus sama dengan `name` di <input type="file"> frontend.
// MenuFormModal.jsx sekarang memakai input tanpa `name`, jadi frontend perlu
// ditambah name="image" — dicatat di SESSPROG.md.
uploadRouter.post(
  '/',
  requireAuth,
  requireRole('seller'),
  // requireAuth lebih dulu: request tanpa token ditolak 401 tanpa body
  // multipart sebesar 10 MB ikut dibaca.
  upload.single('image'),
  async (req, res) => {
    if (!req.file) {
      res.status(400).json({ pesan: 'Pilih gambar dulu.' });
      return;
    }

    const saved = await saveUploadedImage(req.file);
    res.status(201).json({ url: saved.url, size: saved.size, mime: saved.mime });
  }
);

// Harus SETELAH post() di atas. Router hanya meneruskan error ke handler
// yang terdaftar sesudah middleware yang melempar, jadi kalau ini diletakkan
// sebelum route, error dari upload.single() akan lolos ke app.ts dan jadi 500.
uploadRouter.use(handleMulterError);

// Menyajikan file hasil upload. Backend juga yang melayani gambar ini, jadi
// frontend cukup pakai URL relatif hasil POST — tidak perlu tahu host/backend.
//
// express.static sudah menolak path yang keluar dari root (../), dan nama file
// di sini semuanya hash, jadi tidak ada input user yang ikut menentukan path.
export const uploadStaticRouter = Router();

uploadStaticRouter.use(
  express.static(UPLOAD_DIR, {
    // Nama file = hash isi, jadi URL bisa dibuat permanen: file dengan isi
    // sama selalu menunjuk ke nama yang sama.
    immutable: true,
    maxAge: '30d',
    index: false,
    dotfiles: 'deny',
  })
);