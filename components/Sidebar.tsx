'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { LayoutDashboard, BarChart3, PlusCircle, Wallet, Settings, LogOut } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

export default function Sidebar() {
    const router = useRouter()
    const pathname = usePathname()
    const { signOut } = useAuth()

    const navItems = [
        { label: 'Tổng quan',  icon: LayoutDashboard, path: '/dashboard' },
        { label: 'Tài sản',    icon: Wallet,          path: '/assets' },
        { label: 'Nhập liệu',  icon: PlusCircle,      path: '/transaction' },
        { label: 'Phân tích',  icon: BarChart3,       path: '/analysis' },
    ]

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

    return (
        <aside
            className="fixed left-0 top-0 bottom-0 w-[240px] flex flex-col z-50 hidden md:flex"
            style={{
                background: 'var(--surface-1)',
                borderRight: '1px solid var(--line)',
            }}
        >
            {/* Logo */}
            <div className="px-6 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid var(--line)' }}>
                <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(180deg, var(--accent-2), var(--accent))' }}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 11 L5 7 L8 9 L11 4 L14 6" stroke="#062018" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
                <span className="font-bold text-[15px]" style={{ color: 'var(--t-1)', letterSpacing: '-0.01em' }}>
                    Wealthing Waves
                </span>
            </div>

            {/* Main Nav */}
            <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
                <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--t-4)' }}>
                    Menu
                </p>
                {navItems.map((item) => {
                    const active = isActive(item.path)
                    return (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 text-[13px] font-medium"
                            style={
                                active
                                    ? {
                                        background: 'var(--accent-12)',
                                        color: 'var(--accent)',
                                    }
                                    : { color: 'var(--t-2)' }
                            }
                            onMouseEnter={(e) => {
                                if (!active) {
                                    const el = e.currentTarget as HTMLElement
                                    el.style.background = 'var(--surface-2)'
                                    el.style.color = 'var(--t-1)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!active) {
                                    const el = e.currentTarget as HTMLElement
                                    el.style.background = 'transparent'
                                    el.style.color = 'var(--t-2)'
                                }
                            }}
                        >
                            <item.icon
                                className="w-4 h-4 flex-shrink-0"
                                style={{ color: active ? 'var(--accent)' : 'var(--t-3)' }}
                            />
                            {item.label}
                            {active && (
                                <span
                                    className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ background: 'var(--accent)' }}
                                />
                            )}
                        </button>
                    )
                })}
            </nav>

            {/* Bottom: Cài đặt + Logout */}
            <div className="px-3 py-4" style={{ borderTop: '1px solid var(--line)' }}>
                <div className="flex items-center gap-2">
                    {/* Cài đặt — có icon + chữ */}
                    <button
                        onClick={() => router.push('/profile')}
                        className="flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150"
                        style={{ color: 'var(--t-2)' }}
                        onMouseEnter={(e) => {
                            const el = e.currentTarget as HTMLElement
                            el.style.background = 'var(--surface-2)'
                            el.style.color = 'var(--t-1)'
                        }}
                        onMouseLeave={(e) => {
                            const el = e.currentTarget as HTMLElement
                            el.style.background = 'transparent'
                            el.style.color = 'var(--t-2)'
                        }}
                    >
                        <Settings className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--t-3)' }} />
                        Cài đặt
                    </button>

                    {/* Logout — chỉ icon */}
                    <button
                        onClick={() => signOut()}
                        className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 transition-all duration-150"
                        style={{ color: 'var(--t-3)' }}
                        title="Đăng xuất"
                        onMouseEnter={(e) => {
                            const el = e.currentTarget as HTMLElement
                            el.style.background = 'var(--neg-12)'
                            el.style.color = 'var(--neg)'
                        }}
                        onMouseLeave={(e) => {
                            const el = e.currentTarget as HTMLElement
                            el.style.background = 'transparent'
                            el.style.color = 'var(--t-3)'
                        }}
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    )
}
