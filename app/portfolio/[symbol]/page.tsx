'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { getAllTransactions, getAllMarketPrices } from '@/lib/api/database'
import { calculateSymbolDetail } from '@/lib/api/portfolio'
import Sparkline from '@/components/Sparkline'
import type { Transaction, MarketPrice } from '@/lib/supabase'
import { ArrowLeft, TrendingUp, TrendingDown, Clock, Calendar, CheckCircle2, ArrowUpRight, ArrowDownRight, Activity, PlusCircle } from 'lucide-react'

export default function PortfolioDetailPage() {
    const params = useParams()
    const symbol = typeof params.symbol === 'string' ? decodeURIComponent(params.symbol) : ''
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()

    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([])
    const [loading, setLoading] = useState(true)
    const [filterYear, setFilterYear] = useState<number | 'all'>('all')
    const [detail, setDetail] = useState<any>(null)
    const [availableYears, setAvailableYears] = useState<number[]>([])

    useEffect(() => {
        if (!authLoading && !user) router.push('/login')
    }, [user, authLoading, router])

    useEffect(() => {
        if (user && symbol) loadData()
    }, [user, symbol])

    useEffect(() => {
        if (transactions.length > 0) {
            calculateDetail()
        }
    }, [transactions, marketPrices, filterYear])

    const loadData = async () => {
        try {
            setLoading(true)
            const [txns, prices] = await Promise.all([
                getAllTransactions(),
                getAllMarketPrices()
            ])
            setTransactions(txns)
            setMarketPrices(prices)

            const years = Array.from(new Set(txns.filter(t => t.symbol === symbol).map(t => new Date(t.date).getFullYear())))
                .filter(y => !isNaN(y))
                .sort((a, b) => b - a)
            setAvailableYears(years)

            setLoading(false)
        } catch (error) {
            console.error('Error loading detail:', error)
            setLoading(false)
        }
    }

    const calculateDetail = () => {
        const year = filterYear === 'all' ? undefined : filterYear
        const data = calculateSymbolDetail(symbol, transactions, marketPrices, year)
        setDetail(data)
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(Math.round(val)) + ' đ'
    const formatValue = (val: number) => new Intl.NumberFormat('vi-VN').format(Math.round(val))
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('vi-VN')

    if (authLoading || (loading && !detail)) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">Phân tích sóng tín hiệu...</p>
                </div>
            </div>
        )
    }

    if (!detail) return null

    const isProfit = detail.totalPL >= 0

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Header / Nav */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm hover:translate-x-[-2px]"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 tracking-tight leading-none mb-1">{symbol}</h1>
                        <p className="text-slate-500 font-medium tracking-tight uppercase text-xs">Hồ sơ Cộng hưởng Tài sản</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative min-w-[160px]">
                        <select
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="w-full appearance-none bg-white border border-slate-200 text-slate-900 rounded-2xl py-3 pl-5 pr-12 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer transition-all"
                        >
                            <option value="all">Toàn bộ lịch sử</option>
                            {availableYears.map(year => (
                                <option key={year} value={year}>Năm {year}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 border-l border-slate-100 my-2">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Stats Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6 px-2">

                {/* Total P/L Card (Hero) */}
                <div className="md:col-span-4 lg:col-span-4 lg:row-span-2 bento-card p-10 flex flex-col justify-between group overflow-hidden relative">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50 transition-transform duration-700" />

                    <div>
                        <div className="flex items-center justify-between mb-8">
                            <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest">Hiệu suất ròng</p>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isProfit ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                <Activity className="w-5 h-5" />
                            </div>
                        </div>
                        <h2 className={`text-3xl lg:text-4xl font-bold tracking-tighter mb-2 ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isProfit ? '+' : ''}{formatValue(detail.totalPL)} <span className="text-sm">đ</span>
                        </h2>
                        <div className={`inline-flex items-center gap-1 text-sm font-bold ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                            {isProfit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            {detail.plPercent.toFixed(2)}% ROI
                        </div>
                    </div>

                    <div className="mt-12">
                        <div className="h-32 w-full mt-auto">
                            <Sparkline
                                data={detail.priceHistory.map((p: any) => p.price)}
                                width={300}
                                height={80}
                                color={isProfit ? '#10B981' : '#EF4444'}
                                className="opacity-80"
                            />
                        </div>
                    </div>
                </div>

                {/* Holdings & Cost Basis (Medium) */}
                <div className="md:col-span-4 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bento-card p-8 group hover:bg-slate-50 transition-all">
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest">Vị thế hoạt động</p>
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 tracking-tight leading-none mb-1">
                            {detail.quantity.toLocaleString('vi-VN')}
                            <span className="text-sm font-bold text-slate-300 ml-2 uppercase tracking-widest">Đơn vị</span>
                        </h3>
                        <p className="text-slate-400 text-xs font-bold uppercase mt-2">Hiện có trong danh mục</p>
                    </div>

                    <div className="bento-card p-8 group hover:bg-slate-50 transition-all">
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest">Vốn đầu tư</p>
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <Calendar className="w-4 h-4" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1">
                            {formatValue(detail.invested)} <span className="text-sm">đ</span>
                        </h3>
                        <p className="text-slate-400 text-xs font-bold uppercase mt-2">Tổng giá vốn</p>
                    </div>
                </div>

                {/* Timeline Details (Long Horizontal) */}
                <div className="md:col-span-4 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bento-card p-8 bg-[#C9FBF5] border-none group cursor-default">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/50 flex items-center justify-center text-emerald-700">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-emerald-700/60 font-bold uppercase text-[10px] tracking-widest mb-1">Giai đoạn Cộng hưởng</p>
                                <p className="text-2xl font-bold text-emerald-900 tracking-tight">{detail.holdingDays} <span className="text-xs uppercase">Ngày</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="bento-card p-8 bg-[#E3C9FB] border-none group cursor-default">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/50 flex items-center justify-center text-purple-700">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-purple-700/60 font-bold uppercase text-[10px] tracking-widest mb-1">Điểm vào Ban đầu</p>
                                <p className="text-2xl font-bold text-purple-900 tracking-tight">{detail.firstBuyDate ? formatDate(detail.firstBuyDate) : '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Table Bento Block */}
            <div className="px-2">
                <div className="bento-card overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Lịch sử Tín hiệu</h3>
                            <p className="text-slate-500 text-sm font-medium">Nhật ký chi tiết tất cả các tương tác đã ghi lại cho {symbol}.</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="divide-y divide-slate-50">
                        {detail.transactions.map((t: Transaction) => {
                            const isBuy = t.type === 'Mua'
                            return (
                                <div key={t.id} className="p-6 md:p-8 flex items-center justify-between hover:bg-slate-50 transition-all group">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isBuy
                                            ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
                                            : 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white'
                                            }`}>
                                            {isBuy ? <PlusCircle className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-lg tracking-tight">{formatDate(t.date)}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{isBuy ? 'Tăng vị thế' : 'Giảm vị thế'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold text-lg tracking-tight ${isBuy ? 'text-slate-900' : 'text-red-500'}`}>
                                            {isBuy ? '' : '+'}{formatValue(t.total_money)} đ
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                            {t.quantity} Đơn vị @ {formatValue(t.price)}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {detail.transactions.length === 0 && (
                        <div className="p-20 text-center">
                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Không tìm thấy dữ liệu lịch sử.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
