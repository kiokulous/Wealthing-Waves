'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function FloatingNav() {
    const router = useRouter()
    const pathname = usePathname()

    const isActive = (path: string) => pathname === path

    return (
        <div className="floating-nav">
            {/* 1. Home - Dashboard */}
            <button
                onClick={() => router.push('/dashboard')}
                className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
                title="Tổng quan"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 12v9a1 1 0 001 1h3m0 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1v-9m-9 4v-4" />
                </svg>
            </button>

            {/* 2. Analysis - Statistics */}
            <button
                onClick={() => router.push('/analysis')}
                className={`nav-item ${isActive('/analysis') ? 'active' : ''}`}
                title="Thống kê & Phân tích"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            </button>

            {/* 3. Add Transaction (Center Sparkle) */}
            <button
                onClick={() => router.push('/transaction')}
                className="btn-sparkle mx-2 text-white shadow-xl shadow-indigo-500/40 transform hover:-translate-y-1"
                title="Thêm Giao dịch / Giá"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
            </button>

            {/* 4. Assets List - Portfolio Detail Selection */}
            <button
                onClick={() => router.push('/assets')}
                className={`nav-item ${isActive('/assets') ? 'active' : ''}`}
                title="Danh sách tài sản"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
            </button>

            {/* 5. Profile - Account Management */}
            <button
                onClick={() => router.push('/profile')}
                className={`nav-item ${isActive('/profile') ? 'active' : ''}`}
                title="Tài khoản"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            </button>
        </div>
    )
}
