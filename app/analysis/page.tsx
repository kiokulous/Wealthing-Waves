'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { getAllTransactions, getAllMarketPrices } from '@/lib/api/database'
import { calculatePeriodPerformance } from '@/lib/api/calculate_period_performance'
import type { PortfolioSummary } from '@/lib/api/portfolio'

const FILTERS = ['30 Ngày', '3 Tháng', '6 Tháng', '1 Năm', 'Toàn bộ']

const CAT_COLORS = [
    '#00c896', '#5b6bff', '#f59e0b', '#e879f9', '#38bdf8', '#f87171',
]

function formatVND(v: number) {
    if (Math.abs(v) >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + ' tỷ'
    if (Math.abs(v) >= 1_000_000)     return (v / 1_000_000).toFixed(1) + ' tr'
    return new Intl.NumberFormat('vi-VN').format(Math.round(v))
}

export default function AnalysisPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()

    const [allTransactions, setAllTransactions] = useState<any[]>([])
    const [allPrices, setAllPrices]             = useState<any[]>([])
    const [portfolio, setPortfolio]             = useState<PortfolioSummary | null>(null)
    const [loading, setLoading]                 = useState(true)
    const [filter, setFilter]                   = useState('Toàn bộ')

    useEffect(() => {
        if (!authLoading && !user) router.push('/login')
    }, [user, authLoading, router])

    useEffect(() => {
        if (user) loadData()
    }, [user])

    useEffect(() => {
        if (allTransactions.length > 0 && allPrices.length > 0) recalc()
    }, [filter, allTransactions, allPrices])

    const loadData = async () => {
        try {
            setLoading(true)
            const [txns, prices] = await Promise.all([getAllTransactions(), getAllMarketPrices()])
            setAllTransactions(txns)
            setAllPrices(prices)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const recalc = () => {
        const now = new Date()
        let startDate: Date | null = null
        switch (filter) {
            case '30 Ngày': startDate = new Date(new Date().setDate(now.getDate() - 30));     break
            case '3 Tháng': startDate = new Date(new Date().setMonth(now.getMonth() - 3));    break
            case '6 Tháng': startDate = new Date(new Date().setMonth(now.getMonth() - 6));    break
            case '1 Năm':   startDate = new Date(new Date().setFullYear(now.getFullYear() - 1)); break
            default:        startDate = null
        }
        setPortfolio(calculatePeriodPerformance(allTransactions, allPrices, startDate))
    }

    if (authLoading || (loading && !portfolio)) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: '50%', margin: '0 auto 12px',
                        border: '3px solid var(--accent)', borderTopColor: 'transparent',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                    <p style={{ color: 'var(--t-3)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Đang tính toán...</p>
                </div>
            </div>
        )
    }

    if (!portfolio || !user) return null

    // --- Derived data ---
    const total = portfolio.totalCurrentValue || 1

    const allocationData = portfolio.categories
        .filter(c => c.currentValue > 0)
        .map(c => ({ name: c.category, value: c.currentValue, pct: (c.currentValue / total) * 100 }))

    const profitData = portfolio.categories
        .filter(c => Math.abs(c.profitLoss) > 0)
        .sort((a, b) => b.profitLoss - a.profitLoss)

    const profitMax = Math.max(...profitData.map(c => Math.abs(c.profitLoss)), 1)

    const rankingData = portfolio.items
        .filter(i => i.currentValue > 0)
        .sort((a, b) => b.profitLossPercent - a.profitLossPercent)
        .slice(0, 10)

    const rankMax = Math.max(...rankingData.map(i => Math.abs(i.profitLossPercent)), 1)

    // Donut SVG params
    const R = 72, CX = 88, CY = 88, STROKE = 20
    const circum = 2 * Math.PI * R
    let offset = 0
    const arcs = allocationData.map((d, i) => {
        const dash = (d.pct / 100) * circum
        const arc  = { ...d, dash, offset, color: CAT_COLORS[i % CAT_COLORS.length] }
        offset += dash + 3
        return arc
    })

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--t-1)', margin: 0 }}>
                        Phân tích <span style={{ color: 'var(--accent)' }}>Nâng cao</span>
                    </h1>
                    <p style={{ color: 'var(--t-3)', fontSize: 13, marginTop: 4 }}>
                        Trực quan hóa cộng hưởng và hiệu suất danh mục của bạn.
                    </p>
                </div>

                {/* Segmented filter */}
                <div className="segmented" style={{ display: 'flex' }}>
                    {FILTERS.map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '6px 14px', fontSize: 12.5, fontWeight: 600,
                                borderRadius: 8, border: 'none', cursor: 'pointer',
                                transition: 'all .15s',
                                background: filter === f ? 'var(--accent)' : 'transparent',
                                color: filter === f ? '#062018' : 'var(--t-2)',
                            }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Two-column cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

                {/* Card 1 — Allocation Donut */}
                <div className="ww-card" style={{ padding: 24 }}>
                    <div className="label-cap" style={{ marginBottom: 20 }}>Phân bổ Danh mục</div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        {/* Donut */}
                        <div style={{ flexShrink: 0 }}>
                            <svg width={176} height={176} viewBox="0 0 176 176">
                                <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={STROKE} />
                                {arcs.map((arc, i) => (
                                    <circle
                                        key={i}
                                        cx={CX} cy={CY} r={R}
                                        fill="none"
                                        stroke={arc.color}
                                        strokeWidth={STROKE}
                                        strokeDasharray={`${arc.dash} ${circum}`}
                                        strokeDashoffset={-arc.offset}
                                        strokeLinecap="butt"
                                        transform={`rotate(-90 ${CX} ${CY})`}
                                    />
                                ))}
                                <text x={CX} y={CY - 6} textAnchor="middle" style={{ fill: 'var(--t-3)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>TỔNG</text>
                                <text x={CX} y={CY + 14} textAnchor="middle" style={{ fill: 'var(--t-1)', fontSize: 18, fontWeight: 700 }}>100%</text>
                            </svg>
                        </div>

                        {/* Legend bars */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {allocationData.map((d, i) => (
                                <div key={d.name}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 12, color: 'var(--t-2)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_COLORS[i % CAT_COLORS.length], display: 'inline-block' }} />
                                            {d.name}
                                        </span>
                                        <span style={{ fontSize: 12, color: 'var(--t-1)', fontWeight: 700 }}>{d.pct.toFixed(0)}%</span>
                                    </div>
                                    <div style={{ height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${d.pct}%`, borderRadius: 999, background: CAT_COLORS[i % CAT_COLORS.length] }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Card 2 — Category P&L bars */}
                <div className="ww-card" style={{ padding: 24 }}>
                    <div className="label-cap" style={{ marginBottom: 20 }}>Hiệu suất Danh mục</div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {profitData.map((cat, i) => {
                            const isPos = cat.profitLoss >= 0
                            const barW  = (Math.abs(cat.profitLoss) / profitMax) * 100
                            return (
                                <div key={cat.category} className="bar-row">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <span style={{ fontSize: 12.5, color: 'var(--t-2)', fontWeight: 500 }}>{cat.category}</span>
                                        <span className={isPos ? 'delta-pos' : 'delta-neg'}>
                                            {isPos ? '+' : ''}{formatVND(cat.profitLoss)} đ
                                        </span>
                                    </div>
                                    <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', width: `${barW}%`, borderRadius: 999,
                                            background: isPos ? 'var(--accent)' : 'var(--neg)',
                                            transition: 'width .4s ease',
                                        }} />
                                    </div>
                                </div>
                            )
                        })}

                        {profitData.length === 0 && (
                            <p style={{ color: 'var(--t-3)', fontSize: 13, textAlign: 'center', paddingTop: 32 }}>Chưa có dữ liệu hiệu suất</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Ranking table */}
            <div className="ww-card" style={{ padding: 24 }}>
                <div style={{ marginBottom: 20 }}>
                    <div className="label-cap">Xếp hạng Tốc độ Tài sản</div>
                    <p style={{ color: 'var(--t-3)', fontSize: 12.5, marginTop: 4 }}>
                        Top tài sản có hiệu suất tốt nhất trong giai đoạn đã chọn.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Table header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 160px 100px', gap: 12, padding: '0 8px 10px', borderBottom: '1px solid var(--line)' }}>
                        {['#', 'Mã tài sản', 'Tốc độ tăng trưởng', 'P&L'].map(h => (
                            <span key={h} style={{ fontSize: 11, color: 'var(--t-3)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</span>
                        ))}
                    </div>

                    {rankingData.map((item, idx) => {
                        const isPos = item.profitLossPercent >= 0
                        const barW  = (Math.abs(item.profitLossPercent) / rankMax) * 100
                        return (
                            <div
                                key={item.symbol}
                                style={{
                                    display: 'grid', gridTemplateColumns: '24px 1fr 160px 100px',
                                    gap: 12, padding: '12px 8px', borderRadius: 10,
                                    transition: 'background .15s',
                                    cursor: 'default',
                                }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                            >
                                {/* Rank */}
                                <span style={{ fontSize: 12, color: 'var(--t-3)', fontWeight: 700, alignSelf: 'center' }}>{idx + 1}</span>

                                {/* Symbol + name */}
                                <div style={{ alignSelf: 'center' }}>
                                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--t-1)' }}>{item.symbol}</div>
                                    <div style={{ fontSize: 11.5, color: 'var(--t-3)', marginTop: 1 }}>{item.category}</div>
                                </div>

                                {/* Progress bar + pct */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ flex: 1, height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', width: `${barW}%`, borderRadius: 999,
                                            background: isPos ? 'var(--accent)' : 'var(--neg)',
                                        }} />
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: isPos ? 'var(--accent)' : 'var(--neg)', minWidth: 44, textAlign: 'right' }}>
                                        {isPos ? '+' : ''}{item.profitLossPercent.toFixed(1)}%
                                    </span>
                                </div>

                                {/* P&L value */}
                                <div style={{ textAlign: 'right', alignSelf: 'center' }}>
                                    <span className={isPos ? 'delta-pos' : 'delta-neg'}>
                                        {isPos ? '+' : ''}{formatVND(item.profitLoss)} đ
                                    </span>
                                </div>
                            </div>
                        )
                    })}

                    {rankingData.length === 0 && (
                        <p style={{ color: 'var(--t-3)', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>Chưa có dữ liệu tài sản</p>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg) } }
            `}</style>
        </div>
    )
}
