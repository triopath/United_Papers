# Demo Runbook (Windows / PowerShell)

Project: `C:\Sample files\united-papers`. Requires Node 20+. No Docker, no PostgreSQL install needed.

## First-time setup
```powershell
cd "C:\Sample files\united-papers"
npm install
npm run setup:env          # creates .env with random secrets; PRINTS the admin password once
npm run db:start           # TERMINAL 1 — real PostgreSQL on 127.0.0.1:54329. Leave it running.
# TERMINAL 2:
npm run db:generate
npm run db:migrate         # applies migrations (incl. safety constraints)
npm run db:seed            # synthetic catalog, 6 customers, 7 historical orders (idempotent)
```
Lost the admin password? `npm run setup:env -- --reset-admin` (prints a new one; restart the app).

## Run the demo
```powershell
npm run db:start           # terminal 1 (if not already running)
npm run build              # terminal 2
npm run start              # http://localhost:3000   (use `npm run dev` while developing)
```
Admin: http://localhost:3000/admin (owner@unitedpapers.demo + the printed password).

## Reset to a clean demo state (DESTROYS local demo data)
```powershell
npm run db:reset           # drops & re-applies migrations on the local DB
npm run db:seed
```

## Verify
```powershell
npm run verify             # typecheck + eslint + vitest (needs `npm run db:start` running)
npm run build
```
Tests use a separate `unitedpapers_test` database and never touch demo data.

## Share a temporary public link (ngrok) — NOT done yet; needs owner approval
ngrok is not installed on this machine. After the owner approves publishing:
```powershell
winget install ngrok.ngrok ; ngrok config add-authtoken <YOUR_TOKEN>
npm run build ; npm run start          # production mode, never `dev`
ngrok http 3000                        # share the https://….ngrok-free.app URL
```
Limits/risks: anyone with the link can use the **public store** (orders are demo-only, rate-limited per IP) and can attempt the admin login (rate-limited; strong random password). Use a **fresh** admin password for the session, stop ngrok when finished, **never expose port 54329** (PostgreSQL stays on 127.0.0.1). The laptop must stay on and awake. Free ngrok shows an interstitial page on first visit.

## Hosted option (Vercel + Supabase) — needs the owner's accounts
1. Create a dedicated *demo* Supabase project; copy the **pooled** Postgres URL.
2. From this repo: `$env:DATABASE_URL="<url>"; npx prisma migrate deploy; npm run db:seed`.
3. Vercel: import the repo, set `DATABASE_URL`, `SESSION_SECRET` (random 48+ bytes), `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (bcrypt, escape `$` as `\$` in the dashboard if needed), `NEXT_PUBLIC_DEMO_BANNER=true`. Deploy.
4. Replace the in-memory rate limiter with a shared store before any real traffic.

## Troubleshooting
- "Something went wrong" pages / API 500 → PostgreSQL isn't running: `npm run db:start`.
- Port 54329/3000 busy → stop the old process, or change the port in `DATABASE_URL`.
- Tests fail at start with "PostgreSQL is not reachable" → start `db:start` first.
