import { Router, type Request } from 'express';
import {
  CreatePaymentSchema,
  TransitionPaymentSchema,
  PaymentStatusSchema,
} from 'shared';
import { validate } from '../middleware/validate';
import {
  createPayment,
  listPayments,
  getPaymentWithHistory,
  transitionPayment,
} from '../services/payment.service';

const router = Router();

type IdParam = { id: string };

// POST /payments — create a new payment
router.post('/', validate(CreatePaymentSchema), async (req, res) => {
  const payment = await createPayment(req.body);
  res.status(201).json(payment);
});

// GET /payments — list all payments, optionally filtered by ?status=
router.get('/', async (req, res) => {
  const status =
    typeof req.query.status === 'string'
      ? PaymentStatusSchema.parse(req.query.status)
      : undefined;
  const payments = await listPayments({ status });
  res.json(payments);
});

// GET /payments/:id — single payment + full audit-log history
router.get('/:id', async (req: Request<IdParam>, res) => {
  const payment = await getPaymentWithHistory(req.params.id);
  res.json(payment);
});

// PATCH /payments/:id/transition — transition status (atomic, locked)
router.patch(
  '/:id/transition',
  validate(TransitionPaymentSchema),
  async (req: Request<IdParam>, res) => {
    const payment = await transitionPayment(req.params.id, req.body.toStatus);
    res.json(payment);
  },
);

export default router;
