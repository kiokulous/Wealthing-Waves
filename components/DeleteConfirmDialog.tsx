'use client'

import React from 'react'
import { AlertTriangle, X } from 'lucide-react'

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={!loading ? onCancel : undefined}
            />

            {/* Dialog Card */}
            <div className="relative bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onCancel}
                    disabled={loading}
                    className="absolute top-4 right-4 p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-slate-100 dark:hover:bg-white/5 transition-all disabled:opacity-50"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Warning Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                </div>

                {/* Content */}
                <div className="text-center mb-8">
                    <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">
                        {title}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] font-medium">
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 px-6 py-3 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-[var(--foreground)] font-bold text-sm hover:border-slate-300 dark:hover:border-white/20 transition-all disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 px-6 py-3 rounded-2xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            'Xóa'
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
