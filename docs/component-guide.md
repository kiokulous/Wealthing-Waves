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
- 5 nav items (Dashboard, Assets, Analysis, Transaction, Profile)
- Portfolio summary stats (total value, P&L%)
- User avatar + display name + Sign out

**Data fetching:** Tự fetch transactions + market prices để tính portfolio stats. Dùng `calculatePortfolio()`.

---

### FloatingNav

**File:** `components/FloatingNav.tsx`  
**Visible:** Mobile only (ẩn trên `md:`)

Bottom navigation pill (glassmorphism style). 5 nav items cùng với AppSidebar.

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
<MarketPriceHistory
    prices={marketPrices}
    onEdit={(price) => { /* open edit modal */ }}
    onDelete={(id) => { /* delete logic */ }}
/>
```

---

## Modal Components

### EditTransactionModal

**File:** `components/EditTransactionModal.tsx`

```tsx
<EditTransactionModal
    transaction={selectedTxn}
    isOpen={showModal}
    onClose={() => setShowModal(false)}
    onSave={(updated) => { /* call updateTransaction() */ }}
/>
```

Form đầy đủ — date, type, category, symbol, quantity, price, fee, total_money.

---

### EditMarketPriceModal

**File:** `components/EditMarketPriceModal.tsx`

```tsx
<EditMarketPriceModal
    price={selectedPrice}
    isOpen={showModal}
    onClose={() => setShowModal(false)}
    onSave={(updated) => { /* call updateMarketPrice() */ }}
/>
```

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

*Last updated: 2026-05-17*
