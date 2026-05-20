import type { Payment, PaymentStatusHistory } from '@prisma/client';
import type {
  CreatePaymentInput,
  PaymentDto,
  PaymentStatusEventDto,
  PaymentStatus,
  PaymentWithHistoryDto,
} from 'shared';
import { prisma } from '../prisma';
import { HttpError } from '../middleware/error';
import { assertCanTransition } from '../utilities/statusMachine';

function toPaymentDto(p: Payment): PaymentDto {
  return {
    id: p.id,
    senderName: p.senderName,
    recipientName: p.recipientName,
    amount: p.amount.toNumber(),
    currency: p.currency,
    notes: p.notes,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
  };
}

function toEventDto(e: PaymentStatusHistory): PaymentStatusEventDto {
  return {
    id: e.id,
    paymentId: e.paymentId,
    fromStatus: e.fromStatus,
    toStatus: e.toStatus,
    at: e.at.toISOString(),
  };
}

/**
 * Creates a payment and its initial audit-log row in one transaction.
 * The audit row records `fromStatus=null → toStatus=CREATED`, so the history
 * table is always the complete event log from creation onward.
 */
export async function createPayment(input: CreatePaymentInput): Promise<PaymentDto> {
  const created = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        senderName: input.senderName,
        recipientName: input.recipientName,
        amount: input.amount,
        currency: input.currency,
        notes: input.notes ?? null,
      },
    });

    await tx.paymentStatusHistory.create({
      data: { paymentId: payment.id, fromStatus: null, toStatus: 'CREATED' },
    });

    return payment;
  });

  return toPaymentDto(created);
}

/**
 * Returns all payments, newest first. Optionally filtered by status.
 */
export async function listPayments(filter?: { status?: PaymentStatus }): Promise<PaymentDto[]> {
  const payments = await prisma.payment.findMany({
    where: filter?.status ? { status: filter.status } : undefined,
    orderBy: { createdAt: 'desc' },
  });
  return payments.map(toPaymentDto);
}

/**
 * Returns a single payment with its full audit-log history (oldest first).
 * Throws HttpError(404) if no payment matches the given id.
 */
export async function getPaymentWithHistory(id: string): Promise<PaymentWithHistoryDto> {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { history: { orderBy: { at: 'asc' } } },
  });

  if (!payment) {
    throw new HttpError(404, 'NOT_FOUND', `Payment ${id} not found`);
  }

  return {
    ...toPaymentDto(payment),
    history: payment.history.map(toEventDto),
  };
}

/**
 * Transition a payment to a new status, atomically.
 *
 *   1. `SELECT ... FOR UPDATE` locks the row for the duration of the transaction.
 *      Concurrent transition attempts on the same payment block here until we commit.
 *   2. `assertCanTransition` validates the move against ALLOWED_TRANSITIONS.
 *   3. We update the payment and insert the audit row together — either both land
 *      or neither does.
 *
 * All queries inside this transaction MUST use `tx`, not the singleton `prisma`,
 * otherwise they execute outside the lock and lose atomicity.
 */
export async function transitionPayment(
  id: string,
  toStatus: PaymentStatus,
): Promise<PaymentDto> {
  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<Payment[]>`
      SELECT * FROM "Payment" WHERE id = ${id} FOR UPDATE
    `;

    if (locked.length === 0) {
      throw new HttpError(404, 'NOT_FOUND', `Payment ${id} not found`);
    }

    const current = locked[0];
    assertCanTransition(current.status, toStatus);

    const updated = await tx.payment.update({
      where: { id },
      data: { status: toStatus },
    });

    await tx.paymentStatusHistory.create({
      data: { paymentId: id, fromStatus: current.status, toStatus },
    });

    return toPaymentDto(updated);
  });
}
