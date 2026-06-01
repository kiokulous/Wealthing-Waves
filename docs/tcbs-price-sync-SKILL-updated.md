---
name: tcbs-price-sync
description: Tự động đồng bộ giá thị trường từ TCInvest (tcinvest.tcbs.com.vn/my-asset) sang Wealthing Waves (wealthing-waves.vercel.app/transaction). Dùng skill này khi user muốn "cập nhật giá", "đồng bộ giá thị trường", "sync giá từ TCBS", "cập nhật thị giá cổ phiếu/quỹ", hoặc bất kỳ yêu cầu nào liên quan đến việc lấy giá từ TCBS và nhập vào Wealthing Waves.
compatibility: "Yêu cầu Claude in Chrome extension đang kết nối"
---

# TCBS Price Sync

Tự động lấy thị giá cổ phiếu và chứng chỉ quỹ từ TCInvest rồi cập nhật vào Wealthing Waves.

## Chuẩn bị

1. Gọi `tool_search("browser navigate")` để load Chrome tools
2. Gọi `list_connected_browsers` → `select_browser` để kết nối browser
3. Gọi `tabs_context_mcp(createIfEmpty=true)` để lấy tabId

## Bước 1 — Lấy dữ liệu từ TCInvest

### 1a. Mở trang & kiểm tra login

```
navigate(tabId, "https://tcinvest.tcbs.com.vn/home")
screenshot()
```

Nếu thấy màn hình login → thông báo user đăng nhập, đợi xác nhận rồi tiếp tục.

### 1b. Lấy giá Cổ phiếu — widget "Danh mục" trên trang Home

Trên trang `https://tcinvest.tcbs.com.vn/home`, tìm widget **"Danh mục"** (danh sách 10 cổ phiếu đang theo dõi).

Dùng `zoom` hoặc `get_page_text` vùng widget đó để đọc 3 cột: **Mã**, **Thị giá**, **T.KL**.

> ⚠️ Đơn vị thị giá cổ phiếu là **nghìn đồng** → nhân ×1000 khi nhập.
> Ví dụ: 72.90 → nhập 72900

> 📊 Cột **T.KL** (tổng khối lượng) có đơn vị khác nhau tùy mã — đọc kỹ suffix:
> - Số + "M" → nhân × 1,000,000 &nbsp;&nbsp; Ví dụ: "6 M" → 6000000 | "2.9 M" → 2900000
> - Số + "K" → nhân × 1,000 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Ví dụ: "414.9 K" → 414900 | "798.2 K" → 798200
> - Số thuần → giữ nguyên

Lấy toàn bộ 10 mã. Lưu danh sách: `[{ma, thi_gia_don, tkl}, ...]`

### 1c. Lấy giá Quỹ

```
navigate(tabId, "https://tcinvest.tcbs.com.vn/my-asset")
screenshot()
```

Click tab **"Quỹ"**.

Đọc cột **Quỹ** (tên mã) và **Thị giá**. **Không cần đọc KL** cho quỹ.

> ⚠️ Đơn vị thị giá quỹ là **đồng** → giữ nguyên khi nhập.
> Ví dụ: 14,245 → nhập 14245

Lưu danh sách: `[{ma, thi_gia_don}, ...]`

## Bước 2 — Nhập vào Wealthing Waves

### 2a. Mở trang & chọn tab Thị trường

```
navigate(tabId, "https://wealthing-waves.vercel.app/transaction")
screenshot()
```

Nếu thấy màn hình login → thông báo user đăng nhập, đợi xác nhận rồi tiếp tục.

Click button **"Thị trường" / PRICE UPDATE**.

### 2b. Đọc refs của form

```
read_page(filter="interactive")
```

Mapping refs cần dùng (có thể thay đổi theo session):
- `ref_N` = Ngày giao dịch (date input) — thường đã điền ngày hôm nay ✅
- `ref_N` = Mã tài sản (text input)
- `ref_N` = Phân loại tài sản (combobox: "Cổ phiếu" | "Chứng chỉ quỹ")
- `ref_N` = Giá khớp (number input)
- `ref_N` = Khối lượng (number input) — **chỉ hiện khi chọn "Cổ phiếu"**
- `ref_N` = button "Lưu giá thị trường"

### 2c. Vòng lặp nhập từng mã

Với **mỗi mã cổ phiếu**:
```
form_input(ref_ma, value="{MA}")
form_input(ref_phanloai, value="Cổ phiếu")
form_input(ref_gia, value={thi_gia × 1000})
form_input(ref_volume, value={kl})   ← field KL, chỉ hiện khi category = Cổ phiếu
click(ref_submit)  ← button "Lưu giá thị trường"
wait(1s)
```

Với **mỗi mã quỹ** (và Vàng, Tiết kiệm nếu có):
```
form_input(ref_ma, value="{MA}")
form_input(ref_phanloai, value="Chứng chỉ quỹ")
form_input(ref_gia, value={thi_gia_nguyen})
← KHÔNG nhập KL, field này không hiện với loại tài sản này
click(ref_submit)  ← button "Lưu giá thị trường"
wait(1s)
```

> ✅ **Không cần xác nhận** trước mỗi lần submit — user đã đồng ý tự động hóa toàn bộ flow.

### 2d. Xác nhận kết quả

Sau khi nhập xong tất cả, chụp screenshot và tóm tắt bảng kết quả cho user:

```
| Loại           | Mã       | Giá nhập  | KL          | Trạng thái |
|----------------|----------|-----------|-------------|------------|
| Cổ phiếu       | FPT      | 72,200    | 6,000,000   | ✅         |
| ...            | ...      | ...       | ...         | ...        |
| Chứng chỉ quỹ  | TCFIN    | 14,245    | —           | ✅         |
```

> ℹ️ Cột KL chỉ nhập với Cổ phiếu. Quỹ/Vàng/Tiết kiệm không có KL — bỏ qua field này.

## Xử lý lỗi thường gặp

| Tình huống | Xử lý |
|-----------|-------|
| Login wall ở bất kỳ trang nào | Thông báo user, đợi xác nhận đã login |
| Bảng cổ phiếu/quỹ trống | Thông báo "không tìm thấy dữ liệu" ở tab đó |
| Submit không có phản hồi "đã cập nhật" | Screenshot và báo user kiểm tra thủ công |
| Mã không nhận diện được (giá = 0 hoặc lỗi) | Bỏ qua, liệt kê vào danh sách lỗi cuối cùng |
| Field KL không hiện dù đã chọn Cổ phiếu | Reload page và thử lại |

## Lưu ý ngày giao dịch

Mặc định dùng **ngày hiện tại** (form tự điền). Nếu user chỉ định ngày khác, set trước khi nhập từng mã:
```
form_input(ref_ngay, value="YYYY-MM-DD")
```
