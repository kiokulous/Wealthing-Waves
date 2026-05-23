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
