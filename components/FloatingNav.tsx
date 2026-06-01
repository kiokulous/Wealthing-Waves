'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { LayoutDashboard, Plus, BarChart3, User, Zap } from 'lucide-react'

export default function FloatingNav() {
    const router   = useRouter()
    const pathname = usePathname()

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

    const navItems = [
        { label: 'Tổng quan', icon: LayoutDashboard, path: '/dashboard' },
        { label: 'Nhập liệu', icon: Plus,            path: '/transaction' },
        { label: 'Tín hiệu',  icon: Zap,             path: '/signals' },
        { label: 'Phân tích', icon: BarChart3,       path: '/analysis' },
        { label: 'Tài khoản', icon: User,            path: '/profile' },
    ]

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2"
            style={{
                background: 'rgba(10,12,17,0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderTop: '1px solid var(--line)',
                paddingBottom: 'env(safe-area-inset-bottom, 8px)',
                height: 64,
            }}
        >
            {navItems.map((item) => {
                const active = isActive(item.path)
                // Nhập liệu tab gets a special accent pill
                const isEntry = item.path === '/transaction'
                return (
                    <button
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        className="flex flex-col items-center gap-1 flex-1 py-2 transition-all duration-200 relative"
                        style={{ color: active ? 'var(--accent)' : 'var(--t-3)' }}
                    >
                        {isEntry ? (
                            /* Special pill for Nhập liệu */
                            <div style={{
                                width: 44, height: 44,
                                borderRadius: '50%',
                                background: active
                                    ? 'linear-gradient(180deg, var(--accent-2), var(--accent))'
                                    : 'var(--surface-2)',
                                border: active ? 'none' : '1px solid var(--line)',
                                display: 'grid', placeItems: 'center',
                                color: active ? '#062018' : 'var(--t-2)',
                                marginBottom: -4,
                                boxShadow: active ? '0 4px 16px -4px rgba(0,200,150,0.5)' : 'none',
                                transition: 'all .2s',
                            }}>
                                <item.icon size={20} strokeWidth={active ? 2.5 : 2} />
                            </div>
                        ) : (
                            <div style={{
                                width: 36, height: 28,
                                borderRadius: 10,
                                background: active ? 'var(--accent-12)' : 'transparent',
                                display: 'grid', placeItems: 'center',
                                transition: 'all .2s',
                            }}>
                                <item.icon
                                    size={20}
                                    strokeWidth={active ? 2.5 : 1.8}
                                    style={{ filter: active ? 'drop-shadow(0 0 5px rgba(0,200,150,0.4))' : 'none' }}
                                />
                            </div>
                        )}
                        <span style={{
                            fontSize: 10, fontWeight: active ? 700 : 500,
                            letterSpacing: '0.02em',
                            color: active ? 'var(--accent)' : 'var(--t-3)',
                        }}>
                            {item.label}
                        </span>
                    </button>
                )
            })}
        </nav>
    )
}
