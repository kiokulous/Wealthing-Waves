'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Home, PlusCircle, Activity, User } from 'lucide-react'

/* Mobile bottom navigation — 4 tabs per spec */
export default function FloatingNav() {
    const router   = useRouter()
    const pathname = usePathname()

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

    const navItems = [
        { label: 'Tổng quan', icon: Home,     path: '/dashboard' },
        { label: 'Nhập liệu', icon: PlusCircle, path: '/transaction' },
        { label: 'Phân tích', icon: Activity,  path: '/analysis' },
        { label: 'Cá nhân',   icon: User,      path: '/profile' },
    ]

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
            style={{
                background: 'rgba(11,13,18,0.92)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderTop: '1px solid var(--line)',
                paddingBottom: 'env(safe-area-inset-bottom, 12px)',
                height: '68px',
            }}
        >
            {navItems.map((item) => {
                const active = isActive(item.path)
                return (
                    <button
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        className="flex flex-col items-center gap-1 flex-1 py-2 transition-all duration-200"
                        style={{ color: active ? 'var(--accent)' : 'var(--t-3)' }}
                    >
                        <item.icon
                            className="transition-all duration-200"
                            style={{
                                width:       22,
                                height:      22,
                                strokeWidth: active ? 2.5 : 1.8,
                                filter:      active ? 'drop-shadow(0 0 6px rgba(110,231,183,0.5))' : 'none',
                            }}
                        />
                        <span
                            className="text-[10px] font-bold tracking-wide transition-all duration-200"
                            style={{ color: active ? 'var(--accent)' : 'var(--t-3)' }}
                        >
                            {item.label}
                        </span>
                    </button>
                )
            })}
        </nav>
    )
}
