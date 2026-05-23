# Wealthing Waves — Project Documentation

> Hệ thống quản lý và phân tích danh mục đầu tư cá nhân.  
> Stack: Next.js 14 · TypeScript · Supabase · Tailwind CSS · Recharts

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [File Structure](#3-file-structure)
4. [Design System](#4-design-system)
5. [Database Schema](#5-database-schema)
6. [Business Logic](#6-business-logic)
7. [Auth Flow](#7-auth-flow)
8. [Pages & Routes](#8-pages--routes)
9. [Components](#9-components)
10. [Environment Setup](#10-environment-setup)
11. [Deployment](#11-deployment)

---

## 1. Project Overview

**Wealthing Waves** là ứng dụng web theo dõi danh mục đầu tư cá nhân, hỗ trợ:

- Ghi nhận giao dịch mua/bán/chốt trên nhiều loại tài sản (cổ phiếu, chứng chỉ quỹ, vàng, tiết kiệm)
- Cập nhật giá thị trường định kỳ theo mã symbol
- Tính toán lợi nhuận/lỗ theo thời gian thực và theo kỳ (YTD, MTD, tùy chọn)
- Phân tích phân bổ danh mục theo hạng mục
- Responsive: desktop sidebar + mobile bottom nav

**Target user:** Nhà đầu tư cá nhân người Việt, quản lý danh mục vừa và nhỏ.

---

## 2. Architecture

```
Browser (Next.js App Router)
    │
    ├── app/          Pages & API routes (server + client components)
    ├── components/   Pure UI components (client-only, 'use client')
    └── lib/          Business logic & Supabase client
            ├── supabase.ts              Supabase singleton + type definitions
            └── api/
                ├── database.ts          CRUD operations (transactions, market prices)
                ├── portfolio.ts         Portfolio calculation engine
                └── calculate_period_performance.ts  Period-based P&L (YTD, MTD…)

Supabase (Backend-as-a-Service)
    ├── Auth          Email/Password + Google OAuth
    ├── transactions  Table — buy/sell records
    └── market_prices Table — price snapshots per symbol per date
```

**Data flow:** Pages fetch raw data via `lib/api/database.ts` → pass to pure calculation functions in `lib/api/portfolio.ts` → render results in components. No server-side data fetching (all `'use client'`).

---

## 3. File Structure

```
Wealthing Waves/
├── app/                          Next.js App Router
│   ├── layout.tsx                Root layout (AuthProvider + AppLayout wrapper)
│   ├── page.tsx                  Index — redirects to /dashboard or /login
│   ├── globals.css               Design tokens + shared component classes
│   ├── login/page.tsx            Login/signup page
│   ├── auth/callback/route.ts    OAuth callback handler
│   ├── dashboard/page.tsx        Portfolio overview
│   ├── assets/page.tsx           Assets list by symbol
│   ├── analysis/page.tsx         Period performance analysis
│   ├── transaction/page.tsx      Transaction + market price input forms
│   ├── profile/page.tsx          User profile & account settings
│   └── portfolio/[symbol]/       Dynamic symbol detail page
│       └── page.tsx
│
├── components/                   React UI components (all 'use client')
│   ├── providers/
│   │   └── AuthProvider.tsx      Auth context (signIn, signUp, signOut, Google OAuth)
│   ├── AppLayout.tsx             App shell: sidebar (desktop) + FloatingNav (mobile)
│   ├── AppSidebar.tsx            Desktop sidebar with nav links + user info
│   ├── FloatingNav.tsx           Mobile bottom navigation pill
│   ├── CategoryIcon.tsx          Asset category icon with color coding
│   ├── Sparkline.tsx             Mini price trend chart (Recharts)
│   ├── TransactionHistory.tsx    Transaction list with edit/delete
│   ├── MarketPriceHistory.tsx    Market price list with edit/delete
│   ├── EditTransactionModal.tsx  Edit transaction dialog
│   ├── EditMarketPriceModal.tsx  Edit market price dialog
│   └── DeleteConfirmDialog.tsx   Generic delete confirmation dialog
│
├── lib/                          Business logic (framework-agnostic)
│   ├── supabase.ts               Supabase client singleton + TypeScript types
│   ├── utils.ts                  cn() helper (clsx + tailwind-merge)
│   └── api/
│       ├── database.ts           All Supabase CRUD functions
│       ├── portfolio.ts          Portfolio aggregation + calculation engine
│       └── calculate_period_performance.ts  Snapshot-based period P&L
│
├── supabase/                     Database scripts
│   ├── setup.sql                 Full DB schema + RLS policies (run once)
│   ├── fix_total_money.sql       Migration: total_money sign fix
│   └── debug_data.sql            Debug queries
│
├── public/                       Static assets
│   ├── stock_icon.png
│   ├── fund_icon.png
│   ├── gold_icon.png
│   └── saving_icon.png
│
├── docs/                         Project documentation
│   ├── README.md                 This file
│   ├── google-auth-setup.md      Google OAuth configuration guide
│   ├── market-price-fix.md       market_prices upsert fix notes
│   └── prototype-ui.html         Original HTML prototype (design reference)
│
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
└── package.json
```

---

## 4. Design System

Defined entirely in `app/globals.css`. Single dark theme — no light mode.

### Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#0b0d12` | App background |
| `--surface-1` | `#13161f` | Cards |
| `--surface-2` | `#181c27` | Inputs, stat tiles |
| `--surface-3` | `#1f2433` | Hover states |
| `--accent` | `#00c896` | Primary CTA, profit indicator |
| `--neg` | `#ff5a6e` | Loss indicator |
| `--info` | `#6ea8ff` | Info, blue accent |
| `--warn` | `#ffb547` | Warning, gold |
| `--t-1` | `#f2f4f8` | Primary text |
| `--t-2` | `#a4abbd` | Secondary text |
| `--t-3` | `#6c7388` | Muted text |

### Typography

Font: **Be Vietnam Pro** (loaded via `next/font/google`) — weights 400–900, subsets: latin + vietnamese.

### Shared CSS Classes

| Class | Purpose |
|---|---|
| `.ww-card` / `.card` | Base card container |
| `.bento-card` | Alias for backward compat |
| `.hero-card` | Accent-tinted hero card |
| `.floating-pill` | Glassmorphism nav pill |
| `.btn-accent` | Primary CTA button (teal gradient) |
| `.btn-ghost` | Secondary ghost button |
| `.input-bento` | Dark form input |
| `.delta-pos` / `.delta-neg` | Profit/loss badge pill |
| `.delta.pos` / `.delta.neg` | Alternative delta pill |
| `.badge` | Status badge (.green, .red, .blue, .warn, .muted) |
| `.segmented` | Segmented control (radio group) |
| `.stat-tile` | Small metric tile |
| `.label-cap` | Uppercase label caption |
| `.value-xl` / `.value-lg` / `.value-md` | Big number display |
| `.skeleton` | Shimmer loading placeholder |
| `.cat-icon-*` | Category icon color variants |

### Asset Category Colors

| Category | CSS Class | Color |
|---|---|---|
| Cổ phiếu (Stock) | `.cat-icon-stock` | Blue (`--info`) |
| Chứng chỉ quỹ (Fund) | `.cat-icon-fund` | Teal (`--accent`) |
| Vàng (Gold) | `.cat-icon-gold` | Gold (`--warn`) |
| Tiết kiệm (Saving) | `.cat-icon-saving` | Violet |

---

## 5. Database Schema

### `transactions` table

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Auto-generated |
| `user_id` | UUID FK → auth.users | RLS enforced |
| `date` | DATE | Transaction date |
| `type` | VARCHAR(10) | `'Mua'` \| `'Chốt'` \| `'Bán'` |
| `category` | VARCHAR(50) | Asset category |
| `symbol` | VARCHAR(20) | Uppercase ticker |
| `quantity` | DECIMAL(18,4) | Number of units |
| `price` | DECIMAL(18,2) | Price per unit (derived) |
| `fee` | DECIMAL(18,2) | Transaction fee (default 0) |
| `total_money` | DECIMAL(18,2) | Gross cash flow (**always positive**) |
| `notes` | TEXT | Optional |
| `created_at` | TIMESTAMPTZ | Auto |
| `updated_at` | TIMESTAMPTZ | Auto-updated via trigger |

**Note on `total_money`:** Always stored as a positive number. Buy/sell direction is determined by `type` field, not sign.

### `market_prices` table

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Auto-generated |
| `user_id` | UUID FK → auth.users | RLS enforced |
| `date` | DATE | Price date |
| `category` | VARCHAR(50) | Asset category |
| `symbol` | VARCHAR(20) | Uppercase ticker |
| `price` | DECIMAL(18,2) | Price per unit |
| `created_at` | TIMESTAMPTZ | Auto |
| `updated_at` | TIMESTAMPTZ | Auto-updated via trigger |

**Unique constraint:** `(user_id, symbol, date)` — one price per symbol per day per user.

### Indexes

```sql
-- transactions
idx_transactions_user, idx_transactions_symbol, idx_transactions_date
idx_transactions_category, idx_transactions_user_date

-- market_prices
idx_market_prices_user, idx_market_prices_symbol, idx_market_prices_date
idx_market_prices_user_symbol
```

### RLS Policies

Full Row Level Security on both tables. All policies enforce `auth.uid() = user_id`. Users can only SELECT/INSERT/UPDATE/DELETE their own rows.

---

## 6. Business Logic

### Portfolio Calculation (`lib/api/portfolio.ts`)

**`calculatePortfolio(transactions, marketPrices, filterYear?)`**

Aggregates all transactions into a portfolio summary using weighted average cost basis:

- **Buy (`Mua`):** Add qty + cost to holding
- **Sell (`Chốt`/`Bán`):** Deduct qty proportionally, realize P&L via avg cost
- **Current Value:** `quantity × latest market price`
- **P&L:** `(currentValue − invested) + realized`
- **Sparkline data:** Last 7 price snapshots per symbol

Returns `PortfolioSummary` with: items, categories, totals.

**`calculateSymbolDetail(symbol, transactions, marketPrices, filterYear?)`**

Deep dive for a single symbol — holding duration, unrealized/realized P&L, price history for chart.

**`calculatePortfolioHistory(transactions, marketPrices, months?)`**

Generates month-by-month portfolio value for the TotalBalance chart. For each month-end: filter transactions up to that date → compute holdings → multiply by closest available price.

### Period Performance (`lib/api/calculate_period_performance.ts`)

**`calculatePeriodPerformance(transactions, marketPrices, startDate)`**

Snapshot-based P&L for a time window (YTD, MTD, custom):

```
Period Profit = EndValue − StartValue + PeriodSelling − PeriodBuying
```

- StartValue: portfolio value at `startDate` using prices closest to (but ≤) that date
- Fallback for assets without market price: use average cost basis as proxy
- ROI denominator: `StartValue + PeriodBuying` (capital deployed in period)

### Database API (`lib/api/database.ts`)

| Function | Description |
|---|---|
| `getAllTransactions()` | Fetch all user transactions, ordered by date desc |
| `getTransactionsBySymbol(symbol)` | Filter by symbol |
| `getTransactionsByYear(year)` | Filter by year |
| `addTransaction(data)` | Insert new transaction |
| `updateTransaction(id, updates)` | Partial update |
| `deleteTransaction(id)` | Delete by id |
| `getAllMarketPrices()` | Fetch all user prices |
| `getMarketPricesBySymbol(symbol)` | Filter by symbol |
| `getLatestPrice(symbol)` | Most recent price for symbol |
| `addMarketPrice(data)` | Check-then-update-or-insert (avoids upsert constraint issues) |
| `deleteMarketPrice(id)` | Delete by id |
| `deleteAllMyTransactions()` | Bulk delete ALL transactions for current user — always scoped to `user_id` |

---

## 7. Auth Flow

```
User visits /
    │
    ├── Authenticated → redirect /dashboard
    └── Not authenticated → redirect /login

/login
    ├── Email/Password → supabase.auth.signInWithPassword()
    │       └── Success → router.push('/dashboard')
    ├── Sign Up → supabase.auth.signUp()
    │       └── Success → email confirmation sent
    └── Google OAuth → supabase.auth.signInWithOAuth({ provider: 'google' })
            └── Redirects to /auth/callback
                    └── exchangeCodeForSession() → redirect /dashboard

Protected pages: AppLayout reads AuthProvider context.
Unauthenticated → redirect to /login (handled per-page via useAuth hook).
```

`AuthProvider` exposes: `user`, `loading`, `signIn`, `signUp`, `signOut`, `signInWithGoogle`.

Supabase client is a **singleton** (module-level cache) — safe for concurrent renders.

---

## 8. Pages & Routes

| Route | File | Description |
|---|---|---|
| `/` | `app/page.tsx` | Index redirect |
| `/login` | `app/login/page.tsx` | Auth page (login + signup) |
| `/auth/callback` | `app/auth/callback/route.ts` | OAuth callback (API route) |
| `/dashboard` | `app/dashboard/page.tsx` | Portfolio overview, balance chart, category breakdown, year filter dropdown |
| `/assets` | `app/assets/page.tsx` | Asset list by symbol with current values |
| `/analysis` | `app/analysis/page.tsx` | Period performance + BCG Matrix (4-quadrant portfolio classification) |
| `/transaction` | `app/transaction/page.tsx` | Add transaction + update market price forms |
| `/profile` | `app/profile/page.tsx` | User profile, account stats, sign out, "Vùng nguy hiểm" (delete all transactions) |
| `/portfolio/[symbol]` | `app/portfolio/[symbol]/page.tsx` | Symbol detail: P&L, price history, transaction list |

---

## 9. Components

### Layout

| Component | Role |
|---|---|
| `AppLayout.tsx` | Shell: 240px sidebar grid (desktop) + FloatingNav (mobile). Hides sidebar on `/login`. |
| `AppSidebar.tsx` | Desktop sidebar — nav links with active states, user avatar, portfolio summary stats, sign out. |
| `FloatingNav.tsx` | Mobile bottom navigation pill — 5 nav items with active indicator. |

### Data Display

| Component | Props | Role |
|---|---|---|
| `CategoryIcon.tsx` | `category: string` | Colored icon for each asset category |
| `Sparkline.tsx` | `data: number[]`, `positive: boolean` | 7-point mini line chart (Recharts) |
| `TransactionHistory.tsx` | `transactions`, callbacks | Sortable transaction list with edit/delete |
| `MarketPriceHistory.tsx` | `prices`, callbacks | Market price list with edit/delete |

### Modals & Dialogs

| Component | Role |
|---|---|
| `EditTransactionModal.tsx` | Full-form edit dialog for a transaction |
| `EditMarketPriceModal.tsx` | Edit dialog for a market price entry |
| `DeleteConfirmDialog.tsx` | Generic confirm dialog (used for both transactions and prices) |

### Providers

| Component | Role |
|---|---|
| `providers/AuthProvider.tsx` | Auth context — wraps entire app, manages Supabase auth state |

---

## 10. Environment Setup

Create `.env.local` in project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Optional** (for production only, set in Vercel — not in `.env.local`):
```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### Local Development

```bash
npm install
npm run dev
# → http://localhost:3000
```

### Database Setup

Run `supabase/setup.sql` in the Supabase SQL Editor once to create tables, indexes, triggers, and RLS policies.

---

## 11. Deployment

Deployed on **Vercel** (recommended — native Next.js support).

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Deploy

For Google OAuth redirect configuration, see [`google-auth-setup.md`](./google-auth-setup.md).

---

*Last updated: 2026-05-23*
