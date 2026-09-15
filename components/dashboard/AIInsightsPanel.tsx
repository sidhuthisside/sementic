"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Zap, Layers, GitBranch, Target, ShieldAlert, Cpu, Network, Box, Shield, MessageSquare, Layout } from "lucide-react";
import { AIAnalysisResult } from "@/lib/ai/AIClient";
import { useState } from "react";

import AIAssistantChat from "./AIAssistantChat";
import EvidencePanel from "./EvidencePanel";

export default function AIInsightsPanel({
    data,
    loading,
    repoContext,
    hideChat
}: {
    data: AIAnalysisResult | null,
    loading: boolean,
    repoContext?: { fileTree: string[], repoName: string },
    hideChat?: boolean
}) {
    const [explanationLevel, setExplanationLevel] = useState<'macro' | 'meso' | 'micro'>('macro');
    const [view, setView] = useState<'insights' | 'assistant'>('insights');
    const [showEvidence, setShowEvidence] = useState(false);

    // Safety helper for AI-generated content that might occasionally be objects instead of strings
    const renderSafe = (val: any): string => {
        if (typeof val === 'string') return val;
        if (typeof val === 'number') return val.toString();
        if (val && typeof val === 'object') {
            // Special handling for the detected {source, target, type} link object
            if (val.source && val.target) {
                return `${val.source} -> ${val.target}${val.type ? ` (${val.type})` : ''}`;
            }
            // Fallback for general objects
            try { return JSON.stringify(val); } catch { return "[Object]"; }
        }
        return String(val || "");
    };

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4 p-8 text-center text-gray-500">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-cyan-400/20 rounded-full animate-ping" />
                    <div className="absolute inset-0 border-4 border-cyan-400/50 rounded-full border-t-transparent animate-spin" />
                    <Cpu className="absolute inset-0 m-auto w-6 h-6 text-cyan-400 animate-pulse" />
                </div>
                <div>
                    <h3 className="text-white font-bold text-lg animate-pulse">Running Deep Architecture Analysis...</h3>
                    <p className="text-xs">Analyzing structural boundaries, inferring intent, and calculating blast radius.</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const crossCuttingCount = data.structural?.crossCuttingConcerns
        ? Object.values(data.structural.crossCuttingConcerns).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
        : 0;

    return (
        <div className="flex flex-col h-full bg-[#0A0A0A]">
            {/* View Toggle - Only show if chat is not hidden */}
            {!hideChat && (
                <div className="flex border-b border-white/10 shrink-0">
                    <button
                        onClick={() => setView('insights')}
                        className={`flex-1 py-3 text-[10px] font-bold tracking-widest flex items-center justify-center gap-2 transition-all ${view === 'insights' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-white/5' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Layout className="w-3 h-3" /> STRUCTURE
                    </button>
                    <button
                        onClick={() => setView('assistant')}
                        className={`flex-1 py-3 text-[10px] font-bold tracking-widest flex items-center justify-center gap-2 transition-all ${view === 'assistant' ? 'text-purple-400 border-b-2 border-purple-400 bg-white/5' : 'text-gray-500 hover:text-white'}`}
                    >
                        <MessageSquare className="w-3 h-3" /> AI CHAT
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-hidden relative">
                {view === 'insights' ? (
                    <div className="absolute inset-0 overflow-y-auto p-4 space-y-6 custom-scrollbar">


                        {/* Evidence Panel Toggle */}
                        <button
                            onClick={() => setShowEvidence(!showEvidence)}
                            className="w-full py-2 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 rounded-lg text-xs font-bold text-indigo-300 flex items-center justify-center gap-2 transition-colors"
                        >
                            {showEvidence ? "Hide Evidence" : "Show Traceable Evidence"}
                        </button>

                        {showEvidence && (
                            <EvidencePanel data={data} repoName={repoContext?.repoName || "Repository"} />
                        )}

                        {/* 2. Dependency Mapping */}
                        <section className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <Network className="w-3 h-3 text-cyan-400" /> Dependency Mapping
                            </h3>
                            <div className="bg-white/5 border border-white/10 p-3 rounded-lg">
                                <div className="text-xs text-gray-400 mb-2">Module Graph</div>
                                <div className="text-xs text-gray-300 font-mono leading-relaxed max-h-32 overflow-y-auto">
                                    {data.structural?.dependencyMapping?.moduleGraph || "No dependency graph available"}
                                </div>
                                {data.structural?.dependencyMapping?.directedRelationships?.length > 0 && (
                                    <div className="mt-3 space-y-1">
                                        <div className="text-xs text-gray-500">Key Relationships:</div>
                                        {data.structural?.dependencyMapping?.directedRelationships?.slice(0, 5).map((rel, i) => (
                                            <div key={i} className="text-xs text-cyan-400 font-mono">→ {renderSafe(rel)}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 3. Boundaries & Violations */}
                        <section className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <Shield className="w-3 h-3 text-pink-400" /> Architectural Boundaries
                            </h3>
                            <div className="space-y-2">
                                <div className="bg-green-500/10 border border-green-500/20 p-2 rounded">
                                    <div className="text-xs text-green-400 font-bold mb-1">Domain Logic ({data.structural?.boundaries?.domain?.length || 0})</div>
                                    <div className="text-xs text-gray-400 font-mono">
                                        {data.structural?.boundaries?.domain?.slice(0, 3).join(', ') || "None detected"}
                                    </div>
                                </div>
                                <div className="bg-blue-500/10 border border-blue-500/20 p-2 rounded">
                                    <div className="text-xs text-blue-400 font-bold mb-1">Infrastructure ({data.structural?.boundaries?.infrastructure?.length || 0})</div>
                                    <div className="text-xs text-gray-400 font-mono">
                                        {data.structural?.boundaries?.infrastructure?.slice(0, 3).join(', ') || "None detected"}
                                    </div>
                                </div>
                                <div className="bg-purple-500/10 border border-purple-500/20 p-2 rounded">
                                    <div className="text-xs text-purple-400 font-bold mb-1">External Integrations ({data.structural?.boundaries?.external?.length || 0})</div>
                                    <div className="text-xs text-gray-400 font-mono">
                                        {data.structural?.boundaries?.external?.slice(0, 3).join(', ') || "None detected"}
                                    </div>
                                </div>
                                {data.structural?.boundaries?.violations?.length > 0 && (
                                    <div className="bg-red-500/10 border border-red-500/20 p-2 rounded">
                                        <div className="text-xs text-red-400 font-bold mb-1">⚠️ Boundary Violations</div>
                                        <div className="text-xs text-red-300">
                                            {renderSafe(data.structural?.boundaries?.violations[0])}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 4. Cross-Cutting Concerns */}
                        <section className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <Box className="w-3 h-3 text-purple-400" /> Cross-Cutting Concerns
                            </h3>
                            {data.structural?.crossCuttingConcerns ? (
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-white/5 p-2 rounded">
                                        <div className="text-gray-500">Authentication</div>
                                        <div className="font-bold text-white">{(data.structural?.crossCuttingConcerns?.authentication || []).length}</div>
                                    </div>
                                    <div className="bg-white/5 p-2 rounded">
                                        <div className="text-gray-500">Logging</div>
                                        <div className="font-bold text-white">{(data.structural?.crossCuttingConcerns?.logging || []).length}</div>
                                    </div>
                                    <div className="bg-white/5 p-2 rounded">
                                        <div className="text-gray-500">State Management</div>
                                        <div className="font-bold text-white">{(data.structural?.crossCuttingConcerns?.stateManagement || []).length}</div>
                                    </div>
                                    <div className="bg-white/5 p-2 rounded">
                                        <div className="text-gray-500">Error Handling</div>
                                        <div className="font-bold text-white">{(data.structural?.crossCuttingConcerns?.errorHandling || []).length}</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-gray-500 italic">No cross-cutting concerns analyzed</div>
                            )}
                        </section>

                        {/* 5. Inferred Architectural Intent */}
                        <section className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <Target className="w-3 h-3 text-pink-400" /> Architectural Intent
                            </h3>
                            <div className="bg-white/5 border border-white/10 p-4 rounded-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 bg-white/10 rounded-bl-xl text-xs font-bold text-white">
                                    {data.intent?.confidence}% Conf.
                                </div>
                                <div className="text-sm text-gray-400 mb-1">Inferred Pattern</div>
                                <div className="text-xl font-bold text-pink-400 mb-2">{data.intent?.pattern}</div>

                                <div className="flex items-center gap-2 text-xs mb-3">
                                    <span className="text-gray-500">Drift Status:</span>
                                    <span className={`px-2 py-0.5 rounded font-bold uppercase ${data.intent?.drift?.level === 'Low' ? 'bg-green-500/20 text-green-400' :
                                        data.intent?.drift?.level === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-red-500/20 text-red-400'
                                        }`}>
                                        {data.intent?.drift?.level}
                                    </span>
                                </div>

                                {data.intent?.drift?.explanation && (
                                    <div className="text-xs text-gray-400 mb-2">
                                        {data.intent?.drift?.explanation}
                                    </div>
                                )}

                                {data.intent?.abstractionViolations?.length > 0 && (
                                    <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
                                        <div className="text-xs text-red-400 font-bold mb-1">Abstraction Violations:</div>
                                        <div className="text-xs text-red-300">{renderSafe(data.intent?.abstractionViolations[0])}</div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 6. Multi-Scalar Explanations */}
                        <section className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <GitBranch className="w-3 h-3 text-cyan-400" /> Semantic Explanation
                            </h3>

                            <div className="flex bg-white/5 rounded-lg p-1">
                                {(['macro', 'meso', 'micro'] as const).map(level => (
                                    <button
                                        key={level}
                                        onClick={() => setExplanationLevel(level)}
                                        className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${explanationLevel === level
                                            ? 'bg-cyan-400/20 text-cyan-400 shadow-sm'
                                            : 'text-gray-500 hover:text-white'
                                            }`}
                                    >
                                        {level.charAt(0).toUpperCase() + level.slice(1)}
                                    </button>
                                ))}
                            </div>

                            <motion.div
                                key={explanationLevel}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white/5 border border-white/10 p-3 rounded-lg text-sm text-gray-300 leading-relaxed max-h-40 overflow-y-auto"
                            >
                                {data.explanations?.[explanationLevel] || "No explanation available."}
                            </motion.div>
                        </section>

                        {/* 7. Impact / Blast Radius */}
                        <section className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <ShieldAlert className="w-3 h-3 text-orange-500" /> Impact Analysis
                            </h3>
                            <div className="flex items-center gap-4 bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl">
                                <div className="relative w-12 h-12 flex items-center justify-center">
                                    <Target className={`w-8 h-8 ${data.impact?.blastRadius === 'High' ? 'text-red-500' :
                                        data.impact?.blastRadius === 'Medium' ? 'text-orange-500' : 'text-green-500'
                                        }`} />
                                </div>
                                <div>
                                    <div className="text-xs text-orange-300 font-bold uppercase">Blast Radius</div>
                                    <div className="text-lg font-bold text-white">{data.impact?.blastRadius || "Unknown"}</div>
                                    <div className="text-xs text-gray-400">
                                        {data.impact?.tightlyCoupled?.length || 0} tightly coupled modules found
                                    </div>
                                    {data.impact?.changeRisk && (
                                        <div className="text-xs text-gray-500 mt-1">{data.impact?.changeRisk}</div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="absolute inset-0">
                        <AIAssistantChat analysisData={data} repoContext={repoContext} />
                    </div>
                )}
            </div>
        </div>
    );
}
