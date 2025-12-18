
import { calculatePortfolio, PortfolioSummary } from './portfolio';
import type { Transaction, MarketPrice } from '../supabase';

/**
 * Calculate portfolio performance over a period (Snapshot Logic)
 * Profit = (EndValue - StartValue) + (Selling - Buying)
 */
export function calculatePeriodPerformance(
    transactions: Transaction[],
    marketPrices: MarketPrice[],
    startDate: Date | null
): PortfolioSummary {
    if (!startDate) {
        return calculatePortfolio(transactions, marketPrices);
    }

    // 1. Calculate Start Snapshot
    const startPortfolio = new Map<string, { qty: number, value: number }>();
    const historicalTxns = transactions.filter(t => new Date(t.date) < startDate);

    // Calculate qty at start date
    historicalTxns.forEach(t => {
        if (!startPortfolio.has(t.symbol)) {
            startPortfolio.set(t.symbol, { qty: 0, value: 0 });
        }
        const item = startPortfolio.get(t.symbol)!;
        if (t.type === 'Mua') item.qty += t.quantity;
        else item.qty -= t.quantity;
    });

    // Calculate value at start date using price closest to startDate
    let totalStartValue = 0;
    startPortfolio.forEach((item, symbol) => {
        if (item.qty > 0) {
            // Find price closest to startDate (but before or equal)
            const prices = marketPrices
                .filter(p => p.symbol === symbol && new Date(p.date) <= startDate)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            let price = prices.length > 0 ? prices[0].price : 0;

            // Fallback for Savings or Assets without Market Price
            if (price === 0) {
                // Calculate historical invested for this symbol up to startDate
                let histInvested = 0;
                let histQty = 0;
                historicalTxns.filter(t => t.symbol === symbol).forEach(t => {
                    if (t.type === 'Mua') {
                        histInvested += t.total_money;
                        histQty += t.quantity;
                    } else {
                        // Proportional deduction for selling
                        if (histQty > 0) {
                            const avgCost = histInvested / histQty;
                            histInvested -= (t.quantity * avgCost);
                            histQty -= t.quantity;
                        }
                    }
                });

                // If we have remaining quantity, average cost is a good proxy for value at start date
                if (histQty > 0) {
                    item.value = histInvested;
                } else {
                    item.value = 0;
                }
            } else {
                item.value = item.qty * price;
            }
            totalStartValue += item.value;
        }
    });

    // 2. Calculate Flows in Period
    const periodTxns = transactions.filter(t => new Date(t.date) >= startDate);
    let totalBuying = 0;
    let totalSelling = 0;
    const categoryFlows = new Map<string, { buying: number, selling: number }>();

    periodTxns.forEach(t => {
        if (!categoryFlows.has(t.category)) categoryFlows.set(t.category, { buying: 0, selling: 0 });
        const catFlow = categoryFlows.get(t.category)!;

        // Note: Use t.total_money for exact cash flow
        if (t.type === 'Mua') {
            totalBuying += t.total_money;
            catFlow.buying += t.total_money;
        } else {
            totalSelling += t.total_money;
            catFlow.selling += t.total_money;
        }
    });

    // 3. Calculate End Snapshot (Current)
    // We can reuse calculatePortfolio for current state but need detailed items
    const currentPortfolio = calculatePortfolio(transactions, marketPrices);

    // 4. Merge to calculate Profit/Loss per item/category
    // Formula: Profit = EndValue - StartValue + Selling - Buying

    // Items
    const newItems = currentPortfolio.items.map(item => {
        const startItem = startPortfolio.get(item.symbol) || { qty: 0, value: 0 };

        // Calculate flows for this specific symbol
        const symbolTxns = periodTxns.filter(t => t.symbol === item.symbol);
        let symBuying = 0;
        let symSelling = 0;
        symbolTxns.forEach(t => {
            if (t.type === 'Mua') symBuying += t.total_money;
            else symSelling += t.total_money;
        });

        const profit = item.currentValue - startItem.value + symSelling - symBuying;
        // ROI denominator? Usually StartValue + Buying (Capital deployed in period)
        const capitalDeployed = startItem.value + symBuying;
        const profitPercent = capitalDeployed > 0 ? (profit / capitalDeployed) * 100 : 0;

        return {
            ...item,
            invested: capitalDeployed, // Show capital involved in this period context
            profitLoss: profit,
            profitLossPercent: profitPercent
        };
    });

    // Categories
    const newCategories = currentPortfolio.categories.map(cat => {
        // Calculate Start Value for Category
        let catStartValue = 0;
        startPortfolio.forEach((val, sym) => {
            // We need to know category of symbol. currentPortfolio.items has it.
            // Or fallback to checking historical txns? 
            // Best to find from items list. If symbol used to exist but sold all, it might be in historicalTxns
            // Lets loop transactions to build a Symbol->Category map
            const found = transactions.find(t => t.symbol === sym);
            if (found && found.category === cat.category) {
                catStartValue += val.value;
            }
        });

        const flows = categoryFlows.get(cat.category) || { buying: 0, selling: 0 };
        const profit = cat.currentValue - catStartValue + flows.selling - flows.buying;
        const capitalDeployed = catStartValue + flows.buying;
        const profitPercent = capitalDeployed > 0 ? (profit / capitalDeployed) * 100 : 0;

        return {
            ...cat,
            invested: capitalDeployed, // Contextual Invested
            sold: flows.selling,       // Contextual Sold
            profitLoss: profit,
            profitLossPercent: profitPercent
        };
    });

    // Sort categories by current value (descending)
    newCategories.sort((a, b) => b.currentValue - a.currentValue);

    const periodProfit = currentPortfolio.totalCurrentValue - totalStartValue + totalSelling - totalBuying;
    const totalCapital = totalStartValue + totalBuying;
    const periodProfitPercent = totalCapital > 0 ? (periodProfit / totalCapital) * 100 : 0;

    return {
        totalInvested: totalCapital, // In period context
        totalSold: totalSelling,
        totalCurrentValue: currentPortfolio.totalCurrentValue,
        totalProfitLoss: periodProfit,
        totalProfitLossPercent: periodProfitPercent,
        items: newItems,
        categories: newCategories
    };
}
