'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { LayoutDashboard, BarChart3, PlusCircle, Wallet, User, LogOut, HelpCircle } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

export default function Sidebar() {
    const router = useRouter()
    const pathname = usePathname()
    const { signOut } = useAuth()

    const navItems = [
        { label: 'Bảng điều khiển', icon: LayoutDashboard, path: '/dashboard' },
        { label: 'Tài sản',         icon: Wallet,           path: '/assets' },
        { label: 'Giao dịch',       icon: PlusCircle,       path: '/transaction' },
        { label: 'Phân tích',       icon: BarChart3,         path: '/analysis' },
        { label: 'Tài khoản',       icon: User,              path: '/profile' },
    ]

    const isActive = (path: string) => pathname === path

    return (
        <aside className="fixed left-6 top-24 bottom-6 w-12 flex flex-col items-center z-50 hidden md:flex">
            {/* Main Nav Pill */}
            <nav
                className="p-1.5 rounded-full flex flex-col gap-2 my-auto"
                style={{
                    background: 'var(--surface-1)',
                    border: '1px solid var(--line)',
                    boxShadow: 'var(--sh-pop)',
                    backdropFilter: 'blur(12px)',
                }}
            >
                {navItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        className="w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-200 group relative"
                        style={
                            isActive(item.path)
                                ? { background: 'linear-gradient(180deg, var(--accent-2), var(--accent))', color: '#062018' }
                                : { color: 'var(--t-3)' }
                        }
                        onMouseEnter={(e) => {
                            if (!isActive(item.path)) {
                                (e.currentTarget as HTMLElement).style.color = 'var(--accent)'
                                ;(e.currentTarget as HTMLElement).style.background = 'var(--accent-12)'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive(item.path)) {
                                (e.currentTarget as HTMLElement).style.color = 'var(--t-3)'
                                ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                            }
                        }}
                    >
                        <item.icon className="w-5 h-5" />
                        {/* Tooltip */}
                        <div
                            className="absolute left-14 px-3 py-1.5 text-[11px] font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50"
                            style={{
                                background: 'var(--surface-3)',
                                border: '1px solid var(--line-2)',
                                color: 'var(--t-1)',
                                boxShadow: 'var(--sh-pop)',
                            }}
                        >
                            {item.label}
                        </div>
                    </button>
                ))}
            </nav>

            {/* Bottom Actions */}
            <div
                className="p-1.5 rounded-full flex flex-col gap-2 mt-auto"
                style={{
                    background: 'var(--surface-1)',
                    border: '1px solid var(--line)',
                    boxShadow: 'var(--sh-pop)',
                }}
            >
                <button
                    className="w-10 h-10 flex items-center justify-center rounded-2xl transition-all"
                    style={{ color: 'var(--t-3)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--t-1)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--t-3)' }}
                >
                    <HelpCircle className="w-5 h-5" />
                </button>
                <button
                    onClick={() => signOut()}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl transition-all"
                    style={{ color: 'var(--t-3)' }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color = 'var(--neg)'
                        ;(e.currentTarget as HTMLElement).style.background = 'var(--neg-12)'
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color = 'var(--t-3)'
                        ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                    }}
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </aside>
    )
}
