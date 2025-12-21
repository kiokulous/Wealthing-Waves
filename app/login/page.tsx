'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { LogIn, UserPlus, ArrowRight } from 'lucide-react'

export default function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const { signIn, signUp, signInWithGoogle } = useAuth()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            if (isSignUp) {
                await signUp(email, password)
                setError('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.')
            } else {
                await signIn(email, password)
                router.push('/dashboard')
            }
        } catch (err: any) {
            setError(err.message || 'Đã xảy ra lỗi')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setError('')
        setLoading(true)

        try {
            await signInWithGoogle()
        } catch (err: any) {
            setError(err.message || 'Không thể đăng nhập bằng Google')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--background)] transition-colors duration-300">
            <div className="w-full max-w-md">
                {/* Branding Block */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2.5rem] bg-[var(--primary)] text-black shadow-2xl shadow-black/10 dark:shadow-none mb-6 animate-in zoom-in duration-500">
                        <span className="text-3xl font-bold tracking-tighter">W</span>
                    </div>
                    <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight mb-2">
                        Wealthing <span className="text-[var(--primary)]">Waves</span>
                    </h1>
                    <p className="text-[var(--text-muted)] font-medium tracking-tight">Cộng hưởng Tài chính & Minh bạch Danh mục</p>
                </div>

                {/* Main Bento Auth Card */}
                <div className="bento-card p-10 bg-[var(--card-bg)] shadow-2xl shadow-black/5 dark:shadow-none border border-[var(--card-border)]">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-[var(--foreground)]">
                            {isSignUp ? 'Gia nhập Waves' : 'Chào mừng trở lại'}
                        </h2>
                        <p className="text-[var(--text-muted)] font-medium text-sm mt-1">
                            {isSignUp ? 'Tạo tài khoản cấp độ chuyên gia của bạn' : 'Đăng nhập để truy cập bảng điều khiển'}
                        </p>
                    </div>

                    {error && (
                        <div className={`mb-6 p-4 rounded-2xl text-xs font-bold uppercase tracking-widest ${error.includes('thành công')
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                Địa chỉ Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-bento w-full bg-[var(--background)] text-[var(--foreground)] border-[var(--card-border)]"
                                placeholder="ten@congty.com"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                Mật khẩu
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-bento w-full bg-[var(--background)] text-[var(--foreground)] border-[var(--card-border)]"
                                placeholder="••••••••"
                                required
                                disabled={loading}
                                minLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-[var(--primary)] text-black font-bold py-4 rounded-2xl shadow-lg shadow-black/10 dark:shadow-none hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/50 dark:border-black/50 border-t-white dark:border-t-black rounded-full animate-spin" />
                            ) : (
                                <>
                                    {isSignUp ? 'Khởi tạo Tài khoản' : 'Xác thực'}
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[var(--card-border)]"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                                <span className="bg-[var(--card-bg)] px-4 text-[var(--text-muted)]">Bên thứ ba</span>
                            </div>
                        </div>

                        <button
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="mt-6 w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--foreground)] font-bold hover:opacity-80 transition-all active:scale-[0.98] shadow-sm"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Tiếp tục với Google
                        </button>
                    </div>

                    <div className="mt-10 text-center">
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors uppercase tracking-widest"
                            disabled={loading}
                        >
                            {isSignUp ? 'Đã có tài khoản? ' : 'Mới dùng Waves? '}
                            <span className="text-[var(--primary)] underline underline-offset-4 decoration-2">
                                {isSignUp ? 'Đăng nhập' : 'Tham gia ngay'}
                            </span>
                        </button>
                    </div>
                </div>

                <p className="mt-8 text-center text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-[0.2em]">
                    Hệ thống Phân tích Danh mục Chuyên nghiệp 📈
                </p>
            </div>
        </div>
    )
}
