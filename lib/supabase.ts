import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export type Transaction = {
    id: string
    user_id: string
    date: string
    type: 'Mua' | 'Chốt' | 'Bán'
    category: string
    symbol: string
    quantity: number
    price: number
    fee: number
    total_money: number
    notes: string | null
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
    created_at: string
    updated_at: string
}

export type Database = {
    public: {
        Tables: {
            transactions: {
                Row: Transaction
                Insert: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Transaction, 'id' | 'created_at' | 'updated_at'>>
            }
            market_prices: {
                Row: MarketPrice
                Insert: Omit<MarketPrice, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<MarketPrice, 'id' | 'created_at' | 'updated_at'>>
            }
        }
    }
}

// Singleton pattern to prevent multiple instances
let supabase: ReturnType<typeof initSupabase> | null = null

function initSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
        console.error("Supabase Env Vars missing!", { url, key })
        throw new Error("Missing Supabase credentials in .env.local")
    }

    return createSupabaseClient<Database>(url, key, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        }
    })
}

export const createClient = () => {
    if (supabase) return supabase
    supabase = initSupabase()
    return supabase
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
