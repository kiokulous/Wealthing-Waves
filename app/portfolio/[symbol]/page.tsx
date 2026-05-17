'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { getAllTransactions, getAllMarketPrices } from '@/lib/api/database'
import { calculateSymbolDetail } from '@/lib/api/portfolio'
import type { Transaction } from '@/lib/supabase'

// ─── Sparkline SVG ────────────────────────────────────────────────────────────
function Sparkline({ data, color = 'var(--accent)' }: { data: number[]; color?: string }) {
    if (!data || data.length < 2) return null
    const w = 400, h = 80
    const min = Math.min(...data), max = Math.max(...data)
    const range = max - min || 1
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w
        const y = h - ((v - min) / range) * h * 0.8 - h * 0.1
        return `${x},${y}`
    })
    const areaPath = `M${pts[0]} L${pts.join(' L')} L${w},${h} L0,${h} Z`
    return (
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 72, display: 'block' }}>
            <defs>
                <linearGradient id={`sg-${color.replace(/[^a-z0-9]/gi,'')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#sg-${color.replace(/[^a-z0-9]/gi,'')})`} />
            <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function fmtFull(v: number) { return new Intl.NumberFormat('vi-VN').format(Math.round(v)) }
function fmtDate(s: string)  { return new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) }

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PortfolioDetailPage() {
    const params = useParams()
    const symbol = typeof params.symbol === 'string' ? decodeURIComponent(params.symbol) : ''
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()

    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [marketPrices, setMarketPrices] = useState<any[]>([])
    const [loading, setLoading]           = useState(true)
    const [filterYear, setFilterYear]     = useState<number | 'all'>('all')
    const [detail, setDetail]             = useState<any>(null)
    const [availableYears, setAvailableYears] = useState<number[]>([])

    useEffect(() => {
        if (!authLoading && !user) router.push('/login')
    }, [user, authLoading, router])

    useEffect(() => {
        if (user && symbol) loadData()
    }, [user, symbol])

    useEffect(() => {
        if (transactions.length > 0) recalc()
    }, [transactions, marketPrices, filterYear])

    const loadData = async () => {
        try {
            setLoading(true)
            const [txns, prices] = await Promise.all([getAllTransactions(), getAllMarketPrices()])
            setTransactions(txns)
            setMarketPrices(prices)
            const years = Array.from(new Set(txns.filter(t => t.symbol === symbol).map(t => new Date(t.date).getFullYear())))
                .filter(y => !isNaN(y)).sort((a, b) => b - a)
            setAvailableYears(years)
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    const recalc = () => {
        const year = filterYear === 'all' ? undefined : filterYear
        setDetail(calculateSymbolDetail(symbol, transactions, marketPrices, year))
    }

    if (authLoading || (loading && !detail)) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', margin: '0 auto 12px', border: '3px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin .8s linear infinite' }} />
                    <p style={{ color: 'var(--t-3)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Phân tích tín hiệu...</p>
                </div>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        )
    }

    if (!detail) return null

    const isProfit       = detail.totalPL >= 0
    const accentColor    = isProfit ? 'var(--accent)' : 'var(--neg)'
    const sparkPrices    = (detail.priceHistory || []).map((p: any) => p.price)

    const statCards = [
        { label: 'Vị thế hoạt động', value: detail.quantity.toLocaleString('vi-VN'), unit: 'Đơn vị', desc: 'Hiện có trong danh mục' },
        { label: 'Vốn đầu tư',        value: fmtFull(detail.invested),                unit: 'đ',      desc: 'Tổng giá vốn' },
        { label: 'Giai đoạn nắm giữ', value: detail.holdingDays,                      unit: 'Ngày',   desc: 'Kể từ lần mua đầu tiên' },
        { label: 'Điểm vào ban đầu',  value: detail.firstBuyDate ? fmtDate(detail.firstBuyDate) : '—', unit: '', desc: 'Ngày mua đầu tiên' },
    ]

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 60 }}>

            {/* ── Header ── */}
            <div className="row between" style={{ alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div className="row" style={{ gap: 14 }}>
                    <button
                        onClick={() => router.back()}
                        className="btn btn-ghost"
                        style={{ width: 40, height: 40, padding: 0, borderRadius: 12, display: 'grid', placeItems: 'center' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--t-1)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                            {symbol}
                        </div>
                        <div className="label-cap" style={{ marginTop: 4 }}>Hồ sơ Cộng hưởng Tài sản</div>
                    </div>
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

            {/* ── Hero grid: P&L + sparkline (left wide) + 4 stat cards (right) ── */}
            <div className="mob-single" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 18, marginBottom: 18 }}>

                {/* P&L hero card */}
                <div className="card" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
                    <div className="row between" style={{ alignItems: 'flex-start', marginBottom: 4 }}>
                        <div>
                            <div className="label-cap">Hiệu suất ròng</div>
                            <div className="mono num value-xl" style={{ color: accentColor, marginTop: 10 }}>
                                {isProfit ? '+' : ''}{fmtFull(detail.totalPL)}
                                <span style={{ color: 'var(--t-3)', fontSize: 22, fontWeight: 500, marginLeft: 6 }}>đ</span>
                            </div>
                            <div className="row" style={{ gap: 8, marginTop: 10 }}>
                                <span className={`delta ${isProfit ? 'pos' : 'neg'}`}>
                                    {isProfit ? '▲' : '▼'} {Math.abs(detail.plPercent).toFixed(2)}% ROI
                                </span>
                                <span className="muted" style={{ fontSize: 12.5 }}>
                                    Giá hiện tại: {fmtFull(detail.currentPrice || 0)} đ
                                </span>
                            </div>
                        </div>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: isProfit ? 'var(--accent-12)' : 'var(--neg-12)', color: accentColor, display: 'grid', placeItems: 'center' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                {isProfit
                                    ? <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>
                                    : <><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></>}
                            </svg>
                        </div>
                    </div>

                    {/* Sparkline */}
                    {sparkPrices.length >= 2 && (
                        <div style={{ marginTop: 16, marginLeft: -8, marginRight: -8 }}>
                            <Sparkline data={sparkPrices} color={accentColor} />
                        </div>
                    )}
                </div>

                {/* 2×2 stat grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {statCards.map((s, i) => (
                        <div key={i} className="card" style={{ padding: 18 }}>
                            <div className="label-cap" style={{ marginBottom: 10 }}>{s.label}</div>
                            <div className="mono num" style={{ fontSize: 22, fontWeight: 700, color: 'var(--t-1)', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                                {s.value}
                                {s.unit && <span style={{ color: 'var(--t-3)', fontSize: 13, fontWeight: 500, marginLeft: 5 }}>{s.unit}</span>}
                            </div>
                            <div className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>{s.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Quick summary bar ── */}
            <div className="card" style={{ padding: '14px 20px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                {[
                    { label: 'Giá trị hiện tại', value: fmtFull(detail.currentValue || 0) + ' đ', color: 'var(--t-1)' },
                    { label: 'Lợi nhuận đã thực hiện', value: fmtFull(detail.realized || 0) + ' đ', color: detail.realized >= 0 ? 'var(--accent)' : 'var(--neg)' },
                    { label: 'Tổng giao dịch', value: detail.transactions.length + ' lệnh', color: 'var(--t-1)' },
                    { label: 'Danh mục', value: detail.category || '—', color: 'var(--t-2)' },
                ].map((item, i) => (
                    <div key={i}>
                        <div className="label-cap">{item.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: item.color, marginTop: 3 }}>{item.value}</div>
                    </div>
                ))}
            </div>

            {/* ── Transaction history table ── */}
            <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div className="title" style={{ fontSize: 15, fontWeight: 600, color: 'var(--t-1)' }}>Lịch sử Tín hiệu</div>
                        <div className="desc muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                            Nhật ký chi tiết tất cả giao dịch cho <b style={{ color: 'var(--t-1)' }}>{symbol}</b>
                        </div>
                    </div>
                    <div className="ico-box alt">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    </div>
                </div>

                {detail.transactions.length === 0 ? (
                    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                        <p className="muted" style={{ fontSize: 13 }}>Không tìm thấy giao dịch nào.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Ngày</th>
                                    <th>Loại</th>
                                    <th style={{ textAlign: 'right' }}>Số lượng</th>
                                    <th style={{ textAlign: 'right' }}>Đơn giá</th>
                                    <th style={{ textAlign: 'right' }}>Phí</th>
                                    <th style={{ textAlign: 'right' }}>Tổng tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detail.transactions.map((t: Transaction) => {
                                    const isBuy = t.type === 'Mua'
                                    return (
                                        <tr key={t.id}>
                                            <td className="num-cell" style={{ color: 'var(--t-2)' }}>{fmtDate(t.date)}</td>
                                            <td>
                                                {isBuy
                                                    ? <span className="badge green">
                                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                                                        Mua
                                                      </span>
                                                    : <span className="badge red">
                                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
                                                        Bán
                                                      </span>
                                                }
                                            </td>
                                            <td className="num-cell" style={{ textAlign: 'right' }}>
                                                {t.quantity.toLocaleString('vi-VN')}
                                            </td>
                                            <td className="num-cell" style={{ textAlign: 'right', color: 'var(--t-2)' }}>
                                                {fmtFull(t.price)}
                                            </td>
                                            <td className="num-cell" style={{ textAlign: 'right', color: t.fee ? 'var(--t-2)' : 'var(--t-4)' }}>
                                                {t.fee ? fmtFull(t.fee) : '—'}
                                            </td>
                                            <td className="num-cell" style={{ textAlign: 'right', fontWeight: 700, color: isBuy ? 'var(--accent)' : 'var(--neg)' }}>
                                                {fmtFull(t.total_money)} đ
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}
