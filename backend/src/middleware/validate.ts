import type { Request, Response, NextFunction } from 'express';
import { type ZodSchema, type z } from 'zod';

type Target = 'body' | 'query' | 'params';

declare global {
  namespace Express {
    interface Request {
      valid?: Partial<Record<Target, unknown>>;
    }
  }
}

// Hasil parse disimpan di req.valid, bukan ditimpa balik ke req[target].
// Express 5 mendefinisikan req.query sebagai accessor yang hanya punya getter,
// jadi `req.query = ...` melempar TypeError. req.params juga tidak ditulis
// ulang karena bertipe string | string[] di sisi Express.
export function validate(schema: ZodSchema, target: Target = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const pesan = result.error.issues[0]?.message ?? 'Input tidak valid.';
      res.status(400).json({ pesan });
      return;
    }

    req.valid = { ...req.valid, [target]: result.data };

    // Hanya body yang ditulis ulang: router auth & seller-auth yang sudah ada
    // membaca req.body langsung. query/params tidak boleh ditulis karena
    // keduanya getter-only di Express 5.
    if (target === 'body') {
      req.body = result.data;
    }

    next();
  };
}

// Membaca hasil parse dengan tipe yang ikut menyempit ke hasil zod.
export function validated<S extends ZodSchema>(
  req: Request,
  target: Target = 'body'
): z.infer<S> {
  return req.valid?.[target] as z.infer<S>;
}

