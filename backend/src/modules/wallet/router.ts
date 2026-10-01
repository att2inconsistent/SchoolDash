import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate, validated } from '../../middleware/validate.js';
import {
  topUpSchema,
  transactionIdParamsSchema,
  transactionQuerySchema,
  withdrawalSchema,
} from './schema.js';
import {
  confirmTopUp,
  createTopUp,
  getBalance,
  getTopUpStatus,
  listTransactions,
  withdraw,
} from './service.js';

export const walletRouter = Router();

// requireRole('student') wajib: dompet siswa dipisahkan dari dompet penjual
// lewat kolom owner_type, jadi role yang salah akan membaca saldo orang salah.
walletRouter.get(
  '/',
  requireAuth,
  requireRole('student'),
  async (req, res) => {
    const wallet = await getBalance('student', req.user!.sub);
    res.json({ balance: wallet.balance });
  }
);

walletRouter.get(
  '/transactions',
  requireAuth,
  requireRole('student'),
  validate(transactionQuerySchema, 'query'),
  async (req, res) => {
    const { limit } = validated<typeof transactionQuerySchema>(req, 'query');
    res.json({ transactions: await listTransactions('student', req.user!.sub, limit) });
  }
);

walletRouter.post(
  '/topup',
  requireAuth,
  requireRole('student'),
  validate(topUpSchema),
  async (req, res) => {
    const transaction = await createTopUp(
      req.user!.sub,
      validated<typeof topUpSchema>(req)
    );

    res.status(201).json({ transaction });
  }
);

walletRouter.get(
  '/topup/:id',
  requireAuth,
  requireRole('student'),
  validate(transactionIdParamsSchema, 'params'),
  async (req, res) => {
    const { id } = validated<typeof transactionIdParamsSchema>(req, 'params');
    res.json({ transaction: await getTopUpStatus(req.user!.sub, id) });
  }
);

walletRouter.post(
  '/topup/:id/confirm',
  requireAuth,
  requireRole('student'),
  validate(transactionIdParamsSchema, 'params'),
  async (req, res) => {
    const { id } = validated<typeof transactionIdParamsSchema>(req, 'params');
    res.json(await confirmTopUp(req.user!.sub, id));
  }
);

export const sellerWalletRouter = Router();

sellerWalletRouter.get('/', requireAuth, requireRole('seller'), async (req, res) => {
  const wallet = await getBalance('seller', req.user!.sub);
  res.json({ balance: wallet.balance });
});

sellerWalletRouter.get(
  '/transactions',
  requireAuth,
  requireRole('seller'),
  validate(transactionQuerySchema, 'query'),
  async (req, res) => {
    const { limit } = validated<typeof transactionQuerySchema>(req, 'query');
    res.json({ transactions: await listTransactions('seller', req.user!.sub, limit) });
  }
);

sellerWalletRouter.post(
  '/withdrawals',
  requireAuth,
  requireRole('seller'),
  validate(withdrawalSchema),
  async (req, res) => {
    const withdrawal = await withdraw(
      req.user!.sub,
      validated<typeof withdrawalSchema>(req)
    );

    res.status(201).json({ withdrawal });
  }
);
