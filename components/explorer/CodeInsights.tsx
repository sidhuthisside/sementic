"use client";


import { Code, Box, AlertTriangle, Info } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function CodeInsights({ language }: { language: string }) {
    return (
        <div className="h-64 border-t border-white/10 bg-[#050505] p-4 overflow-y-auto">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-neon-cyan" /> Code Insights
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2 mb-2 text-neon-purple">
                        <Code className="w-4 h-4" />
                        <span className="font-bold text-sm">Functions</span>
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-gray-400 hover:text-white cursor-pointer transition-colors block p-1 hover:bg-white/5 rounded">calculateMetric()</div>
                        <div className="text-xs text-gray-400 hover:text-white cursor-pointer transition-colors block p-1 hover:bg-white/5 rounded">formatDate()</div>
                    </div>
                </div>

                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2 mb-2 text-neon-pink">
                        <Box className="w-4 h-4" />
                        <span className="font-bold text-sm">Dependencies</span>
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-gray-400">react</div>
                        <div className="text-xs text-gray-400 text-red-400">lodash (unused)</div>
                    </div>
                </div>

                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2 mb-2 text-yellow-500">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-bold text-sm">Potential Issues</span>
                    </div>
                    <div className="text-xs text-gray-400 leading-relaxed">
                        Line 14: Complex cyclomatic complexity detected. Consider extracting method.
                    </div>
                </div>
            </div>
        </div>
    );
}
