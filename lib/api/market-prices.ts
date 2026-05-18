/**
 * Fetch giá thị trường từ VNDirect — chạy phía CLIENT (browser), không bị block
 */
export type HoldingInfo = {
    symbol: string
    category: string
}

export type PriceFetchResult = {
    symbol: string
    category: string
    price: number | null
    error?: string
}

async function fetchVNDirectPrice(symbol: string): Promise<number | null> {
    try {
        const url = `https://finfo-api.vndirect.com.vn/v4/stock_prices?sort=date:desc&q=code:${symbol}&size=1`
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) return null
        const json = await res.json()
        const item = json?.data?.[0]
        // VNDirect trả về giá đơn vị VNĐ (VD: 88500)
        return item?.close ?? item?.matchPrice ?? null
    } catch {
        return null
    }
}

/**
 * Fetch giá cho danh sách holdings, chạy song song
 */
export async function fetchMarketPrices(holdings: HoldingInfo[]): Promise<PriceFetchResult[]> {
    const results = await Promise.all(
        holdings.map(async ({ symbol, category }) => {
            // Bỏ qua Tiết kiệm — giá cố định, không cần fetch
            if (category === 'Tiết kiệm') {
                return { symbol, category, price: null, error: 'Tiết kiệm – giá cố định' }
            }

            const price = await fetchVNDirectPrice(symbol)
            return {
                symbol,
                category,
                price,
                error: price == null ? 'Không lấy được giá từ VNDirect' : undefined,
            }
        })
    )
    return results
}
