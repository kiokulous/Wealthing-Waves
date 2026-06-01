import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase'

type PriceEntry = {
    symbol: string
    category: string
    price: number
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const userId = body?.userId as string | undefined
        const prices = body?.prices as PriceEntry[] | undefined

        if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
        if (!prices?.length) return NextResponse.json({ error: 'Missing prices' }, { status: 400 })

        const supabase = createSupabaseClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        )

        const today = new Date().toISOString().split('T')[0]
        let saved = 0

        for (const { symbol, category, price } of prices) {
            if (!symbol || !price || price <= 0) continue

            const { data: existing } = await supabase
                .from('market_prices')
                .select('id')
                .eq('user_id', userId)
                .eq('symbol', symbol)
                .eq('date', today)
                .maybeSingle()

            if (existing) {
                await supabase
                    .from('market_prices')
                    .update({ price, category })
                    .eq('id', existing.id)
            } else {
                await supabase
                    .from('market_prices')
                    .insert({ user_id: userId, date: today, category, symbol, price, volume: null })
            }
            saved++
        }

        return NextResponse.json({ saved })

    } catch (err: any) {
        console.error('[save-prices]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
