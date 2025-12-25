'use client'

import React from 'react'
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useTheme } from '@/components/providers/ThemeProvider'

interface ProfitCorrelationChartProps {
    invested: number
    profit: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 dark:bg-[#1A1A1A]/90 backdrop-blur-md p-3 rounded-xl border border-slate-100 dark:border-white/10 shadow-xl z-50">
                <p className="text-[10px] uppercase text-[var(--text-muted)] font-bold mb-1">{payload[0].payload.name}</p>
                <p className={`text-sm font-bold ${payload[0].payload.name === 'Lãi/Lỗ' ? (payload[0].value >= 0 ? 'text-emerald-500' : 'text-red-500') : 'text-[var(--foreground)]'}`}>
                    {new Intl.NumberFormat('vi-VN').format(Math.abs(payload[0].value))} đ
                </p>
            </div>
        )
    }
    return null
}

export default function ProfitCorrelationChart({ invested, profit }: ProfitCorrelationChartProps) {
    const { theme } = useTheme()

    const data = [
        {
            name: 'Vốn',
            value: invested,
            color: theme === 'dark' ? '#333' : '#E2E8F0' // Slate-200 or Dark Grey
        },
        {
            name: 'Lãi/Lỗ',
            value: profit,
            color: profit >= 0 ? '#10B981' : '#EF4444' // Emerald-500 or Red-500
        }
    ]

    return (
        <div className="w-full h-full min-h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} barSize={40}>
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: theme === 'dark' ? '#555' : '#94a3b8', fontSize: 10, fontWeight: 700 }}
                        dy={10}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    <ReferenceLine y={0} stroke={theme === 'dark' ? '#333' : '#e2e8f0'} />
                    <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
