'use client'

import React, { useState, useEffect } from 'react'
import FloatingNav from '@/components/FloatingNav'
import { useAuth } from '@/components/providers/AuthProvider'
import { getAllTransactions, getAllMarketPrices } from '@/lib/api/database'
import { calculatePortfolio, type PortfolioSummary } from '@/lib/api/portfolio'
import { calculatePeriodPerformance } from '@/lib/api/calculate_period_performance'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, ReferenceLine } from 'recharts'

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#3b82f6']

export default function AnalysisPage() {
    const { user, loading: authLoading } = useAuth()
    // Raw Data State
    const [allTransactions, setAllTransactions] = useState<any[]>([])
    const [allPrices, setAllPrices] = useState<any[]>([])

    // Computed State
    const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('Tất cả')

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
            // Initial calculation will happen via useEffect
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
            case 'Tất cả':
            default:
                startDate = null
        }

        const data = calculatePeriodPerformance(allTransactions, allPrices, startDate)
        setPortfolio(data)
    }

    if (authLoading || (loading && !portfolio && allTransactions.length === 0)) {
        return (
            <div className="min-h-screen flex items-center justify-center text-slate-400">
                <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                Đang tải dữ liệu...
            </div>
        )
    }

    if (!portfolio) return null

    // Chart Data Preparation
    const allocationData = portfolio.categories.map(cat => ({
        name: cat.category,
        value: cat.currentValue
    })).filter(d => d.value > 0)

    const profitData = portfolio.categories.map(cat => ({
        name: cat.category,
        pl: cat.profitLoss
    }))

    // Asset Performance Data (Top 5 Assets by Profit %)
    const assetPerformanceData = portfolio.items
        .filter(item => item.currentValue > 0)
        .sort((a, b) => b.profitLossPercent - a.profitLossPercent)
        .slice(0, 10) // Top 10
        .map(item => ({
            name: item.symbol,
            value: item.profitLossPercent
        }))

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-32 pt-6 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-slate-800 mb-6">Thống kê & Phân tích</h1>

                {/* Filters (Restored) */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                    {['30 Ngày', '3 Tháng', '6 Tháng', '1 Năm', 'Tất cả'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${filter === f
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* 1. Allocation Chart */}
                <div className="soft-card p-6 mb-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-6 rounded-full bg-indigo-500"></span>
                        Phân bổ tài sản
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={allocationData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {allocationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    formatter={(value: number) => new Intl.NumberFormat('vi-VN').format(value)}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        {allocationData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="flex-1 truncate">{entry.name}</span>
                                <span>{((entry.value / portfolio.totalCurrentValue) * 100).toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Profit/Loss Analysis (By Category) */}
                <div className="soft-card p-6 mb-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-6 rounded-full bg-emerald-500"></span>
                        Hiệu quả đầu tư (Theo danh mục)
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={profitData} margin={{ left: 10 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#64748b' }} />
                                <ReferenceLine x={0} stroke="#cbd5e1" strokeDasharray="3 3" />
                                <RechartsTooltip
                                    formatter={(value: number) => new Intl.NumberFormat('vi-VN').format(value)}
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="pl" radius={[2, 2, 2, 2]} barSize={24}>
                                    {profitData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.pl >= 0 ? '#10b981' : '#f43f5e'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-center text-xs text-slate-400 mt-2 font-medium">Lợi nhuận theo danh mục (VNĐ)</p>
                </div>

                {/* 3. Asset Performance Comparison (All Assets) */}
                <div className="soft-card p-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-6 rounded-full bg-indigo-500"></span>
                        So sánh lợi nhuận (%) các mã
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={assetPerformanceData} margin={{ left: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#64748b' }} width={50} />
                                <RechartsTooltip
                                    formatter={(value: number) => `${value.toFixed(2)}%`}
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                    {assetPerformanceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#8b5cf6' : '#f43f5e'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-center text-xs text-slate-400 mt-2 font-medium">Top mã tăng trưởng mạnh nhất (%)</p>
                </div>

            </div>
            <FloatingNav />
        </div>
    )
}
