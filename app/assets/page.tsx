'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { getAllTransactions, getAllMarketPrices } from '@/lib/api/database'
import { calculatePortfolio, type PortfolioSummary } from '@/lib/api/portfolio'

const IconWallet = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12V22H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16v4"/>
        <path d="M20 12a2 2 0 0 0-2-2H4"/>
        <circle cx="18" cy="12" r="2"/>
    </svg>
)

const IconSearch = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
)

const IconArrow = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 17L17 7"/><path d="M7 7h10v10"/>
    </svg>
)

const IconUp = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
    </svg>
)

const IconDown = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/>
        <polyline points="16 17 22 17 22 11"/>
    </svg>
)

const categoryColors: Record<string, { bg: string; color: string; abbr: string }> = {
    'Chứng chỉ quỹ': { bg: 'var(--accent-12)', color: 'var(--accent)', abbr: 'CCQ' },
    'Cổ phiếu':      { bg: 'var(--info-12)',   color: 'var(--info)',   abbr: 'CP' },
    'Vàng':          { bg: 'rgba(255,181,71,0.15)', color: '#ffb547',  abbr: 'AU' },
    'Tiết kiệm':     { bg: 'rgba(110,168,255,0.12)', color: '#6ea8ff', abbr: 'TK' },
}

export default function AssetsPage() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterCat, setFilterCat]   = useState('all')
    const [loading, setLoading]       = useState(true)

    useEffect(() => {
        if (!authLoading && !user) router.push('/login')
    }, [user, authLoading, router])

    useEffect(() => {
        if (user) loadData()
    }, [user])

    const loadData = async () => {
        try {
            setLoading(true)
            const [txns, prices] = await Promise.all([getAllTransactions(), getAllMarketPrices()])
            setPortfolio(calculatePortfolio(txns, prices))
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const fmt = (v: number) => new Intl.NumberFormat('vi-VN').format(Math.round(v))

    const allItems = portfolio?.items ?? []
    const categories = Array.from(new Set(allItems.map(i => i.category)))
    const filtered = allItems.filter(item => {
        const matchSym = !searchTerm.trim() || item.symbol.includes(searchTerm.toUpperCase())
        const matchCat = filterCat === 'all' || item.category === filterCat
        return matchSym && matchCat
    })

    // Summary stats
    const totalValue    = portfolio?.totalCurrentValue ?? 0
    const totalInvested = portfolio?.totalInvested ?? 0
    const totalPnL      = portfolio?.totalProfitLoss ?? 0
    const totalPct      = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0
    const activeCount   = allItems.filter(i => i.quantity > 0).length
    const closedCount   = allItems.filter(i => i.quantity === 0).length

    if (authLoading || loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 12, flexDirection: 'column' }}>
                <div style={{ width: 28, height: 28, border: '2.5px solid var(--accent-18)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                <div className="muted" style={{ fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Đang tải danh mục...</div>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
        )
    }

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 60 }}>

            {/* ── Mobile Header ── */}
            <div className="md:hidden" style={{ marginBottom: 16 }}>
                <div className="h-title" style={{ fontSize: 22 }}>
                    Danh mục <span style={{ color: 'var(--accent)' }}>Tài sản</span>
                </div>
                <div className="h-sub">Toàn bộ vị thế đang hoạt động của bạn.</div>
            </div>

            {/* ── Desktop Header ── */}
            <div className="hidden md:flex row between" style={{ alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div className="h-title">
                        Danh mục <span style={{ color: 'var(--accent)' }}>Tài sản</span>
                    </div>
                    <div className="h-sub">Tổng quan tất cả các vị thế tài chính đang hoạt động của bạn.</div>
                </div>
            </div>

            {/* ── Summary stat bar ── */}
            <div className="card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
                <div>
                    <div className="label-cap muted">Tổng giá trị</div>
                    <div className="value-lg num" style={{ color: 'var(--t-1)' }}>{fmt(totalValue)} <span style={{ fontSize: 14, color: 'var(--t-3)' }}>đ</span></div>
                </div>
                <div style={{ width: 1, height: 32, background: 'var(--line)' }} />
                <div>
                    <div className="label-cap muted">Vốn đầu tư</div>
                    <div className="value-lg num" style={{ color: 'var(--t-2)' }}>{fmt(totalInvested)} <span style={{ fontSize: 14, color: 'var(--t-3)' }}>đ</span></div>
                </div>
                <div style={{ width: 1, height: 32, background: 'var(--line)' }} />
                <div>
                    <div className="label-cap muted">P&L</div>
                    <div className="delta" style={{ color: totalPnL >= 0 ? 'var(--accent)' : 'var(--neg)', fontSize: 18, fontWeight: 700 }}>
                        {totalPnL >= 0 ? '+' : ''}{fmt(totalPnL)} đ
                        <span style={{ fontSize: 13, marginLeft: 6 }}>({totalPct >= 0 ? '+' : ''}{totalPct.toFixed(2)}%)</span>
                    </div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                    <span className="badge muted">{activeCount} đang nắm</span>
                    {closedCount > 0 && <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--t-3)', border: '1px solid var(--line)' }}>{closedCount} tất toán</span>}
                </div>
            </div>

            {/* ── Search + Filter bar ── */}
            <div className="row" style={{ gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
                    <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--t-3)', pointerEvents: 'none', display: 'flex' }}>
                        <IconSearch />
                    </span>
                    <input
                        type="text"
                        placeholder="Tìm mã tài sản..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            paddingLeft: 34, paddingRight: 12, height: 38,
                            background: 'var(--surface-1)', border: '1px solid var(--line)',
                            borderRadius: 10, color: 'var(--t-1)', fontSize: 13.5, outline: 'none',
                            width: '100%',
                        }}
                    />
                </div>

                {/* Category pills */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['all', ...categories].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCat(cat)}
                            className="badge"
                            style={{
                                cursor: 'pointer', border: 'none', padding: '5px 12px', borderRadius: 8, fontSize: 12.5,
                                background: filterCat === cat ? 'var(--accent-12)' : 'var(--surface-2)',
                                color: filterCat === cat ? 'var(--accent)' : 'var(--t-3)',
                                fontWeight: filterCat === cat ? 700 : 500,
                                transition: 'background .12s, color .12s',
                            }}
                        >
                            {cat === 'all' ? 'Tất cả' : cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Empty state ── */}
            {filtered.length === 0 && (
                <div className="card" style={{ padding: '64px 24px', textAlign: 'center' }}>
                    <div className="ico-box" style={{ margin: '0 auto 14px', width: 48, height: 48 }}>
                        <IconWallet />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t-2)', marginBottom: 6 }}>
                        {searchTerm || filterCat !== 'all' ? 'Không tìm thấy tài sản phù hợp.' : 'Chưa có tài sản nào.'}
                    </div>
                    <div className="muted" style={{ fontSize: 13 }}>
                        {!searchTerm && filterCat === 'all' && 'Bắt đầu bằng cách nhập giao dịch đầu tiên của bạn.'}
                    </div>
                </div>
            )}

            {/* ── Desktop Grid (3 cols) ── */}
            {filtered.length > 0 && (
                <div className="desktop-asset-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {filtered.map(item => {
                        const isProfit = item.profitLoss >= 0
                        const isClosed = item.quantity === 0
                        const catStyle = categoryColors[item.category] ?? { bg: 'var(--surface-3)', color: 'var(--t-2)', abbr: '?' }
                        const pct = item.profitLossPercent

                        return (
                            <div
                                key={item.symbol}
                                onClick={() => router.push(`/portfolio/${item.symbol}`)}
                                className="card"
                                style={{
                                    padding: '20px 22px', cursor: 'pointer',
                                    transition: 'border-color .15s, transform .15s',
                                    position: 'relative', overflow: 'hidden',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = 'var(--line-2)'
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = 'var(--line)'
                                    e.currentTarget.style.transform = 'translateY(0)'
                                }}
                            >
                                {/* Arrow icon top-right on hover */}
                                <div style={{ position: 'absolute', top: 14, right: 14, color: 'var(--t-4)', opacity: 0.5 }}>
                                    <IconArrow />
                                </div>

                                {/* Symbol avatar + name */}
                                <div className="row" style={{ gap: 12, marginBottom: 18 }}>
                                    <div style={{
                                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                                        background: catStyle.bg, color: catStyle.color,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, fontWeight: 800, letterSpacing: '0.06em',
                                    }}>
                                        {catStyle.abbr}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--t-1)', letterSpacing: '0.04em', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {item.symbol}
                                            {isClosed && (
                                                <span className="badge muted" style={{ fontSize: 10, padding: '2px 7px' }}>Tất toán</span>
                                            )}
                                        </div>
                                        <div className="muted" style={{ fontSize: 11.5, marginTop: 1 }}>{item.category}</div>
                                    </div>
                                </div>

                                {/* Value */}
                                <div style={{ marginBottom: 12 }}>
                                    <div className="label-cap muted" style={{ marginBottom: 3 }}>
                                        {isClosed ? 'Lợi nhuận thực tế' : 'Giá trị vị thế'}
                                    </div>
                                    <div className="num" style={{ fontSize: 22, fontWeight: 800, color: 'var(--t-1)' }}>
                                        {fmt(isClosed ? item.profitLoss : item.currentValue)}
                                        <span style={{ fontSize: 13, color: 'var(--t-3)', marginLeft: 4 }}>đ</span>
                                    </div>
                                </div>

                                {/* P&L row */}
                                <div className="row between">
                                    <div style={{ fontSize: 12.5, color: 'var(--t-3)' }}>
                                        Vốn: <span style={{ color: 'var(--t-2)', fontWeight: 600 }}>{fmt(item.invested)} đ</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: isProfit ? 'var(--accent)' : 'var(--neg)' }}>
                                        {isProfit ? <IconUp /> : <IconDown />}
                                        {Math.abs(pct).toFixed(1)}%
                                    </div>
                                </div>

                                {/* Mini progress bar */}
                                <div className="pbar" style={{ marginTop: 12, height: 3 }}>
                                    <div className="pbar-fill" style={{
                                        width: `${Math.min(100, Math.abs(pct) * 2)}%`,
                                        background: isProfit ? 'var(--accent)' : 'var(--neg)',
                                        opacity: 0.7,
                                    }} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ── Mobile List ── */}
            {filtered.length > 0 && (
                <div className="mob-asset-list" style={{ flexDirection: 'column', gap: 10 }}>
                    {filtered.map(item => {
                        const isProfit = item.profitLoss >= 0
                        const isClosed = item.quantity === 0
                        const catStyle = categoryColors[item.category] ?? { bg: 'var(--surface-3)', color: 'var(--t-2)', abbr: '?' }
                        const pct = item.profitLossPercent

                        return (
                            <div
                                key={item.symbol}
                                onClick={() => router.push(`/portfolio/${item.symbol}`)}
                                style={{
                                    background: 'var(--surface-1)', border: '1px solid var(--line)',
                                    borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    transition: 'background .12s',
                                }}
                                onTouchStart={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                                onTouchEnd={e => (e.currentTarget.style.background = 'var(--surface-1)')}
                            >
                                {/* Avatar */}
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                                    background: catStyle.bg, color: catStyle.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11, fontWeight: 800, letterSpacing: '0.06em',
                                }}>
                                    {catStyle.abbr}
                                </div>

                                {/* Symbol + category */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--t-1)', fontFamily: 'monospace', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 7 }}>
                                        {item.symbol}
                                        {isClosed && (
                                            <span className="badge muted" style={{ fontSize: 10, padding: '2px 7px' }}>Tất toán</span>
                                        )}
                                    </div>
                                    <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{item.category}</div>
                                </div>

                                {/* Right: value + pct */}
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div className="num" style={{ fontSize: 15, fontWeight: 700, color: 'var(--t-1)' }}>
                                        {fmt(isClosed ? item.profitLoss : item.currentValue)}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 3, fontSize: 12.5, fontWeight: 700, color: isProfit ? 'var(--accent)' : 'var(--neg)' }}>
                                        {isProfit ? <IconUp /> : <IconDown />}
                                        {Math.abs(pct).toFixed(1)}%
                                    </div>
                                </div>

                                {/* Chevron */}
                                <div style={{ color: 'var(--t-4)', flexShrink: 0 }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    )
}
