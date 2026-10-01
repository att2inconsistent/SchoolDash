import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate, validated } from '../../middleware/validate.js';
import {
  createOrderSchema,
  orderIdParamsSchema,
  orderQuerySchema,
  orderStatusSchema,
} from './schema.js';
import {
  createOrder,
  getOrderById,
  listStudentOrders,
  listVendorOrders,
  updateOrderStatus,
} from './service.js';
import { getVendorForSeller } from '../seller-auth/service.js';

export const ordersRouter = Router();

// Semua route memakai req.user.sub sebagai students.id, jadi requireRole
// wajib — tanpa itu token penjual bisa menulis/membaca pesanan siswa.
ordersRouter.post(
  '/',
  requireAuth,
  requireRole('student'),
  validate(createOrderSchema),
  async (req, res) => {
    const body = validated<typeof createOrderSchema>(req);
    const order = await createOrder(req.user!.sub, body);

    res.status(201).json({ order });
  }
);

ordersRouter.get(
  '/',
  requireAuth,
  requireRole('student'),
  validate(orderQuerySchema, 'query'),
  async (req, res) => {
    const query = validated<typeof orderQuerySchema>(req, 'query');
    res.json({ orders: await listStudentOrders(req.user!.sub, query) });
  }
);

ordersRouter.get(
  '/:orderId',
  requireAuth,
  requireRole('student'),
  validate(orderIdParamsSchema, 'params'),
  async (req, res) => {
    const { orderId } = validated<typeof orderIdParamsSchema>(req, 'params');
    res.json({ order: await getOrderById(orderId, req.user!.sub) });
  }
);

// Dipakai frontend-seller. requireRole('seller') + vendor milik seller itu
// sendiri mencegah seller A membaca atau mengubah pesanan seller B.
export const sellerOrdersRouter = Router();

sellerOrdersRouter.get(
  '/',
  requireAuth,
  requireRole('seller'),
  validate(orderQuerySchema, 'query'),
  async (req, res) => {
    const vendor = await getVendorForSeller(req.user!.sub);
    const query = validated<typeof orderQuerySchema>(req, 'query');
    res.json({ orders: await listVendorOrders(vendor.id, query) });
  }
);

sellerOrdersRouter.patch(
  '/:orderId',
  requireAuth,
  requireRole('seller'),
  validate(orderIdParamsSchema, 'params'),
  validate(orderStatusSchema),
  async (req, res) => {
    const { orderId } = validated<typeof orderIdParamsSchema>(req, 'params');
    const { status } = validated<typeof orderStatusSchema>(req);
    const vendor = await getVendorForSeller(req.user!.sub);

    const order = await updateOrderStatus(orderId, vendor.id, status);
    res.json({ order });
  }
);
