# Manna Cookies & Co.

One really good cookie, baked fresh each week. Public ordering site + single-owner dashboard.

**Production:** https://www.mannacookiesmi.com
**Stack:** Next.js (App Router) · Supabase (Postgres + Auth, project `manna-cookies` in the Neh Temple org) · Square (payments, orders, customers) · Vercel

## How it works

- One **drop** per week (cookie, capacity, pickup windows, package prices). Exactly one drop can be `live` (enforced by a DB unique index).
- Public checkout (5-step sheet): package → details → pickup window → Square payment → confirmation with `MC-####` number + calendar download.
- Capacity is enforced by the `reserve_order` Postgres function with a row lock — overselling is impossible under concurrency. Prices are read server-side; the client never sends an amount.
- Every paid order creates/updates the **customer in Square** and creates a **Square Order + Payment**; Supabase mirrors it for the dashboard (status pipeline: new → preparing → ready → picked up).
- Abandoned checkout holds auto-expire after 5 minutes; concurrent unpaid holds are capped. Failed/canceled attempts are kept as `canceled` rows for the audit trail.
- Dashboard (`/dashboard`): Home stats, Orders pipeline, Bake (drop editor), Customers, What's Next — all behind the owner login.

## Auth & security

- Single owner: `hello@sirromstudios.com`. Signups are disabled server-side in Supabase; the proxy and every server action also reject any other account.
- Sessions: 24h idle timeout + 7-day absolute cap (cookies `mc_sess_start` / `mc_last_seen`, enforced in `proxy.ts`). Forgot-password works from `/login`.
- All inputs validated with zod server-side; public endpoints are rate-limited (Postgres fixed-window limiter) and honeypotted; anon key has **zero** table access (RLS); checkout RPCs execute for the service role only; strict CSP + security headers in `next.config.ts`.

## Development

```bash
npm install
npm run dev          # http://localhost:3000 (tests assume --port 3457)
npx tsc --noEmit     # type check
npm run build        # production build
```

E2E helpers (Playwright, against a running dev server on :3457):

```bash
node scripts/test-checkout.mjs                        # sandbox card 4111... happy path
node scripts/test-checkout.mjs "4000 0000 0000 0002"  # declined-card path
node scripts/test-auth.mjs                            # login + session-expiry matrix
node scripts/test-dashboard.mjs                       # full dashboard walkthrough
node scripts/shoot.mjs <url> <prefix>                 # mobile+desktop screenshots
```

`scripts/extract-assets.mjs` regenerates `/public` assets from `prototype/index.html`.

## Environment

`.env.local` (gitignored) and Vercel project envs:

| Var | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key has no table access |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only; used by public API routes |
| `SQUARE_ACCESS_TOKEN` / `SQUARE_ENVIRONMENT` / `SQUARE_LOCATION_ID` | server-only |
| `NEXT_PUBLIC_SQUARE_APPLICATION_ID` / `NEXT_PUBLIC_SQUARE_LOCATION_ID` / `NEXT_PUBLIC_SQUARE_ENVIRONMENT` | Web Payments SDK |
| `NEXT_PUBLIC_SITE_URL` | password-reset redirect base |
| `SUPABASE_DB_PASSWORD` | local only, for psql/CLI |

Database changes: add a file under `supabase/migrations/` and run `supabase db push`. Auth settings live in `supabase/config.toml` → `supabase config push`.

## Going live with real money (production cutover)

1. **Vercel Pro** — the Hobby plan prohibits commercial use.
2. In the Square dashboard, create **production** credentials; set `SQUARE_ENVIRONMENT=production`, new `SQUARE_ACCESS_TOKEN`, production `SQUARE_LOCATION_ID`, `NEXT_PUBLIC_SQUARE_APPLICATION_ID` (prod app id), `NEXT_PUBLIC_SQUARE_ENVIRONMENT=production`. Rotate the sandbox token (it was shared in chat).
3. **Apple Pay**: register `www.mannacookiesmi.com` in Square's Apple Pay settings (domain verification file) — the button appears automatically once verified. Google Pay works as soon as production credentials are in.
4. Supabase free tier pauses after ~1 week of inactivity — weekly dashboard use prevents it; upgrade or add an uptime ping if the public page ever sleeps.
5. If a payment ever succeeds but the order fails to confirm (logged as `CRITICAL_UNCONFIRMED_PAYMENT` in Vercel logs), reconcile against the Square dashboard — the customer was charged and should be honored.

## Owner login

Set or change the password via `/forgot-password` (email link → `/auth/confirm` → new password). Policy: 12+ characters with upper/lowercase letters and digits. E2E scripts read the password from the `MC_TEST_PASSWORD` env var.

If a payment ever completes but the order can't be confirmed, the server logs `CRITICAL_UNCONFIRMED_PAYMENT` with the order number and Square payment id — reconcile from the Square dashboard; the hold is intentionally NOT released in that case.
# manna-cookies-co
