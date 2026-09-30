import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { changePasswordSchema, loginSchema, registerSchema } from './schema.js';
import { changePassword, login, me, register } from './service.js';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), async (req, res) => {
  const result = await register(req.body);
  res.status(201).json(result);
});

authRouter.post('/login', validate(loginSchema), async (req, res) => {
  res.json(await login(req.body));
});

// requireRole('student') mencegah token penjual menimpa akun siswa lewat
// endpoint ini — req.user.sub dipakai sebagai students.id.
authRouter.get('/me', requireAuth, requireRole('student'), async (req, res) => {
  res.json({ user: await me(req.user!.sub) });
});

authRouter.post(
  '/change-password',
  requireAuth,
  requireRole('student'),
  validate(changePasswordSchema),
  async (req, res) => {
    await changePassword(req.user!.sub, req.body);
    res.json({ pesan: 'Password berhasil diganti.' });
  }
);
