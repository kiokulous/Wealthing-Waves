'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FloatingNav from '@/components/FloatingNav'
import { addTransaction, addMarketPrice } from '@/lib/api/database'
import { useAuth } from '@/components/providers/AuthProvider'

type Mode = 'transaction' | 'price'

export default function TransactionPage() {
    const router = useRouter()
    const { user } = useAuth()

    // Status State
    const [mode, setMode] = useState<Mode>('transaction')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Form Data State
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'Mua', // Mua, Chốt
        category: 'Cổ phiếu', // Cổ phiếu, Chứng chỉ quỹ, Vàng, Tiết kiệm
        symbol: '',
        qty: '',
        price: '',
        total_money: '',
        fee: '0',
    })

    // Reset success message when switching modes
    useEffect(() => {
        setSuccess('')
        setError('')
    }, [mode])

    // Auto-calculate Price when Total Money, Qty or Fee changes
    useEffect(() => {
        if (mode === 'transaction') {
            const qty = parseFloat(formData.qty) || 0
            const total = parseFloat(formData.total_money) || 0
            const fee = parseFloat(formData.fee) || 0

            // New User Logic: Enter Total, Qty, Fee -> Calculate Price
            // Rule:
            // Mua: Total = (Price * Qty) + Fee => Price = (Total - Fee) / Qty
            // Chốt: Total = (Price * Qty) - Fee => Price = (Total + Fee) / Qty

            if (qty > 0 && total > 0) {
                let derivedPrice = 0
                if (formData.type === 'Mua') {
                    derivedPrice = (total - fee) / qty
                } else {
                    derivedPrice = (total + fee) / qty
                }

                // Only update if valid and reasonably different to avoid rounding loops/spam
                if (derivedPrice > 0) {
                    setFormData(prev => ({
                        ...prev,
                        price: Math.round(derivedPrice).toString() // Round to integer for cleaner UI usually, or keep decimals? Let's use round for VND.
                    }))
                }
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

        if (!user) {
            setError('Vui lòng đăng nhập lại')
            setLoading(false)
            return
        }

        try {
            if (mode === 'transaction') {
                // Validation
                if (!formData.symbol || !formData.date || !formData.qty || !formData.total_money) {
                    throw new Error('Vui lòng điền đầy đủ các trường bắt buộc')
                }

                await addTransaction({
                    date: formData.date,
                    type: formData.type as 'Mua' | 'Chốt', // Cast type safely
                    category: formData.category,
                    symbol: formData.symbol.toUpperCase(),
                    quantity: parseFloat(formData.qty),
                    price: parseFloat(formData.price) || 0, // Price might be optional if calculated from total, but usually required
                    fee: parseFloat(formData.fee) || 0,
                    total_money: parseFloat(formData.total_money)
                })

                setSuccess('Đã thêm giao dịch thành công!')
            } else {
                // Market Price Mode
                if (!formData.symbol || !formData.date || !formData.price) {
                    throw new Error('Vui lòng điền đầy đủ mã và giá')
                }

                await addMarketPrice({
                    date: formData.date,
                    category: formData.category, // Even though price is specific to symbol, we store category for metadata if needed
                    symbol: formData.symbol.toUpperCase(),
                    price: parseFloat(formData.price)
                })

                setSuccess('Đã cập nhật giá thị trường thành công!')
            }

            // Reset form partially
            setFormData(prev => ({
                ...prev,
                symbol: '',
                qty: '',
                price: '',
                total_money: '',
                fee: '0'
            }))

        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Có lỗi xảy ra')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-32 pt-6 px-4">
            <div className="max-w-md mx-auto">
                {/* Header */}
                <h1 className="text-2xl font-bold text-slate-800 mb-6 text-center">Nhập Liệu</h1>

                {/* Toggle Mode */}
                <div className="flex p-1 bg-white border border-slate-100 rounded-2xl mb-6 shadow-sm relative overflow-hidden">
                    <div
                        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-indigo-500 rounded-xl transition-all duration-300 ease-in-out ${mode === 'price' ? 'translate-x-[calc(100%+4px)] bg-pink-500' : 'translate-x-1'}`}
                    ></div>
                    <button
                        onClick={() => setMode('transaction')}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors relative z-10 ${mode === 'transaction' ? 'text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        Giao dịch
                    </button>
                    <button
                        onClick={() => setMode('price')}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors relative z-10 ${mode === 'price' ? 'text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        Giá thị trường
                    </button>
                </div>

                {/* Form Card */}
                <div className={`soft-card p-6 transition-all duration-500 ${mode === 'price' ? 'border-pink-100 shadow-pink-500/5' : 'border-indigo-100 shadow-indigo-500/5'}`}>

                    {error && (
                        <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-sm font-bold rounded-xl flex items-center gap-2 border border-rose-100">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 text-sm font-bold rounded-xl flex items-center gap-2 border border-emerald-100 animate-pulse">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Common: Date */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Ngày</label>
                            <input
                                type="date"
                                name="date"
                                required
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full input-modern rounded-xl p-3.5 font-bold text-slate-700 text-sm appearance-none block"
                            />
                        </div>

                        {/* Common: Category */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Hạng mục</label>
                            <div className="relative">
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full input-modern rounded-xl p-3.5 appearance-none font-bold text-sm text-slate-700 bg-white"
                                >
                                    <option value="Chứng chỉ quỹ">Chứng chỉ quỹ</option>
                                    <option value="Cổ phiếu">Cổ phiếu</option>
                                    <option value="Vàng">Vàng</option>
                                    <option value="Tiết kiệm">Tiết kiệm</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Common: Symbol */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Mã (Symbol)</label>
                            <input
                                type="text"
                                name="symbol"
                                required
                                value={formData.symbol}
                                onChange={handleChange}
                                placeholder="VD: VNM"
                                className="w-full input-modern rounded-xl p-3.5 text-lg font-black uppercase tracking-wider text-slate-800 placeholder:font-normal placeholder:text-slate-300"
                            />
                        </div>

                        {/* Transaction Only Fields */}
                        {mode === 'transaction' && (
                            <>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Loại giao dịch</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className={`cursor-pointer rounded-xl p-3 border text-center font-bold text-sm transition-all ${formData.type === 'Mua' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-slate-100 text-slate-400'}`}>
                                            <input type="radio" name="type" value="Mua" checked={formData.type === 'Mua'} onChange={handleChange} className="hidden" />
                                            Mua vào
                                        </label>
                                        <label className={`cursor-pointer rounded-xl p-3 border text-center font-bold text-sm transition-all ${formData.type === 'Chốt' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'border-slate-100 text-slate-400'}`}>
                                            <input type="radio" name="type" value="Chốt" checked={formData.type === 'Chốt'} onChange={handleChange} className="hidden" />
                                            Bán ra (Chốt)
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Số lượng</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="qty"
                                            value={formData.qty}
                                            onChange={handleChange}
                                            placeholder="0"
                                            className="w-full input-modern rounded-xl p-3.5 font-bold text-slate-700"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Giá / Đơn vị</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleChange}
                                            placeholder="0"
                                            className="w-full input-modern rounded-xl p-3.5 font-bold text-slate-700"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Phí giao dịch (nếu có)</label>
                                    <input
                                        type="number"
                                        step="1"
                                        name="fee"
                                        value={formData.fee}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="w-full input-modern rounded-xl p-3.5 font-bold text-slate-500"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Tổng tiền (VNĐ)</label>
                                    <input
                                        type="number"
                                        step="1"
                                        name="total_money"
                                        value={formData.total_money}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="w-full input-modern rounded-xl p-3.5 font-extrabold text-lg text-indigo-600 border-indigo-100 bg-indigo-50/30"
                                    />
                                </div>
                            </>
                        )}

                        {/* Market Price Mode Only */}
                        {mode === 'price' && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Giá thị trường mới nhất</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    placeholder="Nhập giá hiện tại..."
                                    className="w-full input-modern rounded-xl p-3.5 font-extrabold text-lg text-pink-600 border-pink-100 bg-pink-50/30"
                                />
                                <p className="text-[10px] text-slate-400 italic ml-1">Hệ thống sẽ cập nhật giá mới nhất cho ngày này.</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all mt-4 transform active:scale-[0.98] ${loading ? 'opacity-70 cursor-wait' : ''} ${mode === 'transaction' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30' : 'bg-pink-500 hover:bg-pink-600 shadow-pink-500/30'}`}
                        >
                            {loading ? 'Đang xử lý...' : (mode === 'transaction' ? 'Lưu Giao Dịch' : 'Cập Nhật Giá')}
                        </button>
                    </form>
                </div>
            </div>
            <FloatingNav />
        </div>
    )
}
