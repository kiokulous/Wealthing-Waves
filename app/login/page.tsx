'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'

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
                setError('Check your email for confirmation link!')
            } else {
                await signIn(email, password)
                router.push('/dashboard')
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred')
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
            setError(err.message || 'Failed to sign in with Google')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-wave-primary flex items-center justify-center px-4 relative overflow-hidden">
            {/* Animated Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-64 h-64 bg-[rgb(var(--accent-primary))] opacity-10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-[rgb(var(--purple-medium))] opacity-10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[rgb(var(--accent-secondary))] opacity-5 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Header */}
                <div className="text-center mb-8 animate-fade-in-up">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[rgb(var(--purple-medium))] to-[rgb(var(--accent-primary))] mb-4 shadow-lg">
                        <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="m6 16.5l-3 2.94V11h3m5 3.66l-1.57-1.34L8 14.64V7h3m5 6l-3 3V3h3m2.81 9.81L17 11h5v5l-1.79-1.79L13 21.36l-3.47-3.02L5.75 22H3l6.47-6.34L13 18.64" />
                        </svg>
                    </div>
                    <h1 className="energy-level text-4xl mb-2">Wealthing Waves</h1>
                    <p className="text-wave-secondary text-sm">Ride the market waves like a Rover</p>
                </div>

                {/* Login Card */}
                <div className="wave-card p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <div className="mb-6 text-center">
                        <h2 className="text-2xl font-bold text-wave-primary mb-1">
                            {isSignUp ? 'Start Your Journey' : 'Welcome Back, Rover'}
                        </h2>
                        <p className="text-wave-secondary text-sm">
                            {isSignUp ? 'Create your account to track the waves' : 'Resume your resonance tracking'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-[rgb(var(--loss-red))]/10 border border-[rgb(var(--loss-red))]/20 text-[rgb(var(--loss-red))] text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-wave-secondary uppercase mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-wave w-full"
                                placeholder="rover@wuthering.waves"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-wave-secondary uppercase mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-wave w-full"
                                placeholder="••••••••"
                                required
                                disabled={loading}
                                minLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-wave w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                isSignUp ? 'Begin Resonance' : 'Enter the Waves'
                            )}
                        </button>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-wave"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-wave-tertiary px-2 text-wave-tertiary">Or continue with</span>
                            </div>
                        </div>

                        <button
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="mt-4 w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl border border-wave bg-wave-tertiary/50 text-wave-primary font-semibold hover:bg-wave-tertiary hover:border-[rgb(var(--accent-primary))] transition-all duration-300 disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Sign in with Google
                        </button>
                    </div>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-sm text-wave-secondary hover:text-[rgb(var(--accent-primary))] transition-colors"
                            disabled={loading}
                        >
                            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                            <span className="font-bold text-[rgb(var(--accent-primary))]">
                                {isSignUp ? 'Sign In' : 'Sign Up'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <p className="mt-6 text-center text-xs text-wave-tertiary animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    Track your portfolio with the power of resonance ⚡
                </p>
            </div>
        </div>
    )
}
