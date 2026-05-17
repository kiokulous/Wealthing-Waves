'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import FloatingNav from './FloatingNav'
import AppSidebar from './AppSidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isLoginPage = pathname === '/login'

    if (isLoginPage) {
        return (
            <div style={{ background: 'var(--bg-grad)', color: 'var(--t-1)', minHeight: '100vh' }}>
                {children}
            </div>
        )
    }

    return (
        <div
            className="app-grid"
            style={{
                display: 'grid',
                gridTemplateColumns: '240px 1fr',
                minHeight: '100vh',
                background: 'var(--bg-grad)',
                color: 'var(--t-1)',
            }}
        >
            {/* Desktop sidebar */}
            <div className="hidden md:block">
                <AppSidebar />
            </div>

            {/* Main content column */}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Page content */}
                <main className="animate-fade-up p-4 pb-24 md:p-7 md:pb-16">
                    {children}
                </main>
            </div>

            {/* Mobile bottom nav */}
            <FloatingNav />
        </div>
    )
}
