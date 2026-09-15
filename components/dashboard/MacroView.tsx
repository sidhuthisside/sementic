"use client";

import { motion } from "framer-motion";
import {
    Globe,
    Layers,
    GitBranch,
    AlertTriangle,
    Shield,
    Activity,
    Box,
    ArrowRight,
    CheckCircle,
    XCircle
} from "lucide-react";
import { AIAnalysisResult } from "@/lib/ai/AIClient";

interface MacroViewProps {
    data: AIAnalysisResult | null;
    fileTree: string[];
    repoName: string;
    onDirectorySelect: (dir: string) => void;
}

export default function MacroView({ data, fileTree, repoName, onDirectorySelect }: MacroViewProps) {
    // Extract top-level directories
    const topDirs = extractTopDirectories(fileTree);

    // Get architectural pattern info
    const architecturalPattern = data?.intent?.pattern || "Unknown";
    const patternConfidence = data?.intent?.confidence || 0;
    const driftLevel = data?.intent?.drift?.level || "minimal";

    // Get layer boundaries
    // Get layer boundaries - Normalize to prevent undefined access
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawBoundaries: any = data?.structural?.boundaries || {};
    const boundaries = {
        domain: Array.isArray(rawBoundaries?.domain) ? rawBoundaries.domain : [],
        infrastructure: Array.isArray(rawBoundaries?.infrastructure) ? rawBoundaries.infrastructure : [],
        external: Array.isArray(rawBoundaries?.external) ? rawBoundaries.external : [],
        violations: Array.isArray(rawBoundaries?.violations) ? rawBoundaries.violations : []
    };

    return (
        <div className="space-y-6">
            {/* System Overview Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/30 p-5"
            >
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">System Architecture Overview</h3>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            {data?.explanations?.macro || `The ${repoName} repository represents a software system with ${fileTree.length} files organized across ${topDirs.length} major subsystems. The architecture follows patterns commonly seen in modern applications.`}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Architectural Pattern & Drift */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Detected Pattern */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-700/30 rounded-xl border border-slate-600/50 p-4"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <Layers className="w-5 h-5 text-cyan-400" />
                        <h4 className="font-medium text-white">Architectural Pattern</h4>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            {architecturalPattern}
                        </span>
                        <span className="text-xs text-slate-400 bg-slate-600/50 px-2 py-1 rounded">
                            {patternConfidence}% confidence
                        </span>
                    </div>
                    {data?.intent?.evidence && data.intent.evidence.length > 0 && (
                        <div className="mt-3 text-xs text-slate-400">
                            <span className="text-slate-500">Evidence:</span>
                            <ul className="mt-1 space-y-1">
                                {data.intent.evidence.slice(0, 2).map((e: any, i: number) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <CheckCircle className="w-3 h-3 text-green-500" />
                                        {typeof e === 'string' ? e : String(e)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-slate-700/30 rounded-xl border border-slate-600/50 p-4 flex items-start gap-4"
                >
                    <div className="p-3 bg-indigo-500/20 rounded-lg">
                        <Activity className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">Architectural Intent</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-indigo-300 font-mono text-sm">{architecturalPattern}</span>
                            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                                {(patternConfidence * 100).toFixed(0)}% Conf.
                            </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                            <GitBranch className="w-3 h-3" />
                            <span>Drift Level: <span className={driftLevel === 'High' ? 'text-red-400' : driftLevel === 'Medium' ? 'text-yellow-400' : 'text-green-400'}>{driftLevel}</span></span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Layer Analysis */}
            <div className="space-y-4">
                <h4 className="text-xs uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Layer Boundaries
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Domain Layer */}
                    <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Box className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-medium text-emerald-300">Domain</span>
                            <span className="text-xs text-slate-500 ml-auto">{boundaries.domain.length}</span>
                        </div>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                            {boundaries.domain.length > 0 ? (
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                boundaries.domain.slice(0, 4).map((item: any, i: number) => (
                                    <div
                                        key={i}
                                        className="text-xs text-slate-400 truncate hover:text-emerald-300 cursor-pointer transition-colors"
                                        onClick={() => onDirectorySelect(item)}
                                    >
                                        {item}
                                    </div>
                                ))
                            ) : (
                                <div className="text-xs text-slate-500 italic">No domain layer detected</div>
                            )}
                        </div>
                    </div>

                    {/* Infrastructure Layer */}
                    <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Layers className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-medium text-blue-300">Infrastructure</span>
                            <span className="text-xs text-slate-500 ml-auto">{boundaries.infrastructure.length}</span>
                        </div>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                            {boundaries.infrastructure.length > 0 ? (
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                boundaries.infrastructure.slice(0, 4).map((item: any, i: number) => (
                                    <div
                                        key={i}
                                        className="text-xs text-slate-400 truncate hover:text-blue-300 cursor-pointer transition-colors"
                                        onClick={() => onDirectorySelect(item)}
                                    >
                                        {item}
                                    </div>
                                ))
                            ) : (
                                <div className="text-xs text-slate-500 italic">No infrastructure layer detected</div>
                            )}
                        </div>
                    </div>

                    {/* External Layer */}
                    <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Globe className="w-4 h-4 text-orange-400" />
                            <span className="text-sm font-medium text-orange-300">External</span>
                            <span className="text-xs text-slate-500 ml-auto">{boundaries.external.length}</span>
                        </div>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                            {boundaries.external.length > 0 ? (
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                boundaries.external.slice(0, 4).map((item: any, i: number) => (
                                    <div
                                        key={i}
                                        className="text-xs text-slate-400 truncate hover:text-orange-300 cursor-pointer transition-colors"
                                        onClick={() => onDirectorySelect(item)}
                                    >
                                        {item}
                                    </div>
                                ))
                            ) : (
                                <div className="text-xs text-slate-500 italic">No external layer detected</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Boundary Violations */}
                {boundaries.violations.length > 0 && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <span className="text-sm font-medium text-red-300">Boundary Violations</span>
                        </div>
                        <div className="space-y-1">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {boundaries.violations.slice(0, 3).map((v: any, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-red-300">
                                    <XCircle className="w-3 h-3" />
                                    {v}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Major Subsystems */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-slate-700/30 rounded-xl border border-slate-600/50 p-4"
            >
                <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                    <Box className="w-5 h-5 text-blue-400" />
                    Major Subsystems
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {topDirs.slice(0, 8).map((dir: any, i: number) => (
                        <motion.button
                            key={dir.name}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + i * 0.05 }}
                            onClick={() => onDirectorySelect(dir.name)}
                            className="bg-slate-800/50 hover:bg-slate-700/50 rounded-lg p-3 text-left transition-all group border border-transparent hover:border-blue-500/30"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-slate-200 group-hover:text-blue-300 transition-colors">
                                    {dir.name}
                                </span>
                                <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-blue-400 transition-colors" />
                            </div>
                            <div className="text-xs text-slate-500">
                                {dir.fileCount} files
                            </div>
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        </div >
    );
}

// Helper function to extract top-level directories
function extractTopDirectories(fileTree: string[]): { name: string; fileCount: number }[] {
    const dirCounts = new Map<string, number>();

    for (const file of fileTree) {
        if (typeof file !== 'string') continue;
        const parts = file.split('/').filter(p => p);
        if (parts.length > 0) {
            const topDir = parts[0];
            dirCounts.set(topDir, (dirCounts.get(topDir) || 0) + 1);
        }
    }

    return Array.from(dirCounts.entries())
        .map(([name, fileCount]) => ({ name, fileCount }))
        .sort((a, b) => b.fileCount - a.fileCount);
}
