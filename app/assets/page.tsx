'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { getAllTransactions, getAllMarketPrices } from '@/lib/api/database'
import { calculatePortfolio, type PortfolioSummary } from '@/lib/api/portfolio'
import { Search, Wallet, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react'

export default function AssetsPage() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        }
    }, [user, authLoading, router])

    useEffect(() => {
        if (user) loadData()
    }, [user])

    const loadData = async () => {
        try {
            setLoading(true)
            const [txns, prices] = await Promise.all([
                getAllTransactions(),
                getAllMarketPrices()
            ])
            const data = calculatePortfolio(txns, prices)
            setPortfolio(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const filteredItems = portfolio?.items.filter(item =>
        item.symbol.includes(searchTerm.toUpperCase()) && item.quantity > 0
    ) || []

    const formatValue = (value: number) => {
        return new Intl.NumberFormat('vi-VN').format(Math.round(value))
    }

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">Đang quét kho hàng...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Header Area */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-1">
                        Danh mục <span className="text-blue-600">Tài sản</span>
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight">Tổng quan hệ thống về tất cả các vị thế tài chính đang hoạt động của bạn.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-600 cursor-pointer shadow-sm">
                        <Filter className="w-5 h-5" />
                    </div>
                </div>
            </header>

            {/* Search Bento Block */}
            <div className="px-2">
                <div className="relative group">
                    <input
                        type="text"
                        placeholder="Tìm kiếm mã (VD: AAPL, VNM)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 rounded-[2rem] bg-white border border-slate-200 focus:border-blue-500/30 focus:outline-none shadow-sm font-bold text-slate-900 transition-all placeholder:text-slate-300"
                    />
                    <Search className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                </div>
            </div>

            {/* Asset Mosaic Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
                {filteredItems.map(item => {
                    const isProfit = item.profitLoss >= 0
                    return (
                        <div
                            key={item.symbol}
                            onClick={() => router.push(`/portfolio/${item.symbol}`)}
                            className="bento-card p-8 group cursor-pointer active:scale-95 transition-all duration-300 relative"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <ArrowUpRight className="w-4 h-4" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        {item.symbol.substring(0, 3)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-xl tracking-tight leading-tight">{item.symbol}</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.category}</p>
                                    </div>
                                </div>

                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Giá trị Vị thế</p>
                                        <p className="font-bold text-slate-900 text-2xl tracking-tight">{formatValue(item.currentValue)} đ</p>
                                    </div>
                                    <div className={`text-sm font-bold flex items-center gap-1 ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {isProfit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                        {Math.abs(item.profitLossPercent).toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}

                {filteredItems.length === 0 && (
                    <div className="col-span-full py-24 text-center bento-card border-dashed">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Wallet className="w-8 h-8 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Không tìm thấy mã phù hợp.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
