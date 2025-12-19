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
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-slate-200 px-4 py-3 rounded-[2.5rem] shadow-2xl flex items-center gap-2 z-50">
            {navItems.map((item) => {
                if (item.isCenter) {
                    return (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            className="bg-blue-600 p-4 rounded-full text-white shadow-lg shadow-blue-500/30 mx-1 active:scale-90 transition-transform"
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
                        className={`p-3 rounded-2xl transition-all duration-200 relative ${isActive(item.path)
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                        title={item.label}
                    >
                        <item.icon className="w-6 h-6" />
                    </button>
                )
            })}
        </div>
    )
}
