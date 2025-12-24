'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    BarChart3,
    PlusCircle,
    Wallet,
    User,
    LogOut,
    HelpCircle,
    Sun,
    Moon
} from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useTheme } from '@/components/providers/ThemeProvider'

export default function Sidebar() {
    const router = useRouter()
    const pathname = usePathname()
    const { signOut } = useAuth()
    const { theme, toggleTheme } = useTheme()

    const navItems = [
        { label: 'Bảng điều khiển', icon: LayoutDashboard, path: '/dashboard' },
        { label: 'Tài sản', icon: Wallet, path: '/assets' },
        { label: 'Giao dịch', icon: PlusCircle, path: '/transaction' },
        { label: 'Phân tích', icon: BarChart3, path: '/analysis' },
        { label: 'Tài khoản', icon: User, path: '/profile' },
    ]

    const isActive = (path: string) => pathname === path

    return (
        <aside className="fixed left-6 top-24 bottom-6 w-12 flex flex-col items-center z-50 hidden md:flex">
            {/* Theme Switcher Pill (Top) */}
            <div className="bg-white/80 dark:bg-[#1A1A1A]/95 backdrop-blur-xl border border-white/50 dark:border-white/10 p-1 rounded-full shadow-lg flex flex-col gap-1 mb-auto transition-colors">
                <button
                    onClick={() => theme === 'dark' && toggleTheme()}
                    className={`p-2 rounded-full transition-all ${theme === 'light' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:text-[#888888] dark:hover:text-[var(--primary)]'}`}
                >
                    <Sun className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => theme === 'light' && toggleTheme()}
                    className={`p-2 rounded-full transition-all ${theme === 'dark' ? 'bg-[var(--primary)] text-[#000000] shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Moon className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Main Nav Pill (Centered) */}
            <nav className="bg-white/80 dark:bg-[#1A1A1A]/95 backdrop-blur-xl border border-white/50 dark:border-white/10 p-1.5 rounded-full shadow-lg flex flex-col gap-2 my-auto transition-colors">
                {navItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-300 group relative ${isActive(item.path)
                            ? 'bg-[var(--primary)] text-[#000000] shadow-lg shadow-black/20'
                            : 'text-[#A3AED0] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 dark:text-[#999999] dark:hover:text-[var(--primary)] dark:hover:bg-white/5'
                            }`}
                    >
                        <item.icon className="w-5 h-5" />

                        {/* Tooltip (Desktop) */}
                        <div className="absolute left-14 px-3 py-1 bg-slate-900 dark:bg-[#1A1A1A] text-white text-[10px] font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl z-50 border dark:border-white/10">
                            {item.label}
                            <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-[#1A1A1A]"></div>
                        </div>
                    </button>
                ))}
            </nav>

            {/* Bottom Actions Pill */}
            <div className="bg-white/80 dark:bg-[#1A1A1A]/95 backdrop-blur-xl border border-white/50 dark:border-white/10 p-1.5 rounded-full shadow-lg flex flex-col gap-2 mt-auto transition-colors">
                <button className="w-10 h-10 flex items-center justify-center rounded-2xl text-[#A3AED0] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 dark:text-[#999999] dark:hover:text-[var(--primary)] dark:hover:bg-white/5 transition-all">
                    <HelpCircle className="w-5 h-5" />
                </button>
                <button
                    onClick={() => signOut()}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl text-[#A3AED0] hover:text-red-500 hover:bg-red-50 dark:text-[#999999] dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-all"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </aside>
    )
}
