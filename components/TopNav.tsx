'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { Database, Upload, Bell } from 'lucide-react'

const PAGE_TITLES: Record<string, string> = {
    '/dashboard':   'Tổng quan',
    '/transaction': 'Nhập liệu',
    '/analysis':    'Phân tích',
    '/profile':     'Cá nhân',
    '/assets':      'Tài sản',
}

export default function TopNav() {
    const pathname = usePathname()
    const { user } = useAuth()

    const title = PAGE_TITLES[pathname] ?? 'Wealthing Waves'

    const displayName =
        user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Wave Rider'
    const initial = displayName.charAt(0).toUpperCase()

    return (
        <header
            className="sticky top-0 z-40 flex items-center gap-4 px-7 h-[56px]"
            style={{
                background: 'rgba(11,13,18,0.80)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                borderBottom: '1px solid var(--line)',
            }}
        >
            {/* Search */}
            <div
                className="flex items-center gap-2 px-3 py-[7px] rounded-[10px] flex-1 max-w-[420px]"
                style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', color: 'var(--t-3)', fontSize: 13 }}
            >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>
                </svg>
                <input
                    placeholder={`Tìm trong ${title}... (mã, giao dịch, danh mục)`}
                    style={{ flex: 1, background: 'transparent', border: 0, outline: 0, color: 'var(--t-1)', fontFamily: 'inherit', fontSize: 13 }}
                />
                <span style={{ fontFamily: 'monospace', fontSize: 10.5, color: 'var(--t-3)', padding: '2px 6px', borderRadius: 6, border: '1px solid var(--line-2)', background: 'rgba(255,255,255,0.02)' }}>⌘K</span>
            </div>

            <div style={{ flex: 1 }} />

            {/* Action buttons */}
            <div className="flex items-center gap-2">
                {[
                    { icon: Database, title: 'Đồng bộ' },
                    { icon: Upload,   title: 'Xuất báo cáo' },
                    { icon: Bell,     title: 'Thông báo', dot: true },
                ].map(({ icon: Icon, title: t, dot }) => (
                    <button
                        key={t}
                        title={t}
                        className="relative flex items-center justify-center rounded-[10px] transition-all"
                        style={{ width: 36, height: 36, background: 'var(--surface-1)', border: '1px solid var(--line)', color: 'var(--t-2)' }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.color = 'var(--t-1)'
                            ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--line-2)'
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.color = 'var(--t-2)'
                            ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'
                        }}
                    >
                        <Icon size={16} />
                        {dot && (
                            <span style={{
                                position: 'absolute', top: 8, right: 8,
                                width: 7, height: 7, borderRadius: '50%',
                                background: 'var(--accent)', boxShadow: '0 0 0 2px var(--bg)',
                            }} />
                        )}
                    </button>
                ))}

                {/* User pill */}
                <div
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-full cursor-pointer transition-all"
                    style={{ background: 'var(--surface-1)', border: '1px solid var(--line)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line-2)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)' }}
                >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #5b6bff, #00c896)', color: '#fff' }}>
                        {initial}
                    </div>
                    <div className="hidden lg:flex flex-col items-start leading-none gap-[2px]">
                        <span className="text-[12.5px] font-semibold" style={{ color: 'var(--t-1)' }}>{displayName}</span>
                        <span className="text-[10.5px]" style={{ color: 'var(--t-3)' }}>{user?.email}</span>
                    </div>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--t-3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="hidden lg:block">
                        <path d="m6 9 6 6 6-6"/>
                    </svg>
                </div>
            </div>
        </header>
    )
}
