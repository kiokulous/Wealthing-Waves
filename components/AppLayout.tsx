'use client'

import React from 'react'
import Sidebar from './Sidebar'
import FloatingNav from './FloatingNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#F7F7F7] selection:bg-blue-500/20">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="transition-all duration-300 md:pl-72 min-h-screen relative">
                {/* Content Container */}
                <div className="p-4 md:p-8 md:pt-10 max-w-[1600px] mx-auto">
                    {children}
                </div>

                <div className="h-28 md:hidden" /> {/* Spacer for Mobile Nav */}
            </main>

            {/* Mobile Nav (Visible on small screens) */}
            <FloatingNav />
        </div>
    )
}
