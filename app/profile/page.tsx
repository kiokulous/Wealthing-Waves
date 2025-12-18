'use client'

import React from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import FloatingNav from '@/components/FloatingNav'

export default function ProfilePage() {
    const { user, signOut } = useAuth()

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-24">
            <div className="max-w-2xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-slate-800 mb-6">Tài khoản của tôi</h1>

                <div className="soft-card p-6 flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                        {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 text-lg">User</p>
                        <p className="text-slate-500 text-sm">{user?.email}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <button className="w-full bg-white p-4 rounded-2xl flex items-center justify-between text-slate-700 font-bold hover:bg-slate-50 transition-colors border border-slate-100">
                        <span>Cài đặt chung</span>
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                    <button className="w-full bg-white p-4 rounded-2xl flex items-center justify-between text-slate-700 font-bold hover:bg-slate-50 transition-colors border border-slate-100">
                        <span>Bảo mật</span>
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>

                    <button
                        onClick={() => signOut()}
                        className="w-full bg-white p-4 rounded-2xl flex items-center justify-between text-rose-500 font-bold hover:bg-rose-50 transition-colors border border-slate-100 mt-6"
                    >
                        <span>Đăng xuất</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </button>
                </div>
            </div>
            <FloatingNav />
        </div>
    )
}
