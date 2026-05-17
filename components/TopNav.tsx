'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'

const navLinks = [
    { label: 'Tổng quan', path: '/dashboard' },
    { label: 'Nhập liệu', path: '/transaction' },
    { label: 'Phân tích', path: '/analysis' },
    { label: 'Cá nhân',   path: '/profile' },
]

export default function TopNav() {
    const router   = useRouter()
    const pathname = usePathname()
    const { user } = useAuth()

    const isActive = (path: string) =>
        pathname === path || pathname.startsWith(path + '/')

    const displayName =
        user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Wave Rider'
    const initial = displayName.charAt(0).toUpperCase()

    return (
        <header
            className="sticky top-0 z-40 flex items-center gap-4 px-6 h-[56px]"
            style={{
                background: 'rgba(11,13,18,0.82)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                borderBottom: '1px solid var(--line)',
            }}
        >
            {/* Brand */}
            <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2.5 flex-shrink-0 mr-4"
            >
                <div
                    className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0"
                    style={{
                        background: 'radial-gradient(120% 80% at 30% 20%, rgba(255,255,255,0.18), transparent 60%), linear-gradient(140deg, #14e0a8 0%, #00c896 45%, #0a7d5e 100%)',
                        boxShadow: '0 6px 18px -6px rgba(0,200,150,0.7), 0 0 0 1px rgba(0,200,150,0.4) inset',
                        color: '#03110d',
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
                        <path d="M3.5 10 L 8 19.5 L 13 12.5 L 18 19.5 L 24.5 7" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="24.5" cy="7" r="2.2" fill="currentColor"/>
                    </svg>
                </div>
                <span className="font-bold text-[14px] hidden lg:block" style={{ color: 'var(--t-1)', letterSpacing: '-0.01em' }}>
                    Wealthing <span style={{ color: 'var(--accent)' }}>Waves</span>
                </span>
            </button>

            {/* Main nav links */}
            <nav className="flex items-center gap-1">
                {navLinks.map((link) => (
                    <button
                        key={link.path}
                        onClick={() => router.push(link.path)}
                        className="px-4 py-[6px] rounded-full text-[13px] font-semibold transition-all duration-150"
                        style={
                            isActive(link.path)
                                ? {
                                    background: 'linear-gradient(180deg, var(--accent-2), var(--accent))',
                                    color: '#062018',
                                    boxShadow: '0 4px 16px -6px var(--accent-30)',
                                }
                                : { color: 'var(--t-2)' }
                        }
                        onMouseEnter={(e) => {
                            if (!isActive(link.path)) {
                                (e.currentTarget as HTMLElement).style.color = 'var(--t-1)'
                                ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive(link.path)) {
                                (e.currentTarget as HTMLElement).style.color = 'var(--t-2)'
                                ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                            }
                        }}
                    >
                        {link.label}
                    </button>
                ))}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Search bar */}
            <div
                className="hidden lg:flex items-center gap-2 px-3 py-[7px] rounded-[10px] flex-1 max-w-[340px]"
                style={{
                    background: 'var(--surface-1)',
                    border: '1px solid var(--line)',
                    color: 'var(--t-3)',
                    fontSize: 13,
                }}
            >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>
                </svg>
                <input
                    placeholder="Tìm kiếm... (mã, giao dịch)"
                    style={{
                        flex: 1, background: 'transparent', border: 0, outline: 0,
                        color: 'var(--t-1)', fontFamily: 'inherit', fontSize: 13,
                    }}
                />
                <span
                    style={{
                        fontFamily: 'monospace', fontSize: 10.5, color: 'var(--t-3)',
                        padding: '2px 6px', borderRadius: 6,
                        border: '1px solid var(--line-2)', background: 'rgba(255,255,255,0.02)',
                    }}
                >⌘K</span>
            </div>

            {/* User pill */}
            <button
                onClick={() => router.push('/profile')}
                className="flex items-center gap-2.5 flex-shrink-0 px-2 py-1.5 rounded-full transition-all"
                style={{
                    background: 'var(--surface-1)',
                    border: '1px solid var(--line)',
                }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--line-2)'
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'
                }}
            >
                <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #5b6bff, #00c896)', color: '#fff' }}
                >
                    {initial}
                </div>
                <div className="hidden lg:flex flex-col items-start leading-none gap-[2px]">
                    <span className="text-[12.5px] font-semibold" style={{ color: 'var(--t-1)' }}>{displayName}</span>
                    <span className="text-[10.5px]" style={{ color: 'var(--t-3)' }}>{user?.email}</span>
                </div>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--t-3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="hidden lg:block">
                    <path d="m6 9 6 6 6-6"/>
                </svg>
            </button>
        </header>
    )
}
