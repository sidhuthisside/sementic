"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, AlertCircle, Lightbulb, Book, Github, Share2 } from "lucide-react";

const tabs = [
    { id: "metrics", label: "Metrics", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "issues", label: "Issues", icon: <AlertCircle className="w-4 h-4" /> },
    { id: "recommendations", label: "Recommendations", icon: <Lightbulb className="w-4 h-4" /> },
];

export default function BottomPanel({
    issues,
    recommendations,
    metrics,
    githubStats,
    loading,
    isOpen,
    onToggle
}: {
    issues: any[],
    recommendations: any[],
    metrics?: any,
    githubStats?: { issues: number, stars: number, forks: number } | null,
    loading?: boolean,
    isOpen: boolean,
    onToggle: (open: boolean) => void
}) {
    const [activeTab, setActiveTab] = useState("issues");


    return (
        <div className={`fixed bottom-0 left-0 right-0 z-40 bg-[#080808] border-t border-white/10 transition-all duration-300 ${isOpen ? "h-64" : "h-12"}`}>
            <div className="flex items-center justify-between px-4 sm:px-6 h-12 border-b border-white/5 bg-white/5">
                <div className="flex gap-1 h-full overflow-x-auto scrollbar-hide mask-fade-right touch-pan-x">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                onToggle(true);
                            }}
                            className={`flex items-center gap-2 px-4 h-full text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id ? "text-neon-cyan border-neon-cyan bg-white/5" : "text-gray-400 border-transparent hover:text-white"}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
                <button onClick={() => onToggle(!isOpen)} className="text-gray-500 hover:text-white p-2 shrink-0">
                    <span className="hidden sm:inline">{isOpen ? "Collapse" : "Expand"}</span>
                    <span className="sm:hidden">{isOpen ? "▼" : "▲"}</span>
                </button>
            </div>

            <div className="p-6 h-[calc(100%-3rem)] overflow-y-auto w-full max-w-7xl mx-auto">
                <AnimatePresence mode="wait">
                    {activeTab === "issues" && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {githubStats && (
                                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20 mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-neon-cyan/10 flex items-center justify-center">
                                            <Github className="w-5 h-5 text-neon-cyan" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold flex items-center gap-2">
                                                GitHub Project Issues
                                                <span className="bg-neon-cyan/20 text-neon-cyan text-[10px] px-2 py-0.5 rounded-full border border-neon-cyan/30">
                                                    {githubStats.issues} Open
                                                </span>
                                            </h4>
                                            <p className="text-xs text-gray-400">Project management issues tracked on GitHub repositories.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 animate-pulse">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="w-32 h-4 bg-white/10 rounded" />
                                                <div className="w-12 h-3 bg-white/10 rounded" />
                                            </div>
                                            <div className="w-full h-3 bg-white/5 rounded mt-2" />
                                        </div>
                                    ))
                                ) : issues.length > 0 ? (
                                    issues.map((issue) => (
                                        <div key={issue.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-red-500/50 transition-colors group">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle className={`w-4 h-4 ${issue.severity === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />
                                                    <span className="font-semibold text-white group-hover:text-red-400 transition-colors">{issue.title}</span>
                                                </div>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${issue.severity === 'high' ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500'}`}>{issue.severity}</span>
                                            </div>
                                            <p className="text-sm text-gray-500">{issue.description || "Analysis pending detailed breakdown."}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-8 text-center text-gray-500 italic">
                                        No architectural issues detected by AI yet.
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                    {activeTab === "recommendations" && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {recommendations.map((rec, index) => (
                                <div key={rec.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all bg-gradient-to-r from-white/5 to-transparent border-white/5`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-neon-cyan/20 text-neon-cyan`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-white mb-1">{rec.title}</h4>
                                        <p className="text-xs text-gray-400 mb-2">{rec.description}</p>
                                        <div className="flex gap-4">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded border capitalize ${rec.impact === 'high' ? 'bg-red-500/10 border-red-500/50 text-red-500' : rec.impact === 'medium' ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' : 'bg-blue-500/10 border-blue-500/50 text-blue-500'}`}>
                                                {rec.impact} Impact
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {activeTab === "metrics" && metrics && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4"
                        >
                            {loading ? (
                                Array.from({ length: 7 }).map((_, i) => (
                                    <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 animate-pulse">
                                        <div className="w-16 h-3 bg-white/10 rounded mb-2" />
                                        <div className="w-20 h-6 bg-white/20 rounded" />
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-neon-cyan/10 to-transparent border border-neon-cyan/20">
                                        <div className="text-xs text-gray-500 mb-1">Lines of Code</div>
                                        <div className="text-2xl font-bold text-neon-cyan">{metrics.linesOfCode?.toLocaleString() || 0}</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-neon-purple/10 to-transparent border border-neon-purple/20">
                                        <div className="text-xs text-gray-500 mb-1">Complexity</div>
                                        <div className="text-2xl font-bold text-neon-purple">{(metrics.complexity || 0).toFixed(2)}</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-neon-pink/10 to-transparent border border-neon-pink/20">
                                        <div className="text-xs text-gray-500 mb-1">Maintainability</div>
                                        <div className="text-2xl font-bold text-neon-pink">{(metrics.maintainability || 0).toFixed(2)}%</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20">
                                        <div className="text-xs text-gray-500 mb-1">Functions</div>
                                        <div className="text-2xl font-bold text-green-400">{metrics.functionCount || 0}</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
                                        <div className="text-xs text-gray-500 mb-1">Classes</div>
                                        <div className="text-2xl font-bold text-blue-400">{metrics.classCount || 0}</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20">
                                        <div className="text-xs text-gray-500 mb-1">Test Coverage</div>
                                        <div className="text-2xl font-bold text-yellow-400">{(metrics.testCoverage || 0).toFixed(2)}%</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20">
                                        <div className="text-xs text-gray-500 mb-1">Documentation</div>
                                        <div className="text-2xl font-bold text-orange-400">{(metrics.documentationDensity || 0).toFixed(2)}%</div>
                                    </div>
                                    {githubStats && (
                                        <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20">
                                            <div className="text-xs text-gray-500 mb-1">GitHub Issues</div>
                                            <div className="text-2xl font-bold text-red-400">{githubStats.issues}</div>
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    )}
                    {/* Placeholders for other tabs */}
                    {activeTab !== "issues" && activeTab !== "recommendations" && activeTab !== "metrics" && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <p>Content for {activeTab} coming soon...</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div >
    );
}
