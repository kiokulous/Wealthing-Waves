# Developer Notes

> Các quyết định kỹ thuật, quirks, và gotchas quan trọng cần biết.

---

## Known Patterns & Decisions

### 1. Supabase Client Singleton

`lib/supabase.ts` export `createClient()` dùng module-level singleton để tránh tạo nhiều instances trong concurrent renders:

```typescript
let supabase: ReturnType<typeof initSupabase> | null = null

export const createClient = () => {
    if (supabase) return supabase
    supabase = initSupabase()
    return supabase
}
```

**Quan trọng:** Không tạo `new createBrowserClient()` trực tiếp trong components — luôn dùng `import { createClient } from '@/lib/supabase'`.

---

### 2. `total_money` luôn dương

Sau migration `supabase/fix_total_money.sql`, cột `total_money` được normalize thành **luôn dương**. Direction được xác định bởi `type`:
- `Mua` → cash outflow (trừ tiền)
- `Bán`/`Chốt` → cash inflow (cộng tiền)

Đừng store giá trị âm vào `total_money`. Engine tính toán trong `portfolio.ts` đã assume điều này.

---

### 3. Market Price — check-then-upsert

`addMarketPrice()` trong `database.ts` dùng pattern SELECT-then-UPDATE-or-INSERT thay vì `upsert`. Lý do: `upsert` với `onConflict` yêu cầu unique constraint đã tồn tại. Nếu constraint chưa có → runtime error.

Production hiện đã có constraint `UNIQUE(user_id, symbol, date)` (xem `setup.sql`). Có thể đổi sang upsert nếu muốn. Xem `docs/market-price-fix.md`.

---

### 4. All Pages are Client Components

Tất cả pages đều dùng `'use client'` và fetch data trực tiếp từ Supabase trong `useEffect`. Không có server-side data fetching (no `getServerSideProps` / no RSC data fetching).

Trade-off: đơn giản hơn nhưng initial load có thể chậm hơn SSR. Acceptable cho app cá nhân.

---

### 5. Auth Guard Pattern

Mỗi page tự guard bằng pattern:
```typescript
const { user, loading } = useAuth()
const router = useRouter()

useEffect(() => {
    if (!loading && !user) router.push('/login')
}, [user, loading, router])

if (loading || !user) return <LoadingSpinner />
```

Không có middleware Next.js — guard ở client side.

---

### 6. Symbol Always Uppercase

`symbol` được uppercase trước khi lưu DB (`symbol.toUpperCase()` trong cả `addTransaction` và `addMarketPrice`). Tất cả queries và calculations đều expect uppercase symbol. Match giữa transactions và market_prices dựa vào exact string match.

---

### 7. Single Dark Theme

App chỉ có 1 theme (dark). `ThemeProvider` đã được xóa vì là stub no-op. Nếu muốn thêm light mode trong tương lai: implement toggle logic trong `globals.css` với `[data-theme="light"]` overrides, và tạo lại ThemeProvider với `document.documentElement.setAttribute('data-theme', ...)`.

---

### 8. Mobile vs Desktop Layout

Layout responsive dùng Tailwind breakpoint `md` (768px):
- `< 768px`: sidebar ẩn, FloatingNav hiện, padding mobile
- `≥ 768px`: sidebar 240px, FloatingNav ẩn

Một số pages dùng CSS classes đặc biệt từ `globals.css` cho responsive behavior:
- `.app-grid` → 2-col grid, override thành 1-col trên mobile
- `.mob-form-row`, `.mob-single`, `.mob-asset-list` → responsive layout helpers
- `.desktop-asset-grid` / `.mob-asset-list` → toggle giữa table (desktop) và list (mobile)

---

### 9. Recharts in Components

Recharts components phải được wrapped trong `ResponsiveContainer` với explicit height:
```tsx
<ResponsiveContainer width="100%" height={200}>
    <LineChart data={data}>...</LineChart>
</ResponsiveContainer>
```

Nếu không có height → chart render 0px. Không dùng `height="100%"` mà không có parent có fixed height.

---

### 10. ESLint — Chỉ dùng `next/core-web-vitals`

Project **không có** `@typescript-eslint/eslint-plugin` được cài. Dùng bất kỳ rule `@typescript-eslint/*` nào trong `.eslintrc.json` sẽ gây lỗi build Vercel trên **toàn bộ file**.

Config đúng (`.eslintrc.json`):
```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "no-unused-vars": "off",
    "react-hooks/exhaustive-deps": "warn",
    "react/display-name": "off"
  }
}
```

Không thêm `@typescript-eslint/no-unused-vars` hay bất kỳ `@typescript-eslint/*` rule nào.

---

### 11. Fee Calculation — Chiều ngược lại với ban đầu

**Logic hiện tại (đúng):** User nhập `qty`, `price`, `total_money` → `fee` được tính tự động và **readonly**:
```
fee = total_money - (qty × price)
```

**Logic cũ (sai):** App từng tự tính `price` từ `total_money + fee + qty`. Đã đổi ngược lại.

Áp dụng trong cả `transaction/page.tsx` (form thêm mới) và `EditTransactionModal.tsx` (form chỉnh sửa).

---

### 12. Dark Theme Modals — Không dùng Tailwind `dark:` prefix

Các modal (`EditTransactionModal`, `EditMarketPriceModal`) dùng inline styles với CSS variables thay vì Tailwind `dark:` classes. Lý do: app chỉ có 1 dark theme duy nhất, dùng `dark:` là dư thừa và dễ gây inconsistency.

Pattern chuẩn cho modal:
```tsx
style={{
    background: 'linear-gradient(180deg, rgba(255,255,255,0.012), transparent), var(--surface-1)',
    border: '1px solid var(--line-2)',
    borderRadius: 'var(--r-xl)',
    boxShadow: 'var(--sh-pop)',
}}
```

---

### 13. Volume — Chỉ áp dụng cho Cổ phiếu

Cột `volume` trong bảng `market_prices` là nullable. Chỉ nhập và sử dụng với category `Cổ phiếu`. Các loại khác (Chứng chỉ quỹ, Vàng, Tiết kiệm) luôn để `null`.

Form Price Update trong `transaction/page.tsx` chỉ hiện field "Khối lượng (KL)" khi `formData.category === 'Cổ phiếu'`. Signal engine trong `signals/page.tsx` dùng flag `useVolume = VOLUME_CATEGORIES.includes(category)` để quyết định có tính volume signals hay không.

---

### 14. Map Iteration — Dùng `Array.from()` thay vì `for...of` trực tiếp

TypeScript target của project không hỗ trợ iterate `Map` trực tiếp bằng `for...of`:

```typescript
// ❌ Build fail trên Vercel
for (const [k, v] of myMap) { ... }

// ✅ Đúng
for (const v of Array.from(myMap.values())) { ... }
for (const [k, v] of Array.from(myMap.entries())) { ... }
```

---

## Removed / Deprecated

Các files sau đã bị xóa khỏi codebase (tháng 5/2026):

| File | Lý do |
|---|---|
| `components/Sidebar.tsx` | Thay thế bởi `AppSidebar.tsx` |
| `components/TopNav.tsx` | Không dùng, thay thế bởi AppSidebar |
| `components/MobileHeader.tsx` | Không dùng |
| `components/ProfitCorrelationChart.tsx` | Không dùng |
| `components/TotalBalanceChart.tsx` | Không dùng |
| `components/analysis-view.tsx` | Prototype cũ (gọi Supabase trực tiếp) |
| `components/dashboard-view.tsx` | Prototype cũ |
| `components/input-view.tsx` | Prototype cũ (field mapping sai) |
| `components/fab-input.tsx` | Prototype cũ |
| `components/bottom-nav.tsx` | Prototype cũ (light theme) |
| `components/providers/ThemeProvider.tsx` | Stub no-op |
| `app/input/page.tsx` | Prototype cũ (dùng light theme, DB field sai) |

Prototype UI HTML gốc được giữ tại `docs/prototype-ui.html` làm tham khảo design.

---

## Tech Stack Versions

| Package | Version |
|---|---|
| next | 14.1.0 |
| react | ^18 |
| @supabase/supabase-js | 2.45.4 |
| recharts | ^2.11.0 |
| tailwindcss | ^3.3.0 |
| typescript | ^5 |
| lucide-react | ^0.312.0 |
| clsx | ^2.1.0 |
| tailwind-merge | ^2.2.1 |

---

*Last updated: 2026-06-01*
