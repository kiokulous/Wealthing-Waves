# Hướng dẫn tối ưu Market Prices Table (Tùy chọn)

## Vấn đề đã được sửa

Lỗi **"there is no unique or exclusion constraint matching the ON CONFLICT specification"** đã được sửa bằng cách thay đổi logic từ `upsert` sang **check-then-update-or-insert**.

### Logic mới:
1. Kiểm tra xem đã có giá cho `(user_id, symbol, date)` chưa
2. Nếu có → **Update** record cũ
3. Nếu chưa có → **Insert** record mới

✅ **Không cần phải tạo unique constraint** - app đã hoạt động bình thường!

---

## Tối ưu hóa (Khuyên dùng cho production)

Nếu bạn muốn cải thiện performance và đảm bảo data integrity tốt hơn, có thể tạo **unique constraint** trên Supabase:

### Bước 1: Mở Supabase SQL Editor

1. Truy cập [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **SQL Editor** (icon database ở menu bên trái)

### Bước 2: Chạy SQL để tạo Unique Constraint

```sql
-- Tạo unique constraint để đảm bảo mỗi user chỉ có 1 giá cho 1 symbol tại 1 ngày cụ thể
ALTER TABLE market_prices 
ADD CONSTRAINT unique_user_symbol_date 
UNIQUE (user_id, symbol, date);
```

### Bước 3: Verify Constraint

Kiểm tra constraint đã được tạo:

```sql
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'market_prices';
```

Bạn sẽ thấy:
```
constraint_name           | constraint_type
-------------------------+----------------
unique_user_symbol_date  | UNIQUE
```

---

## Lợi ích của Unique Constraint

### ✅ **Với constraint:**
- Database tự động ngăn duplicate data
- Performance tốt hơn (dùng được `upsert`)
- Đơn giản hóa code (1 query thay vì 2)
- Data integrity cao hơn

### ✅ **Không có constraint (hiện tại):**
- Vẫn hoạt động bình thường
- Không cần thay đổi database
- An toàn cho data hiện có

---

## Nếu muốn dùng lại UPSERT với constraint

Sau khi tạo unique constraint, bạn có thể đổi lại code thành:

```typescript
// lib/api/database.ts - addMarketPrice function

export async function addMarketPrice(marketPrice: {
    date: string
    category: string
    symbol: string
    price: number
}): Promise<MarketPrice> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('User not authenticated')
    }

    // Bây giờ có thể dùng upsert an toàn
    const { data, error } = await supabase
        .from('market_prices')
        .upsert({
            user_id: user.id,
            date: marketPrice.date,
            category: marketPrice.category,
            symbol: marketPrice.symbol.toUpperCase(),
            price: marketPrice.price,
        }, {
            onConflict: 'user_id,symbol,date'
        })
        .select()
        .single()

    if (error) {
        console.error('Error adding market price:', error)
        throw new Error(error.message)
    }

    return data
}
```

---

## Kết luận

- ✅ **Hiện tại**: App đã hoạt động tốt với logic mới
- 🎯 **Khuyến nghị**: Tạo unique constraint khi có thời gian để tối ưu performance
- 📝 **Lưu ý**: Nếu tạo constraint, nhớ test kỹ với data hiện có

**Không cần phải làm gì thêm** - bug đã được sửa! 🎉
