# Hướng dẫn cấu hình Google OAuth cho Local và Production

## Vấn đề
Khi đăng nhập bằng Google từ localhost, ứng dụng redirect về production URL thay vì localhost.

## Nguyên nhân
Supabase cần được cấu hình để chấp nhận nhiều redirect URLs cho các môi trường khác nhau.

## Giải pháp

### 1. Cấu hình Supabase Dashboard

Truy cập [Supabase Dashboard](https://supabase.com/dashboard) → Chọn project của bạn → **Authentication** → **URL Configuration**

#### Thêm các Redirect URLs sau:

```
http://localhost:3000/auth/callback
http://localhost:3000/**
https://your-production-domain.vercel.app/auth/callback
https://your-production-domain.vercel.app/**
```

**Lưu ý:** Thay thế `your-production-domain.vercel.app` bằng domain thực tế của bạn trên Vercel.

#### Site URL
Để trống hoặc sử dụng production URL. Code của chúng ta đã tự động xử lý bằng `window.location.origin`.

### 2. Cấu hình Vercel Environment Variables (Tùy chọn)

Nếu bạn muốn set một URL cụ thể cho production:

1. Vào Vercel Dashboard → Project Settings → Environment Variables
2. Thêm biến sau cho **Production**:
   ```
   NEXT_PUBLIC_SITE_URL=https://your-production-domain.vercel.app
   ```

**Quan trọng:** 
- **KHÔNG** set `NEXT_PUBLIC_SITE_URL` trong file `.env.local` của bạn
- Chỉ set trong Vercel cho môi trường production
- Với cấu hình hiện tại, code sẽ tự động sử dụng `window.location.origin` nên bạn có thể bỏ qua biến này hoàn toàn

### 3. Kiểm tra cấu hình

#### Local Development:
```bash
npm run dev
```
- Mở http://localhost:3000/login
- Click "Tiếp tục với Google"
- Sau khi đăng nhập, bạn sẽ được redirect về `http://localhost:3000/dashboard`

#### Production:
- Deploy lên Vercel
- Truy cập https://your-domain.vercel.app/login
- Click "Tiếp tục với Google"
- Sau khi đăng nhập, bạn sẽ được redirect về `https://your-domain.vercel.app/dashboard`

## Cách hoạt động

### AuthProvider.tsx
```typescript
const signInWithGoogle = async () => {
    // Ưu tiên window.location.origin để redirect động
    // Đảm bảo local dev dùng localhost, production dùng production URL
    const siteUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : (process.env.NEXT_PUBLIC_SITE_URL || '');

    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${siteUrl}/auth/callback`,
        },
    })
    if (error) throw error
}
```

### Auth Callback Route
```typescript
// app/auth/callback/route.ts
export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
        const supabase = createClient()
        await supabase.auth.exchangeCodeForSession(code)
    }

    // Tự động redirect về origin hiện tại
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}
```

## Troubleshooting

### Vẫn redirect về production từ localhost?

1. **Kiểm tra Supabase Dashboard:**
   - Đảm bảo `http://localhost:3000/auth/callback` đã được thêm vào Redirect URLs
   - Đảm bảo `http://localhost:3000/**` đã được thêm

2. **Xóa cache browser:**
   - Mở DevTools (F12)
   - Right-click nút Refresh → "Empty Cache and Hard Reload"

3. **Kiểm tra console:**
   - Mở browser console (F12)
   - Xem có error nào từ Supabase không
   - Kiểm tra redirect URL được gửi đến Google

4. **Test thủ công:**
   ```javascript
   // Trong browser console
   console.log(window.location.origin)
   // Phải trả về: http://localhost:3000
   ```

### Lỗi "Invalid redirect URL"

Điều này có nghĩa là URL không được cấu hình trong Supabase. Hãy đảm bảo bạn đã thêm đầy đủ các URLs ở bước 1.

## Kết luận

Với cấu hình này:
- ✅ Local development → redirect về localhost
- ✅ Production → redirect về production URL
- ✅ Không cần config riêng cho từng môi trường
- ✅ Tự động hoạt động khi deploy preview trên Vercel
