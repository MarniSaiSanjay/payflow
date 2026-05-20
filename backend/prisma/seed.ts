import { prisma } from '../src/prisma';
import {
  createPayment,
  transitionPayment,
} from '../src/services/payment.service';

/**
 * Seeds the database with one payment in each of the five lifecycle states,
 * walking each through the appropriate transitions via the service layer so
 * the audit-log rows are produced exactly as they would be in production.
 *
 * Idempotent: wipes existing rows first, then recreates. 
 * `npm run seed` from the backend directory to execute.
 */
async function main() {
  console.log('Wiping existing payments...');
  // History first (FK constraint), then payments.
  await prisma.paymentStatusHistory.deleteMany({});
  await prisma.payment.deleteMany({});

  console.log('Seeding 5 payments, one per lifecycle state...');

  // A — just CREATED
  const a = await createPayment({
    senderName: 'Acme Co.',
    recipientName: 'Alpha Vendor',
    amount: 1250.0,
    currency: 'USD',
    notes: 'Just created',
  });
  console.log(`  A ${a.id} — CREATED`);

  // B — CREATED → PROCESSING
  const b = await createPayment({
    senderName: 'Acme Co.',
    recipientName: 'Beta Vendor',
    amount: 875.5,
    currency: 'USD',
    notes: 'Currently processing',
  });
  await transitionPayment(b.id, 'PROCESSING');
  console.log(`  B ${b.id} — PROCESSING`);

  // C — CREATED → PROCESSING → COMPLETED
  const c = await createPayment({
    senderName: 'Acme Co.',
    recipientName: 'Gamma Vendor',
    amount: 4200.75,
    currency: 'EUR',
    notes: 'Successfully paid',
  });
  await transitionPayment(c.id, 'PROCESSING');
  await transitionPayment(c.id, 'COMPLETED');
  console.log(`  C ${c.id} — COMPLETED`);

  // D — CREATED → PROCESSING → FAILED
  const d = await createPayment({
    senderName: 'Acme Co.',
    recipientName: 'Delta Vendor',
    amount: 99.99,
    currency: 'USD',
    notes: 'Bank rejected the transfer',
  });
  await transitionPayment(d.id, 'PROCESSING');
  await transitionPayment(d.id, 'FAILED');
  console.log(`  D ${d.id} — FAILED`);

  // E — CREATED → PROCESSING → FAILED → RETRIED
  const e = await createPayment({
    senderName: 'Acme Co.',
    recipientName: 'Epsilon Vendor',
    amount: 12500.0,
    currency: 'GBP',
    notes: 'Marked for retry after initial failure',
  });
  await transitionPayment(e.id, 'PROCESSING');
  await transitionPayment(e.id, 'FAILED');
  await transitionPayment(e.id, 'RETRIED');
  console.log(`  E ${e.id} — RETRIED`);

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
