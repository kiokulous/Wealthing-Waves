'use client'

import React from 'react'
import { AlertTriangle, X, Trash2 } from 'lucide-react'

interface DeleteConfirmDialogProps {
    open: boolean
    title: string
    message: string
    onConfirm: () => void
    onCancel: () => void
    loading?: boolean
}

export default function DeleteConfirmDialog({
    open,
    title,
    message,
    onConfirm,
    onCancel,
    loading = false
}: DeleteConfirmDialogProps) {
    if (!open) return null

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            {/* Backdrop */}
            <div
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
                onClick={!loading ? onCancel : undefined}
            />

            {/* Dialog Card */}
            <div style={{
                position: 'relative',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.012), transparent), var(--surface-1)',
                border: '1px solid var(--line-2)',
                borderRadius: 'var(--r-xl)',
                boxShadow: 'var(--sh-pop)',
                maxWidth: 400,
                width: '100%',
                padding: '32px 28px 24px',
                textAlign: 'center',
            }}>
                {/* Close Button */}
                <button
                    onClick={onCancel}
                    disabled={loading}
                    style={{
                        position: 'absolute', top: 14, right: 14,
                        display: 'grid', placeItems: 'center',
                        width: 30, height: 30,
                        borderRadius: 8,
                        background: 'var(--surface-3)',
                        border: '1px solid var(--line)',
                        color: 'var(--t-3)',
                        cursor: 'pointer',
                    }}
                >
                    <X size={14} />
                </button>

                {/* Warning Icon */}
                <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'var(--neg-12)',
                    border: '1px solid rgba(255,90,110,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                }}>
                    <AlertTriangle size={24} style={{ color: 'var(--neg)' }} />
                </div>

                {/* Content */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t-1)', marginBottom: 8, letterSpacing: '-0.01em' }}>
                        {title}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--t-3)', lineHeight: 1.5 }}>
                        {message}
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="btn btn-ghost"
                        style={{ flex: 1 }}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="btn"
                        style={{
                            flex: 1,
                            background: 'var(--neg)',
                            color: '#fff',
                            boxShadow: '0 8px 24px -10px rgba(255,90,110,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                    >
                        {loading ? (
                            <div style={{
                                width: 16, height: 16,
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTopColor: '#fff',
                                borderRadius: '50%',
                                animation: 'spin 0.7s linear infinite',
                            }} />
                        ) : (
                            <>
                                <Trash2 size={14} />
                                Xóa
                            </>
                        )}
                    </button>
                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
