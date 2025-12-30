'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase'
import { User, Settings, Shield, LogOut, ChevronRight, Save, X, Key, Edit3, Lock } from 'lucide-react'

export default function ProfilePage() {
    const router = useRouter()
    const { user, loading, signOut } = useAuth()
    const [supabase] = useState(() => createClient())

    // Form states
    const [nickname, setNickname] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    // UI states
    const [activeSection, setActiveSection] = useState<'none' | 'profile' | 'security'>('none')
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        } else if (user) {
            setNickname(user.user_metadata?.full_name || '')
        }
    }, [user, loading, router])

    const handleUpdateProfile = async () => {
        setIsSaving(true)
        setMessage(null)
        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: nickname }
            })
            if (error) throw error
            setMessage({ text: 'Cập nhật tên hiển thị thành công!', type: 'success' })
            setActiveSection('none')

            // Force refresh of the page to reflect changes if AuthProvider doesn't catch it immediately
            // But usually, AuthProvider subscribes to changes.
        } catch (error: any) {
            setMessage({ text: error.message || 'Có lỗi xảy ra khi cập nhật hồ sơ', type: 'error' })
        } finally {
            setIsSaving(false)
        }
    }

    const handleUpdatePassword = async () => {
        if (password !== confirmPassword) {
            setMessage({ text: 'Mật khẩu xác nhận không khớp', type: 'error' })
            return
        }
        if (password.length < 6) {
            setMessage({ text: 'Mật khẩu phải có ít nhất 6 ký tự', type: 'error' })
            return
        }

        setIsSaving(true)
        setMessage(null)
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })
            if (error) throw error
            setMessage({ text: 'Đổi mật khẩu thành công!', type: 'success' })
            setActiveSection('none')
            setPassword('')
            setConfirmPassword('')
        } catch (error: any) {
            setMessage({ text: error.message || 'Có lỗi xảy ra khi đổi mật khẩu', type: 'error' })
        } finally {
            setIsSaving(false)
        }
    }

    // Helper to determine if user can change password (only for email provider)
    // Note: detailed provider check might require inspecting user.identities
    const showPasswordChange = user?.app_metadata?.provider === 'email' || user?.identities?.some(id => id.provider === 'email')

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <header className="px-2">
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-1">
                    Hồ sơ <span className="text-blue-600">Người dùng</span>
                </h1>
                <p className="text-slate-500 font-medium tracking-tight">Quản lý nhận dạng và cài đặt bảo mật của bạn.</p>
            </header>

            <div className="max-w-2xl mx-auto space-y-6 px-2">
                {/* Profile Card */}
                <div className="bento-card p-10 flex flex-col sm:flex-row items-center gap-8 group relative overflow-hidden transition-all hover:shadow-lg">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>

                    <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-blue-500/20 relative z-10 shrink-0">
                        {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                    </div>

                    <div className="relative z-10 text-center sm:text-left flex-1">
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Danh tính Hoạt động</p>
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight mb-1">
                            {user?.user_metadata?.full_name || 'Wave Operator'}
                        </h2>
                        <p className="text-slate-500 font-medium text-sm tracking-tight">{user?.email}</p>
                    </div>
                </div>

                {/* Message Banner */}
                {message && (
                    <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm font-medium">{message.text}</span>
                        <button onClick={() => setMessage(null)} className="ml-auto p-1 hover:bg-black/5 rounded-full transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Settings Grid / List */}
                <div className="grid grid-cols-1 gap-4">
                    {/* Change Nickname Section */}
                    <div className={`bento-card overflow-hidden transition-all duration-300 ${activeSection === 'profile' ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}>
                        <button
                            onClick={() => {
                                setActiveSection(activeSection === 'profile' ? 'none' : 'profile')
                                setMessage(null)
                                setNickname(user?.user_metadata?.full_name || '')
                            }}
                            className="w-full p-6 flex items-center justify-between group hover:bg-slate-50 transition-all"
                        >
                            <div className="flex items-center gap-5">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeSection === 'profile' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                                    <User className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-900 text-sm tracking-tight">Thông tin Cá nhân</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Tên hiển thị & Danh tính</p>
                                </div>
                            </div>
                            <ChevronRight className={`w-5 h-5 text-neutral-300 transition-transform duration-300 ${activeSection === 'profile' ? 'rotate-90 text-blue-500' : 'group-hover:translate-x-1'}`} />
                        </button>

                        {activeSection === 'profile' && (
                            <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2 duration-200">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tên hiển thị (Nickname)</label>
                                        <div className="relative">
                                            <Edit3 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                value={nickname}
                                                onChange={(e) => setNickname(e.target.value)}
                                                placeholder="Nhập tên hiển thị mới"
                                                className="w-full h-12 pl-12 pr-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium placeholder:text-slate-400 text-sm transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            onClick={() => setActiveSection('none')}
                                            className="px-4 py-2 text-slate-500 text-sm font-bold hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            onClick={handleUpdateProfile}
                                            disabled={isSaving}
                                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSaving ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span> : <Save className="w-4 h-4" />}
                                            Lưu thay đổi
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Change Password Section - Only for email provider */}
                    {showPasswordChange && (
                        <div className={`bento-card overflow-hidden transition-all duration-300 ${activeSection === 'security' ? 'ring-2 ring-emerald-500 shadow-lg' : ''}`}>
                            <button
                                onClick={() => {
                                    setActiveSection(activeSection === 'security' ? 'none' : 'security')
                                    setMessage(null)
                                }}
                                className="w-full p-6 flex items-center justify-between group hover:bg-slate-50 transition-all"
                            >
                                <div className="flex items-center gap-5">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeSection === 'security' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600'}`}>
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-slate-900 text-sm tracking-tight">Bảo mật & Mật khẩu</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Đổi mật khẩu đăng nhập</p>
                                    </div>
                                </div>
                                <ChevronRight className={`w-5 h-5 text-neutral-300 transition-transform duration-300 ${activeSection === 'security' ? 'rotate-90 text-emerald-500' : 'group-hover:translate-x-1'}`} />
                            </button>

                            {activeSection === 'security' && (
                                <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2 duration-200">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mật khẩu mới</label>
                                            <div className="relative">
                                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                                                    className="w-full h-12 pl-12 pr-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium placeholder:text-slate-400 text-sm transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Xác nhận mật khẩu</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="Nhập lại mật khẩu mới"
                                                    className="w-full h-12 pl-12 pr-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium placeholder:text-slate-400 text-sm transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3 pt-2">
                                            <button
                                                onClick={() => setActiveSection('none')}
                                                className="px-4 py-2 text-slate-500 text-sm font-bold hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                onClick={handleUpdatePassword}
                                                disabled={isSaving}
                                                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSaving ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span> : <Save className="w-4 h-4" />}
                                                Cập nhật Mật khẩu
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Logout Button */}
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
                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.3em]">Wealthing Waves Identity Protocol v1.0.5</p>
                </div>
            </div>
        </div>
    )
}
