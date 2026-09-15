"use client";

import { motion } from "framer-motion";
import { CheckCircle, FileText, Code, Link2, ExternalLink } from "lucide-react";
import { AIAnalysisResult } from "@/lib/ai/AIClient";

interface EvidencePanelProps {
    data: AIAnalysisResult | null;
    repoName: string;
}

export default function EvidencePanel({ data, repoName }: EvidencePanelProps) {
    if (!data?.intent?.evidence && !data?.patterns) return null;

    const evidences = data?.intent?.evidence || [];
    const patterns = data.patterns || [];
    const violations = data.structural?.boundaries?.violations || [];

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 rounded-xl border border-indigo-500/20 p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-indigo-500/20 p-2 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Analysis Evidence</h3>
                        <p className="text-sm text-slate-400">Source-traceable facts backing architectural inferences</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Architectural Evidence */}
                    {evidences.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-400" />
                                Architectural Indicators
                            </h4>
                            <div className="grid gap-3">
                                {evidences.map((evidence, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5">
                                                <Code className="w-4 h-4 text-slate-500" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-slate-300">{typeof evidence === 'string' ? evidence : String(evidence)}</p>
                                                {/* If we had specific file links in the string, we could parse them here */}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pattern Evidence */}
                    {patterns.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                                <Link2 className="w-4 h-4 text-emerald-400" />
                                Pattern Locations
                            </h4>
                            <div className="grid gap-3">
                                {patterns.map((pattern, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + i * 0.05 }}
                                        className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-emerald-300 text-sm">{pattern.name}</span>
                                            <span className="text-xs text-slate-500">{pattern.confidence}% confidence</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mb-2">{pattern.description}</p>

                                        {pattern.locations && pattern.locations.length > 0 && (
                                            <div className="bg-slate-900/50 rounded border border-slate-800 p-2 max-h-32 overflow-y-auto custom-scrollbar">
                                                {pattern.locations.map((loc, j) => (
                                                    <div key={j} className="flex items-center gap-2 text-xs text-slate-300 py-1 border-b border-slate-800/50 last:border-0 hover:text-emerald-300 transition-colors cursor-pointer group">
                                                        <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-emerald-400" />
                                                        <span className="font-mono truncate">{loc}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
