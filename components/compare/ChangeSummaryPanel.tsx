"use client";

import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle2, Info } from "lucide-react";
import { ArchitecturalChangeSummary } from "@/lib/analyzer/ArchitecturalComparator";

interface ChangeSummaryPanelProps {
    summary: ArchitecturalChangeSummary;
}

export default function ChangeSummaryPanel({ summary }: ChangeSummaryPanelProps) {
    const {
        narrative,
        couplingTrend,
        couplingChange,
        topCentralModules,
        riskLevel,
        recommendations
    } = summary;

    // Risk level styling
    const riskConfig = {
        low: {
            color: 'text-green-500',
            bg: 'bg-green-500/10',
            border: 'border-green-500/30',
            icon: CheckCircle2,
            label: 'Low Risk'
        },
        medium: {
            color: 'text-yellow-500',
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/30',
            icon: Info,
            label: 'Medium Risk'
        },
        high: {
            color: 'text-red-500',
            bg: 'bg-red-500/10',
            border: 'border-red-500/30',
            icon: AlertTriangle,
            label: 'High Risk'
        }
    };

    const risk = riskConfig[riskLevel];
    const RiskIcon = risk.icon;

    // Coupling trend config
    const couplingConfig = {
        increased: {
            icon: TrendingUp,
            color: 'text-red-500',
            label: 'Increased'
        },
        decreased: {
            icon: TrendingDown,
            color: 'text-green-500',
            label: 'Decreased'
        },
        stable: {
            icon: CheckCircle2,
            color: 'text-gray-500',
            label: 'Stable'
        }
    };

    const coupling = couplingConfig[couplingTrend];
    const CouplingIcon = coupling.icon;

    return (
        <div className="space-y-4">
            {/* Summary Narrative */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-[#111] border border-white/10 rounded-xl"
            >
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
                    Executive Summary
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                    {narrative}
                </p>
            </motion.div>

            {/* Risk Level & Coupling Trend */}
            <div className="grid grid-cols-2 gap-4">
                {/* Risk Level Card */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`p-4 ${risk.bg} border ${risk.border} rounded-xl`}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <RiskIcon className={`w-5 h-5 ${risk.color}`} />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Risk Level
                        </span>
                    </div>
                    <div className={`text-xl font-bold ${risk.color}`}>
                        {risk.label}
                    </div>
                </motion.div>

                {/* Coupling Trend Card */}
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="p-4 bg-[#111] border border-white/10 rounded-xl"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <CouplingIcon className={`w-5 h-5 ${coupling.color}`} />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Coupling Trend
                        </span>
                    </div>
                    <div className={`text-xl font-bold ${coupling.color}`}>
                        {coupling.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        Average change: {couplingChange >= 0 ? '+' : ''}{couplingChange.toFixed(1)} deps/module
                    </div>
                </motion.div>
            </div>

            {/* Module Centrality Changes */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 bg-[#111] border border-white/10 rounded-xl"
            >
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
                    Module Centrality Shifts
                </h3>

                <div className="space-y-3">
                    {/* Top Central Modules After */}
                    {topCentralModules.after.length > 0 && (
                        <div>
                            <div className="text-xs font-medium text-purple-400 mb-2">
                                Most Central Modules (After)
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {topCentralModules.after.map((module, idx) => {
                                    const isNew = topCentralModules.new.includes(module);
                                    return (
                                        <div
                                            key={idx}
                                            className={`px-2 py-1 rounded-md text-xs font-mono ${isNew
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                                }`}
                                        >
                                            {module.split('/').pop()}
                                            {isNew && ' ✨'}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Lost Centrality */}
                    {topCentralModules.lost.length > 0 && (
                        <div>
                            <div className="text-xs font-medium text-gray-500 mb-2">
                                Lost Centrality
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {topCentralModules.lost.map((module, idx) => (
                                    <div
                                        key={idx}
                                        className="px-2 py-1 rounded-md text-xs font-mono bg-gray-500/20 text-gray-400 border border-gray-500/30"
                                    >
                                        {module.split('/').pop()}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl"
                >
                    <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Recommendations
                    </h3>
                    <ul className="space-y-2">
                        {recommendations.map((rec, idx) => (
                            <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                                <span className="text-blue-400 mt-0.5">•</span>
                                <span>{rec}</span>
                            </li>
                        ))}
                    </ul>
                </motion.div>
            )}
        </div>
    );
}
