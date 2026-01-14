'use client'

import React, { useState, useEffect } from 'react'
import { X, Calendar, Tag, Layers, Save } from 'lucide-react'
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={!loading ? onCancel : undefined}
            />

            {/* Modal Card */}
            <div className="relative bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 max-w-lg w-full p-8 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-[var(--foreground)]">
                        Chỉnh sửa Giá Thị trường
                    </h2>
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-bold rounded-2xl border border-red-100 dark:border-red-500/20">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Date */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                            <Calendar className="w-3 h-3" />
                            Ngày
                        </label>
                        <input
                            type="date"
                            name="date"
                            required
                            value={formData.date}
                            onChange={handleChange}
                            className="input-bento w-full"
                        />
                    </div>

                    {/* Symbol */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                            <Tag className="w-3 h-3" />
                            Mã
                        </label>
                        <input
                            type="text"
                            name="symbol"
                            required
                            value={formData.symbol}
                            onChange={handleChange}
                            className="input-bento uppercase w-full"
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                            <Layers className="w-3 h-3" />
                            Phân loại
                        </label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full appearance-none bg-slate-100 dark:bg-[#1A1A1A] border-none rounded-2xl px-5 py-4 text-sm text-[var(--foreground)] font-bold focus:ring-2 focus:ring-[var(--primary)]/20 transition-all outline-none"
                        >
                            <option value="Chứng chỉ quỹ">Chứng chỉ quỹ</option>
                            <option value="Cổ phiếu">Cổ phiếu</option>
                            <option value="Vàng">Vàng</option>
                            <option value="Tiết kiệm">Tiết kiệm</option>
                        </select>
                    </div>

                    {/* Price */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                            Giá
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            name="price"
                            required
                            value={formData.price}
                            onChange={handleChange}
                            placeholder="Nhập giá..."
                            className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl px-5 py-5 text-xl font-bold text-slate-900 dark:text-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all outline-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
                            className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-[var(--foreground)] font-bold text-sm hover:border-slate-300 dark:hover:border-white/20 transition-all disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-4 rounded-2xl bg-[var(--primary)] text-white dark:text-black font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Lưu thay đổi
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
