'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { getAllTransactions, getAllMarketPrices } from '@/lib/api/database'
import { calculatePortfolio, calculatePortfolioHistory } from '@/lib/api/portfolio'
import CategoryIcon from '@/components/CategoryIcon'
import type { Transaction, MarketPrice } from '@/lib/supabase'
import type { PortfolioSummary } from '@/lib/api/portfolio'
import TotalBalanceChart from '@/components/TotalBalanceChart'
import ProfitCorrelationChart from '@/components/ProfitCorrelationChart'

const CAT_COLORS: Record<string, string> = {
    'Cổ phiếu':       '#5b6bff',
    'Chứng chỉ quỹ':  '#00c896',
    'Vàng':           '#f59e0b',
    'Tiết kiệm':      '#38bdf8',
}

function fmt(v: number) {
    if (Math.abs(v) >= 1_000_000_000) return (v / 1_000_000_000).toFixed(2) + ' tỷ'
    if (Math.abs(v) >= 1_000_000)     return (v / 1_000_000).toFixed(1) + ' tr'
    return new Intl.NumberFormat('vi-VN').format(Math.round(v))
}

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()

    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([])
    const [portfolio, setPortfolio]       = useState<PortfolioSummary | null>(null)
    const [loading, setLoading]           = useState(true)
    const [chartData, setChartData]       = useState<{ date: string; value: number }[]>([])
    const [filterYear, setFilterYear]     = useState<number | 'all'>('all')
    const [availableYears, setAvailableYears] = useState<number[]>([])

    useEffect(() => {
        if (!authLoading && !user) router.push('/login')
    }, [user, authLoading, router])

    useEffect(() => {
        if (user) loadData()
    }, [user])

    useEffect(() => {
        if (transactions.length > 0 || marketPrices.length > 0) recalc()
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
        const year = filterYear === 'all' ? undefined : filterYear
        setPortfolio(calculatePortfolio(transactions, marketPrices, year))
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

    const isProfit  = portfolio.totalProfitLoss >= 0
    const hour      = new Date().getHours()
    const greeting  = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'
    const name      = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Wave Rider'
    const lastUpdate = marketPrices.length > 0
        ? new Date(Math.max(...marketPrices.map(p => new Date(p.date).getTime()))).toLocaleDateString('vi-VN')
        : '—'

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--t-1)', margin: 0 }}>
                        {greeting}, <span style={{ color: 'var(--accent)' }}>{name}</span>!
                    </h1>
                    <p style={{ color: 'var(--t-3)', fontSize: 13, marginTop: 4 }}>
                        Tổng quan tài chính của bạn hôm nay.
                    </p>
                </div>

                {/* Year filter */}
                <select
                    value={filterYear}
                    onChange={e => setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    style={{
                        background: 'var(--surface-1)', border: '1px solid var(--line)',
                        borderRadius: 10, padding: '8px 14px', color: 'var(--t-1)',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: 'none',
                    }}
                >
                    <option value="all">Toàn bộ lịch sử</option>
                    {availableYears.map(y => <option key={y} value={y}>Năm {y}</option>)}
                </select>
            </div>

            {/* KPI hero row — 3 cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>

                {/* Card 1 — Total balance + sparkline */}
                <div className="ww-card" style={{ padding: 22, gridColumn: '1 / 2' }}>
                    <div className="label-cap" style={{ marginBottom: 12 }}>Tổng số dư</div>
                    <div className="value-xl" style={{ marginBottom: 4 }}>
                        {fmt(portfolio.totalCurrentValue)}
                        <span style={{ fontSize: 14, color: 'var(--t-3)', marginLeft: 6 }}>đ</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: isProfit ? 'var(--accent)' : 'var(--neg)' }}>
                            {isProfit ? '▲' : '▼'} {Math.abs(portfolio.totalProfitLossPercent).toFixed(1)}%
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--t-3)' }}>tổng lợi nhuận</span>
                    </div>
                    {chartData.length > 0 && (
                        <div style={{ height: 64, marginTop: 8 }}>
                            <TotalBalanceChart data={chartData} />
                        </div>
                    )}
                </div>

                {/* Card 2 — P&L */}
                <div className="ww-card" style={{ padding: 22 }}>
                    <div className="label-cap" style={{ marginBottom: 12 }}>Lợi nhuận ròng</div>
                    <div className={isProfit ? 'value-xl delta-pos' : 'value-xl delta-neg'} style={{ marginBottom: 4, fontSize: 26 }}>
                        {isProfit ? '+' : ''}{fmt(portfolio.totalProfitLoss)} đ
                    </div>
                    <div style={{ color: 'var(--t-3)', fontSize: 12.5, marginBottom: 20 }}>
                        Đã đầu tư: <span style={{ color: 'var(--t-2)', fontWeight: 600 }}>{fmt(portfolio.totalInvested)} đ</span>
                    </div>
                    {/* Correlation chart */}
                    <div style={{ height: 56 }}>
                        <ProfitCorrelationChart
                            invested={portfolio.totalInvested}
                            profit={portfolio.totalProfitLoss}
                        />
                    </div>
                </div>

                {/* Card 3 — Quick actions */}
                <div className="ww-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <div className="label-cap" style={{ marginBottom: 12 }}>Thao tác nhanh</div>
                        <p style={{ color: 'var(--t-3)', fontSize: 12.5, lineHeight: 1.6, marginBottom: 16 }}>
                            Hệ thống hoạt động bình thường.<br />Cập nhật cuối: <span style={{ color: 'var(--t-2)' }}>{lastUpdate}</span>
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/transaction')}
                        style={{
                            width: '100%', padding: '10px 0', borderRadius: 10, border: 'none',
                            background: 'var(--accent)', color: '#062018', fontSize: 13.5, fontWeight: 700,
                            cursor: 'pointer', transition: 'opacity .15s',
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                    >
                        + Nhập liệu mới
                    </button>
                </div>
            </div>

            {/* Category breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
                {portfolio.categories.map(cat => {
                    const color  = CAT_COLORS[cat.category] || 'var(--accent)'
                    const isPos  = cat.profitLoss >= 0
                    const alloc  = portfolio.totalCurrentValue > 0 ? (cat.currentValue / portfolio.totalCurrentValue) * 100 : 0
                    return (
                        <div key={cat.category} className="ww-card" style={{ padding: 18 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <CategoryIcon category={cat.category as any} className="w-4 h-4" style={{ color }} />
                                </div>
                                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t-2)' }}>{cat.category}</span>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--t-1)', marginBottom: 2 }}>
                                {fmt(cat.currentValue)} đ
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontSize: 11.5, color: isPos ? 'var(--accent)' : 'var(--neg)', fontWeight: 600 }}>
                                    {isPos ? '+' : ''}{cat.profitLossPercent.toFixed(1)}%
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--t-3)' }}>{alloc.toFixed(0)}% danh mục</span>
                            </div>
                            {/* Mini bar */}
                            <div style={{ height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${alloc}%`, background: color, borderRadius: 999 }} />
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Market signals table */}
            <div className="ww-card" style={{ overflow: 'hidden', marginBottom: 24 }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div className="label-cap">Tín hiệu Thị trường</div>
                        <p style={{ color: 'var(--t-3)', fontSize: 12.5, marginTop: 3 }}>
                            Đang theo dõi {portfolio.items.filter(i => i.quantity > 0).length} tài sản hoạt động
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/transaction')}
                        style={{
                            padding: '7px 16px', background: 'var(--accent-12)', border: '1px solid rgba(0,200,150,0.2)',
                            borderRadius: 9, color: 'var(--accent)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        + Nhập liệu
                    </button>
                </div>

                {portfolio.items.length === 0 ? (
                    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                        <p style={{ color: 'var(--t-3)', fontSize: 13 }}>Chưa có giao dịch nào. Hãy bắt đầu!</p>
                        <button
                            onClick={() => router.push('/transaction')}
                            style={{
                                marginTop: 16, padding: '10px 24px', background: 'var(--accent)',
                                border: 'none', borderRadius: 10, color: '#062018', fontWeight: 700,
                                fontSize: 13.5, cursor: 'pointer',
                            }}
                        >
                            Thêm giao dịch đầu tiên
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, padding: 16 }}>
                        {portfolio.items.map(item => {
                            const isPos   = item.profitLoss >= 0
                            const closed  = item.quantity === 0
                            const color   = CAT_COLORS[item.category] || 'var(--accent)'
                            return (
                                <div
                                    key={item.symbol}
                                    onClick={() => router.push(`/portfolio/${item.symbol}`)}
                                    style={{
                                        padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                                        background: 'var(--surface-2)', border: '1px solid var(--line)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        transition: 'border-color .15s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,200,150,0.3)'}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <CategoryIcon category={item.category as any} className="w-4 h-4" style={{ color }} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--t-1)' }}>{item.symbol}</div>
                                            {closed
                                                ? <span style={{ fontSize: 10, color: 'var(--t-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tất toán</span>
                                                : <div style={{ fontSize: 11, color: 'var(--t-3)', marginTop: 1 }}>SL: {item.quantity.toLocaleString('vi-VN')}</div>
                                            }
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--t-1)' }}>
                                            {fmt(closed ? item.profitLoss : item.currentValue)} đ
                                        </div>
                                        <div style={{ fontSize: 11.5, fontWeight: 600, color: isPos ? 'var(--accent)' : 'var(--neg)', marginTop: 2 }}>
                                            {isPos ? '▲' : '▼'} {Math.abs(item.profitLossPercent).toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
