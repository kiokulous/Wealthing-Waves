'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Bell, FileText, ChevronDown } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

export default function TopNav() {
    const router = useRouter()
    const pathname = usePathname()
    const { user } = useAuth()

    const navLinks = [
        { label: 'Bảng điều khiển', path: '/dashboard' },
        { label: 'Giao dịch', path: '/transaction' },
        { label: 'Tài sản', path: '/assets' },
        { label: 'Phân tích', path: '/analysis' },
    ]

    const isActive = (path: string) => pathname === path

    return (
        <header className="fixed top-6 left-0 right-0 px-8 flex items-center justify-between z-40 pointer-events-none transition-all">
            {/* Empty space for logo which is in AppLayout */}
            <div className="w-1/4" />

            {/* Center: Main Navigation pill */}
            <nav className="flex items-center gap-1 bg-white/80 dark:bg-[#111111]/90 backdrop-blur-xl border border-white/50 dark:border-white/5 p-1.5 rounded-full shadow-sm pointer-events-auto transition-colors">
                {navLinks.map((link) => (
                    <button
                        key={link.path}
                        onClick={() => router.push(link.path)}
                        className={`px-6 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${isActive(link.path)
                            ? 'bg-[var(--primary)] text-black shadow-md'
                            : 'text-[var(--text-muted)] hover:text-[var(--primary)]'
                            }`}
                    >
                        {link.label}
                    </button>
                ))}
            </nav>

            {/* Right: Profile pill */}
            <div className="w-1/4 flex justify-end">
                <div className="flex items-center gap-3 bg-white/80 dark:bg-[#111111]/90 backdrop-blur-xl border border-white/50 dark:border-white/5 pl-2 pr-4 py-2 rounded-full shadow-sm cursor-pointer group pointer-events-auto transition-colors">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-black flex items-center justify-center text-[var(--primary)] font-bold overflow-hidden shadow-inner">
                        {user?.email?.[0].toUpperCase()}
                    </div>
                    <div className="hidden lg:block text-left">
                        <p className="text-[10px] font-bold text-[var(--foreground)] leading-none">
                            {user?.email?.split('@')[0]}
                        </p>
                        <p className="text-[9px] text-[var(--text-muted)] font-medium leading-none mt-0.5">
                            {user?.email}
                        </p>
                    </div>
                    <ChevronDown className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
                </div>
            </div>
        </header>
    )
}
