import { Router } from 'express';
import { validate, validated } from '../../middleware/validate.js';
import {catalogQuerySchema,menuParamsSchema,vendorParamsSchema,} from './schema.js';
import {getMenuById,getVendorById,listCategories,listMenus,listVendors,} from './service.js';

export const catalogRouter = Router();

catalogRouter.get('/vendors', validate(catalogQuerySchema, 'query'), async (req, res) => {
  res.json({ vendors: await listVendors(validated<typeof catalogQuerySchema>(req, 'query')) });
});

catalogRouter.get('/menus', validate(catalogQuerySchema, 'query'), async (req, res) => {
  res.json({ menus: await listMenus(validated<typeof catalogQuerySchema>(req, 'query')) });
});

// Kategori dibaca dari tabel `categories`, bukan dari DISTINCT kolom menu:
// daftar tombol UI harus lengkap dan urutannya tetap, walaupun belum ada
// menu yang memakai kategori itu.
catalogRouter.get('/categories', async (_req, res) => {
  res.json({ categories: await listCategories() });
});

// Dipakai halaman /menu/:vendorId. Kantin yang tidak ada dibalas 404 supaya
// frontend bisa balik ke beranda, bukan dapat daftar kosong.
catalogRouter.get(
  '/vendors/:vendorId',
  validate(vendorParamsSchema, 'params'),
  async (req, res) => {
    const { vendorId } = validated<typeof vendorParamsSchema>(req, 'params');
    const vendor = await getVendorById(vendorId);

    if (!vendor) {
      res.status(404).json({ pesan: 'Kantin tidak ditemukan.' });
      return;
    }

    res.json({ vendor });
  }
);

catalogRouter.get(
  '/menus/:menuId',
  validate(menuParamsSchema, 'params'),
  async (req, res) => {
    const { menuId } = validated<typeof menuParamsSchema>(req, 'params');
    const menu = await getMenuById(menuId);

    if (!menu) {
      res.status(404).json({ pesan: 'Menu tidak ditemukan.' });
      return;
    }

    res.json({ menu });
  }
);