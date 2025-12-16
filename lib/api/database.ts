import { createClient } from '../supabase'
import type { Transaction, MarketPrice } from '../supabase'

// ================================================
// TRANSACTIONS API
// ================================================

/**
 * Fetch all transactions for the current user
 */
export async function getAllTransactions(): Promise<Transaction[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })

    if (error) {
        console.error('Error fetching transactions:', error)
        throw new Error(error.message)
    }

    return data || []
}

/**
 * Fetch transactions for a specific symbol
 */
export async function getTransactionsBySymbol(symbol: string): Promise<Transaction[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('symbol', symbol)
        .order('date', { ascending: false })

    if (error) {
        console.error('Error fetching transactions by symbol:', error)
        throw new Error(error.message)
    }

    return data || []
}

/**
 * Fetch transactions for a specific year
 */
export async function getTransactionsByYear(year: number): Promise<Transaction[]> {
    const supabase = createClient()

    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

    if (error) {
        console.error('Error fetching transactions by year:', error)
        throw new Error(error.message)
    }

    return data || []
}

/**
 * Add a new transaction
 */
export async function addTransaction(transaction: {
    date: string
    type: 'Mua' | 'Chốt' | 'Bán'
    category: string
    symbol: string
    quantity: number
    price: number
    fee?: number
    total_money: number
    notes?: string
}): Promise<Transaction> {
    const supabase = createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
        .from('transactions')
        .insert({
            user_id: user.id,
            date: transaction.date,
            type: transaction.type,
            category: transaction.category,
            symbol: transaction.symbol.toUpperCase(),
            quantity: transaction.quantity,
            price: transaction.price,
            fee: transaction.fee || 0,
            total_money: transaction.total_money,
            notes: transaction.notes || null,
        })
        .select()
        .single()

    if (error) {
        console.error('Error adding transaction:', error)
        throw new Error(error.message)
    }

    return data
}

/**
 * Update an existing transaction
 */
export async function updateTransaction(
    id: string,
    updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<Transaction> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating transaction:', error)
        throw new Error(error.message)
    }

    return data
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(id: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting transaction:', error)
        throw new Error(error.message)
    }
}

// ================================================
// MARKET PRICES API
// ================================================

/**
 * Fetch all market prices for the current user
 */
export async function getAllMarketPrices(): Promise<MarketPrice[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('market_prices')
        .select('*')
        .order('date', { ascending: false })

    if (error) {
        console.error('Error fetching market prices:', error)
        throw new Error(error.message)
    }

    return data || []
}

/**
 * Fetch market prices for a specific symbol
 */
export async function getMarketPricesBySymbol(symbol: string): Promise<MarketPrice[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('market_prices')
        .select('*')
        .eq('symbol', symbol)
        .order('date', { ascending: false })

    if (error) {
        console.error('Error fetching market prices by symbol:', error)
        throw new Error(error.message)
    }

    return data || []
}

/**
 * Get the latest price for a symbol
 */
export async function getLatestPrice(symbol: string): Promise<number | null> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('market_prices')
        .select('price')
        .eq('symbol', symbol)
        .order('date', { ascending: false })
        .limit(1)
        .single()

    if (error) {
        if (error.code === 'PGRST116') {
            // No rows found
            return null
        }
        console.error('Error fetching latest price:', error)
        throw new Error(error.message)
    }

    return data?.price || null
}

/**
 * Add or update a market price
 */
export async function addMarketPrice(marketPrice: {
    date: string
    category: string
    symbol: string
    price: number
}): Promise<MarketPrice> {
    const supabase = createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('User not authenticated')
    }

    // Try to upsert (insert or update if exists)
    const { data, error } = await supabase
        .from('market_prices')
        .upsert({
            user_id: user.id,
            date: marketPrice.date,
            category: marketPrice.category,
            symbol: marketPrice.symbol.toUpperCase(),
            price: marketPrice.price,
        }, {
            onConflict: 'user_id,symbol,date'
        })
        .select()
        .single()

    if (error) {
        console.error('Error adding market price:', error)
        throw new Error(error.message)
    }

    return data
}

/**
 * Delete a market price
 */
export async function deleteMarketPrice(id: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
        .from('market_prices')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting market price:', error)
        throw new Error(error.message)
    }
}
