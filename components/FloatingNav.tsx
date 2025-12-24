'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    BarChart3,
    Plus,
    Wallet,
    User
} from 'lucide-react'

export default function FloatingNav() {
    const router = useRouter()
    const pathname = usePathname()

    const isActive = (path: string) => pathname === path

    const navItems = [
        { label: 'Bảng điều khiển', icon: LayoutDashboard, path: '/dashboard' },
        { label: 'Thống kê', icon: BarChart3, path: '/analysis' },
        { label: 'Thêm', icon: Plus, path: '/transaction', isCenter: true },
        { label: 'Tài sản', icon: Wallet, path: '/assets' },
        { label: 'Tôi', icon: User, path: '/profile' },
    ]

    return (
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-[#1A1A1A]/95 backdrop-blur-xl border border-white/50 dark:border-white/10 px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 z-50 shadow-black/20 transition-all">
            {navItems.map((item) => {
                const active = isActive(item.path)
                if (item.isCenter) {
                    return (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            className="bg-[var(--primary)] p-4 rounded-full text-white dark:text-black shadow-lg shadow-black/20 mx-1 active:scale-90 transition-all"
                            title={item.label}
                        >
                            <item.icon className="w-6 h-6" />
                        </button>
                    )
                }

                return (
                    <button
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        className={`p-3 rounded-full transition-all duration-300 relative ${active
                            ? 'text-[var(--primary)] bg-[var(--primary)]/10'
                            : 'text-[var(--text-muted)] hover:text-[var(--primary)]'
                            }`}
                        title={item.label}
                    >
                        <item.icon className="w-5 h-5" />
                    </button>
                )
            })}
        </div>
    )
}
