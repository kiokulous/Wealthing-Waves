'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import TopNav from './TopNav'
import FloatingNav from './FloatingNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isLoginPage = pathname === '/login'

    return (
        <div className="min-h-screen bg-[var(--background)] selection:bg-[var(--primary)]/20 text-[var(--foreground)] transition-colors duration-300">
            {/* Top Left: Logo & Brand - Hidden on login and mobile */}
            {!isLoginPage && (
                <div className="fixed top-6 left-6 items-center gap-3 z-50 hidden md:flex">
                    <div className="w-10 h-10 bg-[var(--primary)] rounded-2xl flex items-center justify-center shadow-lg transition-all">
                        <span className="text-white dark:text-black font-bold text-xl tracking-tighter">W</span>
                    </div>
                    <span className="text-[var(--foreground)] font-bold text-xl tracking-tight hidden md:block">Wealthing Waves</span>
                </div>
            )}

            {/* Desktop Sidebar (Floating Pills) - Hidden on login */}
            {!isLoginPage && <Sidebar />}

            <div className={`transition-all duration-300 ${!isLoginPage ? 'md:pl-28' : ''} min-h-screen relative`}>
                {/* Desktop Top Navigation (Floating Pills) - Hidden on login */}
                {!isLoginPage && (
                    <div className="hidden md:block h-24">
                        <TopNav />
                    </div>
                )}

                {/* Main Content Area */}
                <main className={`${!isLoginPage ? 'p-4 md:px-8 md:pb-12 max-w-[1600px] mx-auto' : ''} animate-in fade-in slide-in-from-bottom-4 duration-700`}>
                    {children}
                </main>

                {!isLoginPage && <div className="h-28 md:hidden" />} {/* Spacer for Mobile Nav */}
            </div>

            {/* Mobile Nav - Hidden on login */}
            {!isLoginPage && <FloatingNav />}
        </div>
    )
}
