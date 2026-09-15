"use client";

import { motion } from "framer-motion";
import { Activity, Shield, Zap, TrendingUp, AlertTriangle } from "lucide-react";
import CountUp from "react-countup";

export default function InsightSidebar({ metrics, patterns }: { metrics: any, patterns: any[] }) {
    return (
        <aside className="w-80 h-full border-l border-white/10 glass overflow-y-auto p-6 space-y-8 absolute right-0 top-0 z-10 hidden lg:block">
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Activity className="text-neon-cyan w-5 h-5" /> Health Score
                </h3>
                <div className="relative w-48 h-24 mx-auto mt-8">
                    {/* Simple gauge visualization using CSS/divs for now - can be upgraded to SVG */}
                    <div className="absolute inset-0 bg-gray-800 rounded-t-full overflow-hidden">
                        <motion.div
                            initial={{ rotate: -180 }}
                            animate={{ rotate: (metrics.health / 100 * 180) - 180 }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            className="w-full h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 origin-bottom center"
                            style={{ transformOrigin: "50% 100%" }}
                        />
                    </div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-white rounded-full z-10 shadow-[0_0_10px_white]" />
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-3xl font-black text-white z-20">
                        <CountUp end={metrics.health} decimals={2} decimal="." />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Key Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="glass p-3 rounded-xl">
                        <div className="text-xs text-gray-500 mb-1">Maintainability</div>
                        <div className="text-xl font-bold text-neon-purple">{(metrics.maintainability || 0).toFixed(2)}</div>
                    </div>
                    <div className="glass p-3 rounded-xl">
                        <div className="text-xs text-gray-500 mb-1">Complexity</div>
                        <div className="text-xl font-bold text-neon-pink">{(metrics.complexity || 0).toFixed(2)}</div>
                    </div>
                    <div className="glass p-3 rounded-xl col-span-2">
                        <div className="text-xs text-gray-500 mb-1">Test Coverage</div>
                        <div className="text-xl font-bold text-neon-cyan">{(metrics.coverage || 0).toFixed(2)}%</div>
                        <div className="w-full bg-gray-700 h-1 mt-2 rounded-full overflow-hidden">
                            <div className="bg-neon-cyan h-full" style={{ width: `${metrics.coverage}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Detected Patterns</h3>
                <div className="space-y-3">
                    {patterns.map((p, i) => (
                        <motion.div
                            key={i}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                            className="p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-sm">{p.title}</span>
                                <span className="text-xs px-2 py-0.5 rounded bg-white/10" style={{ color: p.color }}>{(p.confidence || 0).toFixed(2)}%</span>
                            </div>
                            <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${p.confidence}%` }}
                                    transition={{ duration: 1, delay: 1 + i * 0.1 }}
                                    className="h-full" style={{ backgroundColor: p.color }}
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </aside>
    );
}
