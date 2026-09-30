import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET = process.env['JWT_SECRET'] ?? '';

export interface JwtPayload {
  sub: number;
  role: 'student' | 'seller';
  iat?: number;
  exp?: number;
}
// supaya req.user terbaca bertipe di seluruh handler tanpa import tambahan
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers['authorization'];

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ pesan: 'Token tidak ditemukan.' });
    return;
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, SECRET) as unknown as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ pesan: 'Token tidak valid atau sudah kedaluwarsa.' });
  }
}

export function requireRole(role: JwtPayload['role']) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user?.role !== role) {
      res.status(403).json({ pesan: 'Akses ditolak.' });
      return;
    }
    next();
  };
}
