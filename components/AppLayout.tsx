'use client'

import React from 'react'
import Sidebar from './Sidebar'
import TopNav from './TopNav'
import FloatingNav from './FloatingNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[var(--background)] selection:bg-[var(--primary)]/20 text-[var(--foreground)] transition-colors duration-300">
            {/* Top Left: Logo & Brand */}
            <div className="fixed top-6 left-6 flex items-center gap-3 z-50">
                <div className="w-10 h-10 bg-[var(--primary)] rounded-2xl flex items-center justify-center shadow-lg transition-all">
                    <span className="text-black font-bold text-xl tracking-tighter">W</span>
                </div>
                <span className="text-[var(--foreground)] font-bold text-xl tracking-tight hidden md:block">Wealthing Waves</span>
            </div>

            {/* Desktop Sidebar (Floating Pills) */}
            <Sidebar />

            <div className="transition-all duration-300 md:pl-28 min-h-screen relative">
                {/* Desktop Top Navigation (Floating Pills) */}
                <div className="hidden md:block h-24">
                    <TopNav />
                </div>

                {/* Main Content Area */}
                <main className="p-4 md:px-8 md:pb-12 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {children}
                </main>

                <div className="h-28 md:hidden" /> {/* Spacer for Mobile Nav */}
            </div>

            {/* Mobile Nav */}
            <FloatingNav />
        </div>
    )
}
