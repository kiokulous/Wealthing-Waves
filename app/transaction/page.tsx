'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { addTransaction, addMarketPrice } from '@/lib/api/database'
import { useAuth } from '@/components/providers/AuthProvider'
import TransactionHistory from '@/components/TransactionHistory'
import MarketPriceHistory from '@/components/MarketPriceHistory'

type Mode = 'transaction' | 'price'

export default function TransactionPage() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()

    const [mode, setMode]       = useState<Mode>('transaction')
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState('')
    const [success, setSuccess] = useState('')

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'Mua',
        category: 'Chứng chỉ quỹ',
        symbol: '',
        qty: '',
        price: '',
        total_money: '',
        fee: '0',
        // price-update extras
        session: 'EOD',
        source: 'Nhập tay',
    })

    useEffect(() => {
        if (!authLoading && !user) router.push('/login')
    }, [user, authLoading, router])

    useEffect(() => {
        setSuccess('')
        setError('')
    }, [mode])

    // Auto-calc price from total + qty + fee
    useEffect(() => {
        const qty   = parseFloat(formData.qty)   || 0
        const total = parseFloat(formData.total_money) || 0
        const fee   = parseFloat(formData.fee)   || 0
        if (qty > 0 && total > 0) {
            const derived = formData.type === 'Mua'
                ? (total - fee) / qty
                : (total + fee) / qty
            if (derived > 0) {
                setFormData(prev => ({ ...prev, price: Math.round(derived).toString() }))
            }
        }
    }, [formData.total_money, formData.qty, formData.fee, formData.type])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')
        if (!user) { setError('Vui lòng đăng nhập lại'); setLoading(false); return }

        try {
            if (mode === 'transaction') {
                if (!formData.symbol || !formData.date || !formData.qty || !formData.total_money)
                    throw new Error('Vui lòng điền đầy đủ các trường bắt buộc')

                await addTransaction({
                    date: formData.date,
                    type: formData.type as 'Mua' | 'Chốt',
                    category: formData.category,
                    symbol: formData.symbol.toUpperCase(),
                    quantity: parseFloat(formData.qty),
                    price: parseFloat(formData.price) || 0,
                    fee: parseFloat(formData.fee) || 0,
                    total_money: parseFloat(formData.total_money),
                })
                setSuccess('Giao dịch đã được lưu vào hệ thống!')
            } else {
                if (!formData.symbol || !formData.date || !formData.price)
                    throw new Error('Vui lòng điền đầy đủ mã và giá')

                await addMarketPrice({
                    date: formData.date,
                    category: formData.category,
                    symbol: formData.symbol.toUpperCase(),
                    price: parseFloat(formData.price),
                })
                setSuccess('Giá thị trường đã được cập nhật!')
            }

            setFormData(prev => ({ ...prev, symbol: '', qty: '', price: '', total_money: '', fee: '0' }))
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra trong quá trình xử lý')
        } finally {
            setLoading(false)
        }
    }

    if (authLoading) return null

    const isBuy = formData.type === 'Mua'

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 60 }}>

            {/* ── Header ── */}
            {/* Mobile header */}
            <div className="md:hidden" style={{ marginBottom: 16 }}>
                <div className="h-title" style={{ fontSize: 22 }}>
                    Cổng <span style={{ color: 'var(--accent)' }}>Dữ liệu</span>
                </div>
                <div className="h-sub">Đồng bộ giao dịch và giá thị trường.</div>
            </div>
            {/* Desktop header */}
            <div className="hidden md:flex row between" style={{ alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div className="h-title">
                        Cổng <span style={{ color: 'var(--accent)' }}>Dữ liệu</span>
                    </div>
                    <div className="h-sub">Đồng bộ giao dịch mới nhất và giá thị trường vào danh mục của bạn.</div>
                </div>
                <div className="row" style={{ gap: 8 }}>
                    <button className="btn btn-ghost" style={{ fontSize: 13 }}>
                        ↓ Tải mẫu CSV
                    </button>
                    <button className="btn btn-ghost" style={{ fontSize: 13 }}>
                        ↑ Nhập từ file
                    </button>
                </div>
            </div>

            {/* ── Mode tabs (full-width segmented) ── */}
            <div style={{ marginBottom: 18 }}>
                <div className="segmented" style={{ display: 'flex', width: '100%', padding: 4, borderRadius: 14 }}>
                    <button
                        className={mode === 'transaction' ? 'on' : ''}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 14px' }}
                        onClick={() => setMode('transaction')}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Giao dịch
                        <span style={{ fontSize: 10.5, color: mode === 'transaction' ? '#062018' : 'var(--t-3)', marginLeft: 4 }}>BUY · SELL</span>
                    </button>
                    <button
                        className={mode === 'price' ? 'on' : ''}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 14px' }}
                        onClick={() => setMode('price')}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>
                        Thị trường
                        <span style={{ fontSize: 10.5, color: mode === 'price' ? '#062018' : 'var(--t-3)', marginLeft: 4 }}>PRICE UPDATE</span>
                    </button>
                </div>
            </div>

            {/* ── Form card ── */}
            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                {/* Card header */}
                <div className="row between" style={{ marginBottom: 20 }}>
                    <div className="col">
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t-1)' }}>
                            {mode === 'transaction' ? 'Ghi nhận giao dịch mới' : 'Cập nhật giá thị trường'}
                        </div>
                        <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                            {mode === 'transaction'
                                ? 'Mỗi dòng sẽ được tính vào danh mục và lịch sử.'
                                : 'Giá sẽ áp dụng cho toàn bộ phiên hôm nay.'}
                        </div>
                    </div>
                    <span className="badge muted">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        Tự lưu nháp
                    </span>
                </div>

                {/* Error / success banners */}
                {error && (
                    <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: 'var(--neg-12)', border: '1px solid rgba(255,90,110,0.25)', color: 'var(--neg)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                        {error}
                    </div>
                )}
                {success && (
                    <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: 'var(--accent-12)', border: '1px solid var(--accent-18)', color: 'var(--accent)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Row 1: date / symbol / category */}
                    <div className="mob-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 18 }}>
                        <div className="field">
                            <label>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                Ngày giao dịch
                            </label>
                            <input type="date" name="date" required value={formData.date} onChange={handleChange} />
                        </div>
                        <div className="field">
                            <label>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                                Mã / Tín hiệu
                            </label>
                            <input type="text" name="symbol" required value={formData.symbol} onChange={handleChange} placeholder="VNM, TCBS, VCBFTBF..." />
                        </div>
                        <div className="field">
                            <label>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 22 22 7 12 2"/></svg>
                                Phân loại tài sản
                            </label>
                            <select name="category" value={formData.category} onChange={handleChange}>
                                <option value="Chứng chỉ quỹ">Chứng chỉ quỹ</option>
                                <option value="Cổ phiếu">Cổ phiếu</option>
                                <option value="Vàng">Vàng</option>
                                <option value="Tiết kiệm">Tiết kiệm</option>
                            </select>
                        </div>
                    </div>

                    {/* ── Transaction mode ── */}
                    {mode === 'transaction' && (
                        <>
                            {/* Buy / Sell toggle */}
                            <div className="field" style={{ marginBottom: 18 }}>
                                <label>Loại lệnh</label>
                                <div className="row" style={{ gap: 10 }}>
                                    <button
                                        type="button"
                                        className="btn"
                                        onClick={() => setFormData(prev => ({ ...prev, type: 'Mua' }))}
                                        style={{
                                            flex: 1, padding: 14,
                                            background: isBuy ? 'var(--accent-12)' : 'var(--surface-2)',
                                            border: isBuy ? '1px solid var(--accent-30)' : '1px solid var(--line)',
                                            color: isBuy ? 'var(--accent)' : 'var(--t-2)',
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                                        Cộng hưởng (Mua)
                                    </button>
                                    <button
                                        type="button"
                                        className="btn"
                                        onClick={() => setFormData(prev => ({ ...prev, type: 'Chốt' }))}
                                        style={{
                                            flex: 1, padding: 14,
                                            background: !isBuy ? 'var(--neg-12)' : 'var(--surface-2)',
                                            border: !isBuy ? '1px solid rgba(255,90,110,0.3)' : '1px solid var(--line)',
                                            color: !isBuy ? 'var(--neg)' : 'var(--t-2)',
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
                                        Phát tán (Bán)
                                    </button>
                                </div>
                            </div>

                            {/* 4-col numeric fields */}
                            <div className="mob-num-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
                                <div className="field mono">
                                    <label>Số lượng</label>
                                    <input type="number" step="0.01" name="qty" value={formData.qty} onChange={handleChange} placeholder="0,00" />
                                    <span className="hint">Số đơn vị / cổ phiếu</span>
                                </div>
                                <div className="field mono">
                                    <label>Giá cơ sở (đ)</label>
                                    <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="0" readOnly style={{ color: 'var(--t-3)' }} />
                                    <span className="hint">Đơn giá tại thời điểm khớp</span>
                                </div>
                                <div className="field mono">
                                    <label>Phí &amp; thuế (đ)</label>
                                    <input type="number" step="1" name="fee" value={formData.fee} onChange={handleChange} placeholder="0" />
                                    <span className="hint">Tự động tính theo broker</span>
                                </div>
                                <div className="field mono">
                                    <label>Tổng năng lượng (VNĐ)</label>
                                    <input type="number" step="1" name="total_money" value={formData.total_money} onChange={handleChange} placeholder="0" required style={{ background: 'var(--surface-3)', color: 'var(--accent)', fontWeight: 700 }} />
                                    <span className="hint" style={{ color: 'var(--accent)' }}>Tự tính từ các trường trên</span>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── Price update mode ── */}
                    {mode === 'price' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                            <div className="field mono">
                                <label>Giá khớp (đ)</label>
                                <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} placeholder="0" />
                            </div>
                            <div className="field">
                                <label>Phiên</label>
                                <select name="session" value={formData.session} onChange={handleChange}>
                                    <option>Phiên sáng</option>
                                    <option>Phiên chiều</option>
                                    <option>EOD</option>
                                </select>
                            </div>
                            <div className="field">
                                <label>Nguồn dữ liệu</label>
                                <select name="source" value={formData.source} onChange={handleChange}>
                                    <option>VietStock</option>
                                    <option>SSI</option>
                                    <option>TCBS</option>
                                    <option>Nhập tay</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Form footer */}
                    <div className="row between">
                        <div className="row" style={{ gap: 8 }}>
                            <span className="badge green">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                Hợp lệ
                            </span>
                            <span className="muted" style={{ fontSize: 12 }}>
                                Phím tắt:{' '}
                                <span style={{ padding: '2px 6px', borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--line)', fontFamily: 'monospace', fontSize: 11 }}>⌘↵</span>
                                {' '}để lưu nhanh
                            </span>
                        </div>
                        <div className="row" style={{ gap: 8 }}>
                            <button type="button" className="btn btn-ghost" onClick={() => setFormData(prev => ({ ...prev, symbol: '', qty: '', price: '', total_money: '', fee: '0' }))}>
                                Hủy
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: 160 }}>
                                {loading
                                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ width: 14, height: 14, border: '2px solid #062018', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
                                        Đang lưu...
                                      </span>
                                    : <>
                                        {mode === 'transaction' ? 'Phê duyệt tín hiệu' : 'Cập nhật toàn thị trường'}
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}><path d="m9 18 6-6-6-6"/></svg>
                                      </>
                                }
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* ── History ── */}
            {mode === 'transaction' && <TransactionHistory key={success} />}
            {mode === 'price'       && <MarketPriceHistory key={success} />}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg) } }
                .field { display: flex; flex-direction: column; gap: 6px; }
                .field label {
                    font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
                    color: var(--t-3); font-weight: 600;
                    display: flex; align-items: center; gap: 6px;
                }
                .field input, .field select {
                    appearance: none;
                    background: var(--surface-2);
                    border: 1px solid var(--line);
                    border-radius: 10px;
                    padding: 11px 12px;
                    color: var(--t-1);
                    font-family: inherit; font-size: 14px;
                    outline: none;
                    transition: border-color .15s, box-shadow .15s;
                    width: 100%;
                    color-scheme: dark;
                }
                .field input::placeholder { color: var(--t-4); }
                .field input:focus, .field select:focus {
                    border-color: rgba(0,200,150,0.5);
                    box-shadow: 0 0 0 4px rgba(0,200,150,0.12);
                }
                .field.mono input { font-family: 'JetBrains Mono', 'SF Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; }
                .field .hint { font-size: 11.5px; color: var(--t-3); }
            `}</style>
        </div>
    )
}
