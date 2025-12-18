'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { getAllTransactions, getAllMarketPrices } from '@/lib/api/database'
import { calculatePortfolio } from '@/lib/api/portfolio'
import Sparkline from '@/components/Sparkline'
import FloatingNav from '@/components/FloatingNav'
import type { Transaction, MarketPrice } from '@/lib/supabase'
import type { PortfolioSummary } from '@/lib/api/portfolio'
import Image from 'next/image'

const CATEGORY_ICONS: Record<string, { img: string; bg: string }> = {
    'Cổ phiếu': { img: '/stock_icon.png', bg: '#f8fafc' },
    'Chứng chỉ quỹ': { img: '/fund_icon.png', bg: '#f8fafc' },
    'Vàng': { img: '/gold_icon.png', bg: '#f8fafc' },
    'Tiết kiệm': { img: '/saving_icon.png', bg: '#f8fafc' },
}

export default function DashboardPage() {
    const { user, loading: authLoading, signOut } = useAuth()
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
            setError(err.message || 'Failed to load data')
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

    const formatCompact = (value: number) => {
        if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'B'
        if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M'
        if (value >= 1000) return (value / 1000).toFixed(1) + 'K'
        return value.toFixed(0)
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-slate-400 text-sm">Đang tải...</p>
                </div>
            </div>
        )
    }

    if (!user) return null

    if (error) {
        return (
            <div className="min-h-screen p-6 flex items-center justify-center">
                <div className="soft-card p-6 max-w-md w-full text-center">
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Lỗi tải dữ liệu</h2>
                    <p className="text-slate-500 mb-4">{error}</p>
                    <button onClick={loadData} className="btn-modern mx-auto">
                        Thử lại
                    </button>
                </div>
            </div>
        )
    }

    if (!portfolio) return null

    const displayValue = filterYear === 'all' ? portfolio.totalCurrentValue : portfolio.totalProfitLoss
    const displayLabel = filterYear === 'all' ? 'Tổng tài sản' : `Lợi nhuận ${filterYear}`
    const isProfit = portfolio.totalProfitLoss >= 0
    const lastUpdate = marketPrices.length > 0
        ? new Date(Math.max(...marketPrices.map(p => new Date(p.date).getTime()))).toLocaleDateString('vi-VN')
        : ''

    return (
        <div className="min-h-screen pb-10 px-4 pt-4 md:pt-8 bg-[#f8fafc]">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* 1. Header & Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Wealthing Waves</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <p className="text-sm text-slate-400 font-medium">Cập nhật: {lastUpdate}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <select
                                value={filterYear}
                                onChange={(e) => setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                className="appearance-none bg-white border border-slate-100 shadow-sm rounded-xl py-2 pl-4 pr-10 text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                            >
                                <option value="all">Tất cả</option>
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        <button onClick={() => signOut()} className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* 2. Key Metrics (Floating Pills) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Net Worth Pill */}
                    <div className="floating-pill justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tổng tài sản</p>
                                <p className="text-2xl font-bold text-slate-800">{formatCompact(portfolio.totalCurrentValue)}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-sm font-bold ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {isProfit ? '+' : ''}{portfolio.totalProfitLossPercent.toFixed(1)}%
                            </div>
                            <p className="text-xs text-slate-400 font-medium">Hiệu suất</p>
                        </div>
                    </div>

                    {/* Profit Pill */}
                    <div className="floating-pill justify-between group">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${isProfit ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/30' : 'bg-gradient-to-br from-rose-400 to-red-500 shadow-rose-500/30'}`}>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tổng lợi nhuận</p>
                                <p className={`text-2xl font-bold ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCompact(portfolio.totalProfitLoss)}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-800">{formatCompact(portfolio.totalInvested)}</p>
                            <p className="text-xs text-slate-400 font-medium">Vốn đầu tư</p>
                        </div>
                    </div>
                </div>

                {/* 3. Categories Grid */}
                <div>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-lg font-bold text-slate-800">Danh mục tài sản</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {portfolio.categories.map(cat => {
                            const IconConfig = CATEGORY_ICONS[cat.category] || { img: '/stock_icon.png', bg: '#ffffff' }
                            const isCatProfit = cat.profitLoss >= 0

                            return (
                                <div key={cat.category} className="relative bg-white border border-slate-100 rounded-[2rem] p-5 h-48 overflow-hidden hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 group cursor-pointer" onClick={() => { }}>
                                    {/* Background decoration - very subtle now to blend with white image bg */}
                                    <div className="absolute top-0 right-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-transparent to-indigo-50/50 pointer-events-none"></div>

                                    {/* 3D Icon Image - Floating Effect */}
                                    {/* Added mix-blend-multiply to help blend white backgrounds if possible, though 'bg-white' on parent is main fix */}
                                    <div className="absolute -bottom-2 -right-2 w-36 h-36 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 z-0">
                                        <Image
                                            src={IconConfig.img}
                                            alt={cat.category}
                                            fill
                                            className="object-contain mix-blend-multiply"
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="relative z-10 flex flex-col justify-between h-full">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] font-bold text-slate-500 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full uppercase tracking-wider border border-slate-100 shadow-sm">
                                                {cat.weight.toFixed(0)}%
                                            </span>
                                        </div>

                                        <div className="mb-2">
                                            <p className="text-sm font-bold text-slate-500 mb-1 tracking-wide">{cat.category}</p>
                                            <p className="text-xl font-extrabold text-slate-800 tracking-tight leading-none mb-2">
                                                {formatCompact(cat.currentValue)}
                                            </p>
                                            <div className={`inline-flex items-center gap-1.5 font-bold text-xs px-2 py-1 rounded-lg backdrop-blur-sm ${isCatProfit ? 'bg-emerald-50/80 text-emerald-600' : 'bg-rose-50/80 text-rose-600'}`}>
                                                {isCatProfit ? '+' : ''}{cat.profitLossPercent.toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* 4. Portfolio List */}
                <div className="mb-24"> {/* Added margin bottom for floating nav space */}
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-lg font-bold text-slate-800">Chi tiết danh mục</h3>
                        <button className="text-sm font-bold text-indigo-500 hover:text-indigo-600 transition-colors">Xem tất cả</button>
                    </div>

                    <div className="soft-card overflow-hidden">
                        <div className="divide-y divide-slate-50">
                            {portfolio.items
                                .filter(item => item.quantity > 0)
                                .map(item => {
                                    const itemProfit = item.profitLoss >= 0
                                    const sparklineData = getSparklineData(item.symbol)
                                    const sparklineColor = itemProfit ? '#10b981' : '#f43f5e'

                                    return (
                                        <div
                                            key={item.symbol}
                                            onClick={() => handleItemClick(item.symbol)}
                                            className="p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 group-hover:bg-white group-hover:shadow-md transition-all">
                                                    {item.symbol.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800">{item.symbol}</h4>
                                                    <p className="text-xs text-slate-400 font-medium">{item.category}</p>
                                                </div>
                                            </div>

                                            <div className="hidden md:block w-32">
                                                <Sparkline
                                                    data={sparklineData}
                                                    width={100}
                                                    height={30}
                                                    color={sparklineColor}
                                                />
                                            </div>

                                            <div className="text-right">
                                                <p className="font-bold text-slate-800">{formatCompact(item.currentValue)}</p>
                                                <div className={`text-xs font-bold ${itemProfit ? 'text-emerald-500' : 'text-rose-500'} bg-slate-100 inline-block px-2 py-0.5 rounded-md mt-1 group-hover:bg-white transition-colors`}>
                                                    {itemProfit ? '+' : ''}{item.profitLossPercent.toFixed(1)}%
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}

                            {portfolio.items.length === 0 && (
                                <div className="p-8 text-center text-slate-400">
                                    Chưa có tài sản nào.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* FLOATING NAVIGATION BAR */}
            <FloatingNav />
        </div>
    )
}
