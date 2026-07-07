import { createClient } from '../supabase'
import type { Transaction, MarketPrice, Watchlist } from '../supabase'

// ================================================
// MODULE-LEVEL CACHE (per-user, TTL)
// ================================================
// Every page used to refetch the FULL transactions + market_prices tables
// on mount. This cache shares the two lists across page navigations.
// Any write below invalidates it, so data is never stale after a mutation.

const CACHE_TTL_MS = 60_000
type Cached<T> = { userId: string; ts: number; data: T }

let _txnCache: Cached<Transaction[]> | null = null
let _priceCache: Cached<MarketPrice[]> | null = null

function readCache<T>(c: Cached<T> | null, userId: string): T | null {
    if (c && c.userId === userId && Date.now() - c.ts < CACHE_TTL_MS) return c.data
    return null
}

/** Clear cached lists — called automatically after any write */
export function invalidateDataCache() {
    _txnCache = null
    _priceCache = null
}

// ================================================
// TRANSACTIONS API
// ================================================

/**
 * Fetch all transactions for the current user (cached across pages, TTL 60s)
 */
export async function getAllTransactions(): Promise<Transaction[]> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const cached = readCache(_txnCache, user.id)
    if (cached) return cached

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

    if (error) {
        console.error('Error fetching transactions:', error)
        throw new Error(error.message)
    }

    _txnCache = { userId: user.id, ts: Date.now(), data: data || [] }
    return data || []
}

/**
 * Fetch transactions for a specific symbol
 */
export async function getTransactionsBySymbol(symbol: string): Promise<Transaction[]> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
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
    type: 'Mua' | 'Chốt' | 'Bán' | 'Cổ tức CP'
    category: string
    symbol: string
    quantity: number
    price: number
    fee?: number
    total_money: number
    notes?: string | null
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
            notes: transaction.notes?.trim() || null,
        })
        .select()
        .single()

    if (error) {
        console.error('Error adding transaction:', error)
        throw new Error(error.message)
    }

    invalidateDataCache()
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

    invalidateDataCache()
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

    invalidateDataCache()
}

/**
 * Delete ALL transactions belonging to the currently authenticated user.
 * Safe: always scoped to user_id — never touches other users' data.
 */
export async function deleteAllMyTransactions(): Promise<number> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error, count } = await supabase
        .from('transactions')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)

    if (error) {
        console.error('Error deleting all transactions:', error)
        throw new Error(error.message)
    }

    invalidateDataCache()
    return count ?? 0
}

// ================================================
// MARKET PRICES API
// ================================================

/**
 * Fetch all market prices for the current user (cached across pages, TTL 60s)
 */
export async function getAllMarketPrices(): Promise<MarketPrice[]> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const cached = readCache(_priceCache, user.id)
    if (cached) return cached

    const { data, error } = await supabase
        .from('market_prices')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

    if (error) {
        console.error('Error fetching market prices:', error)
        throw new Error(error.message)
    }

    _priceCache = { userId: user.id, ts: Date.now(), data: data || [] }
    return data || []
}

/**
 * Fetch market prices for a specific symbol
 */
export async function getMarketPricesBySymbol(symbol: string): Promise<MarketPrice[]> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
        .from('market_prices')
        .select('*')
        .eq('user_id', user.id)
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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
        .from('market_prices')
        .select('price')
        .eq('user_id', user.id)
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
    volume?: number | null
}): Promise<MarketPrice> {
    const supabase = createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('User not authenticated')
    }

    const symbolUpper = marketPrice.symbol.toUpperCase()

    // Check if a price already exists for this user, symbol, and date
    const { data: existing, error: fetchError } = await supabase
        .from('market_prices')
        .select('id')
        .eq('user_id', user.id)
        .eq('symbol', symbolUpper)
        .eq('date', marketPrice.date)
        .maybeSingle()

    if (fetchError) {
        console.error('Error checking existing market price:', fetchError)
        throw new Error(fetchError.message)
    }

    if (existing) {
        // Update existing record
        const { data, error } = await supabase
            .from('market_prices')
            .update({
                category: marketPrice.category,
                price: marketPrice.price,
                ...(marketPrice.volume !== undefined ? { volume: marketPrice.volume } : {}),
            })
            .eq('id', existing.id)
            .select()
            .single()

        if (error) {
            console.error('Error updating market price:', error)
            throw new Error(error.message)
        }

        invalidateDataCache()
        return data
    } else {
        // Insert new record
        const { data, error } = await supabase
            .from('market_prices')
            .insert({
                user_id: user.id,
                date: marketPrice.date,
                category: marketPrice.category,
                symbol: symbolUpper,
                price: marketPrice.price,
                volume: marketPrice.volume ?? null,
            })
            .select()
            .single()

        if (error) {
            console.error('Error adding market price:', error)
            throw new Error(error.message)
        }

        invalidateDataCache()
        return data
    }
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

    invalidateDataCache()
}

// ================================================
// WATCHLIST API
// ================================================

export async function getWatchlist(): Promise<Watchlist[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)
    return data || []
}

export async function addToWatchlist(symbol: string, category: string): Promise<Watchlist> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
        .from('watchlist')
        .insert({ user_id: user.id, symbol: symbol.toUpperCase(), category })
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data
}

export async function removeFromWatchlist(symbol: string): Promise<void> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('symbol', symbol.toUpperCase())

    if (error) throw new Error(error.message)
}
