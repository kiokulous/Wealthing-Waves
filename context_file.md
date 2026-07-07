# Wealthing Waves — Context File

## Work Accomplished

### Session 1 (2026-05-23)

**Transaction page (`/transaction`):**
- Renamed fields: "Giá khớp lệnh", "Tổng tiền giao dịch"
- Reversed fee calculation logic: fee is now readonly and auto-derived as `total_money - (qty × price)`. User inputs qty, price, and total_money manually
- Removed "Nhập từ file" button
- Changed "Tải mẫu CSV" → "Xuất CSV": now exports the user's full transaction history to CSV (BOM-prefixed for Excel/Vietnamese support). Security-safe: scoped to `user_id`
- Synced TransactionHistory table font/styling with MarketPriceHistory (header weight 700, `--t-3` color, `letterSpacing: 0.12em`, `.num` class for numeric cells)

**Analysis page (`/analysis`):**
- Added BCG Matrix component below "Xếp hạng Tốc độ Tài sản" card
- 4 quadrants with median-based thresholds on X (portfolio weight %) and Y (profit/loss %)
- Quadrant labels: ⭐ Đáng chú ý / 💰 Tích luỹ / 🔎 Quan sát / 🚨 Thoái vốn
- Mobile: 2×2 grid → single column via `.bcg-grid` + inline media query

**Profile page (`/profile`):**
- Added "Vùng nguy hiểm" section
- 2-step delete-all confirmation: user must type `"XOÁ TẤT CẢ"` to enable final delete
- Backend: added `deleteAllMyTransactions()` to `lib/api/database.ts` — always scoped to `user_id`

**Dashboard page (`/dashboard`):**
- Added random funny sub-greeting (7 positive, 6 negative pool; seeded by hour)
- Fixed "Hàng tháng" label → dynamic (`filterYear` value or "Toàn bộ")
- P&L value font size: `value-lg` → `value-xl` (28px, tight tracking)
- Year filter: replaced button group with `<select>` dropdown (scales with many years)

**Build fixes:**
- Created `.eslintrc.json` with `next/core-web-vitals` only (no `@typescript-eslint` plugin — not installed)
- Fixed `useMemo` unused import in dashboard
- Fixed unused destructured props in `BcgCell` component

**Modals (EditTransactionModal + EditMarketPriceModal):**
- Full dark theme redesign matching app design system
- Old: white/slate background, mismatched Tailwind classes
- New: `var(--surface-1)` background, `.input-bento` inputs, `.btn-primary`/`.btn-ghost` buttons, `.label-cap` labels, `var(--sh-pop)` shadow
- EditTransactionModal: fee auto-calc synced to new logic (readonly)
- Mobile-responsive via `.mob-form-row` and `.mob-form-footer`

## Current State

- All known visual/UI bugs resolved
- ESLint passes on Vercel build
- Both edit modals now match the dark theme design system
- No known pending bugs

## Next Steps

- Add data import from CSV (currently removed — was placeholder)
- Consider adding a "Cổ tức / Dividend" transaction type
- Add portfolio total value over time chart (line chart, not just monthly bar)
- Consider adding notes/memo field to transactions
- Potential: multi-currency support (VND + USD)

---

# PROJECT_SYNC — Session 2026-07-07

## Work Accomplished

**Full project review** → `docs/improvement-proposals.md` (prioritized P0/P1/P2 findings + execution plan). Steps 1–6 of that plan executed:

1. **Security (P0):** `/api/save-prices` now authenticates via `Authorization: Bearer <token>` — user id derived from verified token, never from request body. Writes use anon key + RLS; service role key no longer used anywhere (`SUPABASE_SERVICE_ROLE_KEY` can be removed from Vercel). Input validation added (symbol regex, price bounds, max 100 entries). Deleted dead route `/api/refresh-prices`. Updated callers: `dashboard/page.tsx`, `assets/page.tsx`.
2. **Timezone-proof dates (P0):** all date comparisons in `portfolio.ts` + `calculate_period_performance.ts` now use ISO string compare (new exported helper `toDateStr`). Fixed real bug: `toISOString()` shifted month-end labels back one day in UTC+7 (`calculatePortfolioHistory`).
3. **Tests:** Vitest installed; `lib/api/__tests__/` — 16 tests covering avg-cost, partial sells, stock dividends, closed-position ROI, year boundaries, snapshot period logic. Scripts added: `test`, `test:watch`, `typecheck`.
4. **Year filter fix (P0):** `calculatePeriodPerformance` gained optional `endDate` param (clamps txns/prices to period end). Dashboard year filter now uses snapshot logic — past year = Jan 1 → Dec 31 of that year; cross-year positions (buy 2024, sell 2025) no longer misreported as pure profit. Regression test added.
5. **Middleware auth guard:** `lib/supabase.ts` switched to `createBrowserClient` (@supabase/ssr) — session now in cookies. `middleware.ts` redirects unauthenticated → `/login`; authenticated on `/login` or `/` → `/dashboard`. Public: `/login`, `/auth/*`, `/api/*`. ⚠️ Existing users must sign in again once after deploy (localStorage → cookie migration).
6. **Tooling:** Next.js 14.1.0 → **14.2.35** (+ eslint-config-next); `engines.node >=18.17`; `tsconfig.tsbuildinfo` gitignored; GitHub Actions CI added (`.github/workflows/ci.yml`: typecheck + lint + test on push/PR).

Docs updated: `dev-notes.md` §5 (middleware guard) + new §5b (API route auth).

## Current State

- All checks green: `tsc --noEmit` ✅, `vitest run` 16/16 ✅, `next lint` ✅ (2 pre-existing exhaustive-deps warnings).
- No known pending bugs.
- `node_modules` note: user intentionally keeps it out of Drive sync, moves it in only for builds.

## Next Steps (remaining from improvement plan)

- **Step 7:** Shared data layer (avoid per-page full refetch — SWR/TanStack Query or context) + `market_prices` fetch optimization (latest-per-symbol + last N days instead of full table).
- **Step 8:** Refactors & UX polish — extract `fmtMoney` helpers to `lib/format.ts`, dedupe `computeHoldings`, split 900-line pages, error toasts instead of silent `console.error`, skeleton loading, CSV import, cash dividend type, notes field.
- Deploy reminders: remove `SUPABASE_SERVICE_ROLE_KEY` from Vercel; users re-login once.
