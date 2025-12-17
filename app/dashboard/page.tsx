'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { getAllTransactions, getAllMarketPrices } from '@/lib/api/database'
import { calculatePortfolio } from '@/lib/api/portfolio'
import Sparkline from '@/components/Sparkline'
import type { Transaction, MarketPrice } from '@/lib/supabase'
import type { PortfolioSummary } from '@/lib/api/portfolio'

const CATEGORY_ICONS: Record<string, { emoji: string; class: string }> = {
    'Cổ phiếu': { emoji: '📈', class: 'stock' },
    'Chứng chỉ quỹ': { emoji: '💼', class: 'fund' },
    'Vàng': { emoji: '🪙', class: 'gold' },
    'Tiết kiệm': { emoji: '💰', class: 'saving' },
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
                    <p className="text-secondary text-sm">Đang tải dữ liệu...</p>
                </div>
            </div>
        )
    }

    if (!user) return null

    if (error) {
        return (
            <div className="min-h-screen p-6 flex items-center justify-center">
                <div className="card p-6 max-w-md">
                    <h2 className="text-xl font-bold text-loss-text mb-2">Lỗi tải dữ liệu</h2>
                    <p className="text-secondary mb-4">{error}</p>
                    <button onClick={loadData} className="btn-primary">
                        Thử lại
                    </button>
                </div>
            </div>
        )
    }

    if (!portfolio) return null

    const displayValue = filterYear === 'all' ? portfolio.totalCurrentValue : portfolio.totalProfitLoss
    const displayLabel = filterYear === 'all' ? 'Tổng Tài Sản' : `Lợi Nhuận ${filterYear}`
    const isProfit = portfolio.totalProfitLoss >= 0

    return (
        <div className="min-h-screen pb-6">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-surface border-b border-default px-4 py-4 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <div>
                            <h1 className="text-xl font-bold text-primary">Wealthing Waves</h1>
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-tertiary">Investment Portfolio Tracker</p>
                                {marketPrices.length > 0 && (
                                    <>
                                        <span className="text-xs text-slate-300">•</span>
                                        <p className="text-xs text-emerald-600 font-medium">
                                            Cập nhật: {new Date(Math.max(...marketPrices.map(p => new Date(p.date).getTime()))).toLocaleDateString('vi-VN')}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="input text-sm py-2 px-3"
                        >
                            <option value="all">Lịch sử</option>
                            {availableYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>

                        <button
                            onClick={() => signOut()}
                            className="p-2 hover:bg-slate-100 rounded-lg transition"
                            title="Đăng xuất"
                        >
                            <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Net Worth Card with Gradient */}
                <div className="net-worth-card">
                    <div className="relative z-10">
                        <p className="text-white/80 text-sm font-semibold mb-2 uppercase tracking-wide">
                            {displayLabel}
                        </p>
                        <h2 className="big-number text-white mb-4">
                            {formatCurrency(displayValue)}
                        </h2>
                        <div className="flex items-center gap-4">
                            <div className={`px-4 py-2 rounded-full font-bold text-sm backdrop-blur-sm ${isProfit ? 'bg-white/20' : 'bg-black/20'
                                }`}>
                                {isProfit ? '+' : ''}{portfolio.totalProfitLossPercent.toFixed(2)}%
                            </div>
                            <span className="text-white/90 font-semibold">
                                {isProfit ? '+' : ''}{formatCurrency(portfolio.totalProfitLoss)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Category Performance - Vertical Stack */}
                <div>
                    <h3 className="font-bold text-primary text-lg mb-3">Hiệu quả hoạt động</h3>
                    <div className="space-y-3">
                        {portfolio.categories.map(cat => {
                            const icon = CATEGORY_ICONS[cat.category] || { emoji: '📊', class: 'stock' }
                            const catProfit = cat.profitLoss >= 0

                            return (
                                <div key={cat.category} className="card p-4">
                                    {/* Header Row */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`category-icon ${icon.class}`}>
                                                <span className="text-white">{icon.emoji}</span>
                                            </div>
                                            <span className="font-bold text-primary">{cat.category}</span>
                                        </div>
                                        <span className="badge badge-primary">
                                            {cat.weight.toFixed(1)}%
                                        </span>
                                    </div>

                                    {/* Body Rows */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-secondary">Giá trị thị trường</span>
                                            <span className="font-bold text-primary">{formatCurrency(cat.currentValue)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-secondary">Lợi nhuận</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold ${catProfit ? 'profit-text' : 'loss-text'}`}>
                                                    {catProfit ? '+' : ''}{formatCompact(cat.profitLoss)} đ
                                                </span>
                                                <span className={`badge ${catProfit ? 'profit-bg' : 'loss-bg'}`}>
                                                    {catProfit ? '+' : ''}{cat.profitLossPercent.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Portfolio List */}
                <div>
                    <h3 className="font-bold text-primary text-lg mb-3">Danh mục đầu tư</h3>
                    <div className="card divide-y divide-default">
                        {portfolio.items
                            .filter(item => item.quantity > 0)
                            .map(item => {
                                const itemProfit = item.profitLoss >= 0
                                const sparklineData = getSparklineData(item.symbol)
                                const sparklineColor = itemProfit ? 'rgb(16, 185, 129)' : 'rgb(244, 63, 94)'

                                return (
                                    <div
                                        key={item.symbol}
                                        onClick={() => handleItemClick(item.symbol)}
                                        className="p-4 hover:bg-slate-50 transition cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            {/* Left: Icon + Symbol + Profit % */}
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                                    {item.symbol.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-primary">{item.symbol}</p>
                                                    <p className={`text-sm font-semibold ${itemProfit ? 'profit-text' : 'loss-text'}`}>
                                                        {itemProfit ? '+' : ''}{item.profitLossPercent.toFixed(1)}%
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Middle: Sparkline */}
                                            <div className="flex-shrink-0">
                                                <Sparkline
                                                    data={sparklineData}
                                                    width={80}
                                                    height={32}
                                                    color={sparklineColor}
                                                />
                                            </div>

                                            {/* Right: Current Value + Qty */}
                                            <div className="text-right flex-shrink-0">
                                                <p className="font-bold text-primary">{formatCompact(item.currentValue)} đ</p>
                                                <p className="text-xs text-tertiary">SL: {item.quantity.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                    </div>

                    {portfolio.items.filter(i => i.quantity > 0).length === 0 && (
                        <div className="card p-8 text-center">
                            <p className="text-secondary">Chưa có tài sản nào</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
