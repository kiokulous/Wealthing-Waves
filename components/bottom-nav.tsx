"use client";

import { Home, PieChart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function BottomNav() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <div className="fixed bottom-0 left-0 w-full z-50 pointer-events-none">
            {/* Bottom Tab Bar (Glassmorphism) */}
            <div className="bg-white/90 backdrop-blur-xl border-t border-slate-200/60 pb-8 pt-3 px-6 pointer-events-auto flex items-center gap-8 rounded-t-3xl shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.03)] mx-auto max-w-2xl w-full">
                <Link
                    href="/"
                    className={cn(
                        "flex flex-col items-center gap-1 transition-all duration-300",
                        isActive("/")
                            ? "text-indigo-600 font-bold scale-100 opacity-100"
                            : "text-slate-400 scale-95 opacity-60 hover:opacity-100"
                    )}
                >
                    <Home className="w-6 h-6" strokeWidth={isActive("/") ? 2.5 : 2} />
                    <span className="text-[10px]">Tổng quan</span>
                </Link>
                <Link
                    href="/analysis"
                    className={cn(
                        "flex flex-col items-center gap-1 transition-all duration-300",
                        isActive("/analysis")
                            ? "text-indigo-600 font-bold scale-100 opacity-100"
                            : "text-slate-400 scale-95 opacity-60 hover:opacity-100"
                    )}
                >
                    <PieChart className="w-6 h-6" strokeWidth={isActive("/analysis") ? 2.5 : 2} />
                    <span className="text-[10px]">Chi tiết</span>
                </Link>
                {/* Spacer for FAB */}
                <div className="w-12 h-12" />
            </div>
        </div>
    );
}
