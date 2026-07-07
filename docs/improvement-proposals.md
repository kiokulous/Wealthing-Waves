# Improvement Proposals — Full Project Review

> Review date: 2026-07-07. Scope: all source files under `app/`, `components/`, `lib/`, API routes, middleware, config, and docs.
> Priority levels: **P0** = fix ASAP (security/correctness), **P1** = high value, **P2** = nice to have.

---

## P0 — Security & Correctness

### 1. Unauthenticated API routes trusting client-supplied `userId` (CRITICAL)

`app/api/save-prices/route.ts` and `app/api/refresh-prices/route.ts`:

- Accept `userId` directly from the request body.
- Use `SUPABASE_SERVICE_ROLE_KEY`, which **bypasses RLS entirely**.
- Perform **zero authentication** — anyone who knows (or guesses) a user's UUID can insert/overwrite `market_prices` rows for that user, silently corrupting their portfolio valuation.

**Fix:** authenticate the caller server-side and derive `userId` from the session, never from the body:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const cookieStore = cookies()
const supabase = createServerClient(url, anonKey, {
    cookies: { getAll: () => cookieStore.getAll() },
})
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
// use user.id — and with the anon key + RLS, service role key is not needed at all
```

Since writes are always scoped to the caller's own rows, the anon key + RLS is sufficient — the service role key can be removed from these routes entirely.

Also add input validation on `prices`: cap array length (e.g. 100), validate `symbol` (regex `^[A-Z0-9]{1,20}$`), `price` (positive, sane upper bound), and `category` (whitelist).

### 2. Dead / inconsistent route: `refresh-prices`

No client code calls `/api/refresh-prices` anymore (dashboard now fetches VNDirect prices client-side via `lib/api/market-prices.ts` and saves through `/api/save-prices`). The route also duplicates `fetchVNDirectPrice()` and its error message says "TCBS" while it actually calls VNDirect.

**Fix:** delete the route (preferred), or keep it as the single price-sync path and secure it per item 1.

### 3. Year filter distorts P&L in `calculatePortfolio`

`calculatePortfolio(transactions, prices, filterYear)` filters transactions to a single calendar year **before** computing holdings. Consequences when a position spans years:

- Buy in 2024, sell in 2025 → in the 2025 view, quantity is 0 at sell time, so the *entire* sale value is counted as realized profit (the `item.quantity > 0 else` branch).
- Holdings/quantities can go negative.

The correct tool for "performance within a period" already exists: `calculatePeriodPerformance` (snapshot logic). **Fix:** either route the dashboard year filter through `calculatePeriodPerformance(startDate = Jan 1 of year)`, or clearly relabel the filtered view as "cash flow in year" rather than P&L.

### 4. Timezone-sensitive date comparisons

`new Date('YYYY-MM-DD')` parses as **UTC midnight**, but comparisons use local time (`new Date(filterYear, 0, 1)`, `today`). In VN (UTC+7) this mostly works, but transactions dated on boundary days (Jan 1 / Dec 31, month-ends in `calculatePortfolioHistory`) can land in the wrong bucket. **Fix:** compare date *strings* (`t.date <= '2026-07-07'`) — the DB already stores ISO `DATE`, and string comparison is timezone-proof and faster.

---

## P1 — High-Value Improvements

### 5. Add unit tests for the calculation engine

`lib/api/portfolio.ts` and `calculate_period_performance.ts` are pure functions — ideal for testing, and they carry all the financial correctness of the app. Currently **zero tests**. Recommend Vitest:

```bash
npm i -D vitest
# package.json: "test": "vitest run", "typecheck": "tsc --noEmit"
```

Priority cases: weighted-average cost after partial sells, `Cổ tức CP` (qty up, cost basis unchanged), sell-more-than-held, closed positions ROI (`totalAccumulatedInvested` path), period performance with/without market-price fallback, year-boundary transactions.

### 6. Middleware refreshes session but protects nothing

`middleware.ts` only calls `auth.getUser()`; route protection is client-side per page (spinner → redirect). Data is safe thanks to RLS, but every protected page ships JS to unauthenticated visitors and flashes a loader. **Fix:** in middleware, redirect unauthenticated requests for app pages to `/login` (whitelist `/login`, `/auth/callback`). This also removes the copy-pasted guard `useEffect` from 7 pages.

### 7. Shared data layer instead of per-page refetch

Every page independently fetches **all** transactions + **all** market prices on mount. Navigating Dashboard → Assets → Analysis = 6 full-table fetches. Options (in order of effort):

1. Module-level cache with staleness TTL in `database.ts`.
2. SWR or TanStack Query (`staleTime: 60s`) — also gives retry/focus-revalidation for free.
3. A `PortfolioProvider` context that loads once and exposes `{ transactions, prices, reload }`.

### 8. `market_prices` grows unbounded and is always fetched in full

One row per user × symbol × day. After a couple of years this is thousands of rows fetched on every page view, and `calculatePortfolio` re-sorts prices per symbol on every call. **Fixes:**

- Fetch only what's needed: latest price per symbol (`select distinct on` via a Postgres view or RPC) + last N days for sparklines/history.
- Pre-index prices by symbol once (`Map<string, MarketPrice[]>`) instead of `.filter().sort()` per symbol per call (`portfolio.ts`, `calculatePortfolioHistory` re-sorts inside a month loop → O(months × symbols × P log P)).

### 9. Move the repo out of Google Drive (or exclude heavy dirs)

The project lives in a Drive-synced folder including `node_modules/` (377 entries), `.next/`, `.git/`, `tsconfig.tsbuildinfo`. Risks: sync corruption of `.git`, huge sync churn, slow builds. **Fix:** keep the working repo in a local path (e.g. `~/dev/wealthing-waves`), rely on GitHub for backup; keep only `docs/` + `context_file.md` in Drive if desired. At minimum, mark `node_modules` and `.next` as "don't sync". Also add `tsconfig.tsbuildinfo` to `.gitignore`.

### 10. Update dependencies

- `next` 14.1.0 is old (early 2024); upgrade to latest 14.2.x for security patches (incl. middleware-related CVEs) — low-risk within v14.
- `docs/dev-notes.md` states supabase-js `2.45.4` but `package.json` has `^2.105.4` — sync the docs.
- Add `"engines": { "node": ">=18" }` for Vercel consistency.

---

## P2 — Code Quality & Polish

### 11. Split oversized page files

`dashboard/page.tsx` (909 lines), `signals/page.tsx` (698), `analysis/page.tsx` (615) each mix helpers, sub-components, and page logic. Extract shared bits:

- `fmtMoney/fmtFull/fmtShort` are re-declared in pages → move to `lib/format.ts` (single source of truth for VND formatting).
- Local `Sparkline` in dashboard duplicates `components/Sparkline.tsx` conceptually — pick one.
- Holdings-from-transactions reduction is implemented 3× (dashboard `handleRefreshPrices`, refresh-prices route, portfolio.ts) → export one `computeHoldings(transactions)` from `lib/api/portfolio.ts`.

### 12. Small correctness/cleanliness fixes

- `dashboard/page.tsx:87` — `marketPrices.length >= 0` is always true; the condition is a no-op.
- `fmtMoney`: `.replace(/\./, '.')` is a no-op.
- `.eslintrc.json` disables `no-unused-vars` globally — install `@typescript-eslint` properly instead of turning the rule off (also removes the dev-notes §10 workaround).
- tsconfig: set `"target": "ES2017"` (or `downlevelIteration: true`) to eliminate the `Array.from(map)` workaround documented in dev-notes §16.
- `console.log` of full API bodies in refresh-prices route — remove or gate behind env flag.

### 13. UX / feature suggestions (aligned with context_file "Next Steps")

- **CSV import** with dry-run preview (row validation + duplicate detection against existing txns) — pairs with the existing CSV export.
- **Cash dividend type** (`Cổ tức tiền`) — currently only stock dividends exist; cash dividends would complete realized-return tracking.
- **Notes field** already exists in DB (`notes TEXT`) but is absent from the form/type — cheap win: add to `Transaction` type, form, and edit modal.
- **Error surface**: many `catch { console.error }` blocks swallow errors silently (e.g. `loadData`) — show a toast/banner so failed loads aren't mistaken for empty portfolios.
- **Loading skeletons** (`.skeleton` class already exists in globals.css) instead of full-page spinner.

### 14. Tooling & process

- Add `typecheck` script and a minimal GitHub Actions workflow: `tsc --noEmit` + `next lint` + `vitest run` on push — catches the Vercel-build-only failures (dev-notes §10, §16) before deploy.
- Add Prettier (or Biome) for consistent formatting.

---

## Suggested execution order

| Step | Item | Effort |
|---|---|---|
| 1 | Secure `save-prices`, delete `refresh-prices` (P0-1, P0-2) | ~1h |
| 2 | Date-string comparisons (P0-4) | ~1h |
| 3 | Vitest + engine tests (P1-5) — locks in correctness before refactors | ~half day |
| 4 | Fix year-filter P&L semantics (P0-3) — with tests from step 3 | ~2h |
| 5 | Middleware route guard (P1-6) | ~1h |
| 6 | Repo out of Drive + dep upgrades + CI (P1-9, P1-10, P2-14) | ~half day |
| 7 | Data layer & price-fetch optimization (P1-7, P1-8) | ~1 day |
| 8 | Refactors & UX polish (P2-11..13) | incremental |
