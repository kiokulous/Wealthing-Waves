import type { Transaction, MarketPrice } from '../supabase'

// ================================================
// TYPES
// ================================================

export type PortfolioItem = {
    symbol: string
    category: string
    quantity: number
    invested: number
    currentValue: number
    currentPrice: number
    realized: number
    profitLoss: number
    profitLossPercent: number
    lastPrices: number[] // Last 7 prices for sparkline
}

export type CategoryStats = {
    category: string
    invested: number
    sold: number
    currentValue: number
    profitLoss: number
    profitLossPercent: number
    weight: number // Percentage of total portfolio
}

export type PortfolioSummary = {
    totalInvested: number
    totalSold: number
    totalCurrentValue: number
    totalProfitLoss: number
    totalProfitLossPercent: number
    items: PortfolioItem[]
    categories: CategoryStats[]
}

// ================================================
// PORTFOLIO CALCULATION
// ================================================

/**
 * Calculate portfolio summary from transactions and market prices
 */
export function calculatePortfolio(
    transactions: Transaction[],
    marketPrices: MarketPrice[],
    filterYear?: number
): PortfolioSummary {
    // Filter transactions by year if specified
    let filteredTransactions = transactions
    if (filterYear) {
        const startDate = new Date(filterYear, 0, 1)
        const endDate = new Date(filterYear, 11, 31, 23, 59, 59)
        filteredTransactions = transactions.filter(t => {
            const date = new Date(t.date)
            return date >= startDate && date <= endDate
        })
    }

    // Build portfolio map
    const portfolio = new Map<string, {
        symbol: string
        category: string
        quantity: number
        invested: number
        realized: number
    }>()

    // Track totals
    let totalInvested = 0
    let totalSold = 0

    // Process transactions
    filteredTransactions.forEach(txn => {
        const key = txn.symbol

        if (!portfolio.has(key)) {
            portfolio.set(key, {
                symbol: txn.symbol,
                category: txn.category,
                quantity: 0,
                invested: 0,
                realized: 0,
            })
        }

        const item = portfolio.get(key)!
        const value = txn.total_money // Now always positive after migration

        if (txn.type === 'Mua') {
            // Buy transaction
            item.quantity += txn.quantity
            item.invested += value
            totalInvested += value
        } else if (txn.type === 'Chốt' || txn.type === 'Bán') {
            // Sell transaction
            totalSold += value

            if (item.quantity > 0) {
                const avgCost = item.invested / item.quantity
                const costBasis = txn.quantity * avgCost
                item.realized += value - costBasis
                item.invested -= costBasis
                item.quantity -= txn.quantity
            } else {
                item.realized += value
                item.quantity -= txn.quantity
            }
        }
    })

    // Calculate current values
    const items: PortfolioItem[] = []
    let totalCurrentValue = 0

    portfolio.forEach(item => {
        // Get latest price for symbol
        const symbolPrices = marketPrices
            .filter(p => p.symbol === item.symbol)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        const currentPrice = symbolPrices.length > 0 ? symbolPrices[0].price : 0
        const currentValue = item.quantity * currentPrice

        // Get last 7 prices for sparkline
        const lastPrices = symbolPrices
            .slice(0, 7)
            .reverse()
            .map(p => p.price)

        // Pad with current price if less than 7
        while (lastPrices.length < 7) {
            lastPrices.unshift(currentPrice)
        }

        const profitLoss = (currentValue - item.invested) + item.realized
        const totalCapital = item.invested + (item.quantity === 0 ? Math.abs(item.realized) : 0) // Proxy for capital involved if sold out
        const profitLossPercent = item.invested > 0
            ? (profitLoss / item.invested) * 100
            : (item.realized !== 0 ? 100 : 0) // If sold out, we just show 100% or something indicative

        if (item.quantity > 0) {
            totalCurrentValue += currentValue
        }

        items.push({
            symbol: item.symbol,
            category: item.category,
            quantity: item.quantity,
            invested: item.invested,
            currentValue,
            currentPrice,
            realized: item.realized,
            profitLoss,
            profitLossPercent,
            lastPrices,
        })
    })

    // Calculate category stats - Match GAS logic
    const categoryMap = new Map<string, CategoryStats>()

    // First pass: Calculate invested and sold per category from transactions
    filteredTransactions.forEach(txn => {
        const catKey = txn.category

        if (!categoryMap.has(catKey)) {
            categoryMap.set(catKey, {
                category: catKey,
                invested: 0,
                sold: 0,
                currentValue: 0,
                profitLoss: 0,
                profitLossPercent: 0,
                weight: 0,
            })
        }

        const cat = categoryMap.get(catKey)!
        const value = txn.total_money

        if (txn.type === 'Mua') {
            cat.invested += value
        } else if (txn.type === 'Chốt' || txn.type === 'Bán') {
            cat.sold += value
        }
    })

    // Second pass: Add current values from items
    items.forEach(item => {
        if (item.quantity > 0) {
            const cat = categoryMap.get(item.category)
            if (cat) {
                cat.currentValue += item.currentValue
            }
        }
    })

    // Calculate category P/L and weights
    const categories: CategoryStats[] = []
    categoryMap.forEach(cat => {
        // P/L = Current Value + Sold - Invested (Cash Flow method like GAS)
        cat.profitLoss = cat.currentValue + cat.sold - cat.invested
        cat.profitLossPercent = cat.invested > 0
            ? (cat.profitLoss / cat.invested) * 100
            : 0
        cat.weight = totalCurrentValue > 0
            ? (cat.currentValue / totalCurrentValue) * 100
            : 0
        categories.push(cat)
    })

    // Sort categories by current value (descending)
    categories.sort((a, b) => b.currentValue - a.currentValue)

    // Calculate total P/L
    const totalProfitLoss = totalCurrentValue + totalSold - totalInvested
    const totalProfitLossPercent = totalInvested > 0
        ? (totalProfitLoss / totalInvested) * 100
        : 0

    return {
        totalInvested,
        totalSold,
        totalCurrentValue,
        totalProfitLoss,
        totalProfitLossPercent,
        items: items.sort((a, b) => b.currentValue - a.currentValue),
        categories,
    }
}

/**
 * Calculate detailed statistics for a specific symbol
 */
export function calculateSymbolDetail(
    symbol: string,
    transactions: Transaction[],
    marketPrices: MarketPrice[],
    filterYear?: number
) {
    // Filter transactions for this symbol
    let symbolTransactions = transactions.filter(t => t.symbol === symbol)

    // Apply year filter if specified
    if (filterYear) {
        const startDate = new Date(filterYear, 0, 1)
        const endDate = new Date(filterYear, 11, 31, 23, 59, 59)
        symbolTransactions = symbolTransactions.filter(t => {
            const date = new Date(t.date)
            return date >= startDate && date <= endDate
        })
    }

    // Sort by date ascending for calculation
    symbolTransactions.sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Calculate holdings
    let quantity = 0
    let invested = 0
    let realized = 0
    let firstBuyDate: Date | null = null
    let lastTxnDate: Date | null = null
    let peakInvested = 0 // Track maximum capital deployed for ROI proxy

    for (const txn of symbolTransactions) {
        const value = txn.total_money
        const txnDate = new Date(txn.date)
        if (!lastTxnDate || txnDate > lastTxnDate) lastTxnDate = txnDate

        if (txn.type === 'Mua') {
            if (!firstBuyDate) {
                firstBuyDate = txnDate
            }
            quantity += txn.quantity
            invested += value
            if (invested > peakInvested) peakInvested = invested
        } else if (txn.type === 'Chốt' || txn.type === 'Bán') {
            if (quantity > 0) {
                const avgCost = invested / quantity
                const costBasis = txn.quantity * avgCost
                realized += value - costBasis
                invested -= costBasis
                quantity -= txn.quantity
            }
        }
    }

    // Get market prices for this symbol
    const symbolPrices = marketPrices
        .filter(p => p.symbol === symbol)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const latestPrice = symbolPrices.length > 0 ? symbolPrices[0].price : 0
    const currentValue = quantity * latestPrice

    // Calculate P/L
    const unrealizedPL = currentValue - invested
    const totalPL = unrealizedPL + realized
    const denom = invested > 0 ? invested : peakInvested
    const plPercent = denom > 0
        ? (totalPL / denom) * 100
        : 0

    // Calculate holding duration
    let holdingDays = 0
    if (firstBuyDate) {
        let endDate: Date
        if (quantity > 0) {
            endDate = filterYear ? new Date(filterYear, 11, 31) : new Date()
        } else {
            endDate = lastTxnDate || new Date()
        }

        holdingDays = Math.ceil(
            (endDate.getTime() - firstBuyDate.getTime()) / (1000 * 60 * 60 * 24)
        )
    }

    // Get price history for chart (last 30 days or all available)
    const priceHistory = symbolPrices
        .slice(0, 30)
        .reverse()
        .map(p => ({
            date: p.date,
            price: p.price,
        }))

    return {
        symbol,
        quantity,
        invested,
        realized,
        currentValue,
        latestPrice,
        latestPriceDate: symbolPrices.length > 0 ? symbolPrices[0].date : null,
        unrealizedPL,
        totalPL,
        plPercent,
        holdingDays,
        firstBuyDate: (firstBuyDate as Date | null)?.toISOString() || null,
        priceHistory,
        transactions: symbolTransactions.reverse(), // Return newest first for display
    }
}

/**
 * Calculate portfolio history for the chart
 */
export function calculatePortfolioHistory(
    transactions: Transaction[],
    marketPrices: MarketPrice[],
    months: number = 12
): { date: string; value: number }[] {
    const today = new Date()
    const history: { date: string; value: number }[] = []

    // Adjust today to end of day to be safe with comparisons
    today.setHours(23, 59, 59, 999)

    for (let i = months - 1; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i + 1, 0) // End of month
        // If the calculated date is in the future relative to "today" (e.g. current month end), use 'today'
        const checkDate = date > today ? today : date
        const checkDateStr = checkDate.toISOString().split('T')[0]

        // Calculate portfolio state at this date
        // 1. Filter transactions up to this date
        const relevantTxns = transactions.filter(t => new Date(t.date) <= checkDate)

        // 2. Calculate holdings
        const holdings = new Map<string, number>() // symbol -> quantity
        relevantTxns.forEach(txn => {
            const currentQty = holdings.get(txn.symbol) || 0
            if (txn.type === 'Mua') {
                holdings.set(txn.symbol, currentQty + txn.quantity)
            } else if (txn.type === 'Chốt' || txn.type === 'Bán') {
                holdings.set(txn.symbol, Math.max(0, currentQty - txn.quantity))
            }
        })

        // 3. Calculate value
        let totalValue = 0
        holdings.forEach((qty, symbol) => {
            if (qty > 0) {
                // Find latest price for this symbol UP TO checkDate
                const priceObj = marketPrices
                    .filter(p => p.symbol === symbol && new Date(p.date) <= checkDate)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

                const price = priceObj ? priceObj.price : 0

                // If no price found by this date, try to find the earliest price EVER (fallback) 
                // or just 0 (strict). Let's use 0 to be strict, or maybe the price at purchase?
                // For better visuals, if no price exists yet at that date but we bought it, 
                // it implies we bought it at some price. But `marketPrices` should ideally cover it.
                // Fallback: If we have the transaction, use the transaction price as a proxy? 
                // That might be complex. Let's stick to marketPrices.

                totalValue += qty * price
            }
        })

        history.push({
            date: checkDate.toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' }),
            value: totalValue
        })
    }

    return history
}
