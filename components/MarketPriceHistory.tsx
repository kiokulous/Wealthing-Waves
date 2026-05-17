'use client'

import React, { useState, useEffect } from 'react'
import { getAllMarketPrices, addMarketPrice, deleteMarketPrice } from '@/lib/api/database'
import type { MarketPrice } from '@/lib/supabase'
import DeleteConfirmDialog from './DeleteConfirmDialog'
import EditMarketPriceModal from './EditMarketPriceModal'

const IconChart = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/>
        <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
        <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
    </svg>
)

const IconSearch = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
)

const IconEdit = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
)

const IconTrash = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6"/><path d="M14 11v6"/>
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
)

const ITEMS_PER_PAGE = 20

const categoryColors: Record<string, { bg: string; color: string }> = {
    'Chứng chỉ quỹ': { bg: 'var(--accent-12)', color: 'var(--accent)' },
    'Cổ phiếu':      { bg: 'var(--info-12)',   color: 'var(--info)' },
    'Vàng':          { bg: 'rgba(255,181,71,0.15)', color: '#ffb547' },
    'Tiết kiệm':     { bg: 'rgba(110,168,255,0.12)', color: '#6ea8ff' },
}

export default function MarketPriceHistory() {
    const [prices, setPrices]               = useState<MarketPrice[]>([])
    const [loading, setLoading]             = useState(true)
    const [error, setError]                 = useState('')
    const [search, setSearch]               = useState('')
    const [filterCat, setFilterCat]         = useState('all')
    const [page, setPage]                   = useState(1)
    const [deleteDialog, setDeleteDialog]   = useState<{ open: boolean; price: MarketPrice | null }>({ open: false, price: null })
    const [editModal, setEditModal]         = useState<{ open: boolean; price: MarketPrice | null }>({ open: false, price: null })
    const [deleteLoading, setDeleteLoading] = useState(false)

    const fetchPrices = async () => {
        try {
            setLoading(true)
            setError('')
            const data = await getAllMarketPrices()
            setPrices(data)
        } catch (err: any) {
            setError(err.message || 'Không thể tải lịch sử giá')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchPrices() }, [])

    // Reset page on filter change
    useEffect(() => { setPage(1) }, [search, filterCat])

    const filtered = prices.filter(p => {
        const matchSym = !search.trim() || p.symbol.toLowerCase().includes(search.toLowerCase())
        const matchCat = filterCat === 'all' || p.category === filterCat
        return matchSym && matchCat
    })

    const totalPages    = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
    const paginated     = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
    const categories    = Array.from(new Set(prices.map(p => p.category)))

    const handleDelete = async () => {
        if (!deleteDialog.price) return
        setDeleteLoading(true)
        try {
            await deleteMarketPrice(deleteDialog.price.id)
            await fetchPrices()
            setDeleteDialog({ open: false, price: null })
        } catch (err: any) {
            setError(err.message || 'Không thể xóa bản ghi')
        } finally {
            setDeleteLoading(false)
        }
    }

    const handleEditSave = async (mp: { date: string; category: string; symbol: string; price: number }) => {
        await addMarketPrice(mp)
        await fetchPrices()
    }

    const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n)
    const fmtDate = (d: string) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

    if (loading) {
        return (
            <div className="card" style={{ padding: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 28, height: 28, border: '2.5px solid var(--accent-18)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
        )
    }

    return (
        <>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

                {/* ── Header ── */}
                <div style={{ padding: '20px 20px 0', marginBottom: 16 }}>
                    <div className="row between" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                        <div className="row" style={{ gap: 10 }}>
                            <div className="ico-box">
                                <IconChart />
                            </div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-1)' }}>
                                    Lịch sử Đồng bộ Giá
                                </div>
                                <div className="muted" style={{ fontSize: 12 }}>
                                    {filtered.length} bản ghi
                                    {filterCat !== 'all' && ` · ${filterCat}`}
                                </div>
                            </div>
                        </div>

                        {/* Search + Category filter */}
                        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                            {/* Search */}
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t-3)', pointerEvents: 'none', display: 'flex' }}>
                                    <IconSearch />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Tìm mã..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    style={{
                                        paddingLeft: 32, paddingRight: 12, height: 34,
                                        background: 'var(--surface-2)', border: '1px solid var(--line)',
                                        borderRadius: 8, color: 'var(--t-1)', fontSize: 13, outline: 'none',
                                        width: 140,
                                    }}
                                />
                            </div>

                            {/* Category dropdown */}
                            <select
                                value={filterCat}
                                onChange={e => setFilterCat(e.target.value)}
                                style={{
                                    padding: '0 12px', height: 34,
                                    background: 'var(--surface-2)', border: '1px solid var(--line)',
                                    borderRadius: 8, color: filterCat === 'all' ? 'var(--t-3)' : 'var(--t-1)',
                                    fontSize: 13, outline: 'none', cursor: 'pointer', appearance: 'none',
                                }}
                            >
                                <option value="all">Tất cả loại</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{ marginBottom: 12, padding: '9px 13px', borderRadius: 8, background: 'var(--neg-12)', color: 'var(--neg)', fontSize: 13, fontWeight: 600 }}>
                            {error}
                        </div>
                    )}
                </div>

                {/* ── Desktop Table ── */}
                <div className="hidden md:block" style={{ overflowX: 'auto' }}>
                    {filtered.length === 0 ? (
                        <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--t-3)', fontSize: 14 }}>
                            {search || filterCat !== 'all' ? 'Không tìm thấy bản ghi phù hợp.' : 'Chưa có dữ liệu giá nào.'}
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--surface-2)' }}>
                                    {['Ngày', 'Mã', 'Phân loại', 'Giá', 'Thao tác'].map((h, i) => (
                                        <th key={h} style={{
                                            padding: '10px 16px', fontSize: 10.5, fontWeight: 700,
                                            letterSpacing: '0.12em', textTransform: 'uppercase',
                                            color: 'var(--t-3)', textAlign: i >= 3 ? 'right' : 'left',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((price, idx) => {
                                    const catStyle = categoryColors[price.category] ?? { bg: 'var(--surface-3)', color: 'var(--t-2)' }
                                    return (
                                        <tr
                                            key={price.id}
                                            style={{
                                                background: idx % 2 === 1 ? 'var(--surface-1)' : 'transparent',
                                                transition: 'background .12s',
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 1 ? 'var(--surface-1)' : 'transparent')}
                                        >
                                            <td style={{ padding: '11px 16px', fontSize: 13, color: 'var(--t-2)', whiteSpace: 'nowrap' }}>
                                                {fmtDate(price.date)}
                                            </td>
                                            <td style={{ padding: '11px 16px' }}>
                                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-1)', letterSpacing: '0.04em', fontFamily: 'monospace' }}>
                                                    {price.symbol}
                                                </span>
                                            </td>
                                            <td style={{ padding: '11px 16px' }}>
                                                <span className="badge" style={{ background: catStyle.bg, color: catStyle.color, border: 'none', fontSize: 11.5 }}>
                                                    {price.category}
                                                </span>
                                            </td>
                                            <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                                                <span className="num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                                                    {fmt(price.price)}
                                                </span>
                                            </td>
                                            <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                                                    <button
                                                        onClick={() => setEditModal({ open: true, price })}
                                                        title="Chỉnh sửa"
                                                        style={{
                                                            width: 30, height: 30, borderRadius: 7,
                                                            background: 'transparent', border: 'none',
                                                            color: 'var(--t-3)', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            transition: 'background .12s, color .12s',
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-12)'; e.currentTarget.style.color = 'var(--accent)' }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t-3)' }}
                                                    >
                                                        <IconEdit />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteDialog({ open: true, price })}
                                                        title="Xóa"
                                                        style={{
                                                            width: 30, height: 30, borderRadius: 7,
                                                            background: 'transparent', border: 'none',
                                                            color: 'var(--t-3)', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            transition: 'background .12s, color .12s',
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--neg-12)'; e.currentTarget.style.color = 'var(--neg)' }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t-3)' }}
                                                    >
                                                        <IconTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* ── Mobile Card List ── */}
                <div className="md:hidden" style={{ padding: '0 12px' }}>
                    {filtered.length === 0 ? (
                        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--t-3)', fontSize: 14 }}>
                            {search || filterCat !== 'all' ? 'Không tìm thấy bản ghi phù hợp.' : 'Chưa có dữ liệu giá nào.'}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {paginated.map(price => {
                                const catStyle = categoryColors[price.category] ?? { bg: 'var(--surface-3)', color: 'var(--t-2)' }
                                return (
                                    <div
                                        key={price.id}
                                        style={{
                                            background: 'var(--surface-2)', borderRadius: 12,
                                            padding: '12px 14px', border: '1px solid var(--line)',
                                            display: 'flex', alignItems: 'center', gap: 12,
                                        }}
                                    >
                                        {/* Left: date + symbol */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t-1)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                                                {price.symbol}
                                            </div>
                                            <div style={{ fontSize: 11.5, color: 'var(--t-3)', marginTop: 2 }}>
                                                {fmtDate(price.date)}
                                            </div>
                                        </div>

                                        {/* Middle: category */}
                                        <span className="badge" style={{ background: catStyle.bg, color: catStyle.color, border: 'none', fontSize: 11 }}>
                                            {price.category}
                                        </span>

                                        {/* Right: price + actions */}
                                        <div style={{ textAlign: 'right' }}>
                                            <div className="num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>
                                                {fmt(price.price)}
                                            </div>
                                            <div style={{ display: 'flex', gap: 4, marginTop: 6, justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => setEditModal({ open: true, price })}
                                                    style={{
                                                        width: 28, height: 28, borderRadius: 6,
                                                        background: 'var(--surface-3)', border: 'none',
                                                        color: 'var(--t-3)', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}
                                                >
                                                    <IconEdit />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteDialog({ open: true, price })}
                                                    style={{
                                                        width: 28, height: 28, borderRadius: 6,
                                                        background: 'var(--surface-3)', border: 'none',
                                                        color: 'var(--t-3)', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}
                                                >
                                                    <IconTrash />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* ── Pagination ── */}
                {filtered.length > ITEMS_PER_PAGE && (
                    <div style={{
                        padding: '14px 20px',
                        marginTop: 12,
                        borderTop: '1px solid var(--line)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="btn btn-ghost"
                            style={{ fontSize: 12, padding: '6px 12px', opacity: page === 1 ? 0.4 : 1 }}
                        >
                            ← Trước
                        </button>

                        <div style={{ display: 'flex', gap: 4 }}>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(pg => pg === 1 || pg === totalPages || Math.abs(pg - page) <= 1)
                                .map((pg, i, arr) => {
                                    const showEllipsis = arr[i - 1] && pg - arr[i - 1] > 1
                                    return (
                                        <React.Fragment key={pg}>
                                            {showEllipsis && (
                                                <span style={{ display: 'flex', alignItems: 'center', padding: '0 4px', color: 'var(--t-3)', fontSize: 13 }}>…</span>
                                            )}
                                            <button
                                                onClick={() => setPage(pg)}
                                                style={{
                                                    width: 32, height: 32, borderRadius: 7, border: 'none',
                                                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                                    background: pg === page ? 'var(--accent-12)' : 'transparent',
                                                    color: pg === page ? 'var(--accent)' : 'var(--t-2)',
                                                    transition: 'background .12s',
                                                }}
                                            >
                                                {pg}
                                            </button>
                                        </React.Fragment>
                                    )
                                })}
                        </div>

                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="btn btn-ghost"
                            style={{ fontSize: 12, padding: '6px 12px', opacity: page === totalPages ? 0.4 : 1 }}
                        >
                            Sau →
                        </button>
                    </div>
                )}

                {/* Bottom padding */}
                <div style={{ height: 8 }} />
            </div>

            <DeleteConfirmDialog
                open={deleteDialog.open}
                title="Xóa bản ghi giá?"
                message={`Xóa giá ${deleteDialog.price?.symbol} ngày ${deleteDialog.price ? fmtDate(deleteDialog.price.date) : ''}? Hành động này không thể hoàn tác.`}
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialog({ open: false, price: null })}
                loading={deleteLoading}
            />

            <EditMarketPriceModal
                open={editModal.open}
                marketPrice={editModal.price}
                onSave={handleEditSave}
                onCancel={() => setEditModal({ open: false, price: null })}
            />
        </>
    )
}
