'use client'

import React, { useState, useEffect } from 'react'
import { Edit2, Trash2, Search, TrendingUp, TrendingDown } from 'lucide-react'
import { getAllTransactions, updateTransaction, deleteTransaction } from '@/lib/api/database'
import type { Transaction } from '@/lib/supabase'
import DeleteConfirmDialog from './DeleteConfirmDialog'
import EditTransactionModal from './EditTransactionModal'

export default function TransactionHistory() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Filter states
    const [searchSymbol, setSearchSymbol] = useState('')
    const [filterType, setFilterType] = useState<'all' | 'Mua' | 'Chốt'>('all')

    // Modal states
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; transaction: Transaction | null }>({
        open: false,
        transaction: null
    })
    const [editModal, setEditModal] = useState<{ open: boolean; transaction: Transaction | null }>({
        open: false,
        transaction: null
    })
    const [deleteLoading, setDeleteLoading] = useState(false)

    // Fetch transactions
    const fetchTransactions = async () => {
        try {
            setLoading(true)
            setError('')
            const data = await getAllTransactions()
            setTransactions(data)
            setFilteredTransactions(data)
        } catch (err: any) {
            setError(err.message || 'Không thể tải lịch sử giao dịch')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTransactions()
    }, [])

    // Apply filters
    useEffect(() => {
        let filtered = [...transactions]

        // Filter by symbol
        if (searchSymbol.trim()) {
            filtered = filtered.filter(t =>
                t.symbol.toLowerCase().includes(searchSymbol.toLowerCase())
            )
        }

        // Filter by type
        if (filterType !== 'all') {
            filtered = filtered.filter(t => t.type === filterType)
        }

        setFilteredTransactions(filtered)
    }, [searchSymbol, filterType, transactions])

    // Handle delete
    const handleDelete = async () => {
        if (!deleteDialog.transaction) return

        setDeleteLoading(true)
        try {
            await deleteTransaction(deleteDialog.transaction.id)
            await fetchTransactions()
            setDeleteDialog({ open: false, transaction: null })
        } catch (err: any) {
            setError(err.message || 'Không thể xóa giao dịch')
        } finally {
            setDeleteLoading(false)
        }
    }

    // Handle edit save
    const handleEditSave = async (id: string, updates: Partial<Transaction>) => {
        await updateTransaction(id, updates)
        await fetchTransactions()
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
                        Lịch sử Giao dịch
                    </h2>
                    <p className="text-sm text-[var(--text-muted)] font-medium">
                        Tổng {filteredTransactions.length} giao dịch
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

                    {/* Type Filter */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterType('all')}
                            className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all ${filterType === 'all'
                                    ? 'bg-[var(--primary)] text-white dark:text-black'
                                    : 'bg-slate-100 dark:bg-[#0F0F0F] text-[var(--text-muted)] hover:text-[var(--foreground)]'
                                }`}
                        >
                            Tất cả
                        </button>
                        <button
                            onClick={() => setFilterType('Mua')}
                            className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all ${filterType === 'Mua'
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-100 dark:bg-[#0F0F0F] text-[var(--text-muted)] hover:text-emerald-500'
                                }`}
                        >
                            Mua
                        </button>
                        <button
                            onClick={() => setFilterType('Chốt')}
                            className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all ${filterType === 'Chốt'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-slate-100 dark:bg-[#0F0F0F] text-[var(--text-muted)] hover:text-red-500'
                                }`}
                        >
                            Chốt
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-bold rounded-2xl">
                        {error}
                    </div>
                )}

                {/* Table / Empty State */}
                {filteredTransactions.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-[var(--text-muted)] font-medium">
                            {searchSymbol || filterType !== 'all'
                                ? 'Không tìm thấy giao dịch phù hợp'
                                : 'Chưa có giao dịch nào'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto -mx-8 px-8">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-white/10">
                                    <th className="text-left py-3 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Ngày</th>
                                    <th className="text-left py-3 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Mã</th>
                                    <th className="text-left py-3 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Loại</th>
                                    <th className="text-right py-3 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">SL</th>
                                    <th className="text-right py-3 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Giá</th>
                                    <th className="text-right py-3 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Phí</th>
                                    <th className="text-right py-3 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Tổng</th>
                                    <th className="text-right py-3 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map((transaction) => (
                                    <tr
                                        key={transaction.id}
                                        className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <td className="py-4 px-4 text-sm font-medium text-[var(--foreground)]">
                                            {formatDate(transaction.date)}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-sm font-bold text-[var(--foreground)]">
                                                {transaction.symbol}
                                            </span>
                                            <span className="block text-[10px] text-[var(--text-muted)] mt-0.5">
                                                {transaction.category}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            {transaction.type === 'Mua' ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full">
                                                    <TrendingUp className="w-3 h-3" />
                                                    Mua
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-bold rounded-full">
                                                    <TrendingDown className="w-3 h-3" />
                                                    Chốt
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 text-sm font-bold text-right text-[var(--foreground)]">
                                            {formatNumber(transaction.quantity)}
                                        </td>
                                        <td className="py-4 px-4 text-sm font-bold text-right text-[var(--foreground)]">
                                            {formatNumber(transaction.price)}
                                        </td>
                                        <td className="py-4 px-4 text-sm font-medium text-right text-[var(--text-muted)]">
                                            {formatNumber(transaction.fee)}
                                        </td>
                                        <td className="py-4 px-4 text-sm font-bold text-right text-[var(--primary)]">
                                            {formatNumber(transaction.total_money)}
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setEditModal({ open: true, transaction })}
                                                    className="p-2 rounded-xl text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteDialog({ open: true, transaction })}
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
                title="Xóa Giao dịch?"
                message={`Bạn có chắc chắn muốn xóa giao dịch ${deleteDialog.transaction?.symbol} này không? Hành động này không thể hoàn tác.`}
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialog({ open: false, transaction: null })}
                loading={deleteLoading}
            />

            {/* Edit Modal */}
            <EditTransactionModal
                open={editModal.open}
                transaction={editModal.transaction}
                onSave={handleEditSave}
                onCancel={() => setEditModal({ open: false, transaction: null })}
            />
        </>
    )
}
