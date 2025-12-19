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
    Search
} from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

export default function Sidebar() {
    const router = useRouter()
    const pathname = usePathname()
    const { signOut } = useAuth()

    const navItems = [
        { label: 'Bảng điều khiển', icon: LayoutDashboard, path: '/dashboard' },
        { label: 'Phân tích', icon: BarChart3, path: '/analysis' },
        { label: 'Giao dịch', icon: PlusCircle, path: '/transaction' },
        { label: 'Tài sản', icon: Wallet, path: '/assets' },
        { label: 'Tài khoản', icon: User, path: '/profile' },
    ]

    const isActive = (path: string) => pathname === path

    return (
        <aside className="fixed left-6 top-6 bottom-6 w-60 bg-white border border-slate-200 rounded-[2.5rem] flex flex-col z-50 overflow-hidden hidden md:flex shadow-sm">
            {/* Logo */}
            <div className="p-8">
                <div className="flex items-center gap-3 mb-10 group cursor-pointer" onClick={() => router.push('/dashboard')}>
                    <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <span className="text-white font-bold text-xl tracking-tighter">W</span>
                    </div>
                    <h1 className="text-slate-900 font-bold text-lg tracking-tight">Waves</h1>
                </div>

                {/* Search Bar - Aesthetic Bento Style */}
                <div className="relative mb-8 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        className="w-full bg-slate-100 border-none rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:bg-slate-50 transition-all outline-none"
                    />
                </div>
            </div>

            {/* Main Menu */}
            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto no-scrollbar">
                <p className="px-4 text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-4 ml-1">Tổng quan</p>
                {navItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${isActive(item.path)
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="text-sm font-bold tracking-tight">{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* Footer / User Area */}
            <div className="p-4 mt-auto border-t border-slate-100">
                <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm font-bold tracking-tight">Đăng xuất</span>
                </button>
            </div>
        </aside>
    )
}
