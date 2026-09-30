import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { pool } from './config/db.js';
import { authRouter } from './modules/auth/router.js';
import { sellerAuthRouter } from './modules/seller-auth/router.js';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(morgan('dev'));
app.use(express.json());

// Router dilepas di sini sesuai urutan pengerjaan modul:
// auth → catalog → orders → wallet → seller menus → upload
app.use('/api/auth', authRouter);
app.use('/api/seller/auth', sellerAuthRouter);

// Health check harus didaftarkan DI ATAS catch-all 404 di bawah, kalau tidak
// route ini tidak akan pernah tercapai.
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'up', ts: new Date().toISOString() });
  } catch {
    res.status(503).json({ ok: false, db: 'down', ts: new Date().toISOString() });
  }
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ pesan: 'Endpoint tidak ditemukan.' });
});

// Error yang sudah dikenali bentuknya ({ status, message }) diteruskan apa
// adanya ke klien. Sisanya jadi 500 supaya detail internal tidak bocor.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);

  if (isAppError(err)) {
    res.status(err.status).json({ pesan: err.message });
    return;
  }

  res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
});

interface AppError {
  status: number;
  message: string;
}

function isAppError(err: unknown): err is AppError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    'message' in err &&
    typeof (err as AppError).status === 'number'
  );
}
