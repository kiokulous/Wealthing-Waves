'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { getAllTransactions, getAllMarketPrices } from '@/lib/api/database'
import { calculatePortfolio } from '@/lib/api/portfolio'
import Sparkline from '@/components/Sparkline'
import type { Transaction, MarketPrice } from '@/lib/supabase'
import type { PortfolioSummary } from '@/lib/api/portfolio'
import { PlusCircle, Wallet, ArrowUpRight, ArrowDownRight, TrendingUp, Search, Bell } from 'lucide-react'
import Image from 'next/image'

const CATEGORY_CONFIG: Record<string, { img: string; color: string; bg: string }> = {
    'Cổ phiếu': { img: '/stock_icon.png', color: '#2C56ED', bg: '#E3C9FB' },      // Lavender
    'Chứng chỉ quỹ': { img: '/fund_icon.png', color: '#10B981', bg: '#C9FBF5' },  // Mint
    'Vàng': { img: '/gold_icon.png', color: '#F59E0B', bg: '#DEF8C9' },          // Green
    'Tiết kiệm': { img: '/saving_icon.png', color: '#6366F1', bg: '#F7F7F7' },
}

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()

    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([])
    const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [filterYear, setFilterYear] = useState<number | 'all'>('all')
    const [availableYears, setAvailableYears] = useState<number[]>([])

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        }
    }, [user, authLoading, router])

    useEffect(() => {
        if (user) {
            loadData()
        }
    }, [user])

    useEffect(() => {
        if (transactions.length > 0 && marketPrices.length > 0) {
            calculateAndSetPortfolio()
        }
    }, [transactions, marketPrices, filterYear])

    const loadData = async () => {
        try {
            setLoading(true)
            setError('')

            const [txns, prices] = await Promise.all([
                getAllTransactions(),
                getAllMarketPrices()
            ])

            setTransactions(txns)
            setMarketPrices(prices)

            const years = Array.from(new Set(txns.map(t => new Date(t.date).getFullYear())))
                .filter(y => !isNaN(y))
                .sort((a, b) => b - a)
            setAvailableYears(years)

            setLoading(false)
        } catch (err: any) {
            console.error('Error loading data:', err)
            setError(err.message || 'Không thể tải dữ liệu')
            setLoading(false)
        }
    }

    const calculateAndSetPortfolio = () => {
        const year = filterYear === 'all' ? undefined : filterYear
        const portfolioData = calculatePortfolio(transactions, marketPrices, year)
        setPortfolio(portfolioData)
    }

    const handleItemClick = (symbol: string) => {
        router.push(`/portfolio/${symbol}`)
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN').format(Math.round(value)) + ' đ'
    }

    // Updated to show full numbers as requested
    const formatValue = (value: number) => {
        return new Intl.NumberFormat('vi-VN').format(Math.round(value))
    }

    const getSparklineData = (symbol: string): number[] => {
        return marketPrices
            .filter(p => p.symbol === symbol)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-7)
            .map(p => p.price)
    }

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">Đang đồng bộ...</p>
                </div>
            </div>
        )
    }

    if (!user || !portfolio) return null

    const isProfit = portfolio.totalProfitLoss >= 0
    const lastUpdate = marketPrices.length > 0
        ? new Date(Math.max(...marketPrices.map(p => new Date(p.date).getTime()))).toLocaleDateString('vi-VN')
        : ''

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700">
            {/* 1. Header Area */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-1">
                        Chào buổi sáng, <span className="text-blue-600">{user.email?.split('@')[0]}</span>!
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight">Dưới đây là tổng quan tài chính của bạn hôm nay.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative min-w-[200px]">
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

            {/* 2. Main Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6 px-2">

                {/* Total Assets Card (Big) */}
                <div className="md:col-span-4 lg:col-span-4 lg:row-span-2 bento-card p-10 flex flex-col justify-between group overflow-hidden relative">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-700" />

                    <div>
                        <div className="flex items-center justify-between mb-8">
                            <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest">Tổng số dư</p>
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Wallet className="w-5 h-5" />
                            </div>
                        </div>
                        <h2 className="text-4xl font-bold tracking-tighter text-slate-900 mb-2">
                            {formatValue(portfolio.totalCurrentValue)}
                            <span className="text-lg font-bold text-slate-300 ml-2 tracking-normal uppercase">đ</span>
                        </h2>
                        <div className={`inline-flex items-center gap-1 text-sm font-bold ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                            {isProfit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            {portfolio.totalProfitLossPercent.toFixed(1)}% So với tháng trước
                        </div>
                    </div>

                    <div className="mt-12">
                        <div className="h-32 w-full mt-auto">
                            <Sparkline
                                data={[30, 45, 38, 55, 48, 65, 75]} // Decorative
                                width={300}
                                height={80}
                                color="#2C56ED"
                                className="opacity-80"
                            />
                        </div>
                    </div>
                </div>

                {/* Net Profit Overview Card (Medium) */}
                <div className="md:col-span-4 lg:col-span-5 bento-card p-8 group">
                    <div className="flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest">Tổng quan Lợi nhuận</p>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-slate-50 rounded-full text-[10px] font-bold text-slate-400">Hàng tháng</span>
                                <span className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 cursor-pointer">...</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-slate-400 font-bold text-[10px] uppercase mb-1">Đã đầu tư</p>
                                <p className="text-xl font-bold text-slate-900 tracking-tight">{formatValue(portfolio.totalInvested)} đ</p>
                            </div>
                            <div>
                                <p className="text-slate-400 font-bold text-[10px] uppercase mb-1">Lợi nhuận ròng</p>
                                <p className={`text-xl font-bold tracking-tight ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {isProfit ? '+' : ''}{formatValue(portfolio.totalProfitLoss)} đ
                                </p>
                            </div>
                        </div>

                        <div className="mt-auto pt-6 flex gap-1 items-end">
                            {[40, 60, 45, 55, 70, 40, 85].map((h, i) => (
                                <div key={i} className="flex-1 bg-slate-100 rounded-lg group-hover:bg-blue-600 transition-colors" style={{ height: `${h}%` }} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Cash & Liquidity Card (Small-Medium) */}
                <div className="md:col-span-4 lg:col-span-3 bento-card p-8 bg-blue-600 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                        <TrendingUp className="w-10 h-10 text-white/20" />
                    </div>
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <p className="text-white/60 font-bold uppercase text-[11px] tracking-widest mb-1">Thao tác nhanh</p>
                            <h3 className="text-2xl font-bold">Quản lý dòng tiền</h3>
                        </div>
                        <p className="text-sm text-white/80 my-4 leading-relaxed">Hệ thống đang hoạt động. Cập nhật cuối: {lastUpdate}.</p>
                        <button
                            onClick={() => router.push('/transaction')}
                            className="w-full bg-white text-blue-600 font-bold py-3 rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Đồng bộ dữ liệu mới
                        </button>
                    </div>
                </div>

                {/* Categories Row */}
                <div className="md:col-span-4 lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                    {portfolio.categories.map(cat => {
                        const config = CATEGORY_CONFIG[cat.category] || CATEGORY_CONFIG['Cổ phiếu']
                        const isCatProfit = cat.profitLoss >= 0

                        return (
                            <div key={cat.category} className="bento-card p-6 flex flex-col gap-4 group cursor-pointer hover:bg-slate-50 shadow-none border-slate-100">
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center p-2" style={{ backgroundColor: config.bg }}>
                                    <Image src={config.img} alt={cat.category} width={24} height={24} className="object-contain" />
                                </div>
                                <div>
                                    <p className="text-slate-400 font-bold text-[10px] uppercase mb-1">{cat.category}</p>
                                    <p className="text-lg font-bold text-slate-900 tracking-tight">{formatValue(cat.currentValue)} đ</p>
                                    <div className={`text-xs font-bold mt-1 ${isCatProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {isCatProfit ? '↑' : '↓'} {cat.profitLossPercent.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* 3. Market Signals / Asset List (Long Bento Block) */}
            <div className="px-2 pb-10">
                <div className="bento-card overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Tín hiệu Thị trường</h3>
                            <p className="text-slate-500 text-sm font-medium">Đang theo dõi {portfolio.items.length} chỉ dấu hoạt động.</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">
                                <Search className="w-5 h-5" />
                            </div>
                            <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">
                                <Bell className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-50">
                        {portfolio.items
                            .filter(item => item.quantity > 0)
                            .map(item => {
                                const itemProfit = item.profitLoss >= 0
                                const sparklineData = getSparklineData(item.symbol)

                                return (
                                    <div
                                        key={item.symbol}
                                        onClick={() => handleItemClick(item.symbol)}
                                        className="p-6 md:p-8 flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                {item.symbol.substring(0, 3)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-lg tracking-tight">{item.symbol}</h4>
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{item.category}</p>
                                            </div>
                                        </div>

                                        <div className="hidden lg:block w-48 opacity-40 group-hover:opacity-100 transition-opacity px-8">
                                            <Sparkline
                                                data={sparklineData.length > 0 ? sparklineData : [10, 20, 15, 25, 22, 30, 28]}
                                                width={150}
                                                height={30}
                                                color={itemProfit ? '#10B981' : '#EF4444'}
                                                className="transition-all"
                                            />
                                        </div>

                                        <div className="text-right">
                                            <p className="font-bold text-slate-900 text-lg tracking-tight">{formatValue(item.currentValue)} đ</p>
                                            <div className={`text-xs font-bold mt-1 ${itemProfit ? 'text-emerald-500' : 'text-red-500'} flex items-center justify-end gap-1`}>
                                                {itemProfit ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                {Math.abs(item.profitLossPercent).toFixed(1)}% Hiệu quả
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                    </div>

                    {portfolio.items.length === 0 && (
                        <div className="p-20 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Wallet className="w-8 h-8 text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Chưa phát hiện tín hiệu nào.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
