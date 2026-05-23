'use client'

import React, { useState, useEffect } from 'react'
import { getAllTransactions, updateTransaction, deleteTransaction } from '@/lib/api/database'
import type { Transaction } from '@/lib/supabase'
import DeleteConfirmDialog from './DeleteConfirmDialog'
import EditTransactionModal from './EditTransactionModal'

export default function TransactionHistory() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [filtered, setFiltered] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [search, setSearch] = useState('')
    const [filterType, setFilterType] = useState<'all' | 'Mua' | 'Chốt'>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const PER_PAGE = 20

    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; transaction: Transaction | null }>({ open: false, transaction: null })
    const [editModal, setEditModal] = useState<{ open: boolean; transaction: Transaction | null }>({ open: false, transaction: null })
    const [deleteLoading, setDeleteLoading] = useState(false)

    const fetchTransactions = async () => {
        try {
            setLoading(true); setError('')
            const data = await getAllTransactions()
            setTransactions(data); setFiltered(data)
        } catch (err: any) {
            setError(err.message || 'Không thể tải lịch sử giao dịch')
        } finally { setLoading(false) }
    }

    useEffect(() => { fetchTransactions() }, [])

    useEffect(() => {
        let f = [...transactions]
        if (search.trim()) f = f.filter(t => t.symbol.toLowerCase().includes(search.toLowerCase()))
        if (filterType !== 'all') f = f.filter(t => t.type === filterType)
        setFiltered(f); setCurrentPage(1)
    }, [search, filterType, transactions])

    const handleDelete = async () => {
        if (!deleteDialog.transaction) return
        setDeleteLoading(true)
        try {
            await deleteTransaction(deleteDialog.transaction.id)
            await fetchTransactions()
            setDeleteDialog({ open: false, transaction: null })
        } catch (err: any) {
            setError(err.message || 'Không thể xóa giao dịch')
        } finally { setDeleteLoading(false) }
    }

    const handleEditSave = async (id: string, updates: Partial<Transaction>) => {
        await updateTransaction(id, updates)
        await fetchTransactions()
    }

    const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n)
    const fmtDate = (s: string) => new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

    const totalPages = Math.ceil(filtered.length / PER_PAGE)
    const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

    if (loading) return (
        <div className="card" style={{ padding: 32, display: 'flex', justifyContent: 'center' }}>
            <span style={{ width: 28, height: 28, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
        </div>
    )

    return (
        <>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Card header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="ico-box">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--t-1)' }}>Lịch sử giao dịch</div>
                            <div style={{ fontSize: 11.5, color: 'var(--t-3)', marginTop: 1 }}>
                                Tổng <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{filtered.length}</span> giao dịch · Trang {currentPage}/{totalPages || 1}
                            </div>
                        </div>
                    </div>

                    {/* Search + filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Search */}
                        <div style={{ position: 'relative' }}>
                            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t-3)' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
                            <input
                                type="text"
                                placeholder="Tìm theo mã..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{
                                    paddingLeft: 30, paddingRight: 12, height: 34, borderRadius: 10,
                                    background: 'var(--surface-2)', border: '1px solid var(--line)',
                                    color: 'var(--t-1)', fontFamily: 'inherit', fontSize: 13, outline: 'none', width: 180,
                                }}
                            />
                        </div>

                        {/* Type filter pills */}
                        <div style={{ display: 'flex', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 10, padding: 3, gap: 2 }}>
                            {(['all', 'Mua', 'Chốt'] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setFilterType(t)}
                                    style={{
                                        padding: '4px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                                        background: filterType === t ? 'var(--surface-3)' : 'transparent',
                                        color: filterType === t
                                            ? t === 'Mua' ? 'var(--accent)' : t === 'Chốt' ? 'var(--neg)' : 'var(--t-1)'
                                            : 'var(--t-3)',
                                        transition: 'all .15s',
                                    }}
                                >
                                    {t === 'all' ? 'Tất cả' : t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div style={{ margin: '12px 24px', padding: '10px 14px', borderRadius: 10, background: 'var(--neg-12)', border: '1px solid rgba(255,90,110,0.25)', color: 'var(--neg)', fontSize: 13, fontWeight: 600 }}>
                        {error}
                    </div>
                )}

                {/* Empty */}
                {filtered.length === 0 && !loading ? (
                    <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--t-3)', fontSize: 13 }}>
                        {search || filterType !== 'all' ? 'Không tìm thấy giao dịch phù hợp' : 'Chưa có giao dịch nào'}
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                                    {['Ngày', 'Mã', 'Loại', 'SL', 'Giá khớp', 'Phí', 'Tổng tiền', 'Thao tác'].map((col, i) => (
                                        <th key={col} style={{
                                            padding: '10px 16px', fontSize: 10.5, fontWeight: 700,
                                            letterSpacing: '0.12em', textTransform: 'uppercase',
                                            color: 'var(--t-3)', textAlign: i >= 3 ? 'right' : 'left',
                                            whiteSpace: 'nowrap', background: 'var(--surface-2)',
                                        }}>
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((tx, idx) => (
                                    <tr
                                        key={tx.id}
                                        style={{
                                            borderBottom: '1px solid var(--line)',
                                            background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)',
                                            transition: 'background .12s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)'}
                                    >
                                        {/* Ngày */}
                                        <td style={{ padding: '11px 16px', fontSize: 13, color: 'var(--t-2)', whiteSpace: 'nowrap' }}>
                                            {fmtDate(tx.date)}
                                        </td>
                                        {/* Mã */}
                                        <td style={{ padding: '11px 16px' }}>
                                            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--t-1)', display: 'block', letterSpacing: '0.04em', fontFamily: 'monospace' }}>{tx.symbol}</span>
                                            <span style={{ fontSize: 11, color: 'var(--t-4)', display: 'block', marginTop: 1 }}>{tx.category}</span>
                                        </td>
                                        {/* Loại */}
                                        <td style={{ padding: '11px 16px' }}>
                                            <span className={tx.type === 'Mua' ? 'badge green' : 'badge red'} style={{ fontSize: 11.5 }}>
                                                {tx.type === 'Mua'
                                                    ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                                                    : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
                                                }
                                                {tx.type === 'Mua' ? 'Mua' : 'Chốt'}
                                            </span>
                                        </td>
                                        {/* SL */}
                                        <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                                            <span className="num" style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-1)' }}>{fmt(tx.quantity)}</span>
                                        </td>
                                        {/* Giá */}
                                        <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                                            <span className="num" style={{ fontSize: 13, color: 'var(--t-2)' }}>{fmt(tx.price)}</span>
                                        </td>
                                        {/* Phí */}
                                        <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                                            <span className="num" style={{ fontSize: 13, color: 'var(--t-4)' }}>
                                                {tx.fee > 0 ? fmt(tx.fee) : '—'}
                                            </span>
                                        </td>
                                        {/* Tổng */}
                                        <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                                            <span className="num" style={{ fontSize: 13, fontWeight: 700, color: tx.type === 'Mua' ? 'var(--accent)' : 'var(--neg)' }}>{fmt(tx.total_money)}</span>
                                        </td>
                                        {/* Actions */}
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                                                <button
                                                    onClick={() => setEditModal({ open: true, transaction: tx })}
                                                    title="Chỉnh sửa"
                                                    style={{
                                                        width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
                                                        background: 'transparent', color: 'var(--t-3)',
                                                        display: 'grid', placeItems: 'center', transition: 'all .15s',
                                                    }}
                                                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--accent-12)'; el.style.color = 'var(--accent)' }}
                                                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'var(--t-3)' }}
                                                >
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                </button>
                                                <button
                                                    onClick={() => setDeleteDialog({ open: true, transaction: tx })}
                                                    title="Xóa"
                                                    style={{
                                                        width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
                                                        background: 'transparent', color: 'var(--t-3)',
                                                        display: 'grid', placeItems: 'center', transition: 'all .15s',
                                                    }}
                                                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--neg-12)'; el.style.color = 'var(--neg)' }}
                                                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'var(--t-3)' }}
                                                >
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ padding: '14px 24px', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            style={{
                                padding: '7px 14px', borderRadius: 9, border: '1px solid var(--line)',
                                background: 'transparent', color: currentPage === 1 ? 'var(--t-4)' : 'var(--t-2)',
                                fontSize: 12.5, fontWeight: 600, cursor: currentPage === 1 ? 'default' : 'pointer',
                            }}
                        >
                            ← Trước
                        </button>

                        <div style={{ display: 'flex', gap: 4 }}>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .map((p, idx, arr) => {
                                    const prev = arr[idx - 1]
                                    return (
                                        <React.Fragment key={p}>
                                            {prev && p - prev > 1 && <span style={{ color: 'var(--t-4)', padding: '0 4px', lineHeight: '32px' }}>…</span>}
                                            <button
                                                onClick={() => setCurrentPage(p)}
                                                style={{
                                                    width: 32, height: 32, borderRadius: 8, border: 'none',
                                                    background: currentPage === p ? 'var(--accent-12)' : 'transparent',
                                                    color: currentPage === p ? 'var(--accent)' : 'var(--t-2)',
                                                    fontSize: 12.5, fontWeight: currentPage === p ? 700 : 500, cursor: 'pointer',
                                                }}
                                            >
                                                {p}
                                            </button>
                                        </React.Fragment>
                                    )
                                })}
                        </div>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            style={{
                                padding: '7px 14px', borderRadius: 9, border: '1px solid var(--line)',
                                background: 'transparent', color: currentPage === totalPages ? 'var(--t-4)' : 'var(--t-2)',
                                fontSize: 12.5, fontWeight: 600, cursor: currentPage === totalPages ? 'default' : 'pointer',
                            }}
                        >
                            Sau →
                        </button>
                    </div>
                )}
            </div>

            <DeleteConfirmDialog
                open={deleteDialog.open}
                title="Xóa Giao dịch?"
                message={`Bạn có chắc chắn muốn xóa giao dịch ${deleteDialog.transaction?.symbol} này không? Hành động này không thể hoàn tác.`}
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialog({ open: false, transaction: null })}
                loading={deleteLoading}
            />
            <EditTransactionModal
                open={editModal.open}
                transaction={editModal.transaction}
                onSave={handleEditSave}
                onCancel={() => setEditModal({ open: false, transaction: null })}
            />

            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </>
    )
}
