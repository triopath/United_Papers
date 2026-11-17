# Demo Status — updated 2026-11-17 (late evening)

## Completed (P0 — all working locally)
- Next.js 16 / Prisma 7 / PostgreSQL project, git history (3 milestones), docs, tests.
- Storefront: home, catalog (category + search), product detail with variants, cart, checkout, confirmation.
- Backend: server-priced quote, transactional order + atomic reservation, idempotency, rate limit, origin check.
- Admin (protected): dashboard, orders + detail, inventory, products, customers, suppliers.
- Seed: 8 categories, 21 products, 39 SKUs, 5 suppliers, 6 customers, 7 orders.

## Verification actually executed
| Check | Result |
|---|---|
| `tsc --noEmit` | pass |
| ESLint | pass (0 problems) |
| Vitest (3 files, 35 tests, real PostgreSQL) | **35 passed** — incl. insufficient stock rollback, duplicate/concurrent idempotent submit, 2 and 20 concurrent buyers never oversell, DB CHECK backstop, 401 on all admin APIs, forged/tampered cookies, login rate limit, fresh-client persistence |
| `next build` | pass |
| Migration deploy + seed on fresh UTF-8 cluster | pass |
| Browser E2E (built-in browser, `next start`) | product → cart (qty 1→8) → checkout → UP-10008 confirmed → admin dashboard shows it → inventory UP-CUP-H08 180/10 reserved/170 available → order detail OK |
| Unauthenticated `/admin` → 307 to login; `/api/admin/*` → 401 (curl, live server) | pass |
| Order still present after app server restart | pass (app restart; PostgreSQL itself was not restarted) |

## NOT done / NOT verified
- No public deployment (Vercel/Supabase/ngrok): needs owner approval + accounts; ngrok not installed.
- Not tested: second-device session, visual mobile layouts (responsive classes only), Safari.
- No licensed product photos: only the supplied UP cup photo; other products use local SVG illustrations (labelled).
- Gorilla Paper website was not browsed this session; categories/terminology came from the supplied plan PDF + flyer. No Gorilla content is used.
- P1 not started: product editing, POs/receiving, customer login, fulfillment status changes.
- In-memory rate limiter is per instance (fine locally, weak on serverless).
- `npm audit` reports advisories in transitive dev dependencies; not triaged.

## Next exact task
Walk through DEMO_SCENARIO.md once on the demo machine, then (if the client needs a link) get owner approval for ngrok and follow DEMO_RUNBOOK.md.
Optional P1 order: cancel order → release reservation; status transitions with on-hand deduction; PO + receiving.

## Continue in a new session
```powershell
cd "C:\Sample files\united-papers"; git log --oneline; npm run db:start   # terminal 1
npm run verify; npm run build; npm run start                              # terminal 2
```
Admin credentials are generated locally (`npm run setup:env -- --reset-admin`); never committed.
