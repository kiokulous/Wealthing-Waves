import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// ── TCBS public API (no key required) ────────────────────────────────────────
// Returns latest price for a VN stock symbol (HOSE/HNX/UPCOM)
async function fetchTCBSPrice(symbol: string): Promise<number | null> {
    try {
        const url = `https://apipubaws.tcbs.com.vn/stock-insight/v1/stock/second-data?ticker=${symbol}&type=stock`
        const res = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 0 }, // always fresh
        })
        if (!res.ok) return null
        const json = await res.json()

        // TCBS trả về giá theo đơn vị nghìn đồng (VD: 25.5 = 25,500 VNĐ)
        // data[0].p là lastPrice (x1000)
        const price = json?.data?.[0]?.p
        if (price == null) return null
        return price * 1000 // Chuyển về VNĐ
    } catch {
        return null
    }
}

// CCQ (quỹ mở) – dùng API SSI hoặc fallback sang TCBS
async function fetchCCQPrice(symbol: string): Promise<number | null> {
    // Thử TCBS trước – một số CCQ niêm yết được (FUEVFVND, E1VFVN30...)
    const price = await fetchTCBSPrice(symbol)
    return price
}

// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const supabase = createClient()

        // Xác thực user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 1. Lấy danh sách mã user đang sở hữu (quantity > 0)
        //    → Lấy tất cả transactions rồi tính toán phía server
        const { data: transactions, error: txnError } = await supabase
            .from('transactions')
            .select('symbol, category, quantity, type')
            .eq('user_id', user.id)

        if (txnError) throw new Error(txnError.message)

        // Tính holdings: chỉ lấy mã còn đang nắm
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

        // Chỉ lấy các mã còn đang nắm giữ (quantity > 0)
        const activeHoldings = Array.from(holdings.values()).filter(h => h.quantity > 0)

        if (activeHoldings.length === 0) {
            return NextResponse.json({ updated: 0, skipped: 0, errors: [], message: 'Không có mã nào đang nắm giữ' })
        }

        // 2. Lấy giá cho từng mã
        const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
        const results: { symbol: string; status: 'ok' | 'skip' | 'error'; price?: number; reason?: string }[] = []

        for (const holding of activeHoldings) {
            // Bỏ qua các loại không lấy giá tự động được
            if (holding.category === 'Tiết kiệm') {
                results.push({ symbol: holding.symbol, status: 'skip', reason: 'Tiết kiệm – giá cố định' })
                continue
            }

            // Lấy giá tùy theo category
            let price: number | null = null
            if (holding.category === 'Chứng chỉ quỹ') {
                price = await fetchCCQPrice(holding.symbol)
            } else {
                // Cổ phiếu, Vàng ETF, v.v.
                price = await fetchTCBSPrice(holding.symbol)
            }

            if (price == null || price <= 0) {
                results.push({ symbol: holding.symbol, status: 'error', reason: 'Không lấy được giá từ TCBS' })
                continue
            }

            // 3. Upsert vào market_prices (cùng ngày thì update, khác ngày thì insert)
            const { error: upsertError } = await supabase
                .from('market_prices')
                .upsert(
                    {
                        user_id: user.id,
                        date: today,
                        category: holding.category,
                        symbol: holding.symbol,
                        price,
                    },
                    {
                        onConflict: 'user_id,symbol,date',
                        ignoreDuplicates: false,
                    }
                )

            if (upsertError) {
                // Fallback: upsert có thể không work nếu không có unique constraint → thử insert/update thủ công
                const { data: existing } = await supabase
                    .from('market_prices')
                    .select('id')
                    .eq('user_id', user.id)
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
                        .insert({ user_id: user.id, date: today, category: holding.category, symbol: holding.symbol, price })
                }
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
