"use client";

import { motion } from "framer-motion";
import {
    Activity,
    Box,
    Cpu,
    Network,
    Shield,
    Target,
    Zap,
    Layers,
    GitBranch,
    ShieldAlert,
    FileText,
    ExternalLink,
    ScanFace,
    CheckCircle2,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Download
} from "lucide-react";
import { AIAnalysisResult } from "@/lib/ai/AIClient";
import { useState, useEffect } from "react";



interface ArchitectureOverviewProps {
    data: AIAnalysisResult;
    repoContext?: { fileTree: string[], repoName: string };
}

export default function ArchitectureOverview({ data, repoContext }: ArchitectureOverviewProps) {
    const [explanationLevel, setExplanationLevel] = useState<'macro' | 'meso' | 'micro'>('macro');
    const [expandedClaim, setExpandedClaim] = useState<number | null>(null);
    const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
    const [graphDimensions, setGraphDimensions] = useState({ width: 600, height: 400 });

    useEffect(() => {
        const update = () => {
            const w = window.innerWidth;
            // Rough responsiveness: Full width on mobile, half width on desktop (grid cols 2)
            setGraphDimensions({
                width: w < 768 ? w - 48 : (w > 1280 ? 550 : w / 2 - 60),
                height: 400
            });
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    const renderSafe = (val: any): string => {
        if (typeof val === 'string') return val;
        if (typeof val === 'number') return val.toString();
        if (val && typeof val === 'object') {
            if (val.source && val.target) {
                return `${val.source} -> ${val.target}${val.type ? ` (${val.type})` : ''}`;
            }
            try { return JSON.stringify(val); } catch { return "[Object]"; }
        }
        return String(val || "");
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-6xl mx-auto space-y-8"
        >
            {/* Header Section */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                        Architectural Overview
                    </h1>
                    <p className="text-gray-400 mt-2 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        System intelligence for <span className="text-white font-mono">{repoContext?.repoName || "Repository"}</span>
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Complexity</div>
                        <div className="text-xl font-bold text-white">{(data.metrics.complexity || 0).toFixed(2)}</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Health</div>
                        <div className="text-xl font-bold text-emerald-400">{(data.metrics.maintainability || 0).toFixed(2)}%</div>
                    </div>
                </div>
            </motion.div>

            {/* Core Pattern Recognition - Full Width */}
            <motion.div variants={itemVariants}>
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl -mr-16 -mt-16 group-hover:bg-cyan-500/20 transition-all duration-700" />
                    <div className="relative z-10">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400 mb-4 flex items-center gap-2">
                            <Target className="w-4 h-4" /> Core Pattern Recognition
                        </h3>
                        <div className="text-3xl font-bold text-white mb-2">{data.intent?.pattern}</div>
                        <div className="flex items-center gap-6 mt-4">
                            <div>
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Confidence</div>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-cyan-400"
                                            style={{ width: `${data.intent?.confidence}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-bold">{(data.intent?.confidence || 0).toFixed(2)}%</span>
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Architecture Drift</div>
                                <div className={`text-sm font-bold px-2 py-0.5 rounded leading-none ${data.intent?.drift?.level === 'Low' ? 'bg-green-500/20 text-green-400' :
                                    data.intent?.drift?.level === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {data.intent?.drift?.level}
                                </div>
                            </div>
                        </div>
                        <p className="mt-4 text-base text-gray-400 leading-relaxed">
                            {data.intent?.drift?.explanation}
                        </p>

                        {/* Confidence & Limitations - Integrated Here */}
                        {data.confidenceAnalysis && data.confidenceAnalysis.claims && data.confidenceAnalysis.claims.length > 0 && (() => {
                            // Helper function to get confidence level metadata
                            const getConfidenceLevel = (score: number) => {
                                if (score >= 80) return {
                                    label: 'High',
                                    color: 'emerald',
                                    bgClass: 'bg-emerald-500/20',
                                    textClass: 'text-emerald-400',
                                    barClass: 'bg-emerald-400',
                                    icon: '✓'
                                };
                                if (score >= 50) return {
                                    label: 'Medium',
                                    color: 'yellow',
                                    bgClass: 'bg-yellow-500/20',
                                    textClass: 'text-yellow-400',
                                    barClass: 'bg-yellow-400',
                                    icon: '~'
                                };
                                return {
                                    label: 'Low',
                                    color: 'red',
                                    bgClass: 'bg-red-500/20',
                                    textClass: 'text-red-400',
                                    barClass: 'bg-red-400',
                                    icon: '!'
                                };
                            };

                            const overallLevel = getConfidenceLevel(data.confidenceAnalysis?.overallConfidence || 0);

                            // Export functions
                            const exportAsJSON = () => {
                                const exportData = {
                                    timestamp: new Date().toISOString(),
                                    repository: repoContext?.repoName || 'Unknown',
                                    confidenceAnalysis: data.confidenceAnalysis
                                };
                                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `confidence-report-${repoContext?.repoName?.replace(/\//g, '-') || 'export'}.json`;
                                a.click();
                                URL.revokeObjectURL(url);
                            };

                            const exportAsMarkdown = () => {
                                const md = `# Confidence Analysis Report\n\n**Repository:** ${repoContext?.repoName || 'Unknown'}\n**Date:** ${new Date().toLocaleString()}\n**Overall Confidence:** ${data.confidenceAnalysis?.overallConfidence}% (${overallLevel.label})\n\n---\n\n## Architectural Claims\n\n${data.confidenceAnalysis?.claims.map((claim: any, idx: number) => {
                                    const level = getConfidenceLevel(claim.confidence);
                                    return `### ${idx + 1}. ${claim.claim}\n\n- **Category:** ${claim.category}\n- **Confidence:** ${claim.confidence}% (${level.label} ${level.icon})\n\n**Why This Confidence?**\n${claim.explanation}\n\n**When This Might Fail:**\n${claim.limitationScenario}\n\n**Evidence:**\n${claim.evidence.map((e: string) => `- ${e}`).join('\n')}\n\n---\n`;
                                }).join('\n')}`;

                                const blob = new Blob([md], { type: 'text/markdown' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `confidence-report-${repoContext?.repoName?.replace(/\//g, '-') || 'export'}.md`;
                                a.click();
                                URL.revokeObjectURL(url);
                            };

                            return (
                                <div className="mt-6 pt-6 border-t border-white/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                                            <Shield className="w-4 h-4" /> Confidence & Limitations
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${overallLevel.bgClass} ${overallLevel.textClass}`}>
                                                {overallLevel.icon} {overallLevel.label}
                                            </span>
                                            <div className="text-xs text-gray-500">
                                                <span className="text-indigo-400 font-bold">{data.confidenceAnalysis.overallConfidence}%</span>
                                            </div>
                                            {/* Export Button */}
                                            <div className="relative">
                                                <button
                                                    onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                                                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                                                    title="Export Report"
                                                >
                                                    <Download className="w-3.5 h-3.5 text-gray-400" />
                                                </button>
                                                {/* Dropdown Menu */}
                                                {exportDropdownOpen && (
                                                    <div className="absolute right-0 mt-1 w-32 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-10">
                                                        <button
                                                            onClick={() => {
                                                                exportAsJSON();
                                                                setExportDropdownOpen(false);
                                                            }}
                                                            className="w-full px-3 py-2 text-left text-[10px] text-gray-300 hover:bg-white/5 rounded-t-lg transition-colors"
                                                        >
                                                            Export as JSON
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                exportAsMarkdown();
                                                                setExportDropdownOpen(false);
                                                            }}
                                                            className="w-full px-3 py-2 text-left text-[10px] text-gray-300 hover:bg-white/5 rounded-b-lg transition-colors"
                                                        >
                                                            Export as Markdown
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {data.confidenceAnalysis.claims.map((claim: any, idx: number) => {
                                            const isExpanded = expandedClaim === idx;
                                            const level = getConfidenceLevel(claim.confidence);

                                            return (
                                                <div key={idx} className="bg-white/[0.03] border border-white/5 rounded-lg overflow-hidden hover:border-white/10 transition-colors">
                                                    {/* Claim Header */}
                                                    <div className="p-3">
                                                        <div className="flex items-start justify-between gap-3 mb-2">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${claim.category === 'pattern' ? 'bg-purple-500/20 text-purple-400' :
                                                                        claim.category === 'dependency' ? 'bg-cyan-500/20 text-cyan-400' :
                                                                            claim.category === 'boundary' ? 'bg-pink-500/20 text-pink-400' :
                                                                                'bg-gray-500/20 text-gray-400'
                                                                        }`}>
                                                                        {claim.category}
                                                                    </span>
                                                                </div>
                                                                <h5 className="text-sm font-medium text-white leading-relaxed">{claim.claim}</h5>
                                                            </div>
                                                            <button
                                                                onClick={() => setExpandedClaim(isExpanded ? null : idx)}
                                                                className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
                                                            >
                                                                {isExpanded ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
                                                            </button>
                                                        </div>

                                                        {/* Confidence Bar */}
                                                        <div className="space-y-1">
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="text-gray-500 font-medium">Confidence</span>
                                                                <span className={`font-bold ${level.textClass}`}>{claim.confidence}%</span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full ${level.barClass} transition-all duration-500`}
                                                                    style={{ width: `${claim.confidence}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Expanded Details */}
                                                    {isExpanded && (
                                                        <div className="border-t border-white/5 bg-white/[0.01]">
                                                            {/* Explanation */}
                                                            <div className="p-3 border-b border-white/5">
                                                                <div className="text-xs uppercase font-bold text-gray-500 mb-2 flex items-center gap-1.5">
                                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Why This Confidence?
                                                                </div>
                                                                <p className="text-sm text-gray-300 leading-relaxed">
                                                                    {claim.explanation}
                                                                </p>
                                                            </div>

                                                            {/* Limitation Scenario */}
                                                            <div className="p-3 bg-orange-500/5">
                                                                <div className="text-xs uppercase font-bold text-orange-400 mb-2 flex items-center gap-1.5">
                                                                    <AlertTriangle className="w-3.5 h-3.5" /> When This Might Fail
                                                                </div>
                                                                <p className="text-sm text-gray-300 leading-relaxed">
                                                                    {claim.limitationScenario}
                                                                </p>
                                                            </div>

                                                            {/* Evidence */}
                                                            {claim.evidence && claim.evidence.length > 0 && (
                                                                <div className="p-3 border-t border-white/5">
                                                                    <div className="text-xs uppercase font-bold text-gray-500 mb-2">Evidence</div>
                                                                    <div className="space-y-0.5">
                                                                        {claim.evidence.map((ev: string, i: number) => (
                                                                            <div key={i} className="text-sm text-gray-400 font-mono flex items-start gap-2">
                                                                                <div className="w-0.5 h-0.5 rounded-full bg-gray-500 mt-1.5 flex-shrink-0" />
                                                                                <span className="flex-1">{ev}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )
                        })()}
                    </div>
                </div>
            </motion.div>

            {/* Impact Radius - Separate Section */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Blast Radius Card */}
                <div className="bg-gradient-to-br from-orange-500/5 to-red-500/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-noise opacity-5" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldAlert className={`w-10 h-10 ${data.impact?.blastRadius === 'High' ? 'text-red-500' : 'text-orange-500'
                                }`} />
                            <div>
                                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Impact Radius</div>
                                <div className="text-2xl font-bold text-white uppercase tracking-tight">{data.impact?.blastRadius}</div>
                            </div>
                        </div>
                        <div className="text-xs text-orange-400/80 font-medium">
                            {data.impact?.tightlyCoupled?.length || 0} critical coupling{(data.impact?.tightlyCoupled?.length || 0) !== 1 ? 's' : ''} detected
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* AI Semantic Insights Panel */}
            {data.insights && data.insights.length > 0 && (
                <motion.div variants={itemVariants} className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <Zap className="w-3 h-3 text-yellow-400" /> Semantic Insights
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.insights.map((insight, idx) => (
                            <div key={idx} className={`p-4 rounded-xl border ${insight.severity === 'high' ? 'bg-red-500/5 border-red-500/20' :
                                insight.severity === 'medium' ? 'bg-yellow-500/5 border-yellow-500/20' :
                                    'bg-blue-500/5 border-blue-500/20'
                                }`}>
                                <div className="flex items-start justify-between mb-2">
                                    <h4 className={`text-sm font-bold ${insight.severity === 'high' ? 'text-red-400' :
                                        insight.severity === 'medium' ? 'text-yellow-400' :
                                            'text-blue-400'
                                        }`}>{insight.title}</h4>
                                    <span className="text-[10px] uppercase font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                                        {insight.type}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-300 leading-relaxed mb-3">
                                    {insight.description}
                                </p>
                                {insight.evidence && insight.evidence.length > 0 && (
                                    <div className="space-y-1">
                                        <div className="text-[10px] text-gray-500 uppercase font-bold">Evidence Trace</div>
                                        {insight.evidence.map((ev, i) => (
                                            <div key={i} className="text-[10px] text-gray-400 font-mono flex items-center gap-2">
                                                <div className="w-1 h-1 rounded-full bg-gray-500" />
                                                {ev}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Explanations Section */}
            <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <GitBranch className="w-3 h-3 text-purple-400" /> Semantic Explanation
                    </h3>
                    <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
                        {(['macro', 'meso', 'micro'] as const).map(level => (
                            <button
                                key={level}
                                onClick={() => setExplanationLevel(level)}
                                className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded-full transition-all ${explanationLevel === level
                                    ? 'bg-purple-500 text-white shadow-lg'
                                    : 'text-gray-500 hover:text-white'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl min-h-[120px]">
                    <motion.p
                        key={explanationLevel}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-gray-300 leading-relaxed text-sm lg:text-base font-light"
                    >
                        {data.explanations?.[explanationLevel] || "No explanation available for this scale."}
                    </motion.p>
                </div>
            </motion.div>

            {/* Structural Analysis Summary */}
            <motion.div variants={itemVariants} className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Box className="w-3 h-3 text-cyan-400" /> Structural Analysis
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#0D0D0D] border border-white/10 p-4 rounded-xl relative overflow-hidden group hover:border-emerald-500/20 transition-colors">
                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Circular Dependencies</div>
                        <div className="text-2xl font-bold text-emerald-400">
                            {data.structural?.circularDependencies?.length || 0}
                        </div>
                        {(!data.structural?.circularDependencies || data.structural.circularDependencies.length === 0) && (
                            <div className="text-[10px] text-emerald-500/80 mt-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Clean
                            </div>
                        )}
                    </div>
                    <div className="bg-[#0D0D0D] border border-white/10 p-4 rounded-xl hover:border-purple-500/20 transition-colors">
                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Cross-Cutting Concerns</div>
                        <div className="text-2xl font-bold text-purple-400">
                            {(data.structural?.crossCuttingConcerns?.authentication?.length || 0) +
                                (data.structural?.crossCuttingConcerns?.logging?.length || 0) +
                                (data.structural?.crossCuttingConcerns?.stateManagement?.length || 0) +
                                (data.structural?.crossCuttingConcerns?.errorHandling?.length || 0) +
                                (data.structural?.crossCuttingConcerns?.other?.length || 0)}
                        </div>
                    </div>
                    <div className="bg-[#0D0D0D] border border-white/10 p-4 rounded-xl hover:border-blue-500/20 transition-colors">
                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">High Fan-In</div>
                        <div className="text-2xl font-bold text-blue-400">
                            {data.structural?.highFanIn?.length || 0}
                        </div>
                    </div>
                    <div className="bg-[#0D0D0D] border border-white/10 p-4 rounded-xl hover:border-orange-500/20 transition-colors">
                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">High Fan-Out</div>
                        <div className="text-2xl font-bold text-orange-400">
                            {data.structural?.highFanOut?.length || 0}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Details Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Dependency Map */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <Network className="w-3 h-3 text-cyan-400" /> Dependency Framework
                    </h3>
                    <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl h-[400px] overflow-y-auto p-6 relative group custom-scrollbar">
                        <div className="space-y-4">
                            {data.structural?.graph?.nodes?.slice(0, 50).map((n: any, i: number) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                                    <div className={`w-2 h-2 rounded-full ${n.path?.includes('components') ? 'bg-purple-500' : n.path?.includes('api') ? 'bg-blue-500' : 'bg-gray-500'}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-white truncate">{n.path || n.id}</div>
                                        <div className="text-xs text-gray-500">{n.path?.includes('components') ? 'UI Component' : n.path?.includes('api') ? 'API Endpoint' : 'Module'}</div>
                                    </div>
                                </div>
                            ))}
                            {(!data.structural?.graph?.nodes || data.structural.graph.nodes.length === 0) && (
                                <div className="text-center text-gray-500 py-10">No dependency data available.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Boundaries */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <Shield className="w-3 h-3 text-pink-500" /> Architectural Boundaries
                    </h3>
                    <div className="space-y-3">
                        {/* Domain */}
                        <div className="flex items-start gap-4 bg-white/5 border border-white/10 p-4 rounded-xl">
                            <div className="mt-1 flex-shrink-0 bg-green-500/10 p-2 rounded-lg">
                                <Box className="w-4 h-4 text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold uppercase text-green-400 tracking-wider">Domain Logic</span>
                                    <span className="text-[10px] text-gray-500">{data.structural?.boundaries?.domain?.length || 0} Modules</span>
                                </div>
                                <p className="text-xs text-gray-400 truncate">
                                    {data.structural?.boundaries?.domain?.join(', ') || "No distinct domain boundary detected."}
                                </p>
                            </div>
                        </div>

                        {/* Infrastructure */}
                        <div className="flex items-start gap-4 bg-white/5 border border-white/10 p-4 rounded-xl">
                            <div className="mt-1 flex-shrink-0 bg-blue-500/10 p-2 rounded-lg">
                                <Layers className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold uppercase text-blue-400 tracking-wider">Infrastructure</span>
                                    <span className="text-[10px] text-gray-500">{data.structural?.boundaries?.infrastructure?.length || 0} Modules</span>
                                </div>
                                <p className="text-xs text-gray-400 truncate">
                                    {data.structural?.boundaries?.infrastructure?.join(', ') || "Generic infrastructure layer."}
                                </p>
                            </div>
                        </div>

                        {/* Violations */}
                        {data.structural?.boundaries?.violations && data.structural?.boundaries?.violations.length > 0 && (
                            <div className="mt-4 bg-red-500/5 border border-red-500/20 p-4 rounded-xl">
                                <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-widest mb-3">
                                    <ShieldAlert className="w-3 h-3" /> Boundary Violations
                                </div>
                                <div className="space-y-2">
                                    {data.structural?.boundaries?.violations.slice(0, 2).map((v, i) => (
                                        <div key={i} className="text-xs text-gray-400 bg-red-500/10 p-2 rounded-lg flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-red-500" />
                                            {renderSafe(v)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Cross-Cutting Concerns */}
            {data.structural?.crossCuttingConcerns && (
                <motion.div variants={itemVariants} className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <ScanFace className="w-3 h-3 text-indigo-400" /> Cross-Cutting Concerns
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/5 border border-white/10 p-6 rounded-2xl">
                        {[
                            { name: 'Authentication', count: data.structural.crossCuttingConcerns.authentication?.length || 0 },
                            { name: 'Logging', count: data.structural.crossCuttingConcerns.logging?.length || 0 },
                            { name: 'State Management', count: data.structural.crossCuttingConcerns.stateManagement?.length || 0 },
                            { name: 'Error Handling', count: data.structural.crossCuttingConcerns.errorHandling?.length || 0 }
                        ].map((concern, i) => (
                            <div key={i} className="bg-white/5 p-4 rounded-xl text-center border border-white/5">
                                <div className="text-2xl font-bold text-white mb-1">{concern.count}</div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-wider">{concern.name}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Pattern Detail Links */}
            {data.patterns && data.patterns.length > 0 && (
                <motion.div variants={itemVariants} className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <FileText className="w-3 h-3 text-emerald-400" /> Traceable Pattern Indicators
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.patterns.slice(0, 6).map((pattern, i) => (
                            <div key={i} className="bg-white/[0.03] border border-white/10 p-4 rounded-xl hover:bg-white/[0.05] transition-colors group">
                                <div className="flex items-start justify-between mb-2">
                                    <span className="text-sm font-bold text-white mb-1">{pattern.name}</span>
                                    <span className="text-[10px] text-emerald-400 font-mono">{(pattern.confidence || 0).toFixed(2)}%</span>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">
                                    {pattern.description}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {pattern.locations?.slice(0, 1).map((loc, j) => (
                                        <div key={j} className="text-[10px] text-gray-400 font-mono bg-white/5 px-2 py-0.5 rounded flex items-center gap-1">
                                            <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <span className="truncate max-w-[150px]">{loc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
