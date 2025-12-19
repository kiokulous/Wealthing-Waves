'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { addTransaction, addMarketPrice } from '@/lib/api/database'
import { useAuth } from '@/components/providers/AuthProvider'
import { PlusCircle, Database, Calendar, Tag, Layers, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'

type Mode = 'transaction' | 'price'

export default function TransactionPage() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()

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

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        }
    }, [user, authLoading, router])

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
                if (!formData.symbol || !formData.date || !formData.qty || !formData.total_money) {
                    throw new Error('Vui lòng điền đầy đủ các trường bắt buộc')
                }

                await addTransaction({
                    date: formData.date,
                    type: formData.type as 'Mua' | 'Chốt',
                    category: formData.category,
                    symbol: formData.symbol.toUpperCase(),
                    quantity: parseFloat(formData.qty),
                    price: parseFloat(formData.price) || 0,
                    fee: parseFloat(formData.fee) || 0,
                    total_money: parseFloat(formData.total_money)
                })

                setSuccess('Giao dịch đã được lưu vào hệ thống!')
            } else {
                if (!formData.symbol || !formData.date || !formData.price) {
                    throw new Error('Vui lòng điền đầy đủ mã và giá')
                }

                await addMarketPrice({
                    date: formData.date,
                    category: formData.category,
                    symbol: formData.symbol.toUpperCase(),
                    price: parseFloat(formData.price)
                })

                setSuccess('Giá thị trường đã được cập nhật!')
            }

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
            setError(err.message || 'Có lỗi xảy ra trong quá trình xử lý')
        } finally {
            setLoading(false)
        }
    }

    if (authLoading) return null

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-1">
                        Cổng <span className="text-blue-600">Dữ liệu</span>
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight">Đồng bộ hóa các giao dịch mới nhất và giá thị trường của bạn.</p>
                </div>
            </header>

            <div className="max-w-2xl mx-auto space-y-6">
                {/* Mode Selector Bento Block */}
                <div className="flex p-2 bg-white border border-slate-200 rounded-[2rem] shadow-sm relative overflow-hidden group h-16 items-center">
                    <div
                        className={`absolute top-2 bottom-2 w-[calc(50%-8px)] rounded-3xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] bg-blue-600 shadow-lg shadow-blue-500/20 ${mode === 'price' ? 'translate-x-[calc(100%+8px)]' : 'translate-x-0'}`}
                    ></div>
                    <button
                        onClick={() => setMode('transaction')}
                        className={`flex-1 flex items-center justify-center gap-2 font-bold text-sm tracking-tight transition-all relative z-10 ${mode === 'transaction' ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <PlusCircle className="w-4 h-4" />
                        Giao dịch
                    </button>
                    <button
                        onClick={() => setMode('price')}
                        className={`flex-1 flex items-center justify-center gap-2 font-bold text-sm tracking-tight transition-all relative z-10 ${mode === 'price' ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Database className="w-4 h-4" />
                        Giá thị trường
                    </button>
                </div>

                {/* Form Bento Card */}
                <div className="bento-card p-10 shadow-xl shadow-slate-200/50">
                    {error && (
                        <div className="mb-8 p-4 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-widest rounded-2xl flex items-center gap-3 border border-red-100 animate-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5" />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-8 p-4 bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-widest rounded-2xl flex items-center gap-3 border border-emerald-100 animate-in slide-in-from-top-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Core Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                    <Calendar className="w-3 h-3" />
                                    Chu kỳ Giao dịch
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    required
                                    value={formData.date}
                                    onChange={handleChange}
                                    className="input-bento"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                    <Tag className="w-3 h-3" />
                                    Mã Tín hiệu
                                </label>
                                <input
                                    type="text"
                                    name="symbol"
                                    required
                                    value={formData.symbol}
                                    onChange={handleChange}
                                    placeholder="VNM, TCBS..."
                                    className="input-bento placeholder:uppercase"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                <Layers className="w-3 h-3" />
                                Phân loại Tài sản
                            </label>
                            <div className="relative">
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full appearance-none bg-slate-100 border-none rounded-2xl px-5 py-4 text-sm text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none cursor-pointer"
                                >
                                    <option value="Chứng chỉ quỹ">Chứng chỉ quỹ</option>
                                    <option value="Cổ phiếu">Cổ phiếu</option>
                                    <option value="Vàng">Vàng</option>
                                    <option value="Tiết kiệm">Tiết kiệm</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-slate-400 border-l border-slate-200 my-3">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {mode === 'transaction' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Lệnh Giao dịch</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, type: 'Mua' }))}
                                            className={`rounded-2xl p-4 border-2 font-bold text-sm transition-all ${formData.type === 'Mua' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg shadow-emerald-500/10' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                        >
                                            Cộng hưởng (Mua)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, type: 'Chốt' }))}
                                            className={`rounded-2xl p-4 border-2 font-bold text-sm transition-all ${formData.type === 'Chốt' ? 'bg-red-50 border-red-500 text-red-700 shadow-lg shadow-red-500/10' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                        >
                                            Phát tán (Bán)
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Số lượng</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="qty"
                                            value={formData.qty}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            className="input-bento"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Giá cơ sở</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleChange}
                                            placeholder="0"
                                            className="input-bento bg-slate-50 text-slate-500"
                                            readOnly={true}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phí & Thuế</label>
                                        <input
                                            type="number"
                                            step="1"
                                            name="fee"
                                            value={formData.fee}
                                            onChange={handleChange}
                                            placeholder="0"
                                            className="input-bento"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tổng năng lượng (VNĐ)</label>
                                        <input
                                            type="number"
                                            step="1"
                                            name="total_money"
                                            value={formData.total_money}
                                            onChange={handleChange}
                                            placeholder="0"
                                            className="w-full bg-blue-50 border-none rounded-2xl px-5 py-4 text-xl font-bold text-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {mode === 'price' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Giá trị thị trường hiện tại</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    placeholder="Nhập giá thị trường..."
                                    className="w-full bg-blue-50 border-none rounded-2xl px-5 py-5 text-2xl font-bold text-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                                />
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-3 ml-1">
                                    Hệ thống sẽ cập nhật chỉ số hiệu quả cho các mã này dựa trên giá trị này.
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-5 rounded-[2rem] font-bold text-sm tracking-widest shadow-xl transition-all mt-6 flex items-center justify-center gap-2 active:scale-[0.98] ${loading ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'}`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                            ) : (
                                <>
                                    {mode === 'transaction' ? 'Phê duyệt Tín hiệu' : 'Đồng bộ Giá trị Thị trường'}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
