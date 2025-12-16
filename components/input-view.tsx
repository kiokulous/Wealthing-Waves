"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function InputView() {
    const router = useRouter();
    const supabase = createClient();

    const [mode, setMode] = useState<'txn' | 'price'>('txn');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'Mua',
        category: 'Cổ phiếu',
        symbol: '',
        qty: '',
        price: '',
        total_money: '',
        fee: '0'
    });

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Prepare DB Data
            const qty = parseFloat(formData.qty) || 0;
            const fee = parseFloat(formData.fee) || 0;
            let price = parseFloat(formData.price) || 0;
            const totalMoney = parseFloat(formData.total_money) || 0;

            // Logic for derived price in Txn Mode
            if (mode === 'txn') {
                if (qty !== 0) {
                    if (formData.type === 'Mua') price = (totalMoney - fee) / qty;
                    else price = (totalMoney + fee) / qty;
                }
            }

            let error;
            let userId = (await supabase.auth.getUser()).data.user?.id;
            // If no user (anon), allow insert if RLS permits or just fail (User should handle Auth later)
            // For now we try insert.

            if (mode === 'txn') {
                const { error: err } = await supabase.from('transactions').insert({
                    date: formData.date,
                    type: formData.type,
                    category: formData.category,
                    symbol: formData.symbol.toUpperCase(),
                    qty: qty,
                    price: price,
                    fee: fee,
                    total: formData.type === 'Mua' ? -Math.abs(totalMoney) : Math.abs(totalMoney),
                    user_id: userId // If RLS is strict, this is needed. Supabase client might auto-inject if auth set.
                });
                error = err;
            } else {
                const { error: err } = await supabase.from('market_prices').insert({
                    date: formData.date,
                    category: formData.category,
                    symbol: formData.symbol.toUpperCase(),
                    price: parseFloat(formData.price),
                    user_id: userId
                });
                error = err;
            }

            if (error) throw error;

            // Success Logic
            setSuccess(true);
            setFormData(prev => ({ ...prev, symbol: '', qty: '', price: '', total_money: '', fee: '0' }));

            setTimeout(() => {
                setSuccess(false);
                // router.push('/'); // Optional: Redirect home?
            }, 2000);

        } catch (err: any) {
            alert("Lỗi: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* TOGGLE MODE */}
            <div className="flex p-1 bg-slate-100 rounded-xl relative">
                <div
                    className={`absolute left-1 top-1 w-[calc(50%-4px)] h-[calc(100%-8px)] bg-white rounded-lg shadow-sm transition-all duration-300 ${mode === 'price' ? 'translate-x-full' : 'translate-x-0'}`}
                ></div>
                <button
                    onClick={() => setMode('txn')}
                    className={`relative z-10 flex-1 py-2.5 text-sm font-bold text-center transition-colors ${mode === 'txn' ? 'text-indigo-600' : 'text-slate-400'}`}
                >
                    Giao Dịch
                </button>
                <button
                    onClick={() => setMode('price')}
                    className={`relative z-10 flex-1 py-2.5 text-sm font-bold text-center transition-colors ${mode === 'price' ? 'text-indigo-600' : 'text-slate-400'}`}
                >
                    Cập Nhật Giá
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Ngày</label>
                    <input type="date" name="date" required value={formData.date} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl p-3.5 font-bold text-slate-700 text-sm outline-none focus:border-indigo-500 transition-colors" />
                </div>

                {mode === 'txn' ? (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Loại</label>
                            <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl p-3.5 font-bold text-sm text-slate-700 outline-none">
                                <option value="Mua">Mua vào</option>
                                <option value="Bán">Bán ra</option>
                                <option value="Chốt">Chốt lời/Lỗ</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Hạng mục</label>
                            <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl p-3.5 font-bold text-sm text-slate-700 outline-none">
                                <option value="Cổ phiếu">Cổ phiếu</option>
                                <option value="Chứng chỉ quỹ">CC Quỹ</option>
                                <option value="Vàng">Vàng</option>
                                <option value="Tiết kiệm">Tiết kiệm</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Hạng mục</label>
                        <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl p-3.5 font-bold text-sm text-slate-700 outline-none">
                            <option value="Cổ phiếu">Cổ phiếu</option>
                            <option value="Chứng chỉ quỹ">Chứng chỉ quỹ</option>
                            <option value="Vàng">Vàng</option>
                        </select>
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Mã (Symbol)</label>
                    <input type="text" name="symbol" placeholder="VD: VNM" required value={formData.symbol} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-lg font-black uppercase tracking-wider text-slate-800 placeholder:font-normal outline-none focus:border-indigo-500" />
                </div>

                {mode === 'txn' && (
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Số lượng</label>
                        <input type="number" step="0.01" name="qty" placeholder="0.00" value={formData.qty} onChange={handleChange} required className="w-full bg-white border border-slate-200 rounded-xl p-3.5 font-bold text-slate-700 outline-none focus:border-indigo-500" />
                    </div>
                )}

                {mode === 'price' ? (
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Giá Thị Trường (1 Đơn vị)</label>
                        <input type="number" step="0.01" name="price" placeholder="0" required value={formData.price} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl p-3.5 font-bold text-slate-700 outline-none focus:border-indigo-500" />
                    </div>
                ) : (
                    <>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Tổng Tiền (Gồm Phí)</label>
                            <input type="number" step="1" name="total_money" placeholder="0" required value={formData.total_money} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl p-3.5 font-bold text-indigo-600 outline-none focus:border-indigo-500" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Phí GD</label>
                            <input type="number" step="1" name="fee" value={formData.fee} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl p-3.5 font-bold text-slate-500 outline-none focus:border-indigo-500" />
                        </div>
                    </>
                )}

                <button
                    type="submit"
                    disabled={loading || success}
                    className={`w-full font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 
                    ${success
                            ? 'bg-emerald-500 text-white shadow-emerald-200'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                        }
                    ${loading ? 'opacity-70 cursor-not-allowed' : ''}
                `}
                >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (success ? <CheckCircle2 className="w-5 h-5" /> : null)}
                    {success ? 'Đã Lưu!' : 'Lưu Dữ Liệu'}
                </button>
            </form>
        </div>
    );
}
