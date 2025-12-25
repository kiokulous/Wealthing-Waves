import React from 'react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { useTheme } from '@/components/providers/ThemeProvider'

interface TotalBalanceChartProps {
    data: { date: string; value: number }[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 dark:bg-[#1A1A1A]/90 backdrop-blur-md p-3 rounded-xl border border-slate-100 dark:border-white/10 shadow-xl">
                <p className="text-[10px] uppercase text-[var(--text-muted)] font-bold mb-1">{label}</p>
                <p className="text-sm font-bold text-[var(--foreground)]">
                    {new Intl.NumberFormat('vi-VN').format(payload[0].value)} đ
                </p>
            </div>
        )
    }
    return null
}

export default function TotalBalanceChart({ data }: TotalBalanceChartProps) {
    const { theme } = useTheme()

    // Colors
    // Always use Green #05CD99 (Mint) to match the new request and brand identity
    // Or maybe a slightly darker green for light mode if contrast is needed, but user requested change from purple.
    const color = '#05CD99'

    if (!data || data.length === 0) return null

    return (
        <div className="w-full h-full min-h-[120px] absolute bottom-0 left-0 right-0 z-0 opacity-50 hover:opacity-100 transition-opacity duration-500">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="fadeLeft" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="white" stopOpacity={0} />
                            <stop offset="40%" stopColor="white" stopOpacity={1} />
                        </linearGradient>
                        <mask id="fadeMask">
                            <rect x="0" y="0" width="100%" height="100%" fill="url(#fadeLeft)" />
                        </mask>
                    </defs>
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        mask="url(#fadeMask)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
