"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
    AlertTriangle,
    ShieldAlert,
    Activity,
    GitMerge,
    ArrowUpRight,
    ArrowDownRight,
    FileCode,
    TrendingUp,
    AlertOctagon,
    X,
} from "lucide-react";
import { AIAnalysisResult } from "@/lib/ai/AIClient";

interface ChangeRiskDashboardProps {
    data: AIAnalysisResult | null;
    graphData: any; // Raw graph data with nodes and links
    onFileSelect?: (file: string) => void;
}

// Helper function to calculate system risk score
function calculateSystemRisk(highFanInCount: number, circularDepsCount: number, maxScore: number): number {
    // Weight factors
    const fanInWeight = 3;
    const circularWeight = 5;

    // Calculate raw score
    const rawScore = (highFanInCount * fanInWeight) + (circularDepsCount * circularWeight);

    // Normalize to 0-100 scale with diminishing returns
    const normalizedScore = Math.min(maxScore, Math.round((rawScore / (rawScore + 10)) * maxScore));

    return normalizedScore;
}

export default function ChangeRiskDashboard({ data, graphData, onFileSelect }: ChangeRiskDashboardProps) {

    const [selectedFile, setSelectedFile] = useState<string | null>(null);

    // ... (existing risk score logic)
    // Extract risk data
    const highFanIn = data?.structural?.highFanIn || [];
    const highFanOut = data?.structural?.highFanOut || [];
    const circularDeps = data?.structural?.circularDependencies || [];
    const hotspots = data?.structural?.highFanIn || []; // Using high fan-in as hotspots for now

    // Calculate overall risk score
    const riskScore = calculateSystemRisk(highFanIn.length, circularDeps.length, 100);

    const handleFileSelect = (file: string) => {
        setSelectedFile(file);
        onFileSelect?.(file);
    };



    return (
        <div className="space-y-6 pb-20">
            {/* Header / Summary Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/30 p-5 relative overflow-hidden"
            >
                <div className="flex items-start gap-4 relative z-10">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <ShieldAlert className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-white">System Stability Risk Assessment</h3>
                            <div className="flex gap-2">

                                <div className={`px-3 py-1 rounded-full text-sm font-bold border ${riskScore < 30 ? "bg-green-500/20 text-green-400 border-green-500/30" :
                                    riskScore < 60 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                                        "bg-red-500/20 text-red-400 border-red-500/30"
                                    }`}>
                                    Risk Score: {riskScore}/100
                                </div>
                            </div>
                        </div>
                        {/* ... (rest of header) */}
                        <p className="text-slate-300 text-sm leading-relaxed mb-4">
                            Analysis of coupling, circular dependencies, and architectural stability.
                            {riskScore > 50
                                ? " The system shows signs of high coupling and potential fragility. Refactoring recommended."
                                : " The system structure appears relatively stable with manageable coupling levels."}
                        </p>

                        {/* Key Metrics Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-center">
                            <div className="bg-slate-900/40 rounded-lg p-2 border border-white/5">
                                <div className="text-2xl font-bold text-white">{hotspots.length}</div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider">Hotspots</div>
                            </div>
                            <div className="bg-slate-900/40 rounded-lg p-2 border border-white/5">
                                <div className="text-2xl font-bold text-white">{circularDeps.length}</div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider">Circular Deps</div>
                            </div>
                            <div className="bg-slate-900/40 rounded-lg p-2 border border-white/5">
                                <div className="text-2xl font-bold text-white">{highFanIn.length}</div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider">High Coupling</div>
                            </div>
                            <div className="bg-slate-900/40 rounded-lg p-2 border border-white/5">
                                <div className="text-2xl font-bold text-white">{(data?.metrics?.maintainability || 0).toFixed(2)}</div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider">Maintainability</div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Blast Radius Visualization Overlay */}


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ... (Refactored existing lists - kept same) */}
                {/* High Risk Files (Top 10 Hotspots) */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-700/30 rounded-xl border border-slate-600/50 p-4"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <AlertOctagon className="w-5 h-5 text-red-400" />
                        <h4 className="font-medium text-white">Top Risk Files (High Impact)</h4>
                    </div>

                    {hotspots.length > 0 ? (
                        <div className="space-y-2">
                            {hotspots.slice(0, 10).map((file, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleFileSelect(file)}
                                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all group ${selectedFile === file
                                        ? 'bg-red-500/20 border border-red-500/50'
                                        : 'bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-red-500/30'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="text-xs font-mono text-slate-500 w-4">{i + 1}</div>
                                        <div className="truncate">
                                            <div className="text-sm text-slate-200 font-medium group-hover:text-red-300 transition-colors">
                                                {file.split('/').pop()}
                                            </div>
                                            <div className="text-xs text-slate-500 truncate">{file}</div>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-colors flex-shrink-0" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <FileCode className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No high-risk files detected</p>
                        </div>
                    )}
                </motion.div>

                {/* Circular Dependencies */}
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-700/30 rounded-xl border border-slate-600/50 p-4"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <GitMerge className="w-5 h-5 text-yellow-400" />
                        <h4 className="font-medium text-white">Circular Dependencies</h4>
                    </div>

                    {circularDeps.length > 0 ? (
                        <div className="space-y-2">
                            {circularDeps.slice(0, 8).map((cycle, i) => (
                                <div
                                    key={i}
                                    className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertTriangle className="w-3 h-3 text-yellow-500" />
                                        <span className="text-xs font-bold text-yellow-400">Cycle {i + 1}</span>
                                    </div>
                                    <div className="text-xs text-slate-400 font-mono break-all">
                                        {cycle}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No circular dependencies detected</p>
                            <p className="text-xs text-green-500 mt-1">✓ Clean dependency graph</p>
                        </div>
                    )}
                </motion.div>

                {/* High Fan-Out Files and End of Component... (no changes needed further down) */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-slate-700/30 rounded-xl border border-slate-600/50 p-4 md:col-span-2"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        <h4 className="font-medium text-white">High Fan-Out Files (Many Dependencies)</h4>
                    </div>

                    {highFanOut.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {highFanOut.slice(0, 8).map((file, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleFileSelect(file)}
                                    className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:border-blue-500/30 cursor-pointer transition-all group"
                                >
                                    <div className="text-sm text-slate-200 font-medium truncate group-hover:text-blue-300">
                                        {file.split('/').pop()}
                                    </div>
                                    <div className="text-xs text-slate-500 truncate">{file}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-slate-500">
                            <p className="text-sm">No high fan-out files detected</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
