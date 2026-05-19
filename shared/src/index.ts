import { z } from 'zod';

export const PaymentStatusSchema = z.enum([
  'CREATED',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'RETRIED',
]);

export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const ALLOWED_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  CREATED:    ['PROCESSING'],
  PROCESSING: ['COMPLETED', 'FAILED'],
  COMPLETED:  [],
  FAILED:     ['RETRIED'],
  RETRIED:    ['PROCESSING'],
};

export const CreatePaymentSchema = z.object({
  senderName:    z.string().min(1).max(200),
  recipientName: z.string().min(1).max(200),
  amount:        z.number().positive(),
  currency:      z.string().length(3).regex(/^[A-Z]{3}$/, 'must be a 3-letter ISO 4217 code'),
  notes:         z.string().max(1000).optional(),
});

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;

export const TransitionPaymentSchema = z.object({
  toStatus: PaymentStatusSchema,
});

export type TransitionPaymentInput = z.infer<typeof TransitionPaymentSchema>;

export type PaymentDto = {
  id:            string;
  senderName:    string;
  recipientName: string;
  amount:        number;
  currency:      string;
  notes:         string | null;
  status:        PaymentStatus;
  createdAt:     string;
};

export type PaymentStatusEventDto = {
  id:         string;
  paymentId:  string;
  fromStatus: PaymentStatus | null;
  toStatus:   PaymentStatus;
  at:         string;
};

export type PaymentWithHistoryDto = PaymentDto & {
  history: PaymentStatusEventDto[];
};
