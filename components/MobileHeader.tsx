'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

const PAGE_TITLES: Record<string, string> = {
    '/dashboard':   '',          // dashboard has its own greeting
    '/transaction': 'Nhập liệu',
    '/analysis':    'Phân tích',
    '/profile':     'Tài khoản',
    '/assets':      'Tài sản',
}

export default function MobileHeader({ children }: { children?: React.ReactNode }) {
    const pathname = usePathname()
    const title = PAGE_TITLES[pathname] ?? ''

    if (!title) return null // dashboard renders its own header

    return (
        <div
            className="md:hidden flex items-center justify-between px-4 pt-4 pb-2"
            style={{ background: 'var(--bg)' }}
        >
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--t-1)', letterSpacing: '-0.01em' }}>
                {title}
            </h1>
            {children}
        </div>
    )
}
