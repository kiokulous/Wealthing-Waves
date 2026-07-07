import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    // Set cookies on both request and response
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refresh session — bắt buộc để server client hoạt động đúng
    // KHÔNG dùng getSession() ở đây vì nó không verify token với server
    const { data: { user } } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname
    const isPublicPath =
        path === '/login' ||
        path.startsWith('/auth') ||   // OAuth callback
        path.startsWith('/api')       // API routes tự xử lý auth (Bearer token)

    // Helper: redirect nhưng giữ lại cookies auth vừa được refresh
    const redirectTo = (pathname: string) => {
        const url = request.nextUrl.clone()
        url.pathname = pathname
        url.search = ''
        const res = NextResponse.redirect(url)
        supabaseResponse.cookies.getAll().forEach(cookie => res.cookies.set(cookie))
        return res
    }

    // Chưa đăng nhập + vào trang cần bảo vệ → /login
    if (!user && !isPublicPath) {
        return redirectTo('/login')
    }

    // Đã đăng nhập mà vào /login hoặc / → /dashboard
    if (user && (path === '/login' || path === '/')) {
        return redirectTo('/dashboard')
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        // Chạy trên tất cả routes trừ static files và _next
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
