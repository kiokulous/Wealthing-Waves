'use client'

import React, { useState, useEffect } from 'react'
import { Edit2, Trash2, Search } from 'lucide-react'
import { getAllMarketPrices, addMarketPrice, deleteMarketPrice } from '@/lib/api/database'
import type { MarketPrice } from '@/lib/supabase'
import DeleteConfirmDialog from './DeleteConfirmDialog'
import EditMarketPriceModal from './EditMarketPriceModal'

export default function MarketPriceHistory() {
    const [prices, setPrices] = useState<MarketPrice[]>([])
    const [filteredPrices, setFilteredPrices] = useState<MarketPrice[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Filter states
    const [searchSymbol, setSearchSymbol] = useState('')
    const [filterCategory, setFilterCategory] = useState<string>('all')

    // Modal states
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; price: MarketPrice | null }>({
        open: false,
        price: null
    })
    const [editModal, setEditModal] = useState<{ open: boolean; price: MarketPrice | null }>({
        open: false,
        price: null
    })
    const [deleteLoading, setDeleteLoading] = useState(false)

    // Fetch prices
    const fetchPrices = async () => {
        try {
            setLoading(true)
            setError('')
            const data = await getAllMarketPrices()
            setPrices(data)
            setFilteredPrices(data)
        } catch (err: any) {
            setError(err.message || 'Không thể tải lịch sử giá')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPrices()
    }, [])

    // Apply filters
    useEffect(() => {
        let filtered = [...prices]

        // Filter by symbol
        if (searchSymbol.trim()) {
            filtered = filtered.filter(p =>
                p.symbol.toLowerCase().includes(searchSymbol.toLowerCase())
            )
        }

        // Filter by category
        if (filterCategory !== 'all') {
            filtered = filtered.filter(p => p.category === filterCategory)
        }

        setFilteredPrices(filtered)
    }, [searchSymbol, filterCategory, prices])

    // Handle delete
    const handleDelete = async () => {
        if (!deleteDialog.price) return

        setDeleteLoading(true)
        try {
            await deleteMarketPrice(deleteDialog.price.id)
            await fetchPrices()
            setDeleteDialog({ open: false, price: null })
        } catch (err: any) {
            setError(err.message || 'Không thể xóa giá')
        } finally {
            setDeleteLoading(false)
        }
    }

    // Handle edit save (uses addMarketPrice which handles upsert)
    const handleEditSave = async (marketPrice: { date: string; category: string; symbol: string; price: number }) => {
        await addMarketPrice(marketPrice)
        await fetchPrices()
    }

    // Format number
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('vi-VN').format(num)
    }

    // Format date
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    // Get unique categories
    const categories = ['all', ...Array.from(new Set(prices.map(p => p.category)))]

    if (loading) {
        return (
            <div className="bento-card p-8">
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="bento-card p-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold text-[var(--foreground)]">
                        Lịch sử Đồng bộ Giá
                    </h2>
                    <p className="text-sm text-[var(--text-muted)] font-medium">
                        Tổng {filteredPrices.length} bản ghi
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            placeholder="Tìm theo mã..."
                            value={searchSymbol}
                            onChange={(e) => setSearchSymbol(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-[#0F0F0F] border-none rounded-2xl text-sm text-[var(--foreground)] font-medium focus:ring-2 focus:ring-[var(--primary)]/20 transition-all outline-none"
                        />
                    </div>

                    {/* Category Filter */}
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-4 py-3 bg-slate-100 dark:bg-[#0F0F0F] border-none rounded-2xl text-sm text-[var(--foreground)] font-bold focus:ring-2 focus:ring-[var(--primary)]/20 transition-all outline-none cursor-pointer"
                    >
                        <option value="all">Tất cả phân loại</option>
                        {categories.filter(c => c !== 'all').map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-bold rounded-2xl">
                        {error}
                    </div>
                )}

                {/* Table / Empty State */}
                {filteredPrices.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-[var(--text-muted)] font-medium">
                            {searchSymbol || filterCategory !== 'all'
                                ? 'Không tìm thấy bản ghi phù hợp'
                                : 'Chưa có dữ liệu giá nào'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto -mx-8 px-8">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-white/10">
                                    <th className="text-left py-3 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Ngày</th>
                                    <th className="text-left py-3 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Mã</th>
                                    <th className="text-left py-3 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Phân loại</th>
                                    <th className="text-right py-3 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Giá</th>
                                    <th className="text-right py-3 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPrices.map((price) => (
                                    <tr
                                        key={price.id}
                                        className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <td className="py-4 px-4 text-sm font-medium text-[var(--foreground)]">
                                            {formatDate(price.date)}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-sm font-bold text-[var(--foreground)]">
                                                {price.symbol}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="inline-flex px-3 py-1 bg-slate-100 dark:bg-white/5 text-[var(--foreground)] text-xs font-bold rounded-full">
                                                {price.category}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-sm font-bold text-right text-[var(--primary)]">
                                            {formatNumber(price.price)}
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setEditModal({ open: true, price })}
                                                    className="p-2 rounded-xl text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteDialog({ open: true, price })}
                                                    className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                open={deleteDialog.open}
                title="Xóa Giá Thị trường?"
                message={`Bạn có chắc chắn muốn xóa bản ghi giá ${deleteDialog.price?.symbol} này không? Hành động này không thể hoàn tác.`}
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialog({ open: false, price: null })}
                loading={deleteLoading}
            />

            {/* Edit Modal */}
            <EditMarketPriceModal
                open={editModal.open}
                marketPrice={editModal.price}
                onSave={handleEditSave}
                onCancel={() => setEditModal({ open: false, price: null })}
            />
        </>
    )
}
