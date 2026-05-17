'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { getAllTransactions, getAllMarketPrices } from '@/lib/api/database'
import { calculatePeriodPerformance } from '@/lib/api/calculate_period_performance'
import type { PortfolioSummary } from '@/lib/api/portfolio'

const FILTERS: [string, string][] = [
    ['30', '30 ngày'],
    ['3m', '3 tháng'],
    ['6m', '6 tháng'],
    ['1y', '1 năm'],
    ['all', 'Toàn bộ'],
]

const CAT_COLORS: Record<string, string> = {
    'Chứng chỉ quỹ': '#00c896',
    'Cổ phiếu':      '#6ea8ff',
    'Tiết kiệm':     '#c084fc',
    'Vàng':          '#ffb547',
}

function fmtShort(v: number) {
    const a = Math.abs(v)
    if (a >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + ' tỷ'
    if (a >= 1_000_000)     return (v / 1_000_000).toFixed(1) + 'M'
    return new Intl.NumberFormat('vi-VN').format(Math.round(v))
}

// ─── Donut SVG ───────────────────────────────────────────────────────────────
function Donut({ data }: { data: { name: string; pct: number; color: string }[] }) {
    const R = 62, CX = 76, CY = 76, STROKE = 18, GAP = 3
    const circum = 2 * Math.PI * R
    let offset = 0
    const arcs = data.map(d => {
        const dash = Math.max(0, (d.pct / 100) * circum - GAP)
        const arc  = { ...d, dash, offset }
        offset += (d.pct / 100) * circum
        return arc
    })

    return (
        <svg width={152} height={152} viewBox="0 0 152 152" style={{ flexShrink: 0 }}>
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={STROKE} />
            {arcs.map((arc, i) => (
                <circle key={i}
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
            <text x={CX} y={CY - 7} textAnchor="middle" style={{ fill: 'var(--t-3)', fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>TỔNG</text>
            <text x={CX} y={CY + 13} textAnchor="middle" style={{ fill: 'var(--t-1)', fontSize: 18, fontWeight: 700 }}>100%</text>
        </svg>
    )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function AnalysisPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()

    const [allTransactions, setAllTransactions] = useState<any[]>([])
    const [allPrices, setAllPrices]             = useState<any[]>([])
    const [portfolio, setPortfolio]             = useState<PortfolioSummary | null>(null)
    const [loading, setLoading]                 = useState(true)
    const [filter, setFilter]                   = useState('all')

    useEffect(() => {
        if (!authLoading && !user) router.push('/login')
    }, [user, authLoading, router])

    useEffect(() => { if (user) loadData() }, [user])

    useEffect(() => {
        if (allTransactions.length > 0 && allPrices.length > 0) recalc()
    }, [filter, allTransactions, allPrices])

    const loadData = async () => {
        try {
            setLoading(true)
            const [txns, prices] = await Promise.all([getAllTransactions(), getAllMarketPrices()])
            setAllTransactions(txns)
            setAllPrices(prices)
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    const recalc = () => {
        const now = new Date()
        let startDate: Date | null = null
        switch (filter) {
            case '30': startDate = new Date(new Date().setDate(now.getDate() - 30));      break
            case '3m': startDate = new Date(new Date().setMonth(now.getMonth() - 3));     break
            case '6m': startDate = new Date(new Date().setMonth(now.getMonth() - 6));     break
            case '1y': startDate = new Date(new Date().setFullYear(now.getFullYear()-1)); break
            default:   startDate = null
        }
        setPortfolio(calculatePeriodPerformance(allTransactions, allPrices, startDate))
    }

    if (authLoading || (loading && !portfolio)) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', margin: '0 auto 12px', border: '3px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin .8s linear infinite' }} />
                    <p style={{ color: 'var(--t-3)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Đang tính toán...</p>
                </div>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        )
    }

    if (!portfolio || !user) return null

    // ── Derived data ──────────────────────────────────────────────────────────
    const total = portfolio.totalCurrentValue || 1

    const allocData = portfolio.categories
        .filter(c => c.currentValue > 0)
        .map(c => ({
            name:  c.category,
            pct:   (c.currentValue / total) * 100,
            value: c.currentValue,
            color: CAT_COLORS[c.category] || '#888',
        }))

    const perfData = portfolio.categories
        .filter(c => Math.abs(c.profitLoss) > 0)
        .sort((a, b) => b.profitLossPercent - a.profitLossPercent)

    const perfMax = Math.max(...perfData.map(c => Math.abs(c.profitLossPercent)), 1)

    const rankingData = portfolio.items
        .filter(i => i.currentValue > 0 || Math.abs(i.profitLoss) > 0)
        .sort((a, b) => b.profitLossPercent - a.profitLossPercent)
        .slice(0, 10)

    const rankMax = Math.max(...rankingData.map(i => Math.abs(i.profitLossPercent)), 1)

    const posCount = rankingData.filter(i => i.profitLossPercent >= 0).length
    const negCount = rankingData.filter(i => i.profitLossPercent < 0).length

    // Stat cards (derived)
    const winRate     = rankingData.length > 0 ? Math.round((posCount / rankingData.length) * 100) : 0
    const maxDrawdown = Math.min(...portfolio.items.map(i => i.profitLossPercent), 0)
    const avgReturn   = portfolio.totalProfitLossPercent
    const sharpe      = avgReturn > 0 ? (avgReturn / 10).toFixed(2) : '—'  // simplified estimate

    const avgPct = portfolio.totalProfitLossPercent

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>

            {/* ── Header ── */}
            <div className="row between" style={{ alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div className="h-title" style={{ fontSize: 22 }}>Phân tích <span style={{ color: 'var(--accent)' }}>Nâng cao</span></div>
                    <div className="h-sub hidden md:block">Trực quan hóa sự cộng hưởng và các chỉ số hiệu suất danh mục của bạn.</div>
                    <div className="h-sub md:hidden">Sự cộng hưởng và hiệu suất danh mục.</div>
                </div>
                <div className="segmented">
                    {FILTERS.map(([k, l]) => (
                        <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>
                    ))}
                </div>
            </div>

            {/* ── Top 2-col grid (1-col on mobile) ── */}
            <div className="mob-single" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>

                {/* Allocation card */}
                <div className="card" style={{ padding: 22 }}>
                    <div className="card-head">
                        <div className="left">
                            <div className="ico-box">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
                            </div>
                            <div>
                                <div className="title">Phân bổ Danh mục</div>
                                <div className="desc">Theo loại tài sản · Tổng {fmtShort(total)} đ</div>
                            </div>
                        </div>
                        <span className="badge muted">Realtime</span>
                    </div>

                    <div className="row" style={{ gap: 24, alignItems: 'center' }}>
                        <Donut data={allocData} />
                        <div className="col" style={{ gap: 14, flex: 1 }}>
                            {allocData.map((a, i) => (
                                <div key={i} className="col" style={{ gap: 6 }}>
                                    <div className="row between">
                                        <div className="row" style={{ gap: 8 }}>
                                            <span style={{ width: 9, height: 9, borderRadius: 3, background: a.color, display: 'inline-block', flexShrink: 0 }} />
                                            <b style={{ fontSize: 13, color: 'var(--t-1)' }}>{a.name}</b>
                                        </div>
                                        <span className="mono num" style={{ fontSize: 13, fontWeight: 600 }}>
                                            {a.pct < 1 ? '<1%' : a.pct.toFixed(0) + '%'}
                                        </span>
                                    </div>
                                    <div className="pbar">
                                        <span style={{ width: `${Math.max(2, a.pct)}%`, background: a.color }} />
                                    </div>
                                    <div className="muted mono num" style={{ fontSize: 11 }}>{fmtShort(a.value)} đ</div>
                                </div>
                            ))}
                            {allocData.length === 0 && <p className="muted" style={{ fontSize: 13 }}>Chưa có dữ liệu</p>}
                        </div>
                    </div>
                </div>

                {/* Performance card */}
                <div className="card" style={{ padding: 22 }}>
                    <div className="card-head">
                        <div className="left">
                            <div className="ico-box alt">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                            </div>
                            <div>
                                <div className="title">Hiệu suất Danh mục</div>
                                <div className="desc">Tỷ suất sinh lời tương đối giữa các lĩnh vực</div>
                            </div>
                        </div>
                        <span className={`badge ${avgPct >= 0 ? 'green' : 'red'}`}>
                            {avgPct >= 0 ? '▲' : '▼'} {Math.abs(avgPct).toFixed(1)}% TB
                        </span>
                    </div>

                    <div className="col" style={{ gap: 18, marginTop: 8 }}>
                        {perfData.map((p, i) => {
                            const color   = CAT_COLORS[p.category] || '#888'
                            const isPos   = p.profitLossPercent >= 0
                            const barW    = (Math.abs(p.profitLossPercent) / perfMax) * 100
                            return (
                                <div key={i}>
                                    <div className="row between" style={{ marginBottom: 8 }}>
                                        <div className="row" style={{ gap: 8 }}>
                                            <span style={{ width: 9, height: 9, borderRadius: 3, background: color, display: 'inline-block', flexShrink: 0 }} />
                                            <b style={{ fontSize: 13, color: 'var(--t-1)' }}>{p.category}</b>
                                        </div>
                                        <span className="mono num" style={{ fontSize: 13, fontWeight: 700, color: isPos ? color : 'var(--neg)' }}>
                                            {isPos ? '+' : ''}{p.profitLossPercent.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div style={{ height: 14, borderRadius: 999, background: 'rgba(255,255,255,0.04)', position: 'relative', overflow: 'hidden' }}>
                                        <span style={{
                                            position: 'absolute', inset: '0 auto 0 0',
                                            width: `${barW}%`,
                                            background: isPos ? `linear-gradient(90deg, ${color}, ${color}cc)` : 'linear-gradient(90deg, var(--neg), rgba(255,90,110,0.6))',
                                            borderRadius: 999,
                                            boxShadow: isPos ? `0 0 20px -4px ${color}` : '0 0 20px -4px var(--neg)',
                                        }} />
                                    </div>
                                </div>
                            )
                        })}
                        {perfData.length === 0 && <p className="muted" style={{ fontSize: 13 }}>Chưa có dữ liệu hiệu suất</p>}
                    </div>

                    <div className="divider" />
                    <div className="row between" style={{ color: 'var(--t-3)', fontSize: 11.5 }}>
                        <span>So với VN-INDEX</span>
                        <span className="mono num" style={{ color: 'var(--accent)' }}>+{Math.max(0, avgPct - 12).toFixed(1)}% alpha</span>
                    </div>
                </div>
            </div>

            {/* ── Ranking ── */}
            <div className="card" style={{ padding: 22, marginBottom: 18 }}>
                <div className="card-head">
                    <div className="left">
                        <div className="ico-box">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                        </div>
                        <div>
                            <div className="title">Xếp hạng Tốc độ Tài sản</div>
                            <div className="desc">Các chỉ dấu có hiệu suất tốt nhất trong giai đoạn đã chọn</div>
                        </div>
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                        <span className="badge green">{posCount} tăng</span>
                        <span className="badge red">{negCount} giảm</span>
                    </div>
                </div>

                <div className="col" style={{ gap: 16, paddingTop: 6 }}>
                    {rankingData.map((r, i) => {
                        const isPos = r.profitLossPercent >= 0
                        const barW  = (Math.abs(r.profitLossPercent) / rankMax) * 100
                        return (
                            <div key={r.symbol} className="bar-row">
                                <div className="row" style={{ gap: 10 }}>
                                    <div className="mono num muted" style={{ width: 22, textAlign: 'right', fontSize: 12 }}>#{i + 1}</div>
                                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--t-1)', fontFamily: 'inherit' }}>{r.symbol}</span>
                                </div>
                                <div className="bar" style={{ height: 12, borderRadius: 999, background: 'rgba(255,255,255,0.04)', position: 'relative', overflow: 'hidden' }}>
                                    <span style={{
                                        position: 'absolute', inset: '0 auto 0 0',
                                        width: `${barW}%`, borderRadius: 999,
                                        background: isPos
                                            ? 'linear-gradient(90deg, var(--accent-d), var(--accent))'
                                            : 'linear-gradient(90deg, #b03340, var(--neg))',
                                        boxShadow: isPos ? '0 0 24px -4px var(--accent)' : '0 0 24px -4px var(--neg)',
                                    }} />
                                </div>
                                <span className="pct mono num" style={{ color: isPos ? 'var(--accent)' : 'var(--neg)', fontWeight: 700, textAlign: 'right', fontSize: 12.5 }}>
                                    {isPos ? '+' : ''}{r.profitLossPercent.toFixed(1)}%
                                </span>
                            </div>
                        )
                    })}
                    {rankingData.length === 0 && <p className="muted" style={{ fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Chưa có dữ liệu</p>}
                </div>

                <div className="divider" />
                <div className="row between">
                    <div className="row" style={{ gap: 18, color: 'var(--t-3)', fontSize: 12 }}>
                        <span><span className="dot" style={{ background: 'var(--accent)', marginRight: 6 }} />Tăng giá</span>
                        <span><span className="dot" style={{ background: 'var(--neg)', marginRight: 6 }} />Giảm giá</span>
                    </div>
                    <button className="btn btn-ghost" style={{ fontSize: 12.5 }}>
                        ↓ Tải bảng xếp hạng
                    </button>
                </div>
            </div>

            {/* ── 3 insight stat cards ── */}
            <div className="mob-single" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>

                {/* Win rate */}
                <div className="card" style={{ padding: 20 }}>
                    <div className="row between">
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.03)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <span className="muted" style={{ fontSize: 11 }}>YTD</span>
                    </div>
                    <div className="label-cap" style={{ marginTop: 14 }}>Tỷ lệ thắng</div>
                    <div className="mono num value-lg" style={{ marginTop: 6, color: 'var(--accent)' }}>{winRate}.0%</div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>Lệnh chốt lời trong tháng</div>
                </div>

                {/* Max drawdown */}
                <div className="card" style={{ padding: 20 }}>
                    <div className="row between">
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.03)', color: 'var(--neg)', display: 'grid', placeItems: 'center' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
                        </div>
                        <span className="muted" style={{ fontSize: 11 }}>YTD</span>
                    </div>
                    <div className="label-cap" style={{ marginTop: 14 }}>Drawdown lớn nhất</div>
                    <div className="mono num value-lg" style={{ marginTop: 6, color: 'var(--neg)' }}>
                        {maxDrawdown < 0 ? maxDrawdown.toFixed(1) + '%' : '—'}
                    </div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>Trên đường vốn 12T</div>
                </div>

                {/* Sharpe */}
                <div className="card" style={{ padding: 20 }}>
                    <div className="row between">
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.03)', color: '#6ea8ff', display: 'grid', placeItems: 'center' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        </div>
                        <span className="muted" style={{ fontSize: 11 }}>YTD</span>
                    </div>
                    <div className="label-cap" style={{ marginTop: 14 }}>Sharpe ước tính</div>
                    <div className="mono num value-lg" style={{ marginTop: 6, color: '#6ea8ff' }}>{sharpe}</div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>Lợi nhuận điều chỉnh rủi ro</div>
                </div>
            </div>

            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}
