'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { User, Settings, Shield, LogOut, ChevronRight } from 'lucide-react'

export default function ProfilePage() {
    const router = useRouter()
    const { user, loading, signOut } = useAuth()

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Header */}
            <header className="px-2">
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-1">
                    Hồ sơ <span className="text-blue-600">Người dùng</span>
                </h1>
                <p className="text-slate-500 font-medium tracking-tight">Quản lý nhận dạng và cài đặt đồng bộ hóa của bạn.</p>
            </header>

            <div className="max-w-2xl mx-auto space-y-6 px-2">
                {/* Profile Card */}
                <div className="bento-card p-10 flex items-center gap-8 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>

                    <div className="w-24 h-24 rounded-[2rem] bg-blue-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-blue-500/20 relative z-10 animate-in zoom-in duration-500">
                        {user?.email?.charAt(0).toUpperCase()}
                    </div>

                    <div className="relative z-10">
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Danh tính Hoạt động</p>
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight">Wave Operator</h2>
                        <p className="text-slate-500 font-bold text-sm tracking-tight mt-1">{user?.email}</p>
                    </div>
                </div>

                {/* Settings Grid / List */}
                <div className="grid grid-cols-1 gap-4">
                    <button className="bento-card p-6 flex items-center justify-between group hover:bg-slate-50 transition-all border-slate-100 shadow-none">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                <Settings className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-slate-900 text-sm tracking-tight">Cấu hình Hệ thống</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Điều chỉnh các tham số cộng hưởng</p>
                                <p className="font-bold text-neutral-900 text-sm tracking-tight">Cấu hình Hệ thống</p>
                                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">Điều chỉnh các tham số cộng hưởng</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" />
                    </button>

                    <button className="bento-card p-6 flex items-center justify-between group hover:bg-neutral-50 transition-all border-neutral-100 shadow-none">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-neutral-50 text-neutral-400 flex items-center justify-center group-hover:bg-[var(--primary-light)] group-hover:text-[var(--primary)] transition-all">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-neutral-900 text-sm tracking-tight">Bảo mật & Mã hóa</p>
                                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">Kiểm soát truy cập và kho lưu trữ</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" />
                    </button>

                    <button
                        onClick={() => signOut()}
                        className="bento-card p-6 flex items-center justify-between group hover:bg-red-50 transition-all border-neutral-100 shadow-none mt-4"
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-400 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all">
                                <LogOut className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-red-600 text-sm tracking-tight">Chấm dứt Phiên làm việc</p>
                                <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mt-0.5">Đăng xuất khỏi tài khoản</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-red-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                    </button>
                </div>

                <div className="pt-10 text-center">
                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.3em]">Wealthing Waves Identity Protocol v1.0.4</p>
                </div>
            </div>
        </div>
    )
}
