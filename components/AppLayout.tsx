'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import FloatingNav from './FloatingNav'
import TopNav from './TopNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isLoginPage = pathname === '/login'

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-grad)', color: 'var(--t-1)' }}>

            {/* Desktop: sticky top nav bar */}
            {!isLoginPage && (
                <div className="hidden md:block">
                    <TopNav />
                </div>
            )}

            {/* Page content */}
            <main
                className={`animate-fade-up ${
                    !isLoginPage
                        ? 'p-4 md:px-7 md:pb-16 max-w-[1400px] mx-auto'
                        : ''
                }`}
            >
                {children}
            </main>

            {/* Mobile spacer */}
            {!isLoginPage && <div className="h-28 md:hidden" />}

            {/* Mobile floating bottom nav */}
            {!isLoginPage && <FloatingNav />}
        </div>
    )
}
