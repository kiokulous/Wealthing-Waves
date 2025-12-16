'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { getAllTransactions, getAllMarketPrices } from '@/lib/api/database'
import { calculatePortfolio } from '@/lib/api/portfolio'
import type { Transaction, MarketPrice } from '@/lib/supabase'
import type { PortfolioSummary } from '@/lib/api/portfolio'

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

            // Extract years from transactions
            const years = [...new Set(txns.map(t => new Date(t.date).getFullYear()))]
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

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(value)
    }

    const formatCompact = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            notation: 'compact',
            maximumFractionDigits: 1
        }).format(value)
    }

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-wave-primary flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-16 h-16 border-4 border-[rgb(var(--accent-primary))] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-wave-secondary">Loading resonance data...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    if (error) {
        return (
            <div className="min-h-screen bg-wave-primary p-6 flex items-center justify-center">
                <div className="wave-card p-6 max-w-md">
                    <h2 className="text-xl font-bold text-loss-text mb-2">Error Loading Data</h2>
                    <p className="text-wave-secondary mb-4">{error}</p>
                    <button onClick={loadData} className="btn-wave">
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    if (!portfolio) {
        return null
    }

    const displayValue = filterYear === 'all' ? portfolio.totalCurrentValue : portfolio.totalProfitLoss
    const displayLabel = filterYear === 'all' ? 'Tổng Tài Sản' : `Lợi Nhuận ${filterYear}`

    return (
        <div className="min-h-screen bg-wave-primary pb-20">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-wave-primary/95 backdrop-blur-xl border-b border-wave px-4 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[rgb(var(--purple-medium))] to-[rgb(var(--accent-primary))] flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="m6 16.5l-3 2.94V11h3m5 3.66l-1.57-1.34L8 14.64V7h3m5 6l-3 3V3h3m2.81 9.81L17 11h5v5l-1.79-1.79L13 21.36l-3.47-3.02L5.75 22H3l6.47-6.34L13 18.64" />
                            </svg>
                        </div>

                        <div className="flex flex-col">
                            <p className="text-[10px] font-bold text-wave-tertiary uppercase">Xem hoạt động</p>
                            <select
                                value={filterYear}
                                onChange={(e) => setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                className="bg-transparent text-sm font-bold text-wave-primary outline-none border-none cursor-pointer"
                            >
                                <option value="all">Toàn bộ (Lịch sử)</option>
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={() => signOut()}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-wave-tertiary/50 text-wave-secondary hover:text-loss-text transition"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                {/* Hero Card - Total Assets */}
                <div className="wave-card p-6 relative overflow-hidden">
                    <div className="absolute -top-6 -right-6 w-32 h-32 bg-[rgb(var(--accent-primary))] opacity-10 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-wave-secondary uppercase tracking-wider mb-2">
                            {displayLabel}
                        </p>
                        <h2 className="energy-level mb-4">
                            {formatCurrency(displayValue)}
                        </h2>
                        <div className="flex items-center gap-3">
                            <div className={`px-3 py-1.5 rounded-lg font-bold text-sm ${portfolio.totalProfitLoss >= 0 ? 'profit-bg profit-text' : 'loss-bg loss-text'
                                }`}>
                                {portfolio.totalProfitLoss >= 0 ? '+' : ''}{portfolio.totalProfitLossPercent.toFixed(2)}%
                            </div>
                            <span className={`text-sm font-semibold ${portfolio.totalProfitLoss >= 0 ? 'profit-text' : 'loss-text'
                                }`}>
                                {portfolio.totalProfitLoss >= 0 ? '+' : ''}{formatCurrency(portfolio.totalProfitLoss)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Category Performance */}
                <div>
                    <h3 className="font-bold text-wave-primary text-lg mb-3 px-1">
                        Hiệu quả hoạt động
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {portfolio.categories.map(cat => (
                            <div key={cat.category} className="wave-card p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-bold text-wave-primary">{cat.category}</h4>
                                    <span className="text-xs font-bold text-wave-tertiary">
                                        Tỷ trọng: {cat.weight.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-wave-secondary">Giá trị hiện tại</span>
                                        <span className="font-bold text-wave-primary">
                                            {formatCurrency(cat.currentValue)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-wave-secondary">Lợi nhuận</span>
                                        <div className={`font-bold ${cat.profitLoss >= 0 ? 'profit-text' : 'loss-text'}`}>
                                            {cat.profitLoss >= 0 ? '+' : ''}{formatCompact(cat.profitLoss)}đ
                                            <span className="text-xs ml-1">
                                                ({cat.profitLoss >= 0 ? '+' : ''}{cat.profitLossPercent.toFixed(1)}%)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Portfolio List */}
                <div>
                    <h3 className="font-bold text-wave-primary text-lg mb-3 px-1">
                        Danh mục chi tiết
                    </h3>
                    <div className="wave-card overflow-hidden">
                        <div className="divide-y divide-wave">
                            {portfolio.items
                                .filter(item => item.quantity > 0)
                                .map(item => (
                                    <div key={item.symbol} className="p-4 hover:bg-wave-tertiary/30 transition cursor-pointer">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-wave-primary mb-1">{item.symbol}</h4>
                                                <p className="text-xs text-wave-tertiary">{item.category}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-wave-primary">
                                                    {formatCompact(item.currentValue)}
                                                </p>
                                                <p className={`text-xs font-bold ${item.profitLoss >= 0 ? 'profit-text' : 'loss-text'
                                                    }`}>
                                                    {item.profitLoss >= 0 ? '+' : ''}{item.profitLossPercent.toFixed(1)}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                    {portfolio.items.filter(i => i.quantity > 0).length === 0 && (
                        <div className="wave-card p-8 text-center">
                            <p className="text-wave-secondary">Chưa có tài sản nào</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
