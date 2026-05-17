"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import {
    LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine,
} from "recharts";

/* ============================================================
   Types
   ============================================================ */
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
    category?: string;
};

/* ============================================================
   Helpers
   ============================================================ */
const fmtVND      = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
const fmtNum      = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });
const formatMoney = (n: number) => fmtVND.format(Math.round(n)) + " đ";

function fmtCompact(n: number) {
    const abs = Math.abs(n), sign = n < 0 ? "-" : "";
    if (abs >= 1e9) return sign + (abs / 1e9).toFixed(2) + " tỷ";
    if (abs >= 1e6) return sign + (abs / 1e6).toFixed(1) + " tr";
    if (abs >= 1e3) return sign + (abs / 1e3).toFixed(0) + " ngàn";
    return sign + abs.toFixed(0);
}

function pct(n: number) { return (n >= 0 ? "+" : "") + n.toFixed(2) + "%"; }

function getLatestPrice(prices: MarketPrice[], symbol: string, cutoff: Date) {
    const filtered = prices
        .filter((p) => p.symbol === symbol && new Date(p.date) <= cutoff)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return filtered.length > 0 ? Number(filtered[filtered.length - 1].price) : 0;
}

function computeMetrics(
    txns: Transaction[],
    prices: MarketPrice[],
    symbol: string,
    yearFilter: string
) {
    const cutoff =
        yearFilter !== "all"
            ? new Date(Number(yearFilter), 11, 31, 23, 59, 59)
            : new Date();

    let holdingQty = 0, invested = 0, realized = 0;
    let firstBuy: Date | null = null;

    const symTxns = txns
        .filter((t) => t.symbol === symbol && new Date(t.date) <= cutoff)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    symTxns.forEach((t) => {
        const qty = Number(t.qty);
        const val = Math.abs(Number(t.total));
        if (t.type === "Mua") {
            holdingQty += qty;
            invested   += val;
            if (!firstBuy) firstBuy = new Date(t.date);
        } else {
            if (holdingQty > 0) {
                const avg  = invested / holdingQty;
                const cost = Math.min(qty, holdingQty) * avg;
                invested  -= cost;
                holdingQty = Math.max(0, holdingQty - qty);
                realized  += val - cost;
            }
        }
    });

    const latestPrice = getLatestPrice(prices, symbol, cutoff);
    const marketVal   = holdingQty * latestPrice;
    const pnl         = marketVal - invested + realized;
    const base        = invested > 1 ? invested : Math.max(Math.abs(realized), 1);
    const pnlPct      = (pnl / base) * 100;
    const closed      = holdingQty < 0.001 && invested < 1;
    const avgCost     = holdingQty > 0 ? invested / holdingQty : 0;

    const days =
        holdingQty > 0 && firstBuy
            ? Math.ceil(Math.abs(cutoff.getTime() - (firstBuy as Date).getTime()) / 86_400_000)
            : 0;

    const cagr =
        days > 30 && pnlPct !== 0
            ? (Math.pow(1 + pnlPct / 100, 365 / days) - 1) * 100
            : null;

    const priceHistory = prices
        .filter((p) => p.symbol === symbol && new Date(p.date) <= cutoff)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-20)
        .map((p) => ({
            date:    new Date(p.date).toLocaleDateString("vi-VN"),
            price:   Number(p.price),
            avgCost: avgCost,
        }));

    return {
        pnl, pnlPct, holdingQty, invested, realized, days, cagr,
        avgCost, latestPrice, closed, priceHistory,
        history: [...symTxns].reverse(),
    };
}

/* ============================================================
   Custom tooltip for Recharts
   ============================================================ */
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div
            style={{
                background:   "var(--bg-3)",
                border:       "1px solid var(--glass-border)",
                borderRadius: 14,
                padding:      "10px 14px",
                fontSize:     12,
                fontWeight:   700,
            }}
        >
            <p style={{ color: "var(--text-3)", marginBottom: 4 }}>{label}</p>
            {payload.map((p: any) => (
                <p key={p.name} style={{ color: p.color }}>
                    {p.name}: {formatMoney(p.value)}
                </p>
            ))}
        </div>
    );
}

/* ============================================================
   Main component
   ============================================================ */
export function AnalysisView() {
    const [loading,         setLoading]         = useState(true);
    const [txns,            setTxns]            = useState<Transaction[]>([]);
    const [prices,          setPrices]          = useState<MarketPrice[]>([]);
    const [symbols,         setSymbols]         = useState<string[]>([]);
    const [availableYears,  setAvailableYears]  = useState<number[]>([]);
    const [selectedSymbol,  setSelectedSymbol]  = useState("");
    const [yearFilter,      setYearFilter]      = useState("all");

    const supabase = createClient();

    /* ── Load data once ── */
    useEffect(() => {
        (async () => {
            try {
                const [{ data: tData }, { data: pData }] = await Promise.all([
                    supabase.from("transactions").select("*"),
                    supabase.from("market_prices").select("*"),
                ]);
                const tList = (tData as Transaction[]) || [];
                const pList = (pData as MarketPrice[]) || [];
                setTxns(tList);
                setPrices(pList);
                setSymbols(Array.from(new Set(tList.map((t) => t.symbol))).sort() as string[]);
                setAvailableYears(
                    Array.from(new Set(tList.map((t) => new Date(t.date).getFullYear())))
                        .filter((y) => !isNaN(y))
                        .sort((a, b) => b - a) as number[]
                );
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    /* ── Derived metrics ── */
    const metrics = selectedSymbol
        ? computeMetrics(txns, prices, selectedSymbol, yearFilter)
        : null;

    const allRanks = selectedSymbol
        ? symbols
            .map((s) => {
                const m = computeMetrics(txns, prices, s, yearFilter);
                return { symbol: s, pnl: m.pnl, pnlPct: m.pnlPct };
            })
            .sort((a, b) => b.pnlPct - a.pnlPct)
            .slice(0, 6)
        : [];

    /* ── Loading ── */
    if (loading)
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent)" }} />
            </div>
        );

    const isProfit = (metrics?.pnl ?? 0) >= 0;
    const profitColor = isProfit ? "var(--profit)" : "var(--loss)";

    /* ── Rank medal ── */
    function medalStyle(i: number): React.CSSProperties {
        if (i === 0) return { background: "var(--gold-dim)", color: "var(--gold)" };
        if (i === 1) return { background: "rgba(203,213,225,0.1)", color: "#CBD5E1" };
        if (i === 2) return { background: "rgba(180,120,60,0.1)", color: "#CD7F32" };
        return { background: "var(--glass)", color: "var(--text-3)" };
    }

    return (
        <div className="space-y-5 pb-24">
            {/* ── Controls ── */}
            <div className="flex gap-3">
                <select
                    value={selectedSymbol}
                    onChange={(e) => setSelectedSymbol(e.target.value)}
                    className="input-bento flex-[2]"
                    style={{ fontSize: 15, fontWeight: 900, color: selectedSymbol ? "var(--accent)" : "var(--text-3)" }}
                >
                    <option value="">— Chọn mã để mổ xẻ —</option>
                    {symbols.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>

                <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="input-bento flex-1"
                    style={{ fontSize: 14, fontWeight: 800 }}
                >
                    <option value="all">Tất cả</option>
                    {availableYears.map((y) => <option key={y} value={String(y)}>{y}</option>)}
                </select>
            </div>

            {/* ── Empty state ── */}
            {!selectedSymbol && (
                <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
                    <span style={{ fontSize: 48 }}>🔍</span>
                    <h4 className="text-base font-black" style={{ color: "var(--text-1)" }}>
                        Chọn một mã bên trên
                    </h4>
                    <p className="text-sm" style={{ color: "var(--text-3)", maxWidth: 260, lineHeight: 1.5 }}>
                        Mình sẽ chẩn đoán ngay xem con đó đang khỏe hay đang... bốc mùi.
                    </p>
                </div>
            )}

            {/* ── Analysis content ── */}
            {metrics && (
                <div className="space-y-5 animate-fade-up">

                    {/* Main P&L card */}
                    <div
                        className="rounded-[2rem] p-6"
                        style={{
                            background: isProfit
                                ? "linear-gradient(135deg, rgba(52,211,153,0.08) 0%, transparent 100%)"
                                : "linear-gradient(135deg, rgba(248,113,113,0.08) 0%, transparent 100%)",
                            border: `1px solid ${isProfit ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`,
                        }}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p
                                    className="text-[10px] font-black uppercase tracking-widest mb-2"
                                    style={{ color: "var(--text-3)" }}
                                >
                                    Tiền đẻ ra tiền 🥚
                                </p>
                                <p
                                    className="text-3xl font-black tracking-tight"
                                    style={{ color: profitColor }}
                                >
                                    {isProfit ? "+" : ""}{formatMoney(metrics.pnl)}
                                </p>
                            </div>
                            <div
                                className="px-4 py-2 rounded-full text-sm font-black"
                                style={{
                                    background: isProfit ? "var(--profit-dim)" : "var(--loss-dim)",
                                    color:      profitColor,
                                    border:     `1px solid ${profitColor}44`,
                                }}
                            >
                                {pct(metrics.pnlPct)}
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div
                            className="h-1 w-full rounded-full overflow-hidden mb-5"
                            style={{ background: "var(--glass-border)" }}
                        >
                            <div
                                className="h-full rounded-full progress-fill"
                                style={{
                                    width:      Math.min(Math.abs(metrics.pnlPct), 100) + "%",
                                    background: profitColor,
                                }}
                            />
                        </div>

                        {/* Stat row */}
                        <div
                            className="grid grid-cols-3 gap-3 pt-4"
                            style={{ borderTop: "1px solid var(--glass-border)" }}
                        >
                            {[
                                { label: "Đang nắm", value: fmtNum.format(metrics.holdingQty), sub: "đơn vị" },
                                { label: "Đã rót",   value: fmtCompact(metrics.invested),      sub: "đồng" },
                                { label: "Ngày giữ", value: metrics.days > 0 ? String(metrics.days) : (metrics.closed ? "Đã bán" : "--"), sub: "ngày" },
                            ].map((s) => (
                                <div key={s.label} className="stat-tile text-center">
                                    <p className="text-[9px] font-black uppercase tracking-wider mb-1" style={{ color: "var(--text-3)" }}>{s.label}</p>
                                    <p className="text-base font-black" style={{ color: "var(--text-1)" }}>{s.value}</p>
                                    <p className="text-[10px] font-medium mt-0.5" style={{ color: "var(--text-3)" }}>{s.sub}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CAGR callout */}
                    <div
                        className="flex items-center justify-between p-5 rounded-2xl"
                        style={{
                            background: "linear-gradient(90deg, rgba(110,231,183,0.06) 0%, transparent 100%)",
                            border:     "1px solid rgba(110,231,183,0.15)",
                        }}
                    >
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
                                CAGR hàng năm 🚀
                            </p>
                            <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-3)" }}>
                                Lãi kép hoá của bậc thầy
                            </p>
                        </div>
                        <p
                            className="text-2xl font-black"
                            style={{ color: metrics.cagr !== null && metrics.cagr >= 0 ? "var(--accent)" : "var(--loss)" }}
                        >
                            {metrics.cagr !== null ? pct(metrics.cagr) : "N/A"}
                        </p>
                    </div>

                    {/* Price chart */}
                    <div
                        className="rounded-[2rem] p-5"
                        style={{ background: "var(--glass)", border: "1px solid var(--glass-border)" }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-2)" }}>
                                📊 Sóng giá gần đây
                            </p>
                            <span
                                className="text-[10px] font-bold px-3 py-1 rounded-full"
                                style={{ background: "var(--glass)", border: "1px solid var(--glass-border)", color: "var(--text-3)" }}
                            >
                                20 phiên
                            </span>
                        </div>
                        <div style={{ height: 160 }}>
                            {metrics.priceHistory.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={metrics.priceHistory}>
                                        <Line
                                            type="monotone"
                                            dataKey="price"
                                            stroke={profitColor}
                                            strokeWidth={2}
                                            dot={false}
                                            name="Giá TT"
                                        />
                                        {metrics.avgCost > 0 && (
                                            <Line
                                                type="monotone"
                                                dataKey="avgCost"
                                                stroke="rgba(251,191,36,0.6)"
                                                strokeWidth={1.5}
                                                strokeDasharray="5 4"
                                                dot={false}
                                                name="Giá vốn BQ"
                                            />
                                        )}
                                        <XAxis dataKey="date" hide />
                                        <YAxis hide domain={["auto", "auto"]} />
                                        <Tooltip content={<CustomTooltip />} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <p style={{ color: "var(--text-3)", fontSize: 13 }}>
                                        Chưa có dữ liệu giá thị trường
                                    </p>
                                </div>
                            )}
                        </div>
                        {/* Legend */}
                        <div className="flex gap-4 mt-3">
                            <span className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: profitColor }}>
                                <span style={{ width: 16, height: 2, background: profitColor, display: "inline-block", borderRadius: 9 }} />
                                Giá thị trường
                            </span>
                            {metrics.avgCost > 0 && (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: "var(--gold)" }}>
                                    <span style={{ width: 16, height: 2, background: "var(--gold)", display: "inline-block", borderRadius: 9, opacity: 0.7 }} />
                                    Giá vốn bình quân
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Ranking table */}
                    <div
                        className="rounded-[2rem] p-5"
                        style={{ background: "var(--glass)", border: "1px solid var(--glass-border)" }}
                    >
                        <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: "var(--text-2)" }}>
                            🏆 Bảng xếp hạng danh mục
                        </p>
                        <div className="space-y-2">
                            {allRanks.map((item, i) => {
                                const isCurrent = item.symbol === selectedSymbol;
                                const ip        = item.pnl >= 0;
                                return (
                                    <div
                                        key={item.symbol}
                                        className="flex items-center gap-3 p-3 rounded-xl transition-all"
                                        style={{
                                            background:   isCurrent ? "var(--accent-dim)" : "var(--glass)",
                                            border:       `1px solid ${isCurrent ? "var(--accent)" : "var(--glass-border)"}`,
                                        }}
                                    >
                                        <div
                                            className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0"
                                            style={medalStyle(i)}
                                        >
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black" style={{ color: isCurrent ? "var(--accent)" : "var(--text-1)" }}>
                                                {item.symbol}{isCurrent ? " ← bạn đang xem" : ""}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm font-black" style={{ color: ip ? "var(--profit)" : "var(--loss)" }}>
                                                {pct(item.pnlPct)}
                                            </p>
                                            <p className="text-[10px] font-bold" style={{ color: "var(--text-3)" }}>
                                                {ip ? "+" : ""}{fmtCompact(item.pnl)} đ
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Transaction history */}
                    <div
                        className="rounded-[2rem] p-5"
                        style={{ background: "var(--glass)", border: "1px solid var(--glass-border)" }}
                    >
                        <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: "var(--text-2)" }}>
                            📜 Lịch sử giao dịch
                        </p>
                        <div className="space-y-0 max-h-80 overflow-y-auto">
                            {metrics.history.length === 0 && (
                                <p className="text-center text-sm py-8" style={{ color: "var(--text-3)" }}>
                                    Chưa có giao dịch nào
                                </p>
                            )}
                            {metrics.history.map((h, i) => {
                                const isBuy  = h.type === "Mua";
                                const isLast = i === metrics.history.length - 1;
                                return (
                                    <div
                                        key={i}
                                        className="flex justify-between items-center py-3"
                                        style={{
                                            borderBottom: isLast ? "none" : "1px solid var(--glass-border)",
                                        }}
                                    >
                                        <div>
                                            <p className="text-[10px] font-bold mb-0.5" style={{ color: "var(--text-3)" }}>
                                                {new Date(h.date).toLocaleDateString("vi-VN")}
                                            </p>
                                            <p
                                                className="text-sm font-black"
                                                style={{ color: isBuy ? "var(--blue)" : "var(--profit)" }}
                                            >
                                                {h.type} {fmtNum.format(Number(h.qty))} CP
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black" style={{ color: "var(--text-1)" }}>
                                                {fmtCompact(Math.abs(Number(h.total)))} đ
                                            </p>
                                            <p className="text-[10px] font-medium mt-0.5" style={{ color: "var(--text-3)" }}>
                                                @ {fmtCompact(Number(h.price))}/cp
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
