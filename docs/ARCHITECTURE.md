# United Papers — Architecture & Plan (DEMO build)

Single modular full-stack app: **Next.js 16 (App Router) + React 19 + TypeScript strict + Tailwind 4 + shadcn/ui + Lucide**, Route Handlers as the backend, **Prisma 7 + PostgreSQL**, Zod validation, Vitest. No Medusa/Shopify/NestJS/Docker/Redis.

## Folder structure
```
prisma/            schema.prisma, migrations/ (init has hand-written CHECK constraints + order_number_seq), seed.ts, seed-data.ts
scripts/           setup-env.ts (random secrets .env), db-start.ts (local PostgreSQL, UTF-8)
src/lib/           pricing.ts (pure money rules), validation.ts (Zod schemas), utils.ts
src/server/        db.ts, orders.ts (core transaction), catalog.ts, admin-data.ts, auth.ts, http.ts (rate limit, origin check)
src/app/(store)/   home, products, products/[slug], cart, checkout, order/[id]
src/app/admin/     login/, (portal)/ dashboard, orders, orders/[id], inventory, products, customers, suppliers
src/app/api/       catalog/products, cart/quote, orders, admin/{login,logout,orders,orders/[id],inventory}
src/components/    brand/ (logo, product-art), store/, admin/, ui/ (shadcn)
tests/             Vitest (pricing, orders/concurrency, API authorization) — runs on a separate *_test database
docs/              this file + DEMO_STATUS / RUNBOOK / SCENARIO
```

## Database (PostgreSQL, UUID v7 PKs, timestamptz, Decimal money)
categories · suppliers · products · product_variants (the SKU: pack, units/case, case price, per-piece cost, reorder point) ·
inventory_balances (onHand, reserved — one row per SKU) · inventory_movements (append-only ledger) · inventory_reservations (1:1 with order line) ·
customers · sales_orders (idempotencyKey UNIQUE, isDemo) · sales_order_lines (price/cost/name snapshots).
DB-level CHECKs: `onHand >= 0`, `reserved >= 0`, `reserved <= onHand`, qty > 0, price >= 0. Sequence `order_number_seq` → `UP-10001…`.
Extensible later: purchase_orders/receipts (suppliers + movements already exist), invoices/payments, customer price lists, deliveries, warehouse_id on balances.

## The core workflow (src/server/orders.ts → createOrder)
1. Idempotency pre-check by key. 2. One DB transaction: load active variants → **server-side prices** → upsert customer → next order number → create order + lines (snapshots) →
for each line (sorted by variant id, no deadlocks) `UPDATE inventory_balances SET reserved = reserved + q WHERE onHand - reserved >= q` (0 rows ⇒ `INSUFFICIENT_STOCK`, whole tx rolls back) → create reservation + RESERVE movement.
3. Unique-violation on the idempotency key (double click / retry / race) returns the original order; a single bounded retry covers the same-new-email customer race.
Available to sell = onHand − reserved. Stock is *reserved* at order time; deducting on-hand at dispatch is deferred (fulfillment is a later phase).

## Security model (pilot)
- Prices/totals from the browser are ignored; Zod strips unknown fields. Quantities 1–500, ≤50 lines.
- Admin: bcrypt hash + email from env (fail-closed if unset), signed HS256 JWT in an httpOnly SameSite=Lax cookie (Secure over HTTPS), 8h. Every admin page calls `requireAdminPage()`, every admin API `assertAdminReq()`. No seed/reset/debug endpoints exist.
- Public mutations (`/api/orders`, `/api/cart/quote`, login) have an origin check and an in-memory rate limit (**best-effort, per instance — use a shared store in production**).
- No PII in logs. All data synthetic; orders flagged `isDemo`; UI labels demo/simulated parts (payment, delivery, email).
- Order confirmation URL uses the unguessable-enough UUID (v7); it shows the customer's business name and city only.

## Pages & API
Storefront: `/`, `/products?category=&q=`, `/products/[slug]`, `/cart`, `/checkout`, `/order/[id]`. Admin: `/admin/login`, `/admin`, `/admin/orders[/id]`, `/admin/inventory`, `/admin/products`, `/admin/customers`, `/admin/suppliers`.
API: `GET /api/catalog/products` · `POST /api/cart/quote` · `POST /api/orders` · `POST /api/admin/login|logout` · `GET /api/admin/orders[/id]|inventory` (401 without session).

## Priorities
P0 (done): catalog → cart → demo order → transactional reservation → admin orders/inventory/dashboard.
P1 (not done): product create/edit, image management, purchase orders, goods receiving, customer login, order status transitions (pick/pack/dispatch with on-hand deduction), cancel → release reservation.
Deferred: live payments, supplier APIs, shipping integration, credit terms, multi-warehouse, accounting, tax.

## Hosting
Local (default): embedded PostgreSQL via `npm run db:start` + `next start`. Hosted (preferred, **needs the owner**): Supabase Postgres (use the *pooled* connection string for serverless; run `prisma migrate deploy` + seed once) + Vercel with env vars from `.env.example`. See DEMO_RUNBOOK.md.
