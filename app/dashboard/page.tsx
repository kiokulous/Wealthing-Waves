'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { getAllTransactions, getAllMarketPrices } from '@/lib/api/database'
import { calculatePortfolio, calculatePortfolioHistory } from '@/lib/api/portfolio'
import CategoryIcon from '@/components/CategoryIcon'
import type { Transaction, MarketPrice } from '@/lib/supabase'
import type { PortfolioSummary } from '@/lib/api/portfolio'

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtMoney(v: number) {
    const abs = Math.abs(v)
    if (abs >= 1_000_000_000) return (v / 1_000_000_000).toFixed(3).replace(/\./, '.').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    if (abs >= 1_000_000)     return new Intl.NumberFormat('vi-VN').format(Math.round(v / 1_000)) + '.000'
    return new Intl.NumberFormat('vi-VN').format(Math.round(v))
}

function fmtFull(v: number) {
    return new Intl.NumberFormat('vi-VN').format(Math.round(v))
}

function fmtShort(v: number) {
    const abs = Math.abs(v)
    if (abs >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + ' tỷ'
    if (abs >= 1_000_000)     return (v / 1_000_000).toFixed(1) + ' tr'
    return new Intl.NumberFormat('vi-VN').format(Math.round(v))
}

// ─── Sparkline SVG ────────────────────────────────────────────────────────────

function Sparkline({ data }: { data: number[] }) {
    if (!data || data.length < 2) return null
    const w = 520, h = 100
    const min = Math.min(...data), max = Math.max(...data)
    const range = max - min || 1
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w
        const y = h - ((v - min) / range) * h * 0.85 - h * 0.075
        return `${x},${y}`
    })
    const polyline = pts.join(' ')
    const areaPath = `M${pts[0]} L${pts.join(' L')} L${w},${h} L0,${h} Z`

    return (
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 80, display: 'block' }}>
            <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#sg)" />
            <polyline points={polyline} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()

    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([])
    const [portfolio, setPortfolio]       = useState<PortfolioSummary | null>(null)
    const [loading, setLoading]           = useState(true)
    const [chartData, setChartData]       = useState<{ date: string; value: number }[]>([])
    const [filterRange, setFilterRange]   = useState<'1m' | '3m' | 'ytd' | 'all'>('ytd')
    const [filterYear, setFilterYear]     = useState<number | undefined>(undefined)
    const [availableYears, setAvailableYears] = useState<number[]>([])

    useEffect(() => {
        if (!authLoading && !user) router.push('/login')
    }, [user, authLoading, router])

    useEffect(() => {
        if (user) loadData()
    }, [user])

    useEffect(() => {
        if (transactions.length > 0 || marketPrices.length >= 0) recalc()
    }, [transactions, marketPrices, filterYear])

    const loadData = async () => {
        try {
            setLoading(true)
            const [txns, prices] = await Promise.all([getAllTransactions(), getAllMarketPrices()])
            setTransactions(txns)
            setMarketPrices(prices)
            const years = Array.from(new Set(txns.map(t => new Date(t.date).getFullYear())))
                .filter(y => !isNaN(y)).sort((a, b) => b - a)
            setAvailableYears(years)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const recalc = () => {
        setPortfolio(calculatePortfolio(transactions, marketPrices, filterYear))
        setChartData(calculatePortfolioHistory(transactions, marketPrices, 12))
    }

    if (authLoading || loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: '50%', margin: '0 auto 12px',
                        border: '3px solid var(--accent)', borderTopColor: 'transparent',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                    <p style={{ color: 'var(--t-3)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Đang đồng bộ...</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
        )
    }

    if (!user || !portfolio) return null

    const isProfit   = portfolio.totalProfitLoss >= 0
    const hour       = new Date().getHours()
    const greeting   = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'
    const name       = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Wave Rider'
    const today      = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const activeItems = portfolio.items.filter(i => i.quantity > 0).length
    const lastUpdate = marketPrices.length > 0
        ? new Date(Math.max(...marketPrices.map(p => new Date(p.date).getTime())))
            .toLocaleDateString('vi-VN', { day: '2-digit', month: 'numeric', year: 'numeric' })
        : '—'

    const sparkValues = chartData.map(d => d.value)
    const monthLabels = ['T6','T7','T8','T9','T10','T11','T12','T1','T2','T3','T4','T5']

    const catColors: Record<string, string> = {
        'Chứng chỉ quỹ': 'var(--accent)',
        'Cổ phiếu':      '#6ea8ff',
        'Tiết kiệm':     '#c084fc',
        'Vàng':          '#ffb547',
    }
    const catIcons: Record<string, string> = {
        'Chứng chỉ quỹ': 'pie',
        'Cổ phiếu':      'trend',
        'Tiết kiệm':     'wallet',
        'Vàng':          'spark',
    }

    const rangeLabels: Record<string, string> = { '1m': '1 tháng', '3m': '3 tháng', ytd: 'Năm nay', all: 'Toàn bộ' }

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>

            {/* ── Greeting row ── */}
            <div className="row between" style={{ alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div className="h-title" style={{ fontSize: 26, fontWeight: 700, color: 'var(--t-1)', letterSpacing: '-0.01em' }}>
                        {greeting}, <span style={{ color: 'var(--accent)' }}>{name}</span>
                        <span style={{ marginLeft: 10, fontSize: 20 }}>👋</span>
                    </div>
                    <div style={{ color: 'var(--t-3)', fontSize: 13, marginTop: 4 }}>
                        Hôm nay {today} · Danh mục đang sinh lời{' '}
                        <span style={{ color: isProfit ? 'var(--accent)' : 'var(--neg)', fontWeight: 600 }}>
                            {isProfit ? '+' : ''}{portfolio.totalProfitLossPercent.toFixed(1)}%
                        </span>{' '}so với tháng trước.
                    </div>
                </div>

                <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                    {/* Segmented range filter */}
                    <div className="segmented">
                        {(['1m','3m','ytd','all'] as const).map(k => (
                            <button
                                key={k}
                                className={filterRange === k ? 'on' : ''}
                                onClick={() => setFilterRange(k)}
                            >
                                {rangeLabels[k]}
                            </button>
                        ))}
                    </div>
                    <button
                        className="btn btn-ghost"
                        style={{ fontSize: 12.5, padding: '7px 14px' }}
                        onClick={() => {}}
                    >
                        ↗ Xuất báo cáo
                    </button>
                </div>
            </div>

            {/* ── Hero grid: 1.4fr 1fr 1fr ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 18, marginBottom: 18 }}>

                {/* Card 1 — Total balance + sparkline */}
                <div className="card" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
                    <div className="row between" style={{ alignItems: 'flex-start' }}>
                        <div>
                            <div className="label-cap">Tổng số dư danh mục</div>
                            <div className="value-xl mono num" style={{ marginTop: 10 }}>
                                {fmtFull(portfolio.totalCurrentValue)}{' '}
                                <span style={{ color: 'var(--t-3)', fontSize: 22, fontWeight: 500 }}>đ</span>
                            </div>
                            <div className="row" style={{ gap: 10, marginTop: 14 }}>
                                <span className={`delta ${isProfit ? 'pos' : 'neg'}`}>
                                    {isProfit ? '▲' : '▼'} {isProfit ? '+' : ''}{portfolio.totalProfitLossPercent.toFixed(1)}%
                                </span>
                                <span className="muted" style={{ fontSize: 12.5 }}>
                                    {isProfit ? '+' : ''}{fmtFull(portfolio.totalProfitLoss)} đ so với vốn
                                </span>
                            </div>
                        </div>
                        <div className="col" style={{ alignItems: 'flex-end', gap: 8 }}>
                            <span className="badge green">
                                <span className="dot" style={{ background: 'var(--accent)', marginRight: 0 }} />
                                Đang theo dõi {activeItems} tài sản
                            </span>
                            <span className="muted" style={{ fontSize: 11.5 }}>Cập nhật {lastUpdate}</span>
                        </div>
                    </div>

                    {/* Sparkline */}
                    <div style={{ marginTop: 10, marginLeft: -8, marginRight: -8 }}>
                        <Sparkline data={sparkValues} />
                    </div>
                    <div className="row between" style={{ marginTop: 6, padding: '0 6px', color: 'var(--t-4)', fontSize: 11 }}>
                        {monthLabels.map(l => <span key={l}>{l}</span>)}
                    </div>
                </div>

                {/* Card 2 — P&L */}
                <div className="card" style={{ padding: 22 }}>
                    <div className="card-head">
                        <div className="left">
                            <div className="ico-box">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
                                </svg>
                            </div>
                            <div>
                                <div className="title">Lợi nhuận ròng</div>
                                <div className="desc">Toàn bộ danh mục · YTD</div>
                            </div>
                        </div>
                    </div>

                    <div className={`value-lg mono num ${isProfit ? 'delta pos' : 'delta neg'}`}
                        style={{ color: isProfit ? 'var(--accent)' : 'var(--neg)', background: 'transparent', padding: 0 }}>
                        {isProfit ? '+ ' : '- '}{fmtFull(Math.abs(portfolio.totalProfitLoss))} đ
                    </div>
                    <div className="row" style={{ gap: 8, marginTop: 6 }}>
                        <span className={`delta ${isProfit ? 'pos' : 'neg'}`}>
                            {isProfit ? '+' : ''}{portfolio.totalProfitLossPercent.toFixed(1)}%
                        </span>
                        <span className="muted" style={{ fontSize: 12 }}>tỷ suất sinh lời</span>
                    </div>

                    <div className="divider" />

                    <div className="row between" style={{ marginBottom: 8 }}>
                        <span className="label-cap">Vốn vs Lãi/Lỗ</span>
                        <span className="muted" style={{ fontSize: 11 }}>Hàng tháng</span>
                    </div>
                    <div className="col" style={{ gap: 10 }}>
                        <div className="bar-row">
                            <span className="muted" style={{ fontSize: 12 }}>Vốn gốc</span>
                            <div className="bar alt">
                                <span style={{ width: '92%', background: 'linear-gradient(90deg, #6ea8ff, #5b6bff)' }} />
                            </div>
                            <span className="pct mono" style={{ fontSize: 11.5, color: 'var(--t-2)', textAlign: 'right' }}>
                                {fmtShort(portfolio.totalInvested)}
                            </span>
                        </div>
                        <div className="bar-row">
                            <span className="muted" style={{ fontSize: 12 }}>Lãi/Lỗ</span>
                            <div className="bar">
                                <span style={{
                                    width: `${Math.min(100, Math.abs(portfolio.totalProfitLossPercent) * 5)}%`,
                                    background: isProfit ? 'linear-gradient(90deg, var(--accent-d), var(--accent))' : 'var(--neg)',
                                }} />
                            </div>
                            <span className="pct mono" style={{ fontSize: 11.5, color: isProfit ? 'var(--accent)' : 'var(--neg)', textAlign: 'right' }}>
                                {isProfit ? '+' : ''}{fmtShort(portfolio.totalProfitLoss)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Card 3 — Quick actions */}
                <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column' }}>
                    <div className="card-head">
                        <div className="left">
                            <div className="ico-box warn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                                </svg>
                            </div>
                            <div>
                                <div className="title">Thao tác nhanh</div>
                                <div className="desc">Hệ thống đang vận hành ổn định</div>
                            </div>
                        </div>
                    </div>

                    <div className="col" style={{ gap: 8 }}>
                        <button
                            className="btn btn-primary"
                            style={{ justifyContent: 'space-between', padding: '12px 14px', width: '100%' }}
                            onClick={() => router.push('/transaction')}
                        >
                            <span className="row" style={{ gap: 8 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>
                                Đồng bộ dữ liệu mới
                            </span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </button>
                        <button
                            className="btn btn-ghost"
                            style={{ justifyContent: 'space-between', padding: '12px 14px', width: '100%' }}
                            onClick={() => router.push('/transaction')}
                        >
                            <span className="row" style={{ gap: 8 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                Ghi nhận giao dịch
                            </span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </button>
                        <button
                            className="btn btn-ghost"
                            style={{ justifyContent: 'space-between', padding: '12px 14px', width: '100%' }}
                            onClick={() => router.push('/analysis')}
                        >
                            <span className="row" style={{ gap: 8 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                                Phân tích chi tiết
                            </span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </button>
                    </div>

                    <div style={{ flex: 1 }} />
                    <div className="row" style={{ gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
                        <span className="badge green">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            Đồng bộ
                        </span>
                        <span className="muted" style={{ fontSize: 11.5 }}>cập nhật mới nhất {lastUpdate}</span>
                    </div>
                </div>
            </div>

            {/* ── Allocation cards (4 columns) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 24 }}>
                {portfolio.categories.map((cat, i) => {
                    const color = catColors[cat.category] || 'var(--accent)'
                    const isPos = cat.profitLoss >= 0
                    const share = portfolio.totalCurrentValue > 0
                        ? Math.round((cat.currentValue / portfolio.totalCurrentValue) * 100) : 0
                    return (
                        <div key={cat.category} className="card" style={{ padding: 20 }}>
                            <div className="row between">
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.03)', color, display: 'grid', placeItems: 'center' }}>
                                    <CategoryIcon category={cat.category as any} className="w-4 h-4" style={{ color }} />
                                </div>
                                <span className={`delta ${isPos ? 'pos' : 'neg'}`}>
                                    {isPos ? '▲' : '▼'} {isPos ? '+' : ''}{cat.profitLossPercent.toFixed(1)}%
                                </span>
                            </div>
                            <div className="label-cap" style={{ marginTop: 14 }}>{cat.category}</div>
                            <div className="value-lg mono num" style={{ marginTop: 6 }}>
                                {fmtFull(cat.currentValue)}
                                <span style={{ color: 'var(--t-3)', fontSize: 16, fontWeight: 500 }}> đ</span>
                            </div>
                            <div className="pbar" style={{ marginTop: 14 }}>
                                <span style={{ width: `${share}%`, background: color }} />
                            </div>
                            <div className="row between" style={{ marginTop: 6 }}>
                                <span className="muted" style={{ fontSize: 11 }}>Tỷ trọng</span>
                                <span className="mono num muted" style={{ fontSize: 11 }}>{share}%</span>
                            </div>
                        </div>
                    )
                })}

                {/* Tổng năng suất card */}
                <div className="card" style={{ padding: 20 }}>
                    <div className="row between">
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,181,71,0.12)', color: '#ffb547', display: 'grid', placeItems: 'center' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                            </svg>
                        </div>
                        <span className={`delta ${isProfit ? 'pos' : 'neg'}`}>
                            {isProfit ? '▲' : '▼'} {isProfit ? '+' : ''}{portfolio.totalProfitLossPercent.toFixed(1)}%
                        </span>
                    </div>
                    <div className="label-cap" style={{ marginTop: 14 }}>Tổng năng suất</div>
                    <div className="value-lg mono num" style={{ marginTop: 6, color: isProfit ? 'var(--accent)' : 'var(--neg)' }}>
                        {isProfit ? '+' : ''}{portfolio.totalProfitLossPercent.toFixed(1)}%
                    </div>
                    <div className="pbar" style={{ marginTop: 14 }}>
                        <span style={{ width: `${Math.min(100, Math.abs(portfolio.totalProfitLossPercent) * 5)}%`, background: '#ffb547' }} />
                    </div>
                    <div className="row between" style={{ marginTop: 6 }}>
                        <span className="muted" style={{ fontSize: 11 }}>YTD</span>
                        <span className="mono num muted" style={{ fontSize: 11 }}>100%</span>
                    </div>
                </div>
            </div>

            {/* ── Market signals ── */}
            <div className="card" style={{ padding: 22, marginBottom: 24 }}>
                <div className="card-head">
                    <div className="left">
                        <div className="ico-box">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 10 C3 10 7 4 12 4 S21 10 21 10 S17 16 12 16 S3 10 3 10Z"/><circle cx="12" cy="10" r="3"/>
                            </svg>
                        </div>
                        <div>
                            <div className="title">Tín hiệu Thị trường</div>
                            <div className="desc">
                                Đang theo dõi {activeItems} chỉ dấu hoạt động · Sắp xếp theo giá trị
                            </div>
                        </div>
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                        <span className="badge green">{portfolio.items.filter(i => i.profitLoss >= 0).length} tăng</span>
                        <span className="badge red">{portfolio.items.filter(i => i.profitLoss < 0).length} giảm</span>
                        <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }}>
                            ⚙ Lọc
                        </button>
                    </div>
                </div>

                {portfolio.items.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 0' }}>
                        <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>Chưa có giao dịch nào.</p>
                        <button className="btn btn-primary" onClick={() => router.push('/transaction')}>
                            + Thêm giao dịch đầu tiên
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                        {portfolio.items
                            .sort((a, b) => b.currentValue - a.currentValue)
                            .map(item => {
                                const isPos   = item.profitLoss >= 0
                                const closed  = item.quantity === 0
                                const color   = catColors[item.category] || 'var(--accent)'
                                return (
                                    <div
                                        key={item.symbol}
                                        onClick={() => router.push(`/portfolio/${item.symbol}`)}
                                        className="card inset"
                                        style={{ padding: 14, borderRadius: 14, cursor: 'pointer', transition: 'border-color .15s' }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,200,150,0.3)'}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'}
                                    >
                                        <div className="row between" style={{ marginBottom: 12 }}>
                                            <div className="row" style={{ gap: 10 }}>
                                                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', color: closed ? 'var(--t-3)' : color }}>
                                                    <CategoryIcon category={item.category as any} className="w-4 h-4" style={{ color: closed ? 'var(--t-3)' : color }} />
                                                </div>
                                                <div className="col">
                                                    <div style={{ fontWeight: 700, fontSize: 13.5, letterSpacing: '-0.005em' }}>{item.symbol}</div>
                                                    <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{item.category}</div>
                                                </div>
                                            </div>
                                            {closed
                                                ? <span className="badge muted">Tất toán</span>
                                                : <span className={`delta ${isPos ? 'pos' : 'neg'}`}>
                                                    {isPos ? '▲' : '▼'} {Math.abs(item.profitLossPercent).toFixed(1)}%
                                                </span>
                                            }
                                        </div>
                                        <div className="row between" style={{ alignItems: 'baseline' }}>
                                            <div className="mono num" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>
                                                {fmtFull(closed ? item.profitLoss : item.currentValue)}{' '}
                                                <span style={{ color: 'var(--t-3)', fontWeight: 500 }}>đ</span>
                                            </div>
                                        </div>
                                        <div className="row between" style={{ marginTop: 6 }}>
                                            <div className="muted mono" style={{ fontSize: 11.5 }}>
                                                {closed ? 'Đã đóng' : `SL: ${item.quantity.toLocaleString('vi-VN')}`}
                                            </div>
                                            <div className="muted" style={{ fontSize: 11.5 }}>
                                                {item.category === 'Chứng chỉ quỹ' ? 'Quỹ' : item.category === 'Cổ phiếu' ? 'Cổ phiếu' : 'Tiết kiệm'}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg) } }
                .bar-row { display: grid; grid-template-columns: 80px 1fr 64px; gap: 12px; align-items: center; }
                .bar-row .bar { height: 10px; border-radius: 999px; background: rgba(255,255,255,0.06); position: relative; overflow: hidden; }
                .bar-row .bar > span { position: absolute; inset: 0 auto 0 0; border-radius: 999px; background: linear-gradient(90deg, var(--accent-d), var(--accent)); }
                .bar-row .bar.alt > span { background: linear-gradient(90deg, #6ea8ff, #5b6bff); }
            `}</style>
        </div>
    )
}
