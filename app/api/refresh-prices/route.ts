import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase'

// ── TCBS public API (no key required) ────────────────────────────────────────
async function fetchTCBSPrice(symbol: string): Promise<number | null> {
    try {
        const url = `https://apipubaws.tcbs.com.vn/stock-insight/v1/stock/second-data?ticker=${symbol}&type=stock`
        const res = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            cache: 'no-store',
        })
        const text = await res.text()
        console.log(`[TCBS][${symbol}] status=${res.status} body=${text.slice(0, 300)}`)
        if (!res.ok) return null
        const json = JSON.parse(text)

        // TCBS trả về giá x1000 (VD: 25.5 = 25,500 VNĐ)
        const price = json?.data?.[0]?.p
        console.log(`[TCBS][${symbol}] parsed price field=`, price)
        if (price == null) return null
        return price * 1000
    } catch (e) {
        console.error(`[TCBS][${symbol}] error:`, e)
        return null
    }
}

// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const userId = body?.userId as string | undefined

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
        }

        // Dùng service role key để bypass RLS trên server
        // (an toàn vì key này chỉ dùng server-side, không expose ra client)
        const supabase = createSupabaseClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        )

        // 1. Lấy transactions của user này
        const { data: transactions, error: txnError } = await supabase
            .from('transactions')
            .select('symbol, category, quantity, type')
            .eq('user_id', userId)

        if (txnError) throw new Error(txnError.message)

        // 2. Tính holdings — chỉ lấy mã còn đang nắm giữ
        const holdings = new Map<string, { symbol: string; category: string; quantity: number }>()
        for (const txn of (transactions || [])) {
            const existing = holdings.get(txn.symbol) ?? { symbol: txn.symbol, category: txn.category, quantity: 0 }
            if (txn.type === 'Mua') {
                existing.quantity += txn.quantity
            } else if (txn.type === 'Chốt' || txn.type === 'Bán') {
                existing.quantity -= txn.quantity
            }
            holdings.set(txn.symbol, existing)
        }

        const activeHoldings = Array.from(holdings.values()).filter(h => h.quantity > 0)

        if (activeHoldings.length === 0) {
            return NextResponse.json({ updated: 0, skipped: 0, errors: [], message: 'Không có mã nào đang nắm giữ' })
        }

        // 3. Lấy giá từng mã và upsert
        const today = new Date().toISOString().split('T')[0]
        const results: { symbol: string; status: 'ok' | 'skip' | 'error'; price?: number; reason?: string }[] = []

        for (const holding of activeHoldings) {
            if (holding.category === 'Tiết kiệm') {
                results.push({ symbol: holding.symbol, status: 'skip', reason: 'Tiết kiệm – giá cố định' })
                continue
            }

            const price = await fetchTCBSPrice(holding.symbol)

            if (price == null || price <= 0) {
                results.push({ symbol: holding.symbol, status: 'error', reason: 'Không lấy được giá từ TCBS' })
                continue
            }

            // Kiểm tra đã có record hôm nay chưa
            const { data: existing } = await supabase
                .from('market_prices')
                .select('id')
                .eq('user_id', userId)
                .eq('symbol', holding.symbol)
                .eq('date', today)
                .maybeSingle()

            if (existing) {
                await supabase
                    .from('market_prices')
                    .update({ price, category: holding.category })
                    .eq('id', existing.id)
            } else {
                await supabase
                    .from('market_prices')
                    .insert({ user_id: userId, date: today, category: holding.category, symbol: holding.symbol, price })
            }

            results.push({ symbol: holding.symbol, status: 'ok', price })
        }

        const updated = results.filter(r => r.status === 'ok').length
        const skipped = results.filter(r => r.status === 'skip').length
        const errors  = results.filter(r => r.status === 'error').map(r => `${r.symbol}: ${r.reason}`)

        return NextResponse.json({ updated, skipped, errors, results })

    } catch (err: any) {
        console.error('[refresh-prices] Error:', err)
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
    }
}
