# PayFlow Tracker

A vendor payment workflow app with **atomic status transitions** and a **full audit log**.

## Live demo

| | URL |
|---|---|
| Frontend | https://purple-pond-0d0b80200.7.azurestaticapps.net |
| Backend API | https://payflow-api.azurewebsites.net |

Hosted on Azure (App Service + Static Web Apps + Flexible PostgreSQL). See [Deployment](#deployment) for details.

## Quick start (5 steps)

**Prerequisite:** PostgreSQL 16 running locally.

1. **Install Postgres** (one-time, on Mac):
   ```bash
   brew install postgresql@16 && brew services start postgresql@16
   ```

2. **Clone the repo**:
   ```bash
   git clone <repo-url> && cd tolken-payout-tracker
   ```

3. **Configure environment** — copy the template and update the username for your machine:
   ```bash
   cp backend/.env.example backend/.env
   # In backend/.env, replace YOUR_OS_USERNAME with your Mac username (run `whoami`)
   ```

4. **Install dependencies, build shared, migrate the database, and seed it** — one command:
   ```bash
   npm run setup
   ```

5. **Start everything** — backend and frontend in one terminal:
   ```bash
   npm run dev
   ```

   Open <http://localhost:3000>. The backend runs on <http://localhost:4000>.

   You'll see five seeded payments — one in each lifecycle state.

## What it does

Track outbound vendor payments through a fixed lifecycle. Four user-facing capabilities:

1. **Create** a payment (sender, recipient, amount, currency, optional notes).
2. **List** all payments, filterable by status.
3. **View** a single payment with its full audit history.
4. **Transition** a payment's status — atomically, with the status update and the audit-log row landing together or not at all.

The full design rationale, data model, and state machine are documented in [SPEC.md](./SPEC.md).

## Stack

| Layer | Choice |
|---|---|
| Database | PostgreSQL 16 |
| ORM | Prisma 6 |
| API | Node + Express 5 + TypeScript |
| Frontend | React 19 + TypeScript (Create React App) |
| Styling | MUI 9 |
| Validation | Zod, shared between client and server via the `shared/` workspace |
| Testing | Vitest, focused on the state machine |
| Repo | npm workspaces monorepo |

See [SPEC.md §2](./SPEC.md) for the rationale behind each choice.

## Project structure

```
.
├── backend/      Express API + Prisma + state machine + tests
├── frontend/     React SPA with MUI
├── shared/       Zod schemas + DTO types (consumed by both)
├── SPEC.md       Design reference
└── README.md     This file
```

## API

| Method | Path | Body |
|---|---|---|
| `GET` | `/health` | — |
| `GET` | `/payments?status=…` | (filter optional; `CREATED \| PROCESSING \| COMPLETED \| FAILED \| RETRIED`) |
| `GET` | `/payments/:id` | — |
| `POST` | `/payments` | `{ senderName, recipientName, amount, currency, notes? }` |
| `PATCH` | `/payments/:id/transition` | `{ toStatus }` |

All errors return a consistent envelope (see [SPEC.md §7](./SPEC.md)):

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

### curl examples

```bash
# Create
curl -X POST http://localhost:4000/payments \
  -H 'Content-Type: application/json' \
  -d '{"senderName":"Acme","recipientName":"Vendor","amount":100,"currency":"USD"}'

# Transition
curl -X PATCH http://localhost:4000/payments/<id>/transition \
  -H 'Content-Type: application/json' \
  -d '{"toStatus":"PROCESSING"}'
```

## Tests

```bash
npm --prefix backend test       # 27 state-machine tests
npm --prefix backend run verify # build + tests
```

## Where the data lives

PostgreSQL stores its data on disk. On macOS with Homebrew the data directory is `/opt/homebrew/var/postgresql@16/` — our database is named **`payflow_dev`** inside it. You can inspect rows directly with:

```bash
psql -d payflow_dev -c 'SELECT id, status, "recipientName" FROM "Payment";'
psql -d payflow_dev -c 'SELECT "fromStatus", "toStatus", at FROM "PaymentStatusHistory" ORDER BY at;'
```

To reset the database — drop everything and re-seed:

```bash
psql -d payflow_dev -c 'DELETE FROM "PaymentStatusHistory"; DELETE FROM "Payment";'
npm --prefix backend run seed
```

## Notable design choices

- **State machine in one place.** `backend/src/utilities/statusMachine.ts` is the only file that decides whether a transition is legal. Every entry point — controller, service, seed, tests — calls the same `assertCanTransition` function. The 27 Vitest tests cover all 25 `(from, to)` pairs.
- **Atomic transitions.** Every status change runs inside a `prisma.$transaction` with a `SELECT … FOR UPDATE` row lock. The status update and the audit-log insert land together or roll back together.
- **Single validation source.** Zod schemas live in `shared/` and are imported by both the backend (server-side validation middleware) and the frontend (form validation). One file defines what "valid" means.
- **No delete.** Payments are immortal — the `ON DELETE RESTRICT` foreign key on the history table enforces this at the database level. If a payment shouldn't have happened, transition it to `FAILED` rather than remove it.

## Deployment

The app is deployed to Azure with the following architecture:

| Layer | Service | Tier | Region |
|---|---|---|---|
| Frontend | Azure Static Web Apps | Free | East Asia (global CDN) |
| Backend | Azure App Service (Linux, Node 22) | Basic B1 | Central India |
| Database | Azure Database for PostgreSQL Flexible Server | Burstable B1ms | Central India |
| Secrets | Azure Key Vault | Standard | Central India |

`DATABASE_URL` is stored in Key Vault and referenced by App Service via system-assigned managed identity (`@Microsoft.KeyVault(SecretUri=...)`). No plaintext connection string anywhere in code, config, or workflows.

Deployment runs on every push to `main` via two GitHub Actions workflows (`.github/workflows/`):
- `deploy-backend.yml` — builds the backend + inlines the `shared` workspace into the deploy bundle, then pushes to App Service. Migrations run on startup via `prisma migrate deploy`.
- `deploy-frontend.yml` — builds CRA with `REACT_APP_API_URL` baked in at compile time, uploads to Static Web Apps.

## What I'd add next

- Authentication (none currently — open API for the demo).
- Cursor-based pagination on `GET /payments` (5 rows don't need it; 50,000 would).
- A soft-delete column on `Payment` if business policy requires reversibility.
- Service-level integration tests against a dedicated test database.
- Cloud deployment — Prisma's connection string is the only env value to swap.

## Note for contributors editing `shared/`

`shared/` compiles to JavaScript in `shared/dist/`. After editing `shared/src/*.ts`, rebuild it so the frontend and backend can pick up the change:

```bash
npm run build:shared
```

(Backend reads compiled JS via `shared/package.json`'s `main` field; the frontend's webpack reads the same compiled output.)
