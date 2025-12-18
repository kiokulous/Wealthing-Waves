'use client'

import React, { useState, useEffect } from 'react'
import FloatingNav from '@/components/FloatingNav'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { getAllTransactions, getAllMarketPrices } from '@/lib/api/database'
import { calculatePortfolio, type PortfolioSummary } from '@/lib/api/portfolio'

export default function AssetsPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (user) loadData()
    }, [user])

    const loadData = async () => {
        try {
            const [txns, prices] = await Promise.all([
                getAllTransactions(),
                getAllMarketPrices()
            ])
            const data = calculatePortfolio(txns, prices)
            setPortfolio(data)
        } catch (err) {
            console.error(err)
        }
    }

    const filteredItems = portfolio?.items.filter(item =>
        item.symbol.includes(searchTerm.toUpperCase()) && item.quantity > 0
    ) || []

    const formatCompact = (value: number) => {
        if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B'
        if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M'
        return (value / 1e3).toFixed(0) + 'K'
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-32 pt-6 px-4">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-slate-800 mb-6">Danh mục đầu tư</h1>

                {/* Search */}
                <div className="mb-6 relative">
                    <input
                        type="text"
                        placeholder="Tìm kiếm mã (VD: VNM)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-bold text-slate-700"
                    />
                    <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                <div className="space-y-3">
                    {filteredItems.map(item => {
                        const isProfit = item.profitLoss >= 0
                        return (
                            <div
                                key={item.symbol}
                                onClick={() => router.push(`/portfolio/${item.symbol}`)}
                                className="soft-card p-4 hover:border-indigo-200 transition-colors cursor-pointer group flex justify-between items-center"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors text-xs">
                                        {item.symbol.substring(0, 3)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">{item.symbol}</h3>
                                        <p className="text-xs text-slate-400 font-medium uppercase">{item.category}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-extrabold text-slate-800">{formatCompact(item.currentValue)}</p>
                                    <p className={`text-xs font-bold ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {isProfit ? '+' : ''}{item.profitLossPercent.toFixed(1)}% ({formatCompact(item.profitLoss)})
                                    </p>
                                </div>
                            </div>
                        )
                    })}

                    {filteredItems.length === 0 && (
                        <div className="text-center py-12 opacity-50">
                            <p>Không tìm thấy tài sản nào.</p>
                        </div>
                    )}
                </div>
            </div>
            <FloatingNav />
        </div>
    )
}
