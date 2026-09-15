"use client";
import React, { useState, useMemo } from 'react';
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle,
    File,
    Target,
    Trash2,
    Move,
    Edit,
    Info,
    Zap,
    Sparkles,
    TrendingUp,
    ShieldAlert,
    Share2,
    Share,
    ChevronRight,
    Search,
    Clock,
    Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ImpactGraph from './ImpactGraph';

interface Node {
    id: string;
    name: string;
    group: string;
    distance?: number;
}

interface Link {
    source: string | any;
    target: string | any;
}

interface GraphData {
    nodes: Node[];
    links: Link[];
}

interface BlastRadiusViewProps {
    data: GraphData;
}

type SimulationType = 'modify' | 'delete' | 'move';

export default function BlastRadiusView({ data }: BlastRadiusViewProps) {
    const [selectedFile, setSelectedFile] = useState<string>('');
    const [simulationType, setSimulationType] = useState<SimulationType>('modify');

    // 1. Build Reverse Dependency Map (Who imports me?)
    const dependencyMap = useMemo(() => {
        const map = new Map<string, string[]>();
        if (!data || !data.links || !data.nodes) return map;

        const validFiles = new Set(
            data.nodes
                .filter(n => n.group !== 'folder' && !n.id.endsWith('/') && !n.id.endsWith('\\') && n.group !== 'unknown')
                .map(n => n.id)
        );

        data.links.forEach((link) => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;

            if (!sourceId || !targetId || !validFiles.has(sourceId) || !validFiles.has(targetId)) return;

            if (!map.has(targetId)) map.set(targetId, []);
            if (!map.get(targetId)?.includes(sourceId)) map.get(targetId)?.push(sourceId);
        });
        return map;
    }, [data]);

    // 2. Advanced Impact Analysis
    const impactAnalysis = useMemo(() => {
        if (!selectedFile) return null;

        const directDependents = dependencyMap.get(selectedFile) || [];
        const transitiveData = new Map<string, number>(); // file -> distance
        const queue: [string, number][] = directDependents.map(d => [d, 1]);

        while (queue.length > 0) {
            const [current, dist] = queue.shift()!;
            if (!transitiveData.has(current) && current !== selectedFile) {
                transitiveData.set(current, dist);
                const nextDeps = dependencyMap.get(current) || [];
                queue.push(...nextDeps.map(d => [d, dist + 1] as [string, number]));
            }
        }

        const totalDependents = transitiveData.size;
        const maxDepth = Math.max(0, ...Array.from(transitiveData.values()), 0);

        const simFactor = simulationType === 'delete' ? 1.5 : (simulationType === 'move' ? 1.2 : 1.0);
        const riskCoefficient = Math.min(100, Math.round((totalDependents * 5 + maxDepth * 10) * simFactor));

        let score: 'Low' | 'Medium' | 'High' = 'Low';
        let color = 'text-emerald-400';
        let borderColor = 'border-emerald-500/30';

        if (riskCoefficient > 70) {
            score = 'High';
            color = 'text-rose-400';
            borderColor = 'border-rose-500/30';
        } else if (riskCoefficient > 30) {
            score = 'Medium';
            color = 'text-amber-400';
            borderColor = 'border-amber-500/30';
        }

        const graphNodes = [
            { id: selectedFile, name: selectedFile.split('/').pop() || '', distance: 0 },
            ...Array.from(transitiveData.entries()).map(([id, dist]) => ({
                id,
                name: id.split('/').pop() || '',
                distance: dist
            }))
        ];

        const graphLinks = Array.from(transitiveData.keys()).flatMap(target => {
            const sources = (dependencyMap.get(target) || []).filter(s => transitiveData.has(s) || s === selectedFile);
            return sources.map(source => ({ source, target }));
        });

        let recommendation: string | null = null;
        if (riskCoefficient > 70) {
            // Recommendation Logic
            if (directDependents.length > 5) {
                recommendation = "High coupling detected: Refactor into smaller modules";
            } else if (totalDependents > 15) {
                recommendation = "Deep cascade risk: Introduce interface abstraction";
            } else {
                recommendation = "Structural fragility: Break dependency chains";
            }
        } else if (riskCoefficient > 30) {
            recommendation = "Moderate impact: Safe to proceed with caution";
        } else {
            recommendation = "Low impact: minimal structural risk";
        }

        return {
            score, color, borderColor,
            riskCoefficient,
            maxDepth,
            directCount: directDependents.length,
            indirectCount: totalDependents - directDependents.length,
            directFiles: directDependents,
            indirectFiles: Array.from(transitiveData.keys()).filter(f => !directDependents.includes(f)),
            graphNodes,
            graphLinks,
            recommendation
        };
    }, [selectedFile, dependencyMap, simulationType]);

    const sortedFiles = useMemo(() => {
        if (!data || !data.nodes) return [];
        return [...data.nodes]
            .filter(node => node.group !== 'folder' && !node.id.endsWith('/') && !node.id.endsWith('\\'))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [data.nodes]);

    return (
        <div className="h-full w-full p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar bg-[#020502]">
            {/* Dossier Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-1"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <Share2 className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            Architectural Dossier <span className="text-emerald-500/40 font-mono text-sm ml-2">v3.0</span>
                        </h2>
                        <p className="text-[10px] text-emerald-500/40 uppercase font-black tracking-[0.3em]">
                            Hierarchical Impact Tree // Structural Integrity Scan
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Simulation Controls */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8 bg-[#050505] border border-white/5 p-5 rounded-3xl flex flex-col gap-4 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[0.5px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 flex flex-col gap-2">
                            <label className="text-[9px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2 px-1">
                                <File className="w-3 h-3" />
                                Root Asset ID
                            </label>
                            <select
                                className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-xs text-white font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all cursor-pointer hover:border-white/20"
                                value={selectedFile}
                                onChange={(e) => setSelectedFile(e.target.value)}
                            >
                                <option value="">SELECT ROOT TARGET...</option>
                                {sortedFiles.map(node => (
                                    <option key={node.id} value={node.id}>{node.id}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1 flex flex-col gap-2">
                            <label className="text-[9px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2 px-1">
                                <Zap className="w-3 h-3" />
                                Structural Impact Mode
                            </label>
                            <div className="flex bg-black p-1 rounded-2xl border border-white/10">
                                {(['modify', 'move', 'delete'] as SimulationType[]).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setSimulationType(type)}
                                        className={`flex-1 px-3 py-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-2
                                            ${simulationType === type
                                                ? 'bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]'
                                                : 'text-gray-600 hover:text-gray-400'}`}
                                    >
                                        <span className="capitalize">{type}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-4 grid grid-cols-2 gap-4">
                    <div className="bg-[#050505] border border-white/5 p-4 rounded-3xl flex flex-col items-center justify-center gap-1 shadow-xl group hover:border-emerald-500/20 transition-all">
                        <TrendingUp className="w-4 h-4 text-emerald-500/30 mb-1 group-hover:text-emerald-500 transition-colors" />
                        <span className="text-[8px] text-gray-600 uppercase font-black tracking-tighter">Cascade Depth</span>
                        <span className="text-xl font-black text-white font-mono">{impactAnalysis?.maxDepth || 0}</span>
                    </div>
                    <div className="bg-[#050505] border border-white/5 p-4 rounded-3xl flex flex-col items-center justify-center gap-1 shadow-xl group hover:border-rose-500/20 transition-all">
                        <ShieldAlert className="w-4 h-4 text-rose-500/30 mb-1 group-hover:text-rose-500 transition-colors" />
                        <span className="text-[8px] text-gray-600 uppercase font-black tracking-tighter">System Fragility</span>
                        <span className="text-xl font-black text-rose-500 font-mono">{impactAnalysis?.riskCoefficient || 0}%</span>
                    </div>
                </div>
            </div>

            {/* Tree Workspace */}
            <AnimatePresence mode="wait">
                {selectedFile && impactAnalysis ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col gap-6 pb-12"
                    >
                        {/* 3D Graph Container */}
                        <div className="relative rounded-[2.5rem] overflow-hidden border border-white/5 shadow-3xl bg-[#030303] h-[70vh] min-h-[600px] shrink-0">
                            <div className="absolute inset-0 z-0">
                                <ImpactGraph
                                    nodes={impactAnalysis.graphNodes}
                                    links={impactAnalysis.graphLinks}
                                    selectedFile={selectedFile}
                                    simulationType={simulationType}
                                />
                            </div>

                            {/* Top Left: Simulation Label Only */}
                            <div className="absolute top-6 left-6 z-10 flex flex-col gap-4 pointer-events-none">
                                <div className="pointer-events-auto">
                                    <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] border ${impactAnalysis.borderColor} bg-black/80 ${impactAnalysis.color} backdrop-blur-md shadow-2xl inline-flex items-center gap-2 mb-2`}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                        TREE_ANALYSIS_{simulationType.toUpperCase()}
                                    </div>
                                </div>
                            </div>

                            {/* Right Floating Panel - Stats & AI Insights */}
                            <div className="absolute top-6 right-6 z-10 w-80 pointer-events-none flex flex-col gap-4">
                                {/* Risk Score Card */}
                                <div className={`p-6 rounded-3xl border ${impactAnalysis.borderColor} bg-black/80 backdrop-blur-xl shadow-2xl pointer-events-auto flex flex-col gap-4`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Risk Score</span>
                                            <span className={`text-4xl font-black ${impactAnalysis.color}`}>{impactAnalysis.score}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold block">Fragility</span>
                                            <span className="text-xl font-mono font-bold text-white">{impactAnalysis.riskCoefficient}%</span>
                                        </div>
                                    </div>

                                    <div className="h-px bg-white/10 w-full" />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold block mb-1">Depth</span>
                                            <span className="text-lg font-mono font-bold text-white flex items-center gap-2">
                                                <Layers className="w-4 h-4 text-emerald-500" /> {impactAnalysis.maxDepth}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold block mb-1">Total Nodes</span>
                                            <span className="text-lg font-mono font-bold text-white flex items-center gap-2">
                                                <Target className="w-4 h-4 text-blue-500" /> {impactAnalysis.directCount + impactAnalysis.indirectCount}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Recommendation (Moved here) */}
                                {impactAnalysis.recommendation && (
                                    <div className="p-4 rounded-xl bg-black/80 border border-orange-500/30 backdrop-blur-xl shadow-2xl flex items-start gap-3 pointer-events-auto">
                                        <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase text-orange-400/80 tracking-wider">AI Insight</span>
                                            <span className="text-sm font-bold text-orange-100 leading-snug">{impactAnalysis.recommendation}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bottom Stats Section - Detailed File Lists */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 pointer-events-auto">
                            {/* Column 1: Direct Dependencies */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                                    <Zap className="w-4 h-4 text-rose-500" />
                                    <div className="flex flex-col leading-none">
                                        <span className="text-[9px] font-black uppercase text-rose-500/60 tracking-wider">Direct Impact Zone</span>
                                        <span className="text-sm font-bold text-white">{impactAnalysis.directCount} Assets</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                                    {impactAnalysis.directFiles.length > 0 ? (
                                        impactAnalysis.directFiles.map((file) => (
                                            <div key={file} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-rose-500/30 transition-all group">
                                                <div className="w-1.5 h-1.5 rounded-sm bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                                <span className="text-xs font-mono text-gray-300 group-hover:text-white truncate flex-1" title={file}>
                                                    {file}
                                                </span>
                                                <ChevronRight className="w-3 h-3 text-white/20 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-xs text-white/20 italic">No direct dependencies detected.</div>
                                    )}
                                </div>
                            </div>

                            {/* Column 2: Indirect Dependencies */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                                    <Share2 className="w-4 h-4 text-indigo-400" />
                                    <div className="flex flex-col leading-none">
                                        <span className="text-[9px] font-black uppercase text-indigo-400/60 tracking-wider">Indirect Cascade Zone</span>
                                        <span className="text-sm font-bold text-white">{impactAnalysis.indirectCount} Cascade Nodes</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                                    {impactAnalysis.indirectFiles.length > 0 ? (
                                        impactAnalysis.indirectFiles.map((file) => (
                                            <div key={file} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all group">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
                                                <span className="text-xs font-mono text-gray-300 group-hover:text-white truncate flex-1" title={file}>
                                                    {file}
                                                </span>
                                                <div className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] font-bold text-white/40">
                                                    L{impactAnalysis.maxDepth}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-xs text-white/20 italic">No indirect dependencies detected.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 flex flex-col items-center justify-center text-gray-800 gap-8 py-20"
                    >
                        <div className="relative group">
                            <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full scale-150 animate-pulse" />
                            <Share2 className="w-24 h-24 text-emerald-500/10 animate-pulse group-hover:text-emerald-500/20 transition-colors" />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <p className="text-[10px] font-black tracking-[0.4em] uppercase text-emerald-500/30">Dossier Offline</p>
                            <p className="text-[9px] text-gray-600 uppercase font-bold tracking-widest">Select a root target to generate the impact tree</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
