# PayFlow Tracker

A small-business tool for tracking outbound vendor payments. The user can create a payment, browse the list with a status filter, open a single payment with its full audit trail, and move it through a fixed lifecycle. The engineering problem the app solves is making each status transition **atomic, audited, and impossible to mis-sequence**.

This document is the design reference. The README explains *how to run* the app; this file explains *why it is built this way*.

---

## 1. What it is

Four user-facing capabilities:

1. **Create** a payment (sender, recipient, amount, currency, optional notes).
2. **List** all payments, filterable by status.
3. **View** a single payment along with its full history of status changes.
4. **Transition** a payment's status, following the lifecycle in §3.

Underneath those four capabilities sits one important rule: every transition is checked against an allowed-transitions table, runs inside a database transaction with a row-level lock, and writes both the new state and an audit-log row atomically.

---

## 2. Stack & one-line rationale

| Layer | Choice | Why |
|---|---|---|
| Database | **PostgreSQL** | Atomic transactions and `SELECT … FOR UPDATE` row locking are load-bearing for the transition logic. A document database would require app-level workarounds for the same guarantees. |
| ORM | **Prisma** | Reduces the atomic-transition story to a handful of lines via `$transaction`. The `schema.prisma` file doubles as a readable design artifact. |
| API | **Node + Express + TypeScript** (`backend/`) | Familiar minimal API surface; TypeScript catches the boundary mistakes that Zod can't reach. |
| Frontend | **React + TypeScript** via **Create React App** (`frontend/`) | A mature, well-understood toolchain. Tooling stays out of the way of the state-machine story. |
| Styling | **MUI (Material UI)** | Pre-built components (`TextField`, `Select`, `Table`, `Chip`, `Dialog`, `Snackbar`) cover everything the four screens need. No custom CSS to maintain. |
| Validation | **Zod**, in a `shared/` workspace | One schema imported by both server and client. Single source of truth, no drift. |
| Repo layout | **npm workspaces** monorepo (`frontend/`, `backend/`, `shared/`) | Lets the three packages share the Zod schemas without copy-paste. |
| Testing | **Vitest** | Focused on the state machine — the central correctness concern of this codebase. |

---

## 3. State machine

The lifecycle:

```
CREATED ──▶ PROCESSING ──▶ COMPLETED   (terminal)
            ▲        │
            │        └──▶ FAILED ──▶ RETRIED ──┐
            │                                  │
            └──────────────────────────────────┘
```

Five states; one terminal state (`COMPLETED`). `RETRIED` is treated literally — a `FAILED → RETRIED → PROCESSING` recovery is two user actions and two audit-log rows. If a retry itself fails, the path is back to `FAILED`, then another transition to `RETRIED`; the model makes that case unambiguous.

The allowed-transitions table lives in `backend/src/utilities/statusMachine.ts`:

```ts
export const ALLOWED_TRANSITIONS: Record<Status, readonly Status[]> = {
  CREATED:    ['PROCESSING'],
  PROCESSING: ['COMPLETED', 'FAILED'],
  COMPLETED:  [],            // terminal
  FAILED:     ['RETRIED'],
  RETRIED:    ['PROCESSING'],
};

export function assertCanTransition(from: Status, to: Status): void {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new InvalidTransitionError(from, to);
  }
}
```

`assertCanTransition` is the only function that decides whether a transition is legal. Every code path — the API controller, the service layer, the seed script, the tests — calls it. Concentrating the rule in one function keeps the behavior auditable and gives tests a single unit to exercise exhaustively.

---

## 4. Data model

Two Prisma models, plus an enum for the status:

```prisma
model Payment {
  id            String    @id @default(uuid())
  senderName    String
  recipientName String
  amount        Decimal   @db.Decimal(18, 4)
  currency      String    @db.Char(3)
  notes         String?
  status        Status    @default(CREATED)
  createdAt     DateTime  @default(now())
  history       PaymentStatusHistory[]
}

model PaymentStatusHistory {
  id          String    @id @default(uuid())
  paymentId   String
  fromStatus  Status?         // null on the row that records initial creation
  toStatus    Status
  at          DateTime  @default(now())
  payment     Payment   @relation(fields: [paymentId], references: [id])

  @@index([paymentId, at])
}

enum Status { CREATED PROCESSING COMPLETED FAILED RETRIED }
```

**Status history lives in its own table.** It is append-only — growing monotonically with payment activity, never updated or deleted in place — which maps naturally to a table where each row is immutable. The split keeps each model single-purpose: `Payment` always holds *current* state; `PaymentStatusHistory` is the full event log. A timeline read is one indexed query against one table.

---

## 5. Concurrency

The interesting correctness problem in this app:

> Two clients click "Mark complete" at the same moment on the same payment. Both reads see status `PROCESSING`. Both decide the transition is legal. Both write `COMPLETED` and append an audit row. Result: two audit rows describing a transition that should have happened once.

The fix: every transition runs inside a Prisma transaction, and the first thing the transaction does is acquire a row-level lock on the payment.

```ts
await prisma.$transaction(async (tx) => {
  const [payment] = await tx.$queryRaw<Payment[]>`
    SELECT * FROM "Payment" WHERE id = ${id} FOR UPDATE
  `;

  assertCanTransition(payment.status, next);

  await tx.payment.update({ where: { id }, data: { status: next } });
  await tx.paymentStatusHistory.create({
    data: { paymentId: id, fromStatus: payment.status, toStatus: next },
  });
});
```

**Atomic update + audit insert.** If the audit insert fails after the update succeeds (disk error, constraint violation, anything), the update is rolled back automatically. The payment status and its audit log can never get out of sync.

---

## 6. Validation

Zod schemas live in the `shared/` workspace and are imported by both server and client.

On the server, a small middleware applies them before any controller runs:

```ts
export function validate(schema: ZodSchema) {
  return (req: Request, _: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return next(new ValidationError(result.error));
    req.body = result.data;     // parsed + narrowed types from here on
    next();
  };
}

router.post('/payments',                       validate(createPaymentSchema),   createPayment);
router.patch('/payments/:id/transition',       validate(transitionSchema),      transitionPayment);
```

On the client, the same schemas drive form validation. The exact mechanism — `react-hook-form` + `zodResolver` versus a plain submit handler — is decided at the point the create form is built; the schemas are shared either way.

The principle: there is one definition of "a valid create-payment request" or "a valid transition request" in the codebase. Changing the schema changes both sides.

---

## 7. Error model

Every error response uses the same JSON envelope:

```json
{
  "error": {
    "code": "INVALID_TRANSITION",
    "message": "Cannot move FAILED to COMPLETED",
    "from": "FAILED",
    "to": "COMPLETED"
  }
}
```

| HTTP | When | `code` | UI behaviour |
|---|---|---|---|
| 400 | Zod validation fails | `VALIDATION` | Field-level errors rendered inline on the form |
| 404 | Payment not found | `NOT_FOUND` | Toast + redirect to the list |
| 409 | Invalid state transition | `INVALID_TRANSITION` | Toast: *"Cannot move FAILED to COMPLETED"* |
| 500 | Unexpected | `INTERNAL` | Toast: *"Something went wrong"*; the real error is logged server-side |

No blank screens, no `[object Object]` toasts, no errors swallowed in `console.error`.

