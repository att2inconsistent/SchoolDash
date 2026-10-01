import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate, validated } from '../../middleware/validate.js';
import {
  createMenuSchema,
  menuIdParamsSchema,
  menuQuerySchema,
  toggleMenuSchema,
  updateMenuSchema,
} from './schema.js';
import {
  createMenu,
  deleteMenu,
  listMenus,
  toggleMenu,
  updateMenu,
} from './service.js';
import { getVendorForSeller } from '../seller-auth/service.js';

export const sellerMenusRouter = Router();

// Semua route memakai requireRole('seller') dan mengambil vendorId dari
// getVendorForSeller() — bukan dari parameter request. Tanpa itu, seller A
// bisa menulis atau menghapus menu milik seller B hanya dengan menebak id.
sellerMenusRouter.get(
  '/',
  requireAuth,
  requireRole('seller'),
  validate(menuQuerySchema, 'query'),
  async (req, res) => {
    const vendor = await getVendorForSeller(req.user!.sub);
    const { category, includeInactive } = validated<typeof menuQuerySchema>(req, 'query');

    res.json({ menus: await listMenus(vendor.id, { category, includeInactive }) });
  }
);

sellerMenusRouter.post(
  '/',
  requireAuth,
  requireRole('seller'),
  validate(createMenuSchema),
  async (req, res) => {
    const vendor = await getVendorForSeller(req.user!.sub);
    const menu = await createMenu(vendor.id, validated<typeof createMenuSchema>(req));

    res.status(201).json({ menu });
  }
);

sellerMenusRouter.put(
  '/:id',
  requireAuth,
  requireRole('seller'),
  validate(menuIdParamsSchema, 'params'),
  validate(updateMenuSchema),
  async (req, res) => {
    const vendor = await getVendorForSeller(req.user!.sub);
    const { id } = validated<typeof menuIdParamsSchema>(req, 'params');
    const menu = await updateMenu(id, vendor.id, validated<typeof updateMenuSchema>(req));

    res.json({ menu });
  }
);

// toggleMenu() di frontend cuma mengirim { active }, jadi tidak bisa pakai
// updateMenuSchema yang mewajibkan minimal satu perubahan.
sellerMenusRouter.patch(
  '/:id',
  requireAuth,
  requireRole('seller'),
  validate(menuIdParamsSchema, 'params'),
  validate(toggleMenuSchema),
  async (req, res) => {
    const vendor = await getVendorForSeller(req.user!.sub);
    const { id } = validated<typeof menuIdParamsSchema>(req, 'params');
    const { active } = validated<typeof toggleMenuSchema>(req);
    const menu = await toggleMenu(id, vendor.id, active);

    res.json({ menu });
  }
);

sellerMenusRouter.delete(
  '/:id',
  requireAuth,
  requireRole('seller'),
  validate(menuIdParamsSchema, 'params'),
  async (req, res) => {
    const vendor = await getVendorForSeller(req.user!.sub);
    const { id } = validated<typeof menuIdParamsSchema>(req, 'params');

    res.json(await deleteMenu(id, vendor.id));
  }
);
