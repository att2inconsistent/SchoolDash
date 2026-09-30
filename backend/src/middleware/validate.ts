import type { Request, Response, NextFunction } from 'express';
import { type ZodSchema } from 'zod';

type Target = 'body' | 'query' | 'params';

// req[target] ditulis ulang dengan hasil parse supaya handler menerima data
// yang sudah bersih dan otomatis dikonversi tipenya.
export function validate(schema: ZodSchema, target: Target = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const pesan = result.error.issues[0]?.message ?? 'Input tidak valid.';
      res.status(400).json({ pesan });
      return;
    }

    (req as unknown as Record<string, unknown>)[target] = result.data;
    next();
  };
}

