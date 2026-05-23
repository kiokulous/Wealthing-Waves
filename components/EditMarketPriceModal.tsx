'use client'

import React, { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import type { MarketPrice } from '@/lib/supabase'

interface EditMarketPriceModalProps {
    open: boolean
    marketPrice: MarketPrice | null
    onSave: (marketPrice: { date: string; category: string; symbol: string; price: number }) => Promise<void>
    onCancel: () => void
}

export default function EditMarketPriceModal({
    open,
    marketPrice,
    onSave,
    onCancel
}: EditMarketPriceModalProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        date: '',
        category: '',
        symbol: '',
        price: ''
    })

    // Pre-fill form when marketPrice changes
    useEffect(() => {
        if (marketPrice) {
            setFormData({
                date: marketPrice.date,
                category: marketPrice.category,
                symbol: marketPrice.symbol,
                price: marketPrice.price.toString()
            })
        }
    }, [marketPrice])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!marketPrice) return

        setLoading(true)
        setError('')

        try {
            if (!formData.symbol || !formData.date || !formData.price) {
                throw new Error('Vui lòng điền đầy đủ các trường bắt buộc')
            }

            await onSave({
                date: formData.date,
                category: formData.category,
                symbol: formData.symbol.toUpperCase(),
                price: parseFloat(formData.price)
            })

            onCancel()
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra')
        } finally {
            setLoading(false)
        }
    }

    if (!open || !marketPrice) return null

    return (
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
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
                maxWidth: 420,
                width: '100%',
                padding: '28px 28px 24px',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--t-1)', letterSpacing: '-0.01em' }}>Chỉnh sửa Giá Thị trường</div>
                        <div style={{ fontSize: 12, color: 'var(--t-3)', marginTop: 2 }}>{marketPrice.symbol} · {marketPrice.date}</div>
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
                                <div className="label-cap" style={{ marginBottom: 6 }}>Ngày</div>
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

                        {/* Price — hero input */}
                        <div>
                            <div className="label-cap" style={{ marginBottom: 6 }}>Giá thị trường</div>
                            <input
                                type="number"
                                step="0.01"
                                name="price"
                                required
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="0"
                                className="input-bento num"
                                style={{
                                    fontSize: 22,
                                    fontWeight: 700,
                                    color: 'var(--accent)',
                                    padding: '14px 14px',
                                    letterSpacing: '-0.01em',
                                }}
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
