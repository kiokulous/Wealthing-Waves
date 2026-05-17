// ================================================
// USER LEVEL SYSTEM
// Based on total transaction count — no DB writes needed.
// ================================================

export interface UserLevelInfo {
    level: number
    title: string
    emoji: string
    color: string          // CSS color for badge
    bgColor: string        // CSS background for badge
    borderColor: string    // CSS border for badge
    description: string    // Flavor text
    currentMin: number     // Min txns for this level
    nextLevelTxns: number  // Txns needed to reach next level (0 if max)
    progressPct: number    // 0–100, progress within current level
    isMaxLevel: boolean
}

const LEVELS = [
    {
        level: 1,
        title: 'Mò Sò Bãi Cạn',
        emoji: '🐚',
        color: '#7B8FA1',
        bgColor: 'rgba(123,143,161,0.12)',
        borderColor: 'rgba(123,143,161,0.3)',
        description: 'Chân còn ướt, ví chưa thủng. Hành trình bắt đầu!',
        min: 0,
        max: 9,
    },
    {
        level: 2,
        title: 'Lướt Sóng Tập Sự',
        emoji: '🌊',
        color: '#5B9BD5',
        bgColor: 'rgba(91,155,213,0.12)',
        borderColor: 'rgba(91,155,213,0.3)',
        description: 'Đã biết mặt thị trường. Ít nhất chưa bị sóng nuốt.',
        min: 10,
        max: 24,
    },
    {
        level: 3,
        title: 'Surfer Chân Trần',
        emoji: '🏄',
        color: '#00B4D8',
        bgColor: 'rgba(0,180,216,0.12)',
        borderColor: 'rgba(0,180,216,0.3)',
        description: 'Lướt được rồi, dù vẫn hay té ngã spectacularly.',
        min: 25,
        max: 49,
    },
    {
        level: 4,
        title: 'Thuyền Trưởng Cảng Nhỏ',
        emoji: '⚓',
        color: '#0096C7',
        bgColor: 'rgba(0,150,199,0.12)',
        borderColor: 'rgba(0,150,199,0.3)',
        description: 'Có thuyền rồi. Chưa ra khơi được nhưng trông rất oách.',
        min: 50,
        max: 99,
    },
    {
        level: 5,
        title: 'Cá Voi Nhỏ',
        emoji: '🐋',
        color: '#0077B6',
        bgColor: 'rgba(0,119,182,0.12)',
        borderColor: 'rgba(0,119,182,0.3)',
        description: 'Bắt đầu tạo ra sóng. Thị trường bắt đầu để ý.',
        min: 100,
        max: 199,
    },
    {
        level: 6,
        title: 'Cá Mập Giả Vờ Hiền',
        emoji: '🦈',
        color: '#00C896',
        bgColor: 'rgba(0,200,150,0.12)',
        borderColor: 'rgba(0,200,150,0.3)',
        description: 'Nụ cười thân thiện, nhưng danh mục thì đáng sợ lắm đó.',
        min: 200,
        max: 499,
    },
    {
        level: 7,
        title: 'Thần Sóng Thức Giấc',
        emoji: '🌊⚡',
        color: '#7B2FBE',
        bgColor: 'rgba(123,47,190,0.12)',
        borderColor: 'rgba(123,47,190,0.3)',
        description: 'Bước vào phòng, cả thị trường rùng mình nhẹ.',
        min: 500,
        max: 999,
    },
    {
        level: 8,
        title: 'Tsunami Đi Bộ',
        emoji: '🏔️🌊',
        color: '#FF6B35',
        bgColor: 'rgba(255,107,53,0.12)',
        borderColor: 'rgba(255,107,53,0.3)',
        description: 'Huyền thoại. Bạn không đầu tư theo thị trường — thị trường đầu tư theo bạn.',
        min: 1000,
        max: Infinity,
    },
]

/**
 * Returns full level info based on total transaction count.
 * Pure computation — no DB, no side effects.
 */
export function getUserLevel(txnCount: number): UserLevelInfo {
    const current = LEVELS.findLast(l => txnCount >= l.min) ?? LEVELS[0]
    const nextLevel = LEVELS.find(l => l.min > current.min)

    const isMaxLevel = current.level === LEVELS.length
    const rangeSize = isMaxLevel ? 1 : current.max - current.min + 1
    const progressInLevel = isMaxLevel ? 1 : txnCount - current.min
    const progressPct = isMaxLevel ? 100 : Math.min((progressInLevel / rangeSize) * 100, 100)

    return {
        level: current.level,
        title: current.title,
        emoji: current.emoji,
        color: current.color,
        bgColor: current.bgColor,
        borderColor: current.borderColor,
        description: current.description,
        currentMin: current.min,
        nextLevelTxns: nextLevel ? nextLevel.min : 0,
        progressPct,
        isMaxLevel,
    }
}

/**
 * Returns how many more transactions until next level.
 */
export function txnsUntilNextLevel(txnCount: number): number {
    const info = getUserLevel(txnCount)
    if (info.isMaxLevel) return 0
    return info.nextLevelTxns - txnCount
}
