"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

type Transaction = {
    id: string;
    date: string;
    type: string;
    category: string;
    symbol: string;
    qty: number;
    price: number;
    total: number;
};

type MarketPrice = {
    date: string;
    symbol: string;
    price: number;
};

// MOCK DATA for initial render (before DB connection)
const MOCK_TXNS: Transaction[] = []; // Will be empty initially

export function DashboardView() {
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
    const [netWorth, setNetWorth] = useState(0);
    const [totalPL, setTotalPL] = useState(0);
    const [portfolio, setPortfolio] = useState<any[]>([]);

    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            // 1. Fetch Transactions
            const { data: txns, error: txnError } = await supabase
                .from('transactions')
                .select('*');

            // 2. Fetch Market Prices
            const { data: prices, error: priceError } = await supabase
                .from('market_prices')
                .select('*');

            // Use data or mock if error (e.g. missing env vars)
            const finalTxns = (txns as any[]) || MOCK_TXNS;
            const finalPrices = (prices as any[]) || [];

            processData(finalTxns, finalPrices);

        } catch (e) {
            console.error("Fetch error", e);
        } finally {
            setLoading(false);
        }
    }

    function processData(txns: any[], prices: any[]) {
        // Replicating GAS logic
        let totalInvested = 0;
        let totalSold = 0;
        let currentHoldingsVal = 0;
        let holdings: Record<string, any> = {};

        // Aggregate Portfolio
        txns.forEach(t => {
            const type = t.type;
            const sym = t.symbol;
            const qty = Number(t.qty);
            const val = Math.abs(Number(t.total || 0)); // 'total' in simplified schema

            if (!holdings[sym]) holdings[sym] = { qty: 0, invested: 0, category: t.category };

            if (type === 'Mua') {
                totalInvested += val;
                holdings[sym].qty += qty;
                holdings[sym].invested += val;
            } else if (type === 'Bán' || type === 'Chốt') {
                totalSold += val;
                if (holdings[sym].qty > 0) {
                    const avgCost = holdings[sym].invested / holdings[sym].qty;
                    holdings[sym].invested -= (qty * avgCost);
                    holdings[sym].qty -= qty;
                } else {
                    holdings[sym].qty -= qty;
                }
            }
        });

        // Calculate Current Value based on Market Price
        Object.keys(holdings).forEach(sym => {
            const item = holdings[sym];
            if (item.qty > 0) {
                // Find latest price
                const symPrices = prices.filter(p => p.symbol === sym).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
                const latestPrice = symPrices.length > 0 ? Number(symPrices[symPrices.length - 1].price) : 0;

                const marketVal = item.qty * latestPrice;
                currentHoldingsVal += marketVal;
            }
        });

        const profit = currentHoldingsVal + totalSold - totalInvested;

        setNetWorth(currentHoldingsVal); // Actually usually user wants Total Net Worth (Cash + Assets). Here we just show Asset Value? 
        // Re-reading logic: "bigNumber = isPeriodMode ? profitPeriod : totalHoldingsValPeriod;"
        // If "History" mode: Net Worth = totalHoldingsValPeriod (Current Asset Value).

        setNetWorth(currentHoldingsVal);
        setTotalPL(profit);
    }

    const fmt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

    return (
        <div className="space-y-5 pb-24">
            {/* NET WORTH CARD */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#db2777] p-6 text-white shadow-xl shadow-indigo-200">
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                    <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">Tổng Tài Sản (Assets)</p>
                    <h2 className="text-3xl font-bold tracking-tight mb-4">{fmt.format(netWorth)}</h2>
                    <div className="flex items-center gap-2">
                        <div className="bg-white/20 px-2 py-1 rounded text-xs font-bold">
                            {totalPL >= 0 ? '+' : ''}{fmt.format(totalPL)}
                        </div>
                        <span className="text-xs text-indigo-100 uppercase font-semibold">Lợi nhuận ròng</span>
                    </div>
                </div>
            </div>

            <div className="text-center text-slate-400 text-sm italic pt-10">
                Chưa có dữ liệu giao dịch. <br /> Hãy kết nối Database hoặc nhập liệu.
            </div>
        </div>
    );
}
