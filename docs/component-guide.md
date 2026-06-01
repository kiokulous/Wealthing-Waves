# Component Guide

> Hướng dẫn sử dụng và mở rộng các components.

---

## Layout Components

### AppLayout

**File:** `components/AppLayout.tsx`

Shell của toàn bộ app. Render 2 layout khác nhau:
- **Login page** (`/login`): full-screen, không có sidebar
- **App pages**: grid 240px sidebar + main content, FloatingNav ở mobile

```tsx
// Dùng trong app/layout.tsx — không cần gọi trực tiếp
<AppLayout>{children}</AppLayout>
```

CSS class `.app-grid` bị override trên mobile (globals.css):
```css
@media (max-width: 767px) {
    .app-grid { grid-template-columns: 1fr !important; }
}
```

---

### AppSidebar

**File:** `components/AppSidebar.tsx`  
**Visible:** Desktop only (`hidden md:block` trong AppLayout)

Nav links với active state dựa vào `usePathname()`. Hiển thị:
- Logo + app name
- Nav items: Tổng quan, Nhập liệu, **Tín hiệu** (`/signals`), Phân tích, Cài đặt
- Portfolio return % (màu xanh/cam/đỏ theo ngưỡng)
- XP level card (dựa vào số transaction)
- User avatar + display name + Sign out

**Data fetching:** Tự fetch transactions + market prices để tính portfolio stats. Dùng `calculatePortfolio()`.

---

### FloatingNav

**File:** `components/FloatingNav.tsx`  
**Visible:** Mobile only (ẩn trên `md:`)

Bottom navigation pill (glassmorphism style). Nav items: Tổng quan, Nhập liệu, **Tín hiệu**, Phân tích, Tài khoản.

---

## Data Display Components

### CategoryIcon

**File:** `components/CategoryIcon.tsx`

```tsx
<CategoryIcon category="Cổ phiếu" size={20} />
// Renders colored icon circle
// Categories: "Cổ phiếu" | "Chứng chỉ quỹ" | "Vàng" | "Tiết kiệm"
```

Màu sắc mapping:
- Cổ phiếu → `cat-icon-stock` (blue)
- Chứng chỉ quỹ → `cat-icon-fund` (teal)
- Vàng → `cat-icon-gold` (gold)
- Tiết kiệm → `cat-icon-saving` (violet)
- Fallback → neutral gray

---

### Sparkline

**File:** `components/Sparkline.tsx`

```tsx
<Sparkline data={[100, 105, 98, 112, 108, 115, 120]} positive={true} />
```

Mini line chart (Recharts `LineChart`). `positive` điều khiển màu stroke (teal vs red).

---

### TransactionHistory

**File:** `components/TransactionHistory.tsx`

```tsx
<TransactionHistory
    transactions={transactions}
    onEdit={(txn) => { /* open edit modal */ }}
    onDelete={(id) => { /* delete logic */ }}
/>
```

Hiển thị danh sách giao dịch, sortable by date. Mỗi row có edit + delete button.

---

### MarketPriceHistory

**File:** `components/MarketPriceHistory.tsx`

```tsx
<MarketPriceHistory />
```

Hiển thị lịch sử đồng bộ giá với search, filter theo category, và pagination (20 items/trang).

Cột hiển thị: **Ngày · Mã · Phân loại · Giá · Volume · Thao tác**

- Cột **Volume** chỉ xuất hiện khi trang hiện tại có ít nhất 1 bản ghi Cổ phiếu. Hiển thị dạng rút gọn (`6.0 M`, `414 K`). Các loại tài sản khác (Quỹ, Vàng, Tiết kiệm) hiện `—`.
- Mobile: volume hiện dạng nhỏ `KL: 6.0 M` bên dưới giá, chỉ với Cổ phiếu.

---

## Modal Components

### EditTransactionModal

**File:** `components/EditTransactionModal.tsx`

```tsx
<EditTransactionModal
    open={showModal}
    transaction={selectedTxn}
    onCancel={() => setShowModal(false)}
    onSave={async (id, updates) => { await updateTransaction(id, updates) }}
/>
```

Form đầy đủ — date, type (Mua/Chốt toggle), category, symbol, quantity, giá khớp lệnh, tổng tiền giao dịch, phí & thuế (readonly — auto-calc: `total_money - qty × price`).

**Dark theme:** dùng CSS variables (`var(--surface-1)`, `.input-bento`, `.btn-primary`). Không dùng Tailwind `dark:` prefix. Mobile-responsive qua `.mob-form-row` + `.mob-form-footer`.

---

### EditMarketPriceModal

**File:** `components/EditMarketPriceModal.tsx`

```tsx
<EditMarketPriceModal
    open={showModal}
    marketPrice={selectedPrice}
    onCancel={() => setShowModal(false)}
    onSave={async (data) => { await addMarketPrice(data) }}
/>
```

Fields: date, symbol, category, price (hero input — large teal font, `var(--accent)`). Same dark theme styling as EditTransactionModal.

---

### DeleteConfirmDialog

**File:** `components/DeleteConfirmDialog.tsx`

```tsx
<DeleteConfirmDialog
    isOpen={showConfirm}
    title="Xóa giao dịch?"
    message="Hành động này không thể hoàn tác."
    onConfirm={() => { /* execute delete */ }}
    onCancel={() => setShowConfirm(false)}
/>
```

Reusable — dùng cho cả transaction lẫn market price.

---

## Providers

### AuthProvider

**File:** `components/providers/AuthProvider.tsx`

```tsx
// Wrap trong app/layout.tsx — không gọi trực tiếp
// Sử dụng trong component:
const { user, loading, signIn, signUp, signOut, signInWithGoogle } = useAuth()
```

**Context values:**

| Property | Type | Description |
|---|---|---|
| `user` | `User \| null` | Current Supabase user |
| `loading` | `boolean` | Auth state resolving |
| `signIn(email, password)` | `async` | Email/password login |
| `signUp(email, password)` | `async` | Email/password register |
| `signOut()` | `async` | Sign out + redirect /login |
| `signInWithGoogle()` | `async` | Trigger Google OAuth flow |

**Auth state:** Subscribes to `supabase.auth.onAuthStateChange()`. Automatically updates `user` on session changes (e.g., after OAuth callback).

---

---

## Pages

### /signals — Trang Tín hiệu Giao dịch

**File:** `app/signals/page.tsx`

Trang phân tích và đề xuất hành động cho từng mã trong watchlist.

**Tính năng:**
- Quản lý watchlist: thêm/xóa mã, chọn category
- Tính tín hiệu tự động từ lịch sử `market_prices`: MA5/MA20, momentum 5/10 phiên, P&L từ giá mua, volume (chỉ Cổ phiếu)
- 4 loại tín hiệu: `BUY_MORE` 🟢, `HOLD` 🔵, `WATCH` 🟡, `CONSIDER_CUT` 🔴
- Click vào hàng để xem chi tiết lý do phân tích + link TCBS
- Summary strip đếm số mã theo từng tín hiệu

**Signal engine** (`computeSignal(closes, avgBuyPrice, volumes, useVolume)`):
- `closes[]`: mảng Close price, **newest first**
- `volumes[]`: mảng volume, **newest first**, chỉ dùng khi `useVolume = true`
- `useVolume`: `true` chỉ khi `category === 'Cổ phiếu'`
- Score system: mỗi điều kiện cộng/trừ điểm → classify theo ngưỡng
- Volume rules (chỉ Cổ phiếu): breakout xác nhận (+2), bull trap (−2), bán tháo (−2), điều chỉnh lành mạnh (+1)
- Confidence: `cao` khi ≥20 phiên Close + ≥10 phiên volume; `trung bình` khi ≥10 phiên; `thấp` khi <10

**Data sources:** `getWatchlist()`, `getAllMarketPrices()`, `getAllTransactions()` — tất cả client-side.

---

## Adding a New Component

1. Tạo file `components/YourComponent.tsx`
2. Thêm `'use client'` ở đầu (tất cả components đều là client components)
3. Dùng CSS variables từ `globals.css` thay vì hardcode màu
4. Dùng `cn()` từ `lib/utils.ts` để merge Tailwind classes

```tsx
'use client'

import { cn } from '@/lib/utils'

interface Props {
    className?: string
}

export default function YourComponent({ className }: Props) {
    return (
        <div className={cn('ww-card p-4', className)}>
            {/* content */}
        </div>
    )
}
```

---

*Last updated: 2026-06-01 (updated MarketPriceHistory volume column)*
