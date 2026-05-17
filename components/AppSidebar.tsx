'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { getAllTransactions, getAllMarketPrices } from '@/lib/api/database'
import { calculatePortfolio } from '@/lib/api/portfolio'
import {
    LayoutDashboard, ArrowDownUp, BarChart3,
    Settings, LogOut,
} from 'lucide-react'

export default function AppSidebar() {
    const router   = useRouter()
    const pathname = usePathname()
    const { user, signOut } = useAuth()

    const [txnCount,   setTxnCount]   = useState<number>(0)
    const [returnPct,  setReturnPct]  = useState<number | null>(null)

    const isActive = (path: string) =>
        pathname === path || (path !== '/' && pathname.startsWith(path + '/'))

    useEffect(() => {
        if (!user) return
        const load = async () => {
            try {
                const [txns, prices] = await Promise.all([getAllTransactions(), getAllMarketPrices()])
                setTxnCount(txns.length)
                const p = calculatePortfolio(txns, prices)
                setReturnPct(p.totalInvested > 0
                    ? (p.totalProfitLoss / p.totalInvested) * 100
                    : null)
            } catch { /* ignore */ }
        }
        load()
    }, [user])

    // color code: xanh > 5%, cam -5%~5%, đỏ < -5%
    const pctColor = returnPct === null ? 'var(--t-4)'
        : returnPct > 5  ? 'var(--accent)'
        : returnPct >= 0 ? '#ffb547'
        : returnPct > -5 ? '#ffb547'
        : 'var(--neg)'

    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Wave Rider'
    const initial = displayName.charAt(0).toUpperCase()

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px' }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em', color: 'var(--t-1)', lineHeight: 1 }}>
                        Wealthing Waves
                    </span>
                    <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 10, letterSpacing: '0.05em', lineHeight: 1 }}>
                        Tiền biết tự đẻ ra tiền
                    </span>
                </div>
            </div>

            {/* Main nav */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ color: 'var(--t-4)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '12px 10px 6px', fontWeight: 600 }}>
                    Điều hướng
                </div>

                {/* Tổng quan */}
                {(() => {
                    const active = isActive('/dashboard')
                    return (
                        <button
                            onClick={() => router.push('/dashboard')}
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
                            onMouseEnter={(e) => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--t-1)'; el.style.background = 'rgba(255,255,255,0.03)' } }}
                            onMouseLeave={(e) => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--t-2)'; el.style.background = 'transparent' } }}
                        >
                            <LayoutDashboard size={18} style={{ color: active ? 'var(--accent)' : 'currentColor', opacity: active ? 1 : 0.85, flexShrink: 0 }} />
                            <span style={{ flex: 1 }}>Tổng quan</span>
                            {/* % lời/lỗ */}
                            {returnPct !== null && (
                                <span style={{
                                    fontSize: 10.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                                    color: pctColor,
                                    letterSpacing: '0.02em',
                                }}>
                                    {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}%
                                </span>
                            )}
                        </button>
                    )
                })()}

                {/* Nhập liệu */}
                {(() => {
                    const active = isActive('/transaction')
                    return (
                        <button
                            onClick={() => router.push('/transaction')}
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
                            onMouseEnter={(e) => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--t-1)'; el.style.background = 'rgba(255,255,255,0.03)' } }}
                            onMouseLeave={(e) => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--t-2)'; el.style.background = 'transparent' } }}
                        >
                            <ArrowDownUp size={18} style={{ color: active ? 'var(--accent)' : 'currentColor', opacity: active ? 1 : 0.85, flexShrink: 0 }} />
                            <span style={{ flex: 1 }}>Nhập liệu</span>
                            {txnCount > 0 && (
                                <span style={{
                                    fontSize: 10, padding: '2px 7px', borderRadius: 999,
                                    background: 'var(--accent-12)', color: 'var(--accent)',
                                    letterSpacing: '0.04em', fontWeight: 700,
                                }}>
                                    {txnCount} GD
                                </span>
                            )}
                        </button>
                    )
                })()}

                {/* Phân tích */}
                {(() => {
                    const active = isActive('/analysis')
                    return (
                        <button
                            onClick={() => router.push('/analysis')}
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
                            onMouseEnter={(e) => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--t-1)'; el.style.background = 'rgba(255,255,255,0.03)' } }}
                            onMouseLeave={(e) => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--t-2)'; el.style.background = 'transparent' } }}
                        >
                            <BarChart3 size={18} style={{ color: active ? 'var(--accent)' : 'currentColor', opacity: active ? 1 : 0.85, flexShrink: 0 }} />
                            <span style={{ flex: 1 }}>Phân tích</span>
                        </button>
                    )
                })()}
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
                    <div style={{ height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                        <span style={{ display: 'block', height: '100%', background: 'linear-gradient(90deg, var(--accent-d), var(--accent-2))', width: `${Math.min(100, (txnCount / 20) * 100)}%`, borderRadius: 999, transition: 'width .5s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--t-3)', fontSize: 11 }}>
                        <span>{txnCount} / 20 GD</span>
                        <span>Lv 2 sắp tới</span>
                    </div>
                </div>
            </div>

            {/* User badge + Bottom actions */}
            <div style={{ paddingTop: 14, borderTop: '1px solid var(--line)', marginTop: 14, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* User info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #5b6bff, #00c896)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
                        {initial}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, minWidth: 0 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--t-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {displayName}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--t-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.email}
                        </span>
                    </div>
                </div>

                {/* Cài đặt + Logout */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                        onClick={() => router.push('/profile')}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 10, color: 'var(--t-2)', fontWeight: 500, fontSize: 13.5, background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all .15s ease', textAlign: 'left' }}
                        onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--t-1)'; el.style.background = 'rgba(255,255,255,0.05)' }}
                        onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--t-2)'; el.style.background = 'transparent' }}
                    >
                        <Settings size={16} style={{ color: 'var(--t-3)', flexShrink: 0 }} />
                        Cài đặt
                    </button>
                    <button
                        onClick={() => signOut()}
                        title="Đăng xuất"
                        style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'grid', placeItems: 'center', color: 'var(--t-3)', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all .15s ease' }}
                        onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--neg)'; el.style.background = 'var(--neg-12)' }}
                        onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--t-3)'; el.style.background = 'transparent' }}
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    )
}
