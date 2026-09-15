"use client";

import { motion } from "framer-motion";
import { FileCode, ExternalLink, AlertCircle } from "lucide-react";
import { EvidencedChange, FileEvidence } from "@/lib/analyzer/EvidenceCollector";

interface EvidenceViewerProps {
    topChanges: EvidencedChange[];
    onFileClick: (filePath: string, lineNumber?: number) => void;
}

export default function EvidenceViewer({ topChanges, onFileClick }: EvidenceViewerProps) {

    if (topChanges.length === 0) {
        return (
            <div className="p-8 bg-[#111] border border-white/10 rounded-xl text-center">
                <p className="text-sm text-gray-500">No significant changes detected</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    Top {topChanges.length} Architectural Changes
                </h3>
            </div>

            {topChanges.map((change, idx) => (
                <ChangeCard
                    key={idx}
                    change={change}
                    onFileClick={onFileClick}
                />
            ))}
        </div>
    );
}

function ChangeCard({
    change,
    onFileClick
}: {
    change: EvidencedChange;
    onFileClick: (filePath: string, lineNumber?: number) => void;
}) {
    // Category color coding
    const categoryConfig = {
        module: { color: 'cyan', icon: '📦', label: 'Module' },
        dependency: { color: 'purple', icon: '🔗', label: 'Dependency' },
        coupling: { color: 'yellow', icon: '⚡', label: 'Coupling' },
        centrality: { color: 'blue', icon: '🎯', label: 'Centrality' },
        circular: { color: 'red', icon: '🔄', label: 'Circular Dependency' }
    };

    const config = categoryConfig[change.category];
    const colorClasses = {
        cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
        purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
        yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
        blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
        red: 'bg-red-500/10 border-red-500/30 text-red-400'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: change.rank * 0.1 }}
            className={`p-4 ${colorClasses[config.color as keyof typeof colorClasses]} border rounded-xl`}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                    <div className="text-2xl">{config.icon}</div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                #{change.rank} {config.label}
                            </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1">
                            {change.description}
                        </h4>
                        <p className="text-xs text-gray-400">
                            {change.impact}
                        </p>
                    </div>
                </div>
            </div>

            {/* Evidence List */}
            {change.evidence.length > 0 && (
                <div className="mt-3 space-y-2">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Evidence ({change.evidence.length})
                    </div>
                    {change.evidence.map((ev, evIdx) => (
                        <EvidenceItem
                            key={evIdx}
                            evidence={ev}
                            onClick={onFileClick}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
}

function EvidenceItem({
    evidence,
    onClick
}: {
    evidence: FileEvidence;
    onClick: (filePath: string, lineNumber?: number) => void;
}) {
    const basename = evidence.filePath.split('/').pop() || evidence.filePath;

    // Change type icon
    const changeIcon = {
        addition: '+',
        deletion: '-',
        modification: '~'
    };

    // Significance badge
    const significanceBadge = {
        high: '🔴',
        medium: '🟡',
        low: '⚪'
    };

    return (
        <div
            className="bg-black/20 p-2 rounded hover:bg-black/40 cursor-pointer transition-colors group"
            onClick={() => onClick(evidence.filePath, evidence.lineNumber)}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <FileCode className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        <span className="text-xs font-mono text-white truncate">
                            {basename}
                        </span>
                        {evidence.lineNumber && (
                            <span className="text-xs text-gray-600">
                                :{evidence.lineNumber}
                            </span>
                        )}
                        <ExternalLink className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex-shrink-0" />
                    </div>
                    {evidence.snippet && (
                        <div className="text-xs text-gray-400 font-mono mt-1 pl-5">
                            {evidence.snippet}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs text-gray-600">
                        {changeIcon[evidence.changeType]}
                    </span>
                    <span>
                        {significanceBadge[evidence.significance]}
                    </span>
                </div>
            </div>
        </div>
    );
}
