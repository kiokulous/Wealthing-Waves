# Data Model & Calculation Logic

> Chi tiết kỹ thuật về cách dữ liệu được lưu trữ, truy vấn và tính toán.

---

## TypeScript Types

Defined in `lib/supabase.ts`:

```typescript
type Transaction = {
    id: string
    user_id: string
    date: string               // ISO date string "YYYY-MM-DD"
    type: 'Mua' | 'Chốt' | 'Bán'
    category: string
    symbol: string             // Always uppercase
    quantity: number
    price: number              // Derived: (total_money ± fee) / quantity
    fee: number                // Transaction fee (default 0)
    total_money: number        // Always positive — gross cash amount
    created_at: string
    updated_at: string
}

type MarketPrice = {
    id: string
    user_id: string
    date: string
    category: string
    symbol: string
    price: number
    volume: number | null   // Khối lượng khớp lệnh — chỉ dùng cho Cổ phiếu, null với các loại khác
    created_at: string
    updated_at: string
}

type Watchlist = {
    id: string
    user_id: string
    symbol: string
    category: string
    created_at: string
}
```

Defined in `lib/api/portfolio.ts`:

```typescript
type PortfolioItem = {
    symbol: string
    category: string
    quantity: number
    invested: number           // Current cost basis (remaining)
    currentValue: number       // quantity × latestPrice
    currentPrice: number
    realized: number           // Realized P&L from closed positions
    profitLoss: number         // (currentValue - invested) + realized
    profitLossPercent: number
    lastPrices: number[]       // Last 7 price points for sparkline
}

type CategoryStats = {
    category: string
    invested: number
    sold: number
    currentValue: number
    profitLoss: number
    profitLossPercent: number
    weight: number             // % of total portfolio current value
}

type PortfolioSummary = {
    totalInvested: number
    totalSold: number
    totalCurrentValue: number
    totalProfitLoss: number
    totalProfitLossPercent: number
    items: PortfolioItem[]
    categories: CategoryStats[]
}
```

---

## Transaction Types

| Type | Vietnamese | Direction | Cash Impact | Cost Basis |
|---|---|---|---|---|
| `Mua` | Mua vào (Buy) | +qty, +cost | Cash outflow | Tăng |
| `Bán` | Bán ra (Sell) | −qty, realize P&L | Cash inflow | Giảm proportional |
| `Chốt` | Chốt lời/lỗ (Close) | −qty, realize P&L | Cash inflow | Giảm proportional |
| `Cổ tức CP` | Stock dividend | +qty | **Không tốn tiền** | **Không đổi** → avgCost giảm |

`Chốt` và `Bán` được xử lý giống nhau trong engine tính toán. Tên `Chốt` mang ý nghĩa ngữ nghĩa (đóng vị thế) còn `Bán` là bán một phần.

**Cổ tức CP** là trường hợp đặc biệt: nhận thêm cổ phiếu mà không bỏ tiền ra (chia thưởng cổ phiếu). `total_money = 0`, `price = 0`, `fee = 0`. Chỉ `quantity` có giá trị.

```
Ví dụ: VIC
Trước cổ tức: 100cp, invested = 20,000,000 → avgCost = 200,000đ/cp
Nhận cổ tức:  40cp (Cổ tức CP, total_money = 0)
Sau cổ tức:   140cp, invested = 20,000,000 → avgCost = 142,857đ/cp  ✅
```

Lưu ý: cổ tức **tiền mặt** được tự động tái đầu tư thành CP vẫn dùng type `Mua` (vì có dùng tiền mặt).


---

## Cost Basis Calculation (Weighted Average)

Engine dùng phương pháp **weighted average cost basis**:

```
avgCost = invested / quantity

On Sell:
  costBasis = sellQty × avgCost
  realized  += sellProceeds − costBasis
  invested  -= costBasis
  quantity  -= sellQty
```

Ví dụ:
```
Buy  100 @ 75,000 → invested=7,500,000  qty=100  avgCost=75,000
Buy   50 @ 80,000 → invested=11,500,000 qty=150  avgCost=76,667
Sell  60 @ 90,000 → costBasis=4,600,020
                    realized = 5,400,000 − 4,600,020 = +799,980
                    invested = 11,500,000 − 4,600,020 = 6,899,980
                    qty = 90
```

---

## P&L Formulas

### Unrealized P&L
```
unrealized = currentValue − invested
           = (quantity × latestPrice) − remainingCostBasis
```

### Total P&L
```
totalPL = unrealized + realized
        = (currentValue − invested) + realized
```

Equivalent: `totalPL = currentValue + totalSoldProceeds − totalBuyCost`

### P&L % (ROI)
```
If invested > 1,000:
    plPct = (totalPL / invested) × 100

Else (fully closed position):
    plPct = (totalPL / totalAccumulatedInvested) × 100
```

### Category P&L (Cash Flow method)
```
catPL = catCurrentValue + catSold − catInvested
catWeight = catCurrentValue / totalCurrentValue × 100
```

---

## Period Performance (Snapshot Method)

`calculatePeriodPerformance()` dùng công thức:

```
periodProfit = endValue − startValue + periodSelling − periodBuying
ROI = periodProfit / (startValue + periodBuying)
```

**Start Snapshot:** Reconstruct portfolio state at `startDate`:
1. Filter transactions before `startDate`
2. Compute holding qty per symbol
3. Find latest price ≤ `startDate` for each symbol
4. Fallback (no price available): use average cost basis at that date

**Period Flows:** Sum all `total_money` for buy/sell transactions in `[startDate, now]`.

**End Snapshot:** Current portfolio from `calculatePortfolio()`.

---

## Market Price Upsert Logic

`addMarketPrice()` uses check-then-update pattern (not upsert) to avoid constraint conflicts:

```
1. SELECT id WHERE user_id=? AND symbol=? AND date=?
2. If exists → UPDATE price, category, volume (nếu được truyền vào)
3. If not    → INSERT new row (volume = null nếu không có)
```

Với unique constraint `(user_id, symbol, date)` đã có trên production, có thể dùng upsert. Xem `docs/market-price-fix.md`.

`volume` chỉ được lưu với category `Cổ phiếu`. Các loại khác (Chứng chỉ quỹ, Vàng, Tiết kiệm) luôn để `null`.

---

## Watchlist

Bảng `watchlist` lưu danh sách mã chứng khoán user muốn theo dõi tín hiệu, độc lập với holdings.

- RLS: mỗi user chỉ thấy và sửa watchlist của mình (`auth.uid() = user_id`)
- Unique constraint: `(user_id, symbol)` — không trùng mã trong cùng 1 user
- CRUD: `getWatchlist()`, `addToWatchlist(symbol, category)`, `removeFromWatchlist(symbol)` trong `lib/api/database.ts`

SQL tạo bảng:
```sql
create table watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  symbol text not null,
  category text not null default 'Cổ phiếu',
  created_at timestamptz default now(),
  unique(user_id, symbol)
);
alter table watchlist enable row level security;
create policy "Users manage own watchlist"
  on watchlist for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

---

## Portfolio History Chart Data

`calculatePortfolioHistory(transactions, marketPrices, months=12)`:

Tạo mảng `{ date, value }` cho 12 tháng gần nhất:

```
For each month-end date (oldest → newest):
    1. Filter transactions WHERE date <= monthEnd
    2. Compute holdings map (symbol → qty)
    3. For each symbol with qty > 0:
           find latest marketPrice WHERE date <= monthEnd
           value += qty × price
    4. Push { date: "MM/YYYY", value }
```

---

*Last updated: 2026-06-01 (thêm Cổ tức CP)*
