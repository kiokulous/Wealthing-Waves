'use client'

import React, { useState, useEffect } from 'react'
import { X, Calendar, Tag, Layers, Save } from 'lucide-react'
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
        type: 'Mua' as 'Mua' | 'Chốt',
        category: '',
        symbol: '',
        quantity: '',
        fee: '',
        total_money: '',
        price: ''
    })

    // Pre-fill form when transaction changes
    useEffect(() => {
        if (transaction) {
            setFormData({
                date: transaction.date,
                type: (transaction.type === 'Bán' ? 'Chốt' : transaction.type) as 'Mua' | 'Chốt',
                category: transaction.category,
                symbol: transaction.symbol,
                quantity: transaction.quantity.toString(),
                fee: transaction.fee.toString(),
                total_money: transaction.total_money.toString(),
                price: transaction.price.toString()
            })
        }
    }, [transaction])

    // Auto-calculate price
    useEffect(() => {
        const qty = parseFloat(formData.quantity) || 0
        const total = parseFloat(formData.total_money) || 0
        const fee = parseFloat(formData.fee) || 0

        if (qty > 0 && total > 0) {
            let derivedPrice = 0
            if (formData.type === 'Mua') {
                derivedPrice = (total - fee) / qty
            } else {
                derivedPrice = (total + fee) / qty
            }

            if (derivedPrice > 0) {
                setFormData(prev => ({
                    ...prev,
                    price: Math.round(derivedPrice).toString()
                }))
            }
        }
    }, [formData.total_money, formData.quantity, formData.fee, formData.type])

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
            if (!formData.symbol || !formData.date || !formData.quantity || !formData.total_money) {
                throw new Error('Vui lòng điền đầy đủ các trường bắt buộc')
            }

            await onSave(transaction.id, {
                date: formData.date,
                type: formData.type,
                category: formData.category,
                symbol: formData.symbol.toUpperCase(),
                quantity: parseFloat(formData.quantity),
                price: parseFloat(formData.price) || 0,
                fee: parseFloat(formData.fee) || 0,
                total_money: parseFloat(formData.total_money)
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={!loading ? onCancel : undefined}
            />

            {/* Modal Card */}
            <div className="relative bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 max-w-2xl w-full p-8 my-8 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-[var(--foreground)]">
                        Chỉnh sửa Giao dịch
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
                            Ngày Giao dịch
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

                    {/* Type */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Loại Giao dịch</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, type: 'Mua' }))}
                                className={`rounded-2xl p-4 border-2 font-bold text-sm transition-all ${formData.type === 'Mua' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400' : 'bg-white dark:bg-[#0F0F0F] border-slate-100 dark:border-white/10 text-[var(--text-muted)]'}`}
                            >
                                Mua
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, type: 'Chốt' }))}
                                className={`rounded-2xl p-4 border-2 font-bold text-sm transition-all ${formData.type === 'Chốt' ? 'bg-red-50 dark:bg-red-500/10 border-red-500 text-red-700 dark:text-red-400' : 'bg-white dark:bg-[#0F0F0F] border-slate-100 dark:border-white/10 text-[var(--text-muted)]'}`}
                            >
                                Chốt
                            </button>
                        </div>
                    </div>

                    {/* Quantity & Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Số lượng</label>
                            <input
                                type="number"
                                step="0.01"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                                className="input-bento w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Giá</label>
                            <input
                                type="number"
                                step="0.01"
                                name="price"
                                value={formData.price}
                                readOnly
                                className="input-bento w-full bg-slate-50 dark:bg-[#0F0F0F] text-slate-500"
                            />
                        </div>
                    </div>

                    {/* Fee & Total */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Phí</label>
                            <input
                                type="number"
                                step="1"
                                name="fee"
                                value={formData.fee}
                                onChange={handleChange}
                                className="input-bento w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Tổng tiền</label>
                            <input
                                type="number"
                                step="1"
                                name="total_money"
                                value={formData.total_money}
                                onChange={handleChange}
                                className="input-bento w-full"
                            />
                        </div>
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
