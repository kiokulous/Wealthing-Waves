"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

export function FabInput() {
    return (
        <div className="fixed bottom-6 right-6 z-[60]">
            <Link href="/input">
                <button
                    className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-[0_10px_25px_-5px_rgba(79,70,229,0.4)] active:scale-95 transition-transform group"
                    aria-label="Nhập liệu"
                >
                    <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" />
                </button>
            </Link>
        </div>
    );
}
