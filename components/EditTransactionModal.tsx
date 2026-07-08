'use client'

import React, { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import type { Transaction } from '@/lib/supabase'

interface EditTransactionModalProps {
    open: boolean
    transaction: Transaction | null
    onSave: (id: string, updates: Partial<Transaction>) => Promise<void>
    onCancel: () => void
}

export default function EditTransactionModal({
    open,
    transaction,
    onSave,
    onCancel
}: EditTransactionModalProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        date: '',
        type: 'Mua' as 'Mua' | 'Chốt' | 'Bán' | 'Cổ tức CP',
        category: '',
        symbol: '',
        quantity: '',
        fee: '',
        total_money: '',
        price: '',
        notes: ''
    })

    // Pre-fill form when transaction changes
    useEffect(() => {
        if (transaction) {
            setFormData({
                date: transaction.date,
                type: transaction.type as 'Mua' | 'Chốt' | 'Bán' | 'Cổ tức CP',
                category: transaction.category,
                symbol: transaction.symbol,
                quantity: transaction.quantity.toString(),
                fee: transaction.fee.toString(),
                total_money: transaction.total_money.toString(),
                price: transaction.price.toString(),
                notes: transaction.notes ?? ''
            })
        }
    }, [transaction])

    // Auto-calc fee theo chiều giao dịch:
    // - Mua: phí = total − qty×price · Bán/Chốt: phí = qty×price − total
    useEffect(() => {
        const qty = parseFloat(formData.quantity) || 0
        const price = parseFloat(formData.price) || 0
        const total = parseFloat(formData.total_money) || 0

        if (qty > 0 && price > 0 && total > 0) {
            const isSellType = formData.type === 'Chốt' || formData.type === 'Bán'
            const derived = isSellType ? qty * price - total : total - qty * price
            setFormData(prev => ({
                ...prev,
                fee: Math.round(derived).toString()
            }))
        } else {
            setFormData(prev => ({ ...prev, fee: '' }))
        }
    }, [formData.total_money, formData.quantity, formData.price, formData.type])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!transaction) return

        setLoading(true)
        setError('')

        try {
            const isDividend = formData.type === 'Cổ tức CP'
            if (!formData.symbol || !formData.date || !formData.quantity)
                throw new Error('Vui lòng điền đầy đủ các trường bắt buộc')
            if (!isDividend && !formData.total_money)
                throw new Error('Vui lòng điền tổng tiền giao dịch')

            await onSave(transaction.id, {
                date: formData.date,
                type: formData.type,
                category: formData.category,
                symbol: formData.symbol.toUpperCase(),
                quantity: parseFloat(formData.quantity),
                price: isDividend ? 0 : parseFloat(formData.price) || 0,
                fee: isDividend ? 0 : parseFloat(formData.fee) || 0,
                total_money: isDividend ? 0 : parseFloat(formData.total_money),
                notes: formData.notes.trim() || null
            })

            onCancel()
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra')
        } finally {
            setLoading(false)
        }
    }

    if (!open || !transaction) return null

    return (
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}
        >
            {/* Backdrop */}
            <div
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
                onClick={!loading ? onCancel : undefined}
            />

            {/* Modal Card */}
            <div style={{
                position: 'relative',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.012), transparent), var(--surface-1)',
                border: '1px solid var(--line-2)',
                borderRadius: 'var(--r-xl)',
                boxShadow: 'var(--sh-pop)',
                maxWidth: 560,
                width: '100%',
                padding: '28px 28px 24px',
                margin: '32px 0',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--t-1)', letterSpacing: '-0.01em' }}>Chỉnh sửa Giao dịch</div>
                        <div style={{ fontSize: 12, color: 'var(--t-3)', marginTop: 2 }}>{transaction.symbol} · {transaction.date}</div>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        style={{
                            display: 'grid', placeItems: 'center',
                            width: 32, height: 32,
                            borderRadius: 8,
                            background: 'var(--surface-3)',
                            border: '1px solid var(--line)',
                            color: 'var(--t-3)',
                            cursor: 'pointer',
                            transition: 'all .15s',
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div style={{
                        marginBottom: 16,
                        padding: '10px 14px',
                        background: 'var(--neg-12)',
                        border: '1px solid rgba(255,90,110,0.2)',
                        borderRadius: 10,
                        color: 'var(--neg)',
                        fontSize: 13,
                        fontWeight: 600,
                    }}>
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Date + Symbol */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="mob-form-row">
                            <div>
                                <div className="label-cap" style={{ marginBottom: 6 }}>Ngày giao dịch</div>
                                <input
                                    type="date"
                                    name="date"
                                    required
                                    value={formData.date}
                                    onChange={handleChange}
                                    className="input-bento"
                                />
                            </div>
                            <div>
                                <div className="label-cap" style={{ marginBottom: 6 }}>Mã tài sản</div>
                                <input
                                    type="text"
                                    name="symbol"
                                    required
                                    value={formData.symbol}
                                    onChange={handleChange}
                                    className="input-bento"
                                    style={{ textTransform: 'uppercase' }}
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <div className="label-cap" style={{ marginBottom: 6 }}>Phân loại</div>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="input-bento"
                            >
                                <option value="Chứng chỉ quỹ">Chứng chỉ quỹ</option>
                                <option value="Cổ phiếu">Cổ phiếu</option>
                                <option value="Vàng">Vàng</option>
                                <option value="Tiết kiệm">Tiết kiệm</option>
                            </select>
                        </div>

                        {/* Type toggle */}
                        <div>
                            <div className="label-cap" style={{ marginBottom: 6 }}>Loại giao dịch</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, type: 'Mua' }))}
                                    style={{
                                        padding: '10px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all .15s',
                                        border: formData.type === 'Mua' ? '1px solid var(--accent-30)' : '1px solid var(--line)',
                                        background: formData.type === 'Mua' ? 'var(--accent-12)' : 'var(--surface-2)',
                                        color: formData.type === 'Mua' ? 'var(--accent)' : 'var(--t-3)',
                                    }}
                                >
                                    Mua
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, type: 'Chốt' }))}
                                    style={{
                                        padding: '10px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all .15s',
                                        border: (formData.type === 'Chốt' || formData.type === 'Bán') ? '1px solid rgba(255,90,110,0.3)' : '1px solid var(--line)',
                                        background: (formData.type === 'Chốt' || formData.type === 'Bán') ? 'var(--neg-12)' : 'var(--surface-2)',
                                        color: (formData.type === 'Chốt' || formData.type === 'Bán') ? 'var(--neg)' : 'var(--t-3)',
                                    }}
                                >
                                    Chốt
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, type: 'Cổ tức CP', price: '0', total_money: '0', fee: '0' }))}
                                    style={{
                                        padding: '10px', borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all .15s',
                                        border: formData.type === 'Cổ tức CP' ? '1px solid rgba(110,168,255,0.3)' : '1px solid var(--line)',
                                        background: formData.type === 'Cổ tức CP' ? 'rgba(110,168,255,0.12)' : 'var(--surface-2)',
                                        color: formData.type === 'Cổ tức CP' ? '#6ea8ff' : 'var(--t-3)',
                                    }}
                                >
                                    Cổ tức CP
                                </button>
                            </div>
                        </div>

                        {/* Quantity — luôn hiện */}
                        <div>
                            <div className="label-cap" style={{ marginBottom: 6 }}>Số lượng</div>
                            <input
                                type="number" step="0.01" name="quantity"
                                value={formData.quantity} onChange={handleChange}
                                className="input-bento num"
                            />
                            {formData.type === 'Cổ tức CP' && (
                                <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(110,168,255,0.08)', border: '1px solid rgba(110,168,255,0.2)', fontSize: 12, color: '#6ea8ff' }}>
                                    💡 Cổ tức CP không tốn tiền mặt — giá mua TB sẽ tự động giảm.
                                </div>
                            )}
                        </div>

                        {/* Giá + Tổng tiền + Phí — ẩn khi Cổ tức CP */}
                        {formData.type !== 'Cổ tức CP' && (<>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="mob-form-row">
                                <div>
                                    <div className="label-cap" style={{ marginBottom: 6 }}>Giá khớp lệnh</div>
                                    <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} className="input-bento num" />
                                </div>
                                <div>
                                    <div className="label-cap" style={{ marginBottom: 6 }}>Tổng tiền giao dịch</div>
                                    <input type="number" step="1" name="total_money" value={formData.total_money} onChange={handleChange} className="input-bento num" />
                                </div>
                            </div>
                            <div>
                                <div className="label-cap" style={{ marginBottom: 6 }}>Phí &amp; Thuế <span style={{ color: 'var(--t-4)', fontWeight: 400, textTransform: 'lowercase', letterSpacing: 0 }}>(tự tính)</span></div>
                                <input type="number" step="1" name="fee" value={formData.fee} readOnly className="input-bento num" style={{ color: 'var(--t-3)', cursor: 'default' }} />
                            </div>
                        </>)}

                        {/* Ghi chú */}
                        <div>
                            <div className="label-cap" style={{ marginBottom: 6 }}>Ghi chú <span style={{ color: 'var(--t-4)', fontWeight: 400, textTransform: 'lowercase', letterSpacing: 0 }}>(tuỳ chọn)</span></div>
                            <input
                                type="text" name="notes" maxLength={200}
                                value={formData.notes} onChange={handleChange}
                                placeholder="Lý do giao dịch..."
                                className="input-bento"
                            />
                        </div>

                    </div>

                    {/* Divider */}
                    <div className="divider" style={{ margin: '20px 0 16px' }} />

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 10 }} className="mob-form-footer">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
                            className="btn btn-ghost"
                            style={{ flex: 1 }}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                        >
                            {loading ? (
                                <div style={{
                                    width: 16, height: 16,
                                    border: '2px solid rgba(6,32,24,0.3)',
                                    borderTopColor: '#062018',
                                    borderRadius: '50%',
                                    animation: 'spin 0.7s linear infinite'
                                }} />
                            ) : (
                                <>
                                    <Save size={14} />
                                    Lưu thay đổi
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
