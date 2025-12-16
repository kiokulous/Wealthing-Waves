import { AnalysisView } from "@/components/analysis-view";
import { BottomNav } from "@/components/bottom-nav";
import { FabInput } from "@/components/fab-input";

export default function AnalysisPage() {
    return (
        <main className="min-h-screen bg-slate-50 pb-32">
            {/* HEADER */}
            <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                <h1 className="font-bold text-slate-800 text-lg">Chi Tiết</h1>
            </div>

            <div className="p-4">
                <AnalysisView />
            </div>

            <FabInput />
            <BottomNav />
        </main>
    );
}
