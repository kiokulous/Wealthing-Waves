import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase'

type PriceEntry = {
    symbol: string
    category: string
    price: number
}

const MAX_PRICES = 100
const SYMBOL_RE = /^[A-Z0-9]{1,20}$/
const MAX_PRICE_VALUE = 1_000_000_000_000 // 1,000 tỷ / unit — sanity cap

/**
 * Save market prices for the AUTHENTICATED user.
 *
 * Security model:
 * - Caller must send `Authorization: Bearer <supabase access token>`.
 * - The user id is derived from the verified token — NEVER from the request body.
 * - Writes go through the anon-key client with the user's token attached,
 *   so Postgres RLS enforces row ownership. No service role key involved.
 */
export async function POST(req: NextRequest) {
    try {
        // ── 1. Authenticate ──────────────────────────────────────────────
        const authHeader = req.headers.get('authorization') ?? ''
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = createSupabaseClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: { headers: { Authorization: `Bearer ${token}` } },
                auth: { persistSession: false, autoRefreshToken: false },
            }
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // ── 2. Validate input ────────────────────────────────────────────
        const body = await req.json()
        const prices = body?.prices as PriceEntry[] | undefined

        if (!Array.isArray(prices) || prices.length === 0) {
            return NextResponse.json({ error: 'Missing prices' }, { status: 400 })
        }
        if (prices.length > MAX_PRICES) {
            return NextResponse.json({ error: `Too many entries (max ${MAX_PRICES})` }, { status: 400 })
        }

        const valid: PriceEntry[] = []
        const rejected: string[] = []

        for (const entry of prices) {
            const symbol = typeof entry?.symbol === 'string' ? entry.symbol.toUpperCase().trim() : ''
            const category = typeof entry?.category === 'string' ? entry.category.trim() : ''
            const price = Number(entry?.price)

            if (
                !SYMBOL_RE.test(symbol) ||
                !category || category.length > 50 ||
                !Number.isFinite(price) || price <= 0 || price > MAX_PRICE_VALUE
            ) {
                rejected.push(symbol || '(invalid)')
                continue
            }
            valid.push({ symbol, category, price })
        }

        if (valid.length === 0) {
            return NextResponse.json({ error: 'No valid price entries', rejected }, { status: 400 })
        }

        // ── 3. Save (check-then-update-or-insert, RLS-scoped) ───────────
        const today = new Date().toISOString().split('T')[0]
        let saved = 0

        for (const { symbol, category, price } of valid) {
            const { data: existing, error: fetchError } = await supabase
                .from('market_prices')
                .select('id')
                .eq('user_id', user.id)
                .eq('symbol', symbol)
                .eq('date', today)
                .maybeSingle()

            if (fetchError) throw new Error(fetchError.message)

            if (existing) {
                const { error } = await supabase
                    .from('market_prices')
                    .update({ price, category })
                    .eq('id', existing.id)
                if (error) throw new Error(error.message)
            } else {
                const { error } = await supabase
                    .from('market_prices')
                    .insert({ user_id: user.id, date: today, category, symbol, price, volume: null })
                if (error) throw new Error(error.message)
            }
            saved++
        }

        return NextResponse.json({ saved, rejected })

    } catch (err: any) {
        console.error('[save-prices]', err?.message)
        return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
    }
}
