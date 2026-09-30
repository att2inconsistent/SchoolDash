import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { changePasswordSchema, loginSchema, registerSchema } from './schema.js';
import { changePassword, login, me, register } from './service.js';

// requireRole('seller') wajib di semua route yang membaca req.user.sub sebagai
// sellers.id — tanpa itu token siswa bisa menimpa password penjual.
export const sellerAuthRouter = Router();

sellerAuthRouter.post('/register', validate(registerSchema), async (req, res) => {
  const result = await register(req.body);
  res.status(201).json(result);
});

sellerAuthRouter.post('/login', validate(loginSchema), async (req, res) => {
  res.json(await login(req.body));
});

sellerAuthRouter.get('/me', requireAuth, requireRole('seller'), async (req, res) => {
  res.json({ user: await me(req.user!.sub) });
});

sellerAuthRouter.post(
  '/change-password',
  requireAuth,
  requireRole('seller'),
  validate(changePasswordSchema),
  async (req, res) => {
    await changePassword(req.user!.sub, req.body);
    res.json({ pesan: 'Password berhasil diganti.' });
  }
);