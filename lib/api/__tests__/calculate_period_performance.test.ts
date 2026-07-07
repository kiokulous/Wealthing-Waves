import { describe, it, expect } from 'vitest'
import { calculatePeriodPerformance } from '../calculate_period_performance'
import type { Transaction, MarketPrice } from '../../supabase'

let idSeq = 0

function txn(partial: Partial<Transaction> & { date: string; type: Transaction['type']; quantity: number; total_money: number }): Transaction {
    idSeq++
    return {
        id: `txn-${idSeq}`,
        user_id: 'user-1',
        category: 'Cổ phiếu',
        symbol: 'AAA',
        price: 0,
        fee: 0,
        notes: null,
        created_at: '',
        updated_at: '',
        ...partial,
    }
}

function price(partial: Partial<MarketPrice> & { date: string; price: number }): MarketPrice {
    idSeq++
    return {
        id: `mp-${idSeq}`,
        user_id: 'user-1',
        category: 'Cổ phiếu',
        symbol: 'AAA',
        volume: null,
        created_at: '',
        updated_at: '',
        ...partial,
    }
}

describe('calculatePeriodPerformance', () => {
    it('delegates to calculatePortfolio when startDate is null', () => {
        const txns = [txn({ date: '2025-01-01', type: 'Mua', quantity: 100, total_money: 1000 })]
        const prices = [price({ date: '2025-06-01', price: 12 })]

        const result = calculatePeriodPerformance(txns, prices, null)
        expect(result.totalCurrentValue).toBe(1200)
        expect(result.totalProfitLoss).toBe(200)
    })

    it('computes snapshot profit: End − Start + Sell − Buy', () => {
        // Bought before the period; price appreciated within it. No flows.
        const txns = [txn({ date: '2025-06-01', type: 'Mua', quantity: 100, total_money: 1000 })]
        const prices = [
            price({ date: '2025-12-30', price: 12 }), // start snapshot → 1200
            price({ date: '2026-06-01', price: 15 }), // end snapshot → 1500
        ]
        const startDate = new Date(2026, 0, 1) // local Jan 1, 2026

        const result = calculatePeriodPerformance(txns, prices, startDate)

        expect(result.totalCurrentValue).toBe(1500)
        expect(result.totalProfitLoss).toBe(300)              // 1500 − 1200
        expect(result.totalInvested).toBe(1200)               // capital = startValue + buying
        expect(result.totalProfitLossPercent).toBeCloseTo(25) // 300 / 1200
    })

    it('counts buys within the period as deployed capital, not profit', () => {
        const txns = [
            txn({ date: '2025-06-01', type: 'Mua', quantity: 100, total_money: 1000 }),
            txn({ date: '2026-02-01', type: 'Mua', quantity: 50, total_money: 600 }), // in-period buy
        ]
        const prices = [
            price({ date: '2025-12-30', price: 12 }), // start: 100 × 12 = 1200
            price({ date: '2026-06-01', price: 12 }), // end: 150 × 12 = 1800
        ]
        const result = calculatePeriodPerformance(txns, prices, new Date(2026, 0, 1))

        // Profit = 1800 − 1200 + 0 − 600 = 0 (price flat; buy is not profit)
        expect(result.totalProfitLoss).toBe(0)
        expect(result.totalInvested).toBe(1800) // 1200 + 600
    })

    it('treats a transaction dated exactly on startDate as in-period', () => {
        const txns = [
            txn({ date: '2026-01-01', type: 'Mua', quantity: 100, total_money: 1000 }),
        ]
        const prices = [price({ date: '2026-06-01', price: 10 })]
        const result = calculatePeriodPerformance(txns, prices, new Date(2026, 0, 1))

        // Start snapshot empty; buy 1000 in period; end value 1000 → profit 0
        expect(result.totalProfitLoss).toBe(0)
        expect(result.totalInvested).toBe(1000)
    })

    it('handles cross-year position correctly with endDate (buy 2024, sell 2025)', () => {
        // The old dashboard year-filter counted the ENTIRE 2025 sale as profit
        // because the 2024 buy was filtered out. Snapshot logic fixes this.
        const txns = [
            txn({ date: '2024-03-01', type: 'Mua', quantity: 100, total_money: 1000 }), // avg 10
            txn({ date: '2025-05-01', type: 'Bán', quantity: 100, total_money: 1400 }),
        ]
        const prices = [
            price({ date: '2024-12-31', price: 12 }), // start of 2025: 100 × 12 = 1200
        ]
        // Year-2025 view: Jan 1 → Dec 31, 2025
        const result = calculatePeriodPerformance(txns, prices, new Date(2025, 0, 1), new Date(2025, 11, 31))

        // Profit in 2025 = 0 (end value) − 1200 (start) + 1400 (sold) − 0 = 200
        expect(result.totalProfitLoss).toBe(200)
        expect(result.totalInvested).toBe(1200)               // capital at start of year
        expect(result.totalProfitLossPercent).toBeCloseTo(200 / 1200 * 100)
    })

    it('ignores transactions and prices after endDate', () => {
        const txns = [
            txn({ date: '2025-02-01', type: 'Mua', quantity: 100, total_money: 1000 }),
            txn({ date: '2026-02-01', type: 'Mua', quantity: 900, total_money: 9000 }), // after end — ignored
        ]
        const prices = [
            price({ date: '2025-12-30', price: 15 }),
            price({ date: '2026-03-01', price: 99 }), // after end — ignored
        ]
        const result = calculatePeriodPerformance(txns, prices, new Date(2025, 0, 1), new Date(2025, 11, 31))

        expect(result.totalCurrentValue).toBe(1500)  // 100 × 15 at 2025-12-30
        expect(result.totalProfitLoss).toBe(500)     // 1500 − 0 + 0 − 1000
        expect(result.totalInvested).toBe(1000)
    })

    it('falls back to average cost when no market price exists at start', () => {
        // e.g. savings — never has a market price row
        const txns = [
            txn({ date: '2025-06-01', type: 'Mua', quantity: 1, total_money: 5000, symbol: 'SAVE', category: 'Tiết kiệm' }),
        ]
        const prices = [price({ date: '2026-06-01', price: 5500, symbol: 'SAVE', category: 'Tiết kiệm' })]

        const result = calculatePeriodPerformance(txns, prices, new Date(2026, 0, 1))

        // Start value falls back to invested cost (5000); end 5500 → profit 500
        expect(result.totalProfitLoss).toBe(500)
        expect(result.totalProfitLossPercent).toBeCloseTo(10)
    })
})
