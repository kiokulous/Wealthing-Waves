'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { getAllTransactions, getAllMarketPrices } from '@/lib/api/database'
import { calculateSymbolDetail } from '@/lib/api/portfolio'
import Sparkline from '@/components/Sparkline'
import type { Transaction, MarketPrice } from '@/lib/supabase'

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
                getAllTransactions(), // We fetch all to filter by symbol locally or API could support it
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
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('vi-VN')

    if (loading || !detail) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
            </div>
        )
    }

    const isProfit = detail.totalPL >= 0

    return (
        <div className="min-h-screen bg-slate-50 pb-10">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition"
                    >
                        <i className="fa-solid fa-arrow-left"></i> Quay lại
                    </button>
                    <h1 className="font-bold text-lg text-slate-800">{symbol}</h1>
                    <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="text-sm border-none bg-transparent font-semibold text-indigo-600 outline-none cursor-pointer"
                    >
                        <option value="all">Lịch sử</option>
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                {/* Big Stats Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="mb-6">
                        <p className="text-sm text-slate-500 font-medium uppercase mb-1">Lợi nhuận ròng</p>
                        <div className="flex items-baseline gap-3">
                            <h2 className={`text-3xl font-bold ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {isProfit ? '+' : ''}{formatCurrency(detail.totalPL)}
                            </h2>
                            <span className={`px-2 py-1 rounded-lg text-sm font-bold ${isProfit ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {isProfit ? '+' : ''}{detail.plPercent.toFixed(2)}%
                            </span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-6">
                        <div
                            className={`h-full rounded-full ${isProfit ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            style={{ width: `${Math.min(Math.abs(detail.plPercent), 100)}%` }}
                        ></div>
                    </div>

                    {/* Grid Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Hiện nắm giữ</p>
                            <p className="font-bold text-slate-800 text-lg">{detail.quantity.toLocaleString('vi-VN')} CP</p>
                            <p className="text-xs text-slate-500">≈ {formatCurrency(detail.currentValue)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Giá vốn</p>
                            <p className="font-bold text-slate-800 text-lg">{formatCurrency(detail.invested)}</p>
                            <p className="text-xs text-slate-500">
                                TB: {detail.quantity > 0 ? formatCurrency(detail.invested / detail.quantity).replace(' đ', '') : 0}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Price Chart Area (Placeholder for now, using Sparkline for trend) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800">Biến động giá</h3>
                        <div className="text-right">
                            <p className="font-bold text-slate-800">{formatCurrency(detail.latestPrice)}</p>
                            <p className="text-xs text-slate-500">
                                {detail.latestPriceDate
                                    ? `Cập nhật: ${new Date(detail.latestPriceDate).toLocaleDateString('vi-VN')}`
                                    : 'Giá thị trường'
                                }
                            </p>
                        </div>
                    </div>
                    <div className="w-full h-32 flex items-end">
                        <Sparkline
                            data={detail.priceHistory.map((p: any) => p.price)}
                            width={600}
                            height={128}
                            color={isProfit ? '#10b981' : '#f43f5e'}
                            className="w-full h-full"
                        />
                    </div>
                </div>

                {/* Info Card */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-4">
                        <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Thời gian giữ</p>
                        <p className="font-bold text-slate-800 text-xl">{detail.holdingDays} <span className="text-sm font-normal text-slate-500">ngày</span></p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-4">
                        <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Ngày mua đầu</p>
                        <p className="font-bold text-slate-800 text-xl">{detail.firstBuyDate ? new Date(detail.firstBuyDate).toLocaleDateString('vi-VN') : '-'}</p>
                    </div>
                </div>

                {/* Transactions History */}
                <div>
                    <h3 className="font-bold text-slate-800 mb-3 px-1">Lịch sử giao dịch</h3>
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="divide-y divide-slate-100">
                            {detail.transactions.map((t: Transaction) => (
                                <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${t.type === 'Mua'
                                            ? 'bg-emerald-100 text-emerald-600'
                                            : 'bg-rose-100 text-rose-600'
                                            }`}>
                                            {t.type === 'Mua' ? 'MUA' : 'BÁN'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{formatDate(t.date)}</p>
                                            <p className="text-xs text-slate-500">{t.notes || 'Không có ghi chú'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold text-sm ${t.type === 'Mua' ? 'text-slate-800' : 'text-rose-600'}`}>
                                            {t.type === 'Mua' ? '-' : '+'}{formatCurrency(t.total_money)}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {t.quantity} CP x {formatCurrency(t.price).replace(' đ', '')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
