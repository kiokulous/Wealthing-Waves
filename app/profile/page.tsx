'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase'
import { getAllTransactions, getAllMarketPrices } from '@/lib/api/database'
import { calculatePortfolio } from '@/lib/api/portfolio'
import { Save, X, Loader2, LogOut, ShieldCheck, UserCircle, TrendingUp, Wallet, Calendar } from 'lucide-react'

export default function ProfilePage() {
    const router = useRouter()
    const { user, loading, signOut } = useAuth()
    const [supabase] = useState(() => createClient())

    const [nickname,        setNickname]        = useState('')
    const [password,        setPassword]        = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [openSection,     setOpenSection]     = useState<'none' | 'profile' | 'security'>('none')
    const [isSaving,        setIsSaving]        = useState(false)
    const [msg,             setMsg]             = useState<{ text: string; ok: boolean } | null>(null)

    // Stats
    const [totalValue,      setTotalValue]      = useState(0)
    const [returnPct,       setReturnPct]       = useState(0)
    const [txnCount,        setTxnCount]        = useState(0)
    const [joinDate,        setJoinDate]        = useState('')

    useEffect(() => {
        if (!loading && !user) router.push('/login')
        if (user) {
            setNickname(user.user_metadata?.full_name || '')
            const created = user.created_at
                ? new Date(user.created_at).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
                : ''
            setJoinDate(created)
            loadStats()
        }
    }, [user, loading, router])

    const loadStats = async () => {
        try {
            const [txns, prices] = await Promise.all([getAllTransactions(), getAllMarketPrices()])
            const portfolio = calculatePortfolio(txns, prices)
            setTotalValue(portfolio.totalCurrentValue)
            setReturnPct(portfolio.totalInvested > 0
                ? (portfolio.totalProfitLoss / portfolio.totalInvested) * 100 : 0)
            setTxnCount(txns.length)
        } catch { /* ignore */ }
    }

    const handleUpdateProfile = async () => {
        setIsSaving(true); setMsg(null)
        try {
            const { error } = await supabase.auth.updateUser({ data: { full_name: nickname } })
            if (error) throw error
            setMsg({ text: 'Đã cập nhật tên hiển thị!', ok: true })
            setOpenSection('none')
        } catch (err: any) {
            setMsg({ text: err.message || 'Có lỗi xảy ra', ok: false })
        } finally { setIsSaving(false) }
    }

    const handleUpdatePassword = async () => {
        if (password.length < 6) { setMsg({ text: 'Mật khẩu cần ít nhất 6 ký tự!', ok: false }); return }
        if (password !== confirmPassword) { setMsg({ text: 'Mật khẩu xác nhận không khớp!', ok: false }); return }
        setIsSaving(true); setMsg(null)
        try {
            const { error } = await supabase.auth.updateUser({ password })
            if (error) throw error
            setMsg({ text: 'Đổi mật khẩu thành công!', ok: true })
            setOpenSection('none'); setPassword(''); setConfirmPassword('')
        } catch (err: any) {
            setMsg({ text: err.message || 'Có lỗi xảy ra', ok: false })
        } finally { setIsSaving(false) }
    }

    const canChangePassword =
        user?.app_metadata?.provider === 'email' ||
        user?.identities?.some((id: any) => id.provider === 'email')

    const displayName = user?.user_metadata?.full_name || 'Wave Rider'
    const initial     = displayName.charAt(0).toUpperCase()

    const formatCurrency = (v: number) =>
        new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(v) + ' đ'

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
            </div>
        )
    }

    const toggleSection = (sec: 'profile' | 'security') => {
        setOpenSection(prev => prev === sec ? 'none' : sec)
        setMsg(null)
    }

    const SectionCard = ({
        id, title, sub, icon: Icon, accentColor, children,
    }: {
        id: 'profile' | 'security'
        title: string
        sub: string
        icon: React.ElementType
        accentColor: string
        children: React.ReactNode
    }) => {
        const open = openSection === id
        return (
            <div
                className="overflow-hidden transition-all duration-300"
                style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.012), transparent), var(--surface-1)',
                    border: `1px solid ${open ? accentColor : 'var(--line)'}`,
                    borderRadius: 'var(--r-md)',
                    boxShadow: open ? `0 0 0 4px ${accentColor}18` : 'var(--sh-card)',
                }}
            >
                <button
                    onClick={() => toggleSection(id)}
                    className="w-full flex items-center justify-between p-5 transition-all"
                    style={{ color: 'var(--t-1)' }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-all"
                            style={{
                                background: open ? accentColor : 'var(--accent-12)',
                                color: open ? '#062018' : 'var(--accent)',
                            }}
                        >
                            <Icon className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <p className="text-[13.5px] font-semibold" style={{ color: 'var(--t-1)' }}>{title}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: 'var(--t-3)' }}>{sub}</p>
                        </div>
                    </div>
                    <svg
                        width="15" height="15" viewBox="0 0 24 24" fill="none"
                        stroke="var(--t-3)" strokeWidth="2" strokeLinecap="round"
                        style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
                    >
                        <path d="m9 18 6-6-6-6" />
                    </svg>
                </button>

                {open && (
                    <div className="px-5 pb-5 pt-1" style={{ borderTop: '1px solid var(--line)' }}>
                        {children}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="animate-fade-up" style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 60 }}>

            {/* Page header */}
            <div className="mb-6 pt-2">
                <h1 className="text-[28px] font-bold tracking-tight" style={{ color: 'var(--t-1)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                    Cá nhân
                </h1>
                <p className="mt-1.5 text-[13.5px]" style={{ color: 'var(--t-2)' }}>
                    Quản lý hồ sơ, thành tích và tuỳ chọn của bạn trong Wealthing Waves.
                </p>
            </div>

            {/* Two-column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 20 }}>

                {/* LEFT: Profile hero card */}
                <div
                    className="flex flex-col"
                    style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.012), transparent), var(--surface-1)',
                        border: '1px solid var(--line)',
                        borderRadius: 'var(--r-lg)',
                        padding: 24,
                        boxShadow: 'var(--sh-card)',
                    }}
                >
                    {/* Avatar + name */}
                    <div className="flex items-center gap-4 mb-6">
                        <div
                            className="flex items-center justify-center font-bold text-2xl flex-shrink-0"
                            style={{
                                width: 68, height: 68, borderRadius: 20,
                                background: 'linear-gradient(135deg, #5b6bff 0%, #00c896 100%)',
                                color: '#fff',
                                boxShadow: '0 8px 24px -8px rgba(0,200,150,0.5)',
                            }}
                        >
                            {initial}
                        </div>
                        <div>
                            <h2 className="text-[18px] font-bold tracking-tight" style={{ color: 'var(--t-1)', letterSpacing: '-0.01em' }}>
                                {displayName}
                            </h2>
                            <p className="text-[12px] mt-0.5" style={{ color: 'var(--t-3)' }}>{user.email}</p>
                        </div>
                    </div>

                    {/* Wave Rider badge */}
                    <div className="mb-6">
                        <div
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold"
                            style={{
                                background: 'var(--accent-12)',
                                border: '1px solid var(--accent-18)',
                                color: 'var(--accent)',
                            }}
                        >
                            <span>🌊</span>
                            <span>WAVE RIDER · LEVEL 1</span>
                        </div>
                        <p className="text-[11.5px] mt-3 leading-relaxed" style={{ color: 'var(--t-3)' }}>
                            Bắt đầu hành trình tài chính từ {joinDate || 'đầu'}.
                            Tiếp tục ghi nhận giao dịch để nâng cấp.
                        </p>
                    </div>

                    {/* XP bar */}
                    <div className="mb-6">
                        <div className="flex justify-between text-[11px] mb-2" style={{ color: 'var(--t-3)' }}>
                            <span className="font-semibold">Tiến độ Level</span>
                            <span className="font-semibold" style={{ color: 'var(--accent)' }}>
                                {Math.min(txnCount, 20)} / 20 giao dịch
                            </span>
                        </div>
                        <div className="pbar">
                            <span style={{ width: `${Math.min((txnCount / 20) * 100, 100)}%` }} />
                        </div>
                        <p className="text-[11px] mt-1.5" style={{ color: 'var(--t-4)' }}>
                            Còn {Math.max(20 - txnCount, 0)} giao dịch để đạt Level 2
                        </p>
                    </div>

                    {/* Stats row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 'auto' }}>
                        {[
                            { icon: Wallet,     label: 'Danh mục',  value: formatCurrency(totalValue) },
                            { icon: TrendingUp, label: 'Lợi nhuận', value: `${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(1)}%`, color: returnPct >= 0 ? 'var(--accent)' : 'var(--neg)' },
                            { icon: Calendar,   label: 'Giao dịch', value: `${txnCount}` },
                        ].map((stat) => (
                            <div
                                key={stat.label}
                                style={{
                                    background: 'var(--surface-2)',
                                    border: '1px solid var(--line)',
                                    borderRadius: 'var(--r-sm)',
                                    padding: '10px 12px',
                                    display: 'flex', flexDirection: 'column', gap: 6,
                                }}
                            >
                                <stat.icon className="w-3.5 h-3.5" style={{ color: 'var(--t-3)' }} />
                                <span className="text-[11px]" style={{ color: 'var(--t-3)' }}>{stat.label}</span>
                                <span className="text-[14px] font-bold" style={{ color: stat.color || 'var(--t-1)', letterSpacing: '-0.01em' }}>
                                    {stat.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Settings */}
                <div className="flex flex-col gap-3">

                    {/* Message banner */}
                    {msg && (
                        <div
                            className="p-4 flex items-center gap-3 text-[13px] font-semibold"
                            style={{
                                background: msg.ok ? 'var(--accent-12)' : 'var(--neg-12)',
                                border: `1px solid ${msg.ok ? 'var(--accent-18)' : 'rgba(255,90,110,0.3)'}`,
                                borderRadius: 'var(--r-sm)',
                                color: msg.ok ? 'var(--accent)' : 'var(--neg)',
                            }}
                        >
                            <span className="flex-1">{msg.text}</span>
                            <button onClick={() => setMsg(null)} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Edit nickname */}
                    <SectionCard id="profile" title="Thông tin cá nhân" sub="Tên hiển thị & danh tính" icon={UserCircle} accentColor="var(--info)">
                        <div className="space-y-3 mt-4">
                            <div>
                                <label className="label-cap block mb-1.5">Tên hiển thị mới</label>
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    placeholder="Nhập tên mới..."
                                    className="input-bento"
                                />
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button onClick={() => setOpenSection('none')} className="btn-ghost flex-1 py-2.5 text-sm">Hủy</button>
                                <button
                                    onClick={handleUpdateProfile}
                                    disabled={isSaving}
                                    className="flex-[2] flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-[10px] transition-all"
                                    style={{ background: 'var(--info)', color: '#fff' }}
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Lưu thay đổi
                                </button>
                            </div>
                        </div>
                    </SectionCard>

                    {/* Change password */}
                    {canChangePassword && (
                        <SectionCard id="security" title="Bảo mật & Mật khẩu" sub="Đổi mật khẩu đăng nhập" icon={ShieldCheck} accentColor="var(--accent)">
                            <div className="space-y-3 mt-4">
                                <div>
                                    <label className="label-cap block mb-1.5">Mật khẩu mới (≥ 6 ký tự)</label>
                                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input-bento" />
                                </div>
                                <div>
                                    <label className="label-cap block mb-1.5">Xác nhận mật khẩu</label>
                                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Nhập lại..." className="input-bento" />
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <button onClick={() => setOpenSection('none')} className="btn-ghost flex-1 py-2.5 text-sm">Hủy</button>
                                    <button
                                        onClick={handleUpdatePassword}
                                        disabled={isSaving}
                                        className="btn-accent flex-[2] flex items-center justify-center gap-2 py-2.5"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                        Đổi mật khẩu
                                    </button>
                                </div>
                            </div>
                        </SectionCard>
                    )}

                    {/* Sign out */}
                    <button
                        onClick={async () => { await signOut(); router.push('/login') }}
                        className="w-full flex items-center justify-between p-5 transition-all"
                        style={{
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.012), transparent), var(--surface-1)',
                            border: '1px solid var(--line)',
                            borderRadius: 'var(--r-md)',
                            boxShadow: 'var(--sh-card)',
                        }}
                        onMouseEnter={(e) => {
                            ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,90,110,0.35)'
                            ;(e.currentTarget as HTMLElement).style.background  = 'rgba(255,90,110,0.06)'
                        }}
                        onMouseLeave={(e) => {
                            ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'
                            ;(e.currentTarget as HTMLElement).style.background  = 'linear-gradient(180deg, rgba(255,255,255,0.012), transparent) var(--surface-1)'
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: 'var(--neg-12)', color: 'var(--neg)' }}>
                                <LogOut className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                                <p className="text-[13.5px] font-semibold" style={{ color: 'var(--neg)' }}>Thoát phiên làm việc</p>
                                <p className="text-[11px] mt-0.5" style={{ color: 'var(--t-3)' }}>Đăng xuất khỏi Wealthing Waves</p>
                            </div>
                        </div>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--neg)" strokeWidth="2" strokeLinecap="round">
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    </button>

                    {/* Footer */}
                    <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] pt-4" style={{ color: 'var(--t-4)' }}>
                        Wealthing Waves · v2.0 · Ride the wave 🌊
                    </p>
                </div>
            </div>
        </div>
    )
}
