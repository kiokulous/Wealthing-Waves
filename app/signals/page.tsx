'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import {
    getWatchlist, addToWatchlist, removeFromWatchlist,
    getAllMarketPrices, getAllTransactions,
} from '@/lib/api/database'
import type { Watchlist, MarketPrice, Transaction } from '@/lib/supabase'
import { TrendingUp, TrendingDown, Minus, Plus, Trash2, RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react'

// ─── Signal engine ────────────────────────────────────────────────────────────

type Signal = 'BUY_MORE' | 'HOLD' | 'WATCH' | 'CONSIDER_CUT'

type SignalResult = {
    signal: Signal
    label: string
    color: string
    bgColor: string
    borderColor: string
    icon: React.ReactNode
    reasons: string[]
    confidence: 'cao' | 'trung bình' | 'thấp'
}

// Loại tài sản dùng volume (chỉ cổ phiếu)
const VOLUME_CATEGORIES = ['Cổ phiếu']

function calcMA(prices: number[], period: number): number | null {
    if (prices.length < period) return null
    const slice = prices.slice(0, period)
    return slice.reduce((a, b) => a + b, 0) / period
}

function calcMomentum(prices: number[], days: number): number | null {
    if (prices.length <= days) return null
    return ((prices[0] - prices[days]) / prices[days]) * 100
}

function calcAvgVolume(volumes: (number | null)[], period: number): number | null {
    const valid = volumes.slice(0, period).filter((v): v is number => v !== null && v > 0)
    if (valid.length < Math.ceil(period * 0.5)) return null // cần ít nhất 50% phiên có data
    return valid.reduce((a, b) => a + b, 0) / valid.length
}

function fmtVol(v: number): string {
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M'
    if (v >= 1_000)     return (v / 1_000).toFixed(0) + 'K'
    return v.toString()
}

function computeSignal(
    closes: number[],              // newest first
    avgBuyPrice: number | null,
    volumes: (number | null)[],    // newest first, chỉ có giá trị với Cổ phiếu
    useVolume: boolean,            // true chỉ khi category là Cổ phiếu
): SignalResult {
    const reasons: string[] = []
    let score = 0

    const current  = closes[0]
    const ma5      = calcMA(closes, 5)
    const ma20     = calcMA(closes, 20)
    const mom5     = calcMomentum(closes, 5)
    const mom10    = calcMomentum(closes, 10)
    const volNow   = useVolume ? (volumes[0] ?? null) : null
    const avgVol20 = useVolume ? calcAvgVolume(volumes, 20) : null
    const hasVol   = useVolume && volNow !== null && avgVol20 !== null

    // — Trend: MA5 vs MA20
    if (ma5 !== null && ma20 !== null) {
        if (ma5 > ma20) {
            score += 2
            reasons.push(`MA5 (${ma5.toFixed(1)}) > MA20 (${ma20.toFixed(1)}) — xu hướng tăng`)
        } else {
            score -= 2
            reasons.push(`MA5 (${ma5.toFixed(1)}) < MA20 (${ma20.toFixed(1)}) — xu hướng giảm`)
        }
    }

    // — Short momentum (5 phiên)
    if (mom5 !== null) {
        if (mom5 > 3) {
            score += 1
            reasons.push(`Tăng ${mom5.toFixed(1)}% trong 5 phiên`)
        } else if (mom5 < -5) {
            score -= 2
            reasons.push(`Giảm ${Math.abs(mom5).toFixed(1)}% trong 5 phiên`)
        } else if (mom5 < -2) {
            score -= 1
            reasons.push(`Điều chỉnh nhẹ ${mom5.toFixed(1)}% trong 5 phiên`)
        }
    }

    // — Medium momentum (10 phiên)
    if (mom10 !== null) {
        if (mom10 > 5) {
            score += 1
            reasons.push(`Tăng ${mom10.toFixed(1)}% trong 10 phiên`)
        } else if (mom10 < -8) {
            score -= 2
            reasons.push(`Giảm mạnh ${Math.abs(mom10).toFixed(1)}% trong 10 phiên`)
        }
    }

    // — Volume signals (chỉ áp dụng cho Cổ phiếu)
    if (hasVol && avgVol20 !== null && volNow !== null) {
        const volRatio = volNow / avgVol20

        if (mom5 !== null && mom5 > 2 && volRatio >= 1.5) {
            // Breakout thật: giá tăng + volume bùng nổ
            score += 2
            reasons.push(`🔥 Breakout xác nhận: vol ${fmtVol(volNow)} gấp ${volRatio.toFixed(1)}x TB20 — dòng tiền thật`)
        } else if (mom5 !== null && mom5 > 2 && volRatio < 0.7) {
            // Bull trap: giá tăng nhưng vol èo uột
            score -= 2
            reasons.push(`⚠️ Bull trap nghi ngờ: giá tăng ${mom5.toFixed(1)}% nhưng vol chỉ ${fmtVol(volNow)} (${(volRatio * 100).toFixed(0)}% TB20) — thiếu xác nhận`)
        } else if (mom5 !== null && mom5 < -2 && volRatio >= 1.5) {
            // Breakdown thật: giá giảm + volume lớn = bán tháo thật
            score -= 2
            reasons.push(`🚨 Bán tháo: vol ${fmtVol(volNow)} gấp ${volRatio.toFixed(1)}x TB20 trong phiên giảm — áp lực lớn`)
        } else if (mom5 !== null && mom5 < -2 && volRatio < 0.6) {
            // Giảm vol cạn dần về support → tín hiệu tích cực
            score += 1
            reasons.push(`✅ Điều chỉnh lành mạnh: vol cạn (${fmtVol(volNow)}, ${(volRatio * 100).toFixed(0)}% TB20) — phe bán mệt dần`)
        } else {
            reasons.push(`Vol hiện tại: ${fmtVol(volNow)} (${(volRatio * 100).toFixed(0)}% so với TB20)`)
        }
    } else if (useVolume) {
        reasons.push(`Chưa có đủ dữ liệu volume để xác nhận tín hiệu`)
    }

    // — P&L từ giá mua
    if (avgBuyPrice !== null && avgBuyPrice > 0) {
        const pnlPct = ((current - avgBuyPrice) / avgBuyPrice) * 100
        if (pnlPct <= -7) {
            score -= 3
            reasons.push(`Đang lỗ ${Math.abs(pnlPct).toFixed(1)}% từ giá mua — vượt ngưỡng cắt lỗ 7%`)
        } else if (pnlPct < -3) {
            score -= 1
            reasons.push(`Đang lỗ ${Math.abs(pnlPct).toFixed(1)}% từ giá mua`)
        } else if (pnlPct > 15) {
            score += 1
            reasons.push(`Đang lời ${pnlPct.toFixed(1)}% — cân nhắc chốt một phần`)
        } else if (pnlPct > 0) {
            reasons.push(`Đang lời ${pnlPct.toFixed(1)}% từ giá mua`)
        }
    }

    // — Data quality warning
    const dataQuality = closes.length
    if (dataQuality < 5) {
        reasons.push(`⚠️ Chỉ có ${dataQuality} phiên dữ liệu — tín hiệu kém chính xác`)
    }

    // — Confidence: volume nâng cao độ tin cậy
    const volCoverage = useVolume
        ? volumes.slice(0, 20).filter((v): v is number => v !== null && v > 0).length
        : 0
    const confidence: 'cao' | 'trung bình' | 'thấp' =
        (dataQuality >= 20 && (!useVolume || volCoverage >= 10)) ? 'cao'
        : dataQuality >= 10 ? 'trung bình'
        : 'thấp'

    if (score <= -4) {
        return {
            signal: 'CONSIDER_CUT', label: 'Xem xét cắt', confidence,
            color: 'var(--neg)', bgColor: 'var(--neg-12)',
            borderColor: 'rgba(255,90,110,0.25)',
            icon: <TrendingDown size={14} />, reasons,
        }
    }
    if (score <= -1) {
        return {
            signal: 'WATCH', label: 'Theo dõi', confidence,
            color: '#ffb547', bgColor: 'rgba(255,181,71,0.1)',
            borderColor: 'rgba(255,181,71,0.25)',
            icon: <AlertTriangle size={14} />, reasons,
        }
    }
    if (score >= 3) {
        return {
            signal: 'BUY_MORE', label: 'Mua thêm', confidence,
            color: 'var(--accent)', bgColor: 'var(--accent-12)',
            borderColor: 'var(--accent-18)',
            icon: <TrendingUp size={14} />, reasons,
        }
    }
    return {
        signal: 'HOLD', label: 'Giữ', confidence,
        color: '#6ea8ff', bgColor: 'rgba(110,168,255,0.1)',
        borderColor: 'rgba(110,168,255,0.25)',
        icon: <Minus size={14} />, reasons,
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORIES = ['Cổ phiếu', 'Chứng chỉ quỹ', 'Vàng', 'Tiết kiệm']

function fmtPrice(v: number) {
    return new Intl.NumberFormat('vi-VN').format(Math.round(v))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SignalBadge({ result }: { result: SignalResult }) {
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 8,
            background: result.bgColor, border: `1px solid ${result.borderColor}`,
            color: result.color, fontWeight: 700, fontSize: 12,
            whiteSpace: 'nowrap',
        }}>
            {result.icon}
            {result.label}
        </span>
    )
}

function ConfidenceDot({ level }: { level: 'cao' | 'trung bình' | 'thấp' }) {
    const color = level === 'cao' ? 'var(--accent)' : level === 'trung bình' ? '#ffb547' : 'var(--t-4)'
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--t-3)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
            Độ tin cậy: <span style={{ color }}>{level}</span>
        </span>
    )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SignalsPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()

    const [watchlist, setWatchlist]       = useState<Watchlist[]>([])
    const [allPrices, setAllPrices]       = useState<MarketPrice[]>([])
    const [allTxns, setAllTxns]           = useState<Transaction[]>([])
    const [loading, setLoading]           = useState(true)
    const [expandedRow, setExpandedRow]   = useState<string | null>(null)

    // Add form
    const [addSymbol, setAddSymbol]       = useState('')
    const [addCategory, setAddCategory]   = useState('Cổ phiếu')
    const [adding, setAdding]             = useState(false)
    const [addError, setAddError]         = useState('')

    useEffect(() => {
        if (!authLoading && !user) router.push('/login')
    }, [user, authLoading, router])

    const loadData = useCallback(async () => {
        try {
            setLoading(true)
            const [wl, prices, txns] = await Promise.all([
                getWatchlist(),
                getAllMarketPrices(),
                getAllTransactions(),
            ])
            setWatchlist(wl)
            setAllPrices(prices)
            setAllTxns(txns)
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { if (user) loadData() }, [user, loadData])

    // ── Derived: signal per symbol ──────────────────────────────────────────
    const signalMap = React.useMemo(() => {
        const map = new Map<string, {
            signal: SignalResult
            closes: number[]
            latestPrice: number | null
            avgBuyPrice: number | null
            holdingQty: number
        }>()

        for (const item of watchlist) {
            const sym = item.symbol

            // Price history for this symbol, sorted newest first
            const priceHistory = allPrices
                .filter(p => p.symbol === sym)
                .sort((a, b) => b.date.localeCompare(a.date))
            const closes  = priceHistory.map(p => p.price)
            const volumes = priceHistory.map(p => p.volume ?? null)
            const latestPrice = closes[0] ?? null

            // Chỉ dùng volume cho Cổ phiếu
            const useVolume = VOLUME_CATEGORIES.includes(item.category)

            // Avg buy price from transactions
            let totalCost = 0, totalQty = 0
            for (const t of allTxns) {
                if (t.symbol !== sym) continue
                if (t.type === 'Mua') {
                    totalCost += t.price * t.quantity + (t.fee || 0)
                    totalQty  += t.quantity
                } else if (t.type === 'Chốt' || t.type === 'Bán') {
                    totalQty  -= t.quantity
                }
            }
            const holdingQty  = Math.max(0, totalQty)
            const avgBuyPrice = holdingQty > 0 && totalCost > 0
                ? totalCost / (holdingQty + (totalQty < 0 ? Math.abs(totalQty) : 0))
                : null

            const signal = computeSignal(closes, avgBuyPrice, volumes, useVolume)
            map.set(sym, { signal, closes, latestPrice, avgBuyPrice, holdingQty })
        }
        return map
    }, [watchlist, allPrices, allTxns])

    // ── Add symbol ──────────────────────────────────────────────────────────
    const handleAdd = async () => {
        const sym = addSymbol.trim().toUpperCase()
        if (!sym) return
        if (watchlist.find(w => w.symbol === sym)) {
            setAddError('Mã này đã có trong danh sách')
            return
        }
        try {
            setAdding(true)
            setAddError('')
            await addToWatchlist(sym, addCategory)
            setAddSymbol('')
            await loadData()
        } catch (err: any) {
            setAddError(err.message || 'Lỗi thêm mã')
        } finally { setAdding(false) }
    }

    const handleRemove = async (symbol: string) => {
        await removeFromWatchlist(symbol)
        await loadData()
    }

    // ── Signal summary counts ───────────────────────────────────────────────
    const counts = React.useMemo(() => {
        let buy = 0, hold = 0, watch = 0, cut = 0
        for (const [, v] of signalMap) {
            if (v.signal.signal === 'BUY_MORE')     buy++
            else if (v.signal.signal === 'HOLD')    hold++
            else if (v.signal.signal === 'WATCH')   watch++
            else                                    cut++
        }
        return { buy, hold, watch, cut }
    }, [signalMap])

    if (authLoading || loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', margin: '0 auto 12px', border: '3px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin .8s linear infinite' }} />
                    <p style={{ color: 'var(--t-3)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Đang tính tín hiệu...</p>
                </div>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        )
    }

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

            {/* ── Header ── */}
            <div style={{ marginBottom: 24 }}>
                <div className="h-title" style={{ fontSize: 22 }}>
                    Tín hiệu <span style={{ color: 'var(--accent)' }}>Giao dịch</span>
                </div>
                <div className="h-sub">
                    Phân tích xu hướng và đưa ra gợi ý hành động dựa trên lịch sử giá của bạn.
                </div>
            </div>

            {/* ── Summary strip ── */}
            {watchlist.length > 0 && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                    {[
                        { label: 'Mua thêm', count: counts.buy,   color: 'var(--accent)', bg: 'var(--accent-12)', border: 'var(--accent-18)' },
                        { label: 'Giữ',      count: counts.hold,  color: '#6ea8ff',       bg: 'rgba(110,168,255,0.1)', border: 'rgba(110,168,255,0.2)' },
                        { label: 'Theo dõi', count: counts.watch, color: '#ffb547',       bg: 'rgba(255,181,71,0.1)', border: 'rgba(255,181,71,0.2)' },
                        { label: 'Xem xét cắt', count: counts.cut, color: 'var(--neg)', bg: 'var(--neg-12)', border: 'rgba(255,90,110,0.2)' },
                    ].map(s => (
                        <div key={s.label} style={{
                            padding: '8px 16px', borderRadius: 10,
                            background: s.bg, border: `1px solid ${s.border}`,
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            <span style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.count}</span>
                            <span style={{ fontSize: 12, color: 'var(--t-2)' }}>{s.label}</span>
                        </div>
                    ))}
                    <button
                        onClick={loadData}
                        style={{
                            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 14px', borderRadius: 10,
                            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)',
                            color: 'var(--t-2)', fontSize: 12, cursor: 'pointer',
                        }}
                    >
                        <RefreshCw size={13} /> Làm mới
                    </button>
                </div>
            )}

            {/* ── Signal table ── */}
            {watchlist.length === 0 ? (
                <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                    <div style={{ color: 'var(--t-2)', fontWeight: 600, marginBottom: 8 }}>Danh sách theo dõi trống</div>
                    <div style={{ color: 'var(--t-4)', fontSize: 13 }}>Thêm mã chứng khoán bên dưới để bắt đầu nhận tín hiệu.</div>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
                    {/* Table header */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '90px 1fr 110px 110px 130px 100px 44px',
                        gap: 0, padding: '10px 18px',
                        borderBottom: '1px solid var(--line)',
                        background: 'rgba(255,255,255,0.02)',
                    }}>
                        {['Mã', 'Loại', 'Giá hiện tại', 'Giá mua TB', 'Lời/Lỗ', 'Tín hiệu', ''].map((h, i) => (
                            <div key={i} style={{ fontSize: 11, color: 'var(--t-4)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</div>
                        ))}
                    </div>

                    {watchlist.map((item, idx) => {
                        const data     = signalMap.get(item.symbol)
                        const isExpanded = expandedRow === item.symbol
                        const latestPrice = data?.latestPrice ?? null
                        const avgBuy   = data?.avgBuyPrice ?? null
                        const pnlPct   = (latestPrice && avgBuy)
                            ? ((latestPrice - avgBuy) / avgBuy) * 100
                            : null
                        const isLast = idx === watchlist.length - 1

                        return (
                            <React.Fragment key={item.symbol}>
                                {/* Main row */}
                                <div
                                    onClick={() => setExpandedRow(isExpanded ? null : item.symbol)}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '90px 1fr 110px 110px 130px 100px 44px',
                                        gap: 0, padding: '14px 18px',
                                        borderBottom: isLast && !isExpanded ? 'none' : '1px solid var(--line)',
                                        cursor: 'pointer',
                                        background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent',
                                        transition: 'background .15s',
                                    }}
                                    onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.015)' }}
                                    onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                                >
                                    {/* Mã */}
                                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--t-1)', fontFamily: 'monospace', letterSpacing: '0.04em', alignSelf: 'center' }}>
                                        {item.symbol}
                                    </div>

                                    {/* Loại */}
                                    <div style={{ fontSize: 12, color: 'var(--t-3)', alignSelf: 'center' }}>
                                        {item.category}
                                        {data && data.holdingQty > 0 && (
                                            <span style={{ marginLeft: 8, fontSize: 10.5, color: 'var(--accent)', background: 'var(--accent-12)', padding: '2px 6px', borderRadius: 5 }}>
                                                {data.holdingQty} cp
                                            </span>
                                        )}
                                    </div>

                                    {/* Giá hiện tại */}
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-1)', fontVariantNumeric: 'tabular-nums', alignSelf: 'center' }}>
                                        {latestPrice ? `${fmtPrice(latestPrice)} đ` : <span style={{ color: 'var(--t-4)' }}>—</span>}
                                    </div>

                                    {/* Giá mua TB */}
                                    <div style={{ fontSize: 13, color: 'var(--t-3)', fontVariantNumeric: 'tabular-nums', alignSelf: 'center' }}>
                                        {avgBuy ? `${fmtPrice(avgBuy)} đ` : <span style={{ color: 'var(--t-4)' }}>—</span>}
                                    </div>

                                    {/* Lời/Lỗ */}
                                    <div style={{ alignSelf: 'center' }}>
                                        {pnlPct !== null ? (
                                            <span style={{
                                                fontSize: 13, fontWeight: 700,
                                                color: pnlPct >= 0 ? 'var(--accent)' : 'var(--neg)',
                                                fontVariantNumeric: 'tabular-nums',
                                            }}>
                                                {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--t-4)', fontSize: 12 }}>chưa có data</span>
                                        )}
                                    </div>

                                    {/* Tín hiệu */}
                                    <div style={{ alignSelf: 'center' }}>
                                        {data ? (
                                            <SignalBadge result={data.signal} />
                                        ) : (
                                            <span style={{ color: 'var(--t-4)', fontSize: 12 }}>—</span>
                                        )}
                                    </div>

                                    {/* Delete */}
                                    <div style={{ alignSelf: 'center', display: 'flex', justifyContent: 'center' }}>
                                        <button
                                            onClick={e => { e.stopPropagation(); handleRemove(item.symbol) }}
                                            title="Xóa khỏi watchlist"
                                            style={{
                                                width: 28, height: 28, borderRadius: 7,
                                                display: 'grid', placeItems: 'center',
                                                background: 'transparent', border: 'none',
                                                color: 'var(--t-4)', cursor: 'pointer',
                                                transition: 'all .15s',
                                            }}
                                            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--neg)'; el.style.background = 'var(--neg-12)' }}
                                            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--t-4)'; el.style.background = 'transparent' }}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded: reasons */}
                                {isExpanded && data && (
                                    <div style={{
                                        padding: '14px 18px 18px',
                                        background: 'rgba(255,255,255,0.015)',
                                        borderBottom: isLast ? 'none' : '1px solid var(--line)',
                                        display: 'flex', flexDirection: 'column', gap: 12,
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                            <SignalBadge result={data.signal} />
                                            <ConfidenceDot level={data.signal.confidence} />
                                            <span style={{ fontSize: 11, color: 'var(--t-4)' }}>
                                                Dựa trên {data.closes.length} phiên dữ liệu
                                            </span>
                                            <a
                                                href={`https://tcinvest.tcbs.com.vn/search?keyword=${item.symbol}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={e => e.stopPropagation()}
                                                style={{
                                                    marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5,
                                                    fontSize: 12, color: 'var(--accent)', textDecoration: 'none',
                                                    padding: '4px 10px', borderRadius: 7,
                                                    background: 'var(--accent-12)', border: '1px solid var(--accent-18)',
                                                }}
                                            >
                                                Xem trên TCBS <ExternalLink size={11} />
                                            </a>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <div style={{ fontSize: 11, color: 'var(--t-4)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                                Lý do phân tích
                                            </div>
                                            {data.signal.reasons.map((r, i) => (
                                                <div key={i} style={{
                                                    fontSize: 12.5, color: 'var(--t-2)',
                                                    display: 'flex', alignItems: 'flex-start', gap: 8,
                                                }}>
                                                    <span style={{ color: data.signal.color, marginTop: 2, flexShrink: 0 }}>›</span>
                                                    {r}
                                                </div>
                                            ))}
                                        </div>

                                        {data.closes.length < 5 && (
                                            <div style={{
                                                padding: '10px 14px', borderRadius: 9,
                                                background: 'rgba(255,181,71,0.08)', border: '1px solid rgba(255,181,71,0.2)',
                                                fontSize: 12, color: '#ffb547',
                                                display: 'flex', alignItems: 'center', gap: 8,
                                            }}>
                                                <AlertTriangle size={13} />
                                                Cần ít nhất 5 phiên dữ liệu để tính tín hiệu chính xác. Hãy nhập giá thêm qua Claude skill mỗi ngày.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </React.Fragment>
                        )
                    })}
                </div>
            )}

            {/* ── Add symbol form ── */}
            <div className="card" style={{ padding: 20 }}>
                <div className="card-head" style={{ marginBottom: 16 }}>
                    <div className="left">
                        <div className="ico-box">
                            <Plus size={15} />
                        </div>
                        <div>
                            <div className="title">Thêm mã theo dõi</div>
                            <div className="desc">Mã sẽ được phân tích mỗi khi có dữ liệu giá mới</div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, color: 'var(--t-4)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mã CK</label>
                        <input
                            value={addSymbol}
                            onChange={e => { setAddSymbol(e.target.value.toUpperCase()); setAddError('') }}
                            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
                            placeholder="VD: FPT, VCB, MBB..."
                            style={{
                                padding: '9px 12px', borderRadius: 9, fontSize: 13,
                                background: 'rgba(255,255,255,0.05)',
                                border: addError ? '1px solid var(--neg)' : '1px solid var(--line)',
                                color: 'var(--t-1)', width: 180,
                                fontFamily: 'monospace', letterSpacing: '0.04em',
                                outline: 'none',
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, color: 'var(--t-4)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Loại</label>
                        <select
                            value={addCategory}
                            onChange={e => setAddCategory(e.target.value)}
                            style={{
                                padding: '9px 12px', borderRadius: 9, fontSize: 13,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--line)',
                                color: 'var(--t-1)', cursor: 'pointer', outline: 'none',
                            }}
                        >
                            {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#1a1a2e' }}>{c}</option>)}
                        </select>
                    </div>

                    <button
                        onClick={handleAdd}
                        disabled={adding || !addSymbol.trim()}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            padding: '9px 18px', borderRadius: 9,
                            background: 'var(--accent)', color: '#03110d',
                            fontWeight: 700, fontSize: 13, cursor: 'pointer',
                            border: 'none', opacity: (adding || !addSymbol.trim()) ? 0.5 : 1,
                            transition: 'opacity .15s',
                        }}
                    >
                        <Plus size={14} />
                        {adding ? 'Đang thêm...' : 'Thêm'}
                    </button>
                </div>

                {addError && (
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--neg)' }}>{addError}</div>
                )}

                <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)' }}>
                    <div style={{ fontSize: 11.5, color: 'var(--t-3)', lineHeight: 1.6 }}>
                        💡 <strong style={{ color: 'var(--t-2)' }}>Lưu ý:</strong> Tín hiệu được tính từ lịch sử giá bạn đã nhập qua Claude skill.
                        Càng nhiều phiên dữ liệu → tín hiệu càng chính xác. Tối thiểu cần 5 phiên, tốt nhất là 20+ phiên.
                        Click vào từng hàng để xem chi tiết lý do phân tích.
                    </div>
                </div>
            </div>

            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}
