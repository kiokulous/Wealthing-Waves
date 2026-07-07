import { describe, it, expect } from 'vitest'
import { calculatePortfolio, calculateSymbolDetail, calculatePortfolioHistory, toDateStr } from '../portfolio'
import type { Transaction, MarketPrice } from '../../supabase'

// ── factories ────────────────────────────────────────────────────────────────

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

// ── toDateStr ────────────────────────────────────────────────────────────────

describe('toDateStr', () => {
    it('formats local date without UTC shift', () => {
        expect(toDateStr(new Date(2026, 6, 7))).toBe('2026-07-07')
        expect(toDateStr(new Date(2026, 0, 1))).toBe('2026-01-01')
        expect(toDateStr(new Date(2026, 11, 31))).toBe('2026-12-31')
    })
})

// ── calculatePortfolio ───────────────────────────────────────────────────────

describe('calculatePortfolio', () => {
    it('computes weighted average cost with partial sell', () => {
        const txns = [
            txn({ date: '2025-01-01', type: 'Mua', quantity: 100, total_money: 1000 }), // avg 10
            txn({ date: '2025-02-01', type: 'Mua', quantity: 100, total_money: 2000 }), // avg → 15
            txn({ date: '2025-03-01', type: 'Bán', quantity: 100, total_money: 2500 }), // cost basis 1500
        ]
        const prices = [price({ date: '2025-04-01', price: 20 })]

        const result = calculatePortfolio(txns, prices)
        const item = result.items[0]

        expect(item.quantity).toBe(100)
        expect(item.invested).toBe(1500)          // 3000 − 1500 cost basis
        expect(item.realized).toBe(1000)          // 2500 − 1500
        expect(item.currentValue).toBe(2000)      // 100 × 20
        expect(item.profitLoss).toBe(1500)        // (2000 − 1500) + 1000
        expect(result.totalProfitLoss).toBe(1500) // 2000 + 2500 − 3000
    })

    it('handles stock dividend (Cổ tức CP): qty up, cost basis unchanged', () => {
        const txns = [
            txn({ date: '2025-01-01', type: 'Mua', quantity: 100, total_money: 2000 }),
            txn({ date: '2025-02-01', type: 'Cổ tức CP', quantity: 10, total_money: 0 }),
        ]
        const prices = [price({ date: '2025-03-01', price: 20 })]

        const result = calculatePortfolio(txns, prices)
        const item = result.items[0]

        expect(item.quantity).toBe(110)
        expect(item.invested).toBe(2000)          // unchanged by dividend
        expect(item.currentValue).toBe(2200)      // 110 × 20
        expect(item.profitLoss).toBe(200)
        expect(result.totalInvested).toBe(2000)   // dividend not counted as buying
    })

    it('uses total accumulated capital for ROI of closed positions', () => {
        const txns = [
            txn({ date: '2025-01-01', type: 'Mua', quantity: 100, total_money: 1_000_000 }),
            txn({ date: '2025-06-01', type: 'Chốt', quantity: 100, total_money: 1_200_000 }),
        ]
        const result = calculatePortfolio(txns, [])
        const item = result.items[0]

        expect(item.quantity).toBe(0)
        expect(item.realized).toBe(200_000)
        expect(item.profitLossPercent).toBeCloseTo(20) // 200k / 1M ever deployed
    })

    it('includes year-boundary transactions in year filter (Jan 1 & Dec 31)', () => {
        const txns = [
            txn({ date: '2024-12-31', type: 'Mua', quantity: 1, total_money: 100 }),
            txn({ date: '2025-01-01', type: 'Mua', quantity: 1, total_money: 200 }),
            txn({ date: '2025-12-31', type: 'Mua', quantity: 1, total_money: 300 }),
            txn({ date: '2026-01-01', type: 'Mua', quantity: 1, total_money: 400 }),
        ]
        const result = calculatePortfolio(txns, [], 2025)

        expect(result.totalInvested).toBe(500) // only the two 2025 txns
    })

    it('excludes closed positions from total current value', () => {
        const txns = [
            txn({ date: '2025-01-01', type: 'Mua', quantity: 100, total_money: 1000, symbol: 'OPEN' }),
            txn({ date: '2025-01-01', type: 'Mua', quantity: 50, total_money: 500, symbol: 'DONE' }),
            txn({ date: '2025-02-01', type: 'Bán', quantity: 50, total_money: 600, symbol: 'DONE' }),
        ]
        const prices = [
            price({ date: '2025-03-01', price: 12, symbol: 'OPEN' }),
            price({ date: '2025-03-01', price: 13, symbol: 'DONE' }),
        ]
        const result = calculatePortfolio(txns, prices)

        expect(result.totalCurrentValue).toBe(1200) // only OPEN counts
    })
})

// ── calculateSymbolDetail ────────────────────────────────────────────────────

describe('calculateSymbolDetail', () => {
    it('computes unrealized + realized P&L and latest price', () => {
        const txns = [
            txn({ date: '2025-01-01', type: 'Mua', quantity: 200, total_money: 2000 }), // avg 10
            txn({ date: '2025-02-01', type: 'Bán', quantity: 100, total_money: 1500 }), // realized 500
        ]
        const prices = [
            price({ date: '2025-02-15', price: 11 }),
            price({ date: '2025-03-01', price: 12 }), // latest
        ]
        const detail = calculateSymbolDetail('AAA', txns, prices)

        expect(detail.quantity).toBe(100)
        expect(detail.invested).toBe(1000)
        expect(detail.realized).toBe(500)
        expect(detail.latestPrice).toBe(12)
        expect(detail.currentValue).toBe(1200)
        expect(detail.unrealizedPL).toBe(200)
        expect(detail.totalPL).toBe(700)
    })
})

// ── calculatePortfolioHistory ────────────────────────────────────────────────

describe('calculatePortfolioHistory', () => {
    it('values holdings at each month-end using latest price up to that date', () => {
        const txns = [
            txn({ date: '2020-01-15', type: 'Mua', quantity: 10, total_money: 40 }),
        ]
        const prices = [price({ date: '2020-01-20', price: 5 })]

        const history = calculatePortfolioHistory(txns, prices, 3)

        expect(history).toHaveLength(3)
        history.forEach(point => expect(point.value).toBe(50)) // 10 × 5, stable ever since
    })

    it('returns zero value before any price exists', () => {
        // Transaction & price dated in the future relative to the history window
        const future = new Date()
        future.setFullYear(future.getFullYear() + 1)
        const futureStr = toDateStr(future)

        const txns = [txn({ date: futureStr, type: 'Mua', quantity: 10, total_money: 40 })]
        const prices = [price({ date: futureStr, price: 5 })]

        const history = calculatePortfolioHistory(txns, prices, 2)
        history.forEach(point => expect(point.value).toBe(0))
    })
})
