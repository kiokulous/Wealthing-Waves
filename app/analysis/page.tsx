'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { getAllTransactions, getAllMarketPrices } from '@/lib/api/database'
import { calculatePortfolio, type PortfolioSummary } from '@/lib/api/portfolio'
import { calculatePeriodPerformance } from '@/lib/api/calculate_period_performance'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, ReferenceLine } from 'recharts'
import { Filter, PieChart as PieIcon, TrendingUp, BarChart3 } from 'lucide-react'

const BENTO_CHART_COLORS = ['#2C56ED', '#E3C9FB', '#C9FBF5', '#DEF8C9', '#F7F7F7']

export default function AnalysisPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()

    // Raw Data State
    const [allTransactions, setAllTransactions] = useState<any[]>([])
    const [allPrices, setAllPrices] = useState<any[]>([])

    // Computed State
    const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('Toàn bộ')

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        }
    }, [user, authLoading, router])

    useEffect(() => {
        if (user) loadData()
    }, [user])

    // Re-calculate when filter changes
    useEffect(() => {
        if (allTransactions.length > 0 && allPrices.length > 0) {
            recalculatePortfolio()
        }
    }, [filter, allTransactions, allPrices])

    const loadData = async () => {
        try {
            setLoading(true)
            const [txns, prices] = await Promise.all([
                getAllTransactions(),
                getAllMarketPrices()
            ])
            setAllTransactions(txns)
            setAllPrices(prices)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const recalculatePortfolio = () => {
        const now = new Date()
        let startDate: Date | null = null

        switch (filter) {
            case '30 Ngày':
                startDate = new Date(now.setDate(now.getDate() - 30))
                break
            case '3 Tháng':
                startDate = new Date(now.setMonth(now.getMonth() - 3))
                break
            case '6 Tháng':
                startDate = new Date(now.setMonth(now.getMonth() - 6))
                break
            case '1 Năm':
                startDate = new Date(now.setFullYear(now.getFullYear() - 1))
                break
            case 'Toàn bộ':
            default:
                startDate = null
        }

        const data = calculatePeriodPerformance(allTransactions, allPrices, startDate)
        setPortfolio(data)
    }

    const formatValue = (value: number) => {
        return new Intl.NumberFormat('vi-VN').format(Math.round(value))
    }

    if (authLoading || (loading && !portfolio && allTransactions.length === 0)) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">Đang tính toán chỉ số...</p>
                </div>
            </div>
        )
    }

    if (!portfolio || !user) return null

    // Chart Data Preparation
    const allocationData = portfolio.categories.map(cat => ({
        name: cat.category,
        value: cat.currentValue
    })).filter(d => d.value > 0)

    const profitData = portfolio.categories.map(cat => ({
        name: cat.category,
        pl: cat.profitLoss
    }))

    const assetPerformanceData = portfolio.items
        .filter(item => item.currentValue > 0)
        .sort((a, b) => b.profitLossPercent - a.profitLossPercent)
        .slice(0, 10)
        .map(item => ({
            name: item.symbol,
            value: item.profitLossPercent
        }))

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-1">
                        Phân tích <span className="text-blue-600">Nâng cao</span>
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight">Trực quan hóa sự cộng hưởng và các chỉ số hiệu suất danh mục của bạn.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm overflow-x-auto no-scrollbar">
                        {['30 Ngày', '3 Tháng', '6 Tháng', '1 Năm', 'Toàn bộ'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${filter === f
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
                {/* 1. Allocation Chart */}
                <div className="bento-card p-10 group relative">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <PieIcon className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Phân bổ Danh mục</h3>
                        </div>
                    </div>

                    <div className="h-72 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={allocationData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {allocationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={BENTO_CHART_COLORS[index % BENTO_CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    formatter={(value: number) => new Intl.NumberFormat('vi-VN').format(value) + ' đ'}
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        borderRadius: '24px',
                                        border: '1px solid #E5E7EB',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                        color: '#1B1B1B',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        padding: '12px 16px'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tổng thể</p>
                            <p className="text-2xl font-bold text-slate-900">100%</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-12 pt-8 border-t border-slate-50">
                        {allocationData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-3 group/legend">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BENTO_CHART_COLORS[index % BENTO_CHART_COLORS.length] }}></div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{entry.name}</span>
                                    <span className="text-sm font-bold text-slate-900">{((entry.value / portfolio.totalCurrentValue) * 100).toFixed(0)}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Profit/Loss Analysis (By Category) */}
                <div className="bento-card p-10 group">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Hiệu suất Danh mục</h3>
                    </div>

                    <div className="h-72 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={profitData} margin={{ left: 0, right: 30 }}>
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                                    width={90}
                                />
                                <ReferenceLine x={0} stroke="#f1f5f9" />
                                <RechartsTooltip
                                    formatter={(value: number) => new Intl.NumberFormat('vi-VN').format(value) + ' đ'}
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        borderRadius: '24px',
                                        border: '1px solid #E5E7EB',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                        color: '#1B1B1B',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        padding: '12px 16px'
                                    }}
                                />
                                <Bar dataKey="pl" radius={[0, 10, 10, 0]} barSize={24}>
                                    {profitData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.pl >= 0 ? '#10B981' : '#EF4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mt-12">Hiệu suất tương đối giữa các lĩnh vực</p>
                </div>
            </div>

            {/* 3. Detailed Performance Comparison */}
            <div className="px-2">
                <div className="bento-card p-10">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">Xếp hạng Tốc độ Tài sản</h3>
                            <p className="text-slate-500 text-sm font-medium">Các chỉ dấu có hiệu suất tốt nhất trong giai đoạn đã chọn.</p>
                        </div>
                    </div>

                    <div className="h-[450px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={assetPerformanceData} margin={{ left: 10, right: 40 }}>
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fontWeight: 700, fill: '#1e293b' }}
                                    width={100}
                                />
                                <ReferenceLine x={0} stroke="#f1f5f9" />
                                <RechartsTooltip
                                    formatter={(value: number) => `${value.toFixed(2)}%`}
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        borderRadius: '24px',
                                        border: '1px solid #E5E7EB',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                        color: '#1B1B1B',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        padding: '12px 16px'
                                    }}
                                />
                                <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={20}>
                                    {assetPerformanceData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.value >= 0 ? '#2C56ED' : '#EF4444'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}
