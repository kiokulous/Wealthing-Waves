'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import {
    LayoutDashboard, ArrowDownUp, BarChart3, User,
    Landmark, ShieldCheck, Settings, HelpCircle, LogOut,
} from 'lucide-react'

const NAV_MAIN = [
    { label: 'Tổng quan',  icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Nhập liệu',  icon: ArrowDownUp,     path: '/transaction', badge: true },
    { label: 'Phân tích',  icon: BarChart3,        path: '/analysis' },
    { label: 'Cá nhân',    icon: User,             path: '/profile' },
]

const NAV_ACCOUNT = [
    { label: 'Tài khoản liên kết', icon: Landmark,     path: '/assets' },
    { label: 'Bảo mật',            icon: ShieldCheck,  path: '/profile' },
    { label: 'Cài đặt',            icon: Settings,     path: '/profile' },
    { label: 'Trợ giúp',           icon: HelpCircle,   path: '#' },
]

export default function AppSidebar() {
    const router   = useRouter()
    const pathname = usePathname()
    const { user, signOut } = useAuth()

    const isActive = (path: string) =>
        pathname === path || (path !== '/' && pathname.startsWith(path + '/'))

    const txnCount = 92 // TODO: pull from context if needed

    return (
        <aside
            className="hidden md:flex"
            style={{
                position: 'sticky',
                top: 0,
                height: '100vh',
                flexDirection: 'column',
                gap: 20,
                padding: '22px 18px 18px',
                borderRight: '1px solid var(--line)',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.01), transparent)',
                overflowY: 'auto',
            }}
        >
            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px 0' }}>
                <div
                    style={{
                        width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                        background: 'radial-gradient(120% 80% at 30% 20%, rgba(255,255,255,0.18), transparent 60%), linear-gradient(140deg, #14e0a8 0%, #00c896 45%, #0a7d5e 100%)',
                        boxShadow: '0 8px 22px -8px rgba(0,200,150,0.7), 0 0 0 1px rgba(0,200,150,0.4) inset, 0 1px 0 rgba(255,255,255,0.35) inset',
                        display: 'grid', placeItems: 'center', color: '#03110d',
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                        <path d="M3.5 10 L 8 19.5 L 13 12.5 L 18 19.5 L 24 6.5"
                            stroke="currentColor" strokeWidth="2.6"
                            strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="24" cy="6.5" r="2" fill="currentColor"/>
                        <circle cx="24" cy="6.5" r="3.5" fill="currentColor" fillOpacity="0.18"/>
                    </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em', color: 'var(--t-1)' }}>
                        Wealthing Waves
                    </span>
                    <span style={{ color: 'var(--t-3)', fontWeight: 500, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                        Personal Finance · v2.0
                    </span>
                </div>
            </div>

            {/* Main nav */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ color: 'var(--t-4)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '12px 10px 6px', fontWeight: 600 }}>
                    Điều hướng
                </div>
                {NAV_MAIN.map((item) => {
                    const active = isActive(item.path)
                    return (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '9px 10px', borderRadius: 10,
                                color: active ? 'var(--t-1)' : 'var(--t-2)',
                                fontWeight: 500, fontSize: 13.5,
                                border: `1px solid ${active ? 'rgba(0,200,150,0.18)' : 'transparent'}`,
                                background: active
                                    ? 'linear-gradient(180deg, rgba(0,200,150,0.10), rgba(0,200,150,0.04))'
                                    : 'transparent',
                                boxShadow: active ? '0 0 0 1px rgba(0,200,150,0.06) inset, 0 8px 22px -16px rgba(0,200,150,0.5)' : 'none',
                                cursor: 'pointer', transition: 'all .15s ease', textAlign: 'left',
                                width: '100%',
                            }}
                            onMouseEnter={(e) => {
                                if (!active) {
                                    (e.currentTarget as HTMLElement).style.color = 'var(--t-1)'
                                    ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!active) {
                                    (e.currentTarget as HTMLElement).style.color = 'var(--t-2)'
                                    ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                                }
                            }}
                        >
                            <item.icon
                                size={18}
                                style={{ color: active ? 'var(--accent)' : 'currentColor', opacity: active ? 1 : 0.85, flexShrink: 0 }}
                            />
                            <span style={{ flex: 1 }}>{item.label}</span>
                            {item.badge && (
                                <span style={{
                                    fontSize: 10, padding: '2px 7px', borderRadius: 999,
                                    background: 'var(--accent-12)', color: 'var(--accent)',
                                    letterSpacing: '0.06em', fontWeight: 700,
                                }}>
                                    {txnCount}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Account nav */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ color: 'var(--t-4)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '12px 10px 6px', fontWeight: 600 }}>
                    Tài khoản
                </div>
                {NAV_ACCOUNT.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => item.path !== '#' && router.push(item.path)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '9px 10px', borderRadius: 10,
                            color: 'var(--t-2)', fontWeight: 500, fontSize: 13.5,
                            border: '1px solid transparent', background: 'transparent',
                            cursor: 'pointer', transition: 'all .15s ease', textAlign: 'left',
                            width: '100%',
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.color = 'var(--t-1)'
                            ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.color = 'var(--t-2)'
                            ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                        }}
                    >
                        <item.icon size={18} style={{ opacity: 0.75, flexShrink: 0 }} />
                        {item.label}
                    </button>
                ))}

                {/* Sign out */}
                <button
                    onClick={() => signOut()}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 10px', borderRadius: 10,
                        color: 'var(--t-2)', fontWeight: 500, fontSize: 13.5,
                        border: '1px solid transparent', background: 'transparent',
                        cursor: 'pointer', transition: 'all .15s ease', textAlign: 'left',
                        width: '100%',
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color = 'var(--neg)'
                        ;(e.currentTarget as HTMLElement).style.background = 'var(--neg-12)'
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color = 'var(--t-2)'
                        ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                    }}
                >
                    <LogOut size={18} style={{ opacity: 0.75, flexShrink: 0 }} />
                    Đăng xuất
                </button>
            </div>

            {/* XP footer card */}
            <div style={{ marginTop: 'auto' }}>
                <div
                    style={{
                        padding: 12, borderRadius: 14,
                        background: 'linear-gradient(180deg, rgba(0,200,150,0.08), rgba(0,200,150,0.02))',
                        border: '1px solid rgba(0,200,150,0.16)',
                        display: 'grid', gap: 8,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14 }}>⚡</span>
                        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--t-1)' }}>
                            Wave Rider · Level 1
                        </span>
                    </div>
                    {/* XP bar */}
                    <div style={{ height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                        <span style={{ display: 'block', height: '100%', background: 'linear-gradient(90deg, var(--accent-d), var(--accent-2))', width: '34%', borderRadius: 999 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--t-3)', fontSize: 11 }}>
                        <span>340 / 1000 XP</span>
                        <span>Lv 2 sắp tới</span>
                    </div>
                    <div style={{ color: 'var(--t-2)', fontSize: 12, lineHeight: 1.45 }}>
                        Ghi nhận 8 giao dịch nữa để lên cấp Sailor.
                    </div>
                </div>
            </div>
        </aside>
    )
}
