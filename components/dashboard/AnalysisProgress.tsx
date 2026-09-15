"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Cpu, Terminal, ChevronRight, Loader2, Sparkles, Database, BarChart3 } from "lucide-react";

interface AnalysisProgressProps {
    progress: number;
    status: string;
    onComplete: () => void;
}

export default function AnalysisProgress({ progress, status, onComplete }: AnalysisProgressProps) {
    const milestones = [
        { id: 'repo', label: 'Analyzing Repository', threshold: 0, icon: Database },
        { id: 'logic', label: 'Heuristic Mapping', threshold: 30, icon: Cpu },
        { id: 'ai', label: 'Initiating AI Architect', threshold: 60, icon: Sparkles },
        { id: 'final', label: 'Finalizing Dashboard', threshold: 90, icon: Terminal },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505] overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg px-6"
            >
                <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden">
                    {/* Progress Bar Glow Overlay */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-white/5 overflow-hidden">
                        <motion.div
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink shadow-[0_0_15px_rgba(0,255,242,0.5)]"
                        />
                    </div>

                    <div className="space-y-10">
                        {/* Huge Percentage Ticker */}
                        <div className="flex flex-col items-center text-center space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-neon-cyan uppercase tracking-[0.2em]">
                                <BarChart3 className="w-3 h-3" />
                                Processing Codebase
                            </div>
                            <div className="text-8xl font-black text-white italic tracking-tighter tabular-nums flex items-baseline">
                                {progress.toFixed(2)}
                                <span className="text-2xl text-neon-purple align-top mt-4 ml-1">%</span>
                            </div>
                            <motion.p
                                key={status}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-sm text-gray-400 font-medium tracking-wide h-5"
                            >
                                {status || "Preparing systems..."}
                            </motion.p>
                        </div>

                        {/* Horizontal Dedicated Progress Bar */}
                        <div className="space-y-4">
                            <div className="h-2 w-full bg-white/5 rounded-full relative overflow-hidden">
                                <motion.div
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.5, ease: "circOut" }}
                                    className="absolute inset-0 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink"
                                />
                                {/* Scanning pulse */}
                                <motion.div
                                    animate={{ x: ["-100%", "200%"] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-y-0 w-20 bg-white/20 blur-md"
                                />
                            </div>

                            {/* Indicators */}
                            <div className="flex justify-between px-1">
                                {milestones.map((m) => (
                                    <div key={m.id} className="flex flex-col items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${progress >= m.threshold ? 'bg-neon-cyan shadow-[0_0_8px_rgba(0,255,242,1)]' : 'bg-white/10'}`} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Milestone Tags */}
                        <div className="flex flex-wrap justify-center gap-3">
                            {milestones.map((m) => {
                                const Icon = m.icon;
                                const isActive = progress >= m.threshold;
                                return (
                                    <div
                                        key={m.id}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-500 ${isActive ? 'bg-white/5 border-white/20 text-white' : 'bg-transparent border-transparent text-gray-600'}`}
                                    >
                                        <Icon className={`w-3 h-3 ${isActive ? 'text-neon-cyan' : 'text-gray-600'}`} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{m.label}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Completion Button */}
                        <AnimatePresence>
                            {progress >= 100 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="pt-4"
                                >
                                    <button
                                        onClick={onComplete}
                                        className="w-full flex items-center justify-center gap-3 py-5 bg-white text-black font-black uppercase text-xs tracking-[0.3em] rounded-2xl hover:bg-neon-cyan transition-all transform active:scale-95 shadow-xl"
                                    >
                                        Launch Architect <ChevronRight className="w-5 h-5" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
