# United Papers demo — project guide

B2B wholesale foodservice packaging demo (storefront + admin). **All data is synthetic; keep demo labels.**
Read first: `docs/DEMO_STATUS.md`, then `docs/ARCHITECTURE.md`, `docs/DEMO_RUNBOOK.md`.

- Stack: Next.js 16 App Router (see `AGENTS.md` — APIs differ from older Next; check `node_modules/next/dist/docs/`), Prisma 7 (driver adapter `@prisma/adapter-pg`, client in `src/generated/prisma`), PostgreSQL, Zod, Vitest. Cache Components is OFF on purpose.
- DB: `npm run db:start` (embedded real PostgreSQL, port 54329, UTF-8) must be running for dev, tests and the app.
- Commands: `npm run verify` (types+lint+tests), `npm run build`, `npm run start`, `npm run db:migrate|db:seed|db:reset`.
- Core rule: **all stock/price logic lives in `src/server/orders.ts`**; never trust browser prices; reservation is the atomic conditional UPDATE. Don't weaken it; add tests in `tests/orders.test.ts`.
- Admin pages call `requireAdminPage()`, admin APIs call `assertAdminReq()`. No debug/seed/reset endpoints. Never hardcode credentials; `.env` is gitignored (`npm run setup:env`). Admin logins are rows in `admin_users` (bcrypt hash only) — create with `npm run admin:create -- <email> <password>`; there is NO admin password in env. Local scripts/tests refuse a non-local `DATABASE_URL`; when running anything against a hosted DB, set the variable only for that command and clear it after.
- Tests run on `unitedpapers_test` only (global-setup refuses other DBs).
- Windows/PowerShell: write files without BOM (a BOM in package.json breaks tsx).
- Don't publish publicly (ngrok/Vercel) without explicit owner approval.
- Commit small milestones; end commit messages with the Co-Authored-By line used in this repo.
