import { TrendingUp, PieChart, Coins, Vault } from 'lucide-react'
import React from 'react'

type CategoryIconProps = {
    category: 'Cổ phiếu' | 'Chứng chỉ quỹ' | 'Vàng' | 'Tiết kiệm'
    className?: string
    style?: React.CSSProperties
}

export default function CategoryIcon({ category, className = 'w-6 h-6', style }: CategoryIconProps) {
    const iconMap = {
        'Cổ phiếu': TrendingUp,
        'Chứng chỉ quỹ': PieChart,
        'Vàng': Coins,
        'Tiết kiệm': Vault,
    }

    const Icon = iconMap[category] || TrendingUp

    return <Icon className={className} style={style} />
}
