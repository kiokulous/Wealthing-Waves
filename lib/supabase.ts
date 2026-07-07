import { createBrowserClient } from '@supabase/ssr'

export type Transaction = {
    id: string
    user_id: string
    date: string
    type: 'Mua' | 'Chốt' | 'Bán' | 'Cổ tức CP'
    category: string
    symbol: string
    quantity: number
    price: number
    fee: number
    total_money: number
    created_at: string
    updated_at: string
}

export type MarketPrice = {
    id: string
    user_id: string
    date: string
    category: string
    symbol: string
    price: number
    volume: number | null
    created_at: string
    updated_at: string
}

export type Watchlist = {
    id: string
    user_id: string
    symbol: string
    category: string
    created_at: string
}

export type Database = {
    public: {
        Tables: {
            transactions: {
                Row: Transaction
                Insert: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Transaction, 'id' | 'created_at' | 'updated_at'>>
                Relationships: []
            }
            market_prices: {
                Row: MarketPrice
                Insert: Omit<MarketPrice, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<MarketPrice, 'id' | 'created_at' | 'updated_at'>>
                Relationships: []
            }
            watchlist: {
                Row: Watchlist
                Insert: Omit<Watchlist, 'id' | 'created_at'>
                Update: Partial<Omit<Watchlist, 'id' | 'created_at'>>
                Relationships: []
            }
        }
        Views: Record<string, never>
        Functions: Record<string, never>
        Enums: Record<string, never>
        CompositeTypes: Record<string, never>
    }
}

type SupabaseClient = ReturnType<typeof createBrowserClient<Database>>
let _instance: SupabaseClient | null = null

/**
 * Browser client from @supabase/ssr — stores the session in COOKIES
 * (not localStorage) so middleware and server routes can see it.
 * NOTE: switching from the old localStorage client logs existing
 * sessions out once; users just sign in again.
 */
export const createClient = (): SupabaseClient => {
    if (_instance) return _instance

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
        console.error("Supabase Env Vars missing!", { url, key })
        throw new Error("Missing Supabase credentials in .env.local")
    }

    _instance = createBrowserClient<Database>(url, key)
    return _instance
}

// Helper to get the current user
export async function getCurrentUser() {
    const client = createClient()
    const { data: { user }, error } = await client.auth.getUser()

    if (error) {
        console.error('Error getting user:', error)
        return null
    }

    return user
}

// Helper to check if user is authenticated
export async function isAuthenticated() {
    const user = await getCurrentUser()
    return !!user
}
