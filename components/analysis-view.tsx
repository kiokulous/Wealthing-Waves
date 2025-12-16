"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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

export function AnalysisView() {
    const [loading, setLoading] = useState(true);
    const [symbols, setSymbols] = useState<string[]>([]);
    const [selectedSymbol, setSelectedSymbol] = useState<string>("");
    const [yearFilter, setYearFilter] = useState<string>("all");

    // Data State
    const [txns, setTxns] = useState<Transaction[]>([]);
    const [prices, setPrices] = useState<MarketPrice[]>([]);

    // Calculated State
    const [stats, setStats] = useState({
        pl: 0,
        plPercent: 0,
        qty: 0,
        duration: 0,
        invested: 0
    });
    const [history, setHistory] = useState<Transaction[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);

    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedSymbol) {
            calculateMetrics();
        }
    }, [selectedSymbol, yearFilter, txns, prices]);

    async function fetchData() {
        try {
            const { data: tData } = await supabase.from('transactions').select('*');
            const { data: pData } = await supabase.from('market_prices').select('*');

            const tList = tData || [];
            const pList = pData || [];

            setTxns(tList);
            setPrices(pList);

            // Extract unique symbols
            const uniqueSyms = Array.from(new Set(tList.map((t: any) => t.symbol))).sort();
            setSymbols(uniqueSyms as string[]);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    function calculateMetrics() {
        if (!selectedSymbol) return;

        // Filter Date Limit
        let cutoffDate = new Date();
        if (yearFilter !== 'all') {
            cutoffDate = new Date(Number(yearFilter), 11, 31, 23, 59, 59);
        }

        let holdingQty = 0;
        let invested = 0;
        let realized = 0;
        let firstBuyDate: Date | null = null;

        // Filter Txns
        const symTxns = txns
            .filter(t => t.symbol === selectedSymbol && new Date(t.date) <= cutoffDate)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        symTxns.forEach(t => {
            const qty = Number(t.qty);
            const val = Math.abs(Number(t.total));

            if (t.type === 'Mua') {
                holdingQty += qty;
                invested += val;
                if (!firstBuyDate) firstBuyDate = new Date(t.date);
            } else if (t.type === 'Bán' || t.type === 'Chốt') {
                if (holdingQty > 0) {
                    const avg = invested / holdingQty;
                    const cost = qty * avg;
                    invested -= cost;
                    holdingQty -= qty;
                    realized += (val - cost);
                }
            }
        });

        // Duration
        let duration = 0;
        if (holdingQty > 0 && firstBuyDate) {
            const diff = Math.abs(cutoffDate.getTime() - (firstBuyDate as Date).getTime());
            duration = Math.ceil(diff / (1000 * 60 * 60 * 24));
        }

        // Market Value
        const symPrices = prices
            .filter(p => p.symbol === selectedSymbol && new Date(p.date) <= cutoffDate)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const latestPrice = symPrices.length > 0 ? Number(symPrices[symPrices.length - 1].price) : 0;
        const marketVal = holdingQty * latestPrice;
        const totalPL = (marketVal - invested) + realized;

        const baseInvest = invested > 0 ? invested : (Math.abs(realized) + 1);
        const plPercent = (totalPL / baseInvest) * 100;

        setStats({
            pl: totalPL,
            plPercent: (holdingQty <= 0.001 && invested <= 1) ? 0 : plPercent,
            qty: holdingQty,
            duration: duration,
            invested
        });

        // History List (Newest first)
        setHistory([...symTxns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

        // Chart Data
        const chartD = symPrices.slice(-20).map(p => ({
            date: new Date(p.date).toLocaleDateString('vi-VN'),
            price: Number(p.price),
            cost: invested / (holdingQty || 1) // Approx avg cost
        }));
        setChartData(chartD);
    }

    const fmt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
    const fmtNum = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

    return (
        <div className="space-y-6 pb-24">
            {/* CONTROLS */}
            <div className="flex gap-3">
                <div className="flex-1 bg-white p-3 rounded-2xl border border-indigo-100 shadow-sm">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Mã</label>
                    <select
                        value={selectedSymbol}
                        onChange={(e) => setSelectedSymbol(e.target.value)}
                        className="w-full bg-transparent font-bold text-lg text-indigo-600 outline-none"
                    >
                        <option value="">-- Chọn --</option>
                        {symbols.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="w-1/3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Năm</label>
                    <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="w-full bg-transparent font-bold text-lg text-slate-600 outline-none"
                    >
                        <option value="all">All</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                    </select>
                </div>
            </div>

            {selectedSymbol ? (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* MAIN CARD */}
                    <div className="bg-gradient-to-br from-white to-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Lợi Nhuận</p>
                                <h3 className={`text-3xl font-extrabold mt-1 tracking-tight ${stats.pl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {fmt.format(stats.pl)}
                                </h3>
                            </div>
                            <div className={`px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm border ${stats.pl >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                {stats.pl >= 0 ? '+' : ''}{stats.plPercent.toFixed(2)}%
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-5">
                            <div
                                className={`h-full transition-all duration-1000 ${stats.pl >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                style={{ width: '100%' }}
                            ></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Số lượng</p>
                                <p className="text-lg font-bold text-slate-700">{fmtNum.format(stats.qty)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Thời gian</p>
                                <p className="text-lg font-bold text-slate-700">{stats.qty > 0 ? `${stats.duration} ngày` : 'Đã bán hết'}</p>
                            </div>
                        </div>
                    </div>

                    {/* CHART */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-700 mb-4 text-xs uppercase">Biến động giá</h3>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <Line type="monotone" dataKey="price" stroke="#6366f1" strokeWidth={2} dot={false} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide domain={['auto', 'auto']} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* HISTORY LIST */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-700 mb-4 text-xs uppercase">Lịch sử giao dịch</h3>
                        <div className="space-y-4 max-h-80 overflow-y-auto pr-2 text-sm">
                            {history.length === 0 && <p className="text-center text-slate-400 text-xs py-4">Chưa có giao dịch</p>}
                            {history.map((h, i) => (
                                <div key={i} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                            {new Date(h.date).toLocaleDateString('vi-VN')}
                                        </span>
                                        <div className={`font-bold text-sm mt-0.5 ${h.type === 'Mua' ? 'text-slate-700' : 'text-emerald-600'}`}>
                                            {h.type} {fmtNum.format(Number(h.qty))}
                                        </div>
                                    </div>
                                    <div className="font-bold text-sm text-indigo-600">
                                        {fmt.format(Math.abs(Number(h.total)))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 opacity-40">
                    <p className="text-sm font-medium">Chọn một mã để xem chi tiết</p>
                </div>
            )}
        </div>
    );
}
