import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate, validated } from '../../middleware/validate.js';
import { updateStoreSchema } from './schema.js';
import { getStore, updateStore } from './service.js';

export const sellerStoreRouter = Router();

// requireRole('seller') WAJIB di setiap route: kantin dicari dari
// sellers.id milik token, jadi tanpa penjaga role token siswa bisa membaca
// atau mengubah kantin orang lain.
sellerStoreRouter.get('/', requireAuth, requireRole('seller'), async (req, res) => {
  res.json({ vendor: await getStore(req.user!.sub) });
});

sellerStoreRouter.put(
  '/',
  requireAuth,
  requireRole('seller'),
  validate(updateStoreSchema),
  async (req, res) => {
    const input = validated<typeof updateStoreSchema>(req);
    await updateStore(req.user!.sub, input);

    // Balikkan data terbaru supaya frontend bisa langsung memakai hasilnya.
    res.json({ vendor: await getStore(req.user!.sub) });
  }
);
