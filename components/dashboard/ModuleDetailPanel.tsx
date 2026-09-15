"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, ShieldAlert, Zap, Box, Layers, Code, FileText } from "lucide-react";
import { useMemo } from "react";

interface ModuleDetailPanelProps {
    node: any | null;
    graphData: any;
    onClose: () => void;
    onNodeSelect?: (nodeId: string) => void;
}

export default function ModuleDetailPanel({ node, graphData, onClose, onNodeSelect }: ModuleDetailPanelProps) {
    const details = useMemo(() => {
        if (!node || !graphData) return null;

        const dependencies = graphData.links
            .filter((l: any) => (typeof l.source === 'object' ? l.source.id : l.source) === node.id)
            .map((l: any) => typeof l.target === 'object' ? l.target : graphData.nodes.find((n: any) => n.id === l.target))
            .filter(Boolean);

        const dependents = graphData.links
            .filter((l: any) => (typeof l.target === 'object' ? l.target.id : l.target) === node.id)
            .map((l: any) => typeof l.source === 'object' ? l.source : graphData.nodes.find((n: any) => n.id === l.source))
            .filter(Boolean);

        const isDomain = node.id.includes('domain') || node.id.includes('model') || node.id.includes('entity');
        const isInfra = node.id.includes('infra') || node.id.includes('db') || node.id.includes('api');
        const isUtil = node.id.includes('util') || node.id.includes('common');

        const boundary = isDomain ? 'Domain Layer' : isInfra ? 'Infrastructure Layer' : isUtil ? 'Shared Utility' : 'Application Layer';

        const risk = {
            highFanIn: dependents.length > 5,
            highFanOut: dependencies.length > 5,
            circular: false // Placeholder for complex calc
        };

        return { dependencies, dependents, boundary, risk };
    }, [node, graphData]);

    if (!node) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-20 right-4 w-96 max-h-[calc(100vh-6rem)] bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden backdrop-blur-xl"
            >
                {/* Header */}
                <div className="p-5 border-b border-white/5 bg-white/[0.02] flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            {node.group === 'folder' ? <Box className="w-4 h-4 text-blue-400" /> : <Code className="w-4 h-4 text-emerald-400" />}
                            <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">{node.group}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white break-all leading-tight">{node.name || node.id.split('/').pop()}</h3>
                        <p className="text-[10px] text-gray-500 font-mono mt-1 break-all opacity-60">{node.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                    {/* Boundary & Risk Badge */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                            <Layers className="w-5 h-5 text-purple-400" />
                            <div>
                                <span className="text-[10px] text-purple-400/60 font-black uppercase tracking-wider">Boundary Classification</span>
                                <p className="text-sm font-bold text-purple-200">{details?.boundary}</p>
                            </div>
                        </div>

                        {(details?.risk.highFanIn || details?.risk.highFanOut) && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                <ShieldAlert className="w-5 h-5 text-red-400" />
                                <div>
                                    <span className="text-[10px] text-red-400/60 font-black uppercase tracking-wider">Risk Indicators</span>
                                    <div className="flex gap-2 mt-1">
                                        {details.risk.highFanIn && <span className="px-2 py-0.5 rounded bg-red-500/20 text-[9px] font-bold text-red-300">High Fan-In ({details.dependents.length})</span>}
                                        {details.risk.highFanOut && <span className="px-2 py-0.5 rounded bg-orange-500/20 text-[9px] font-bold text-orange-300">High Fan-Out ({details.dependencies.length})</span>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1">
                            <span className="text-2xl font-black text-white">{details?.dependencies.length}</span>
                            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Dependencies</span>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1">
                            <span className="text-2xl font-black text-white">{details?.dependents.length}</span>
                            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Used By</span>
                        </div>
                    </div>

                    {/* Dependencies List */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <ArrowRight className="w-3 h-3" /> Outgoing Dependencies
                        </h4>
                        <div className="space-y-2">
                            {details?.dependencies.slice(0, 10).map((dep: any) => (
                                <div
                                    key={dep.id}
                                    onClick={() => onNodeSelect?.(dep.id)}
                                    className="p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors cursor-pointer flex items-center gap-2 group"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400" />
                                    <span className="text-xs text-gray-300 truncate font-mono">{dep.name || dep.id.split('/').pop()}</span>
                                </div>
                            ))}
                            {details && details.dependencies.length > 10 && (
                                <div className="text-[10px] text-gray-500 text-center italic py-1">
                                    + {details.dependencies.length - 10} more...
                                </div>
                            )}
                            {details?.dependencies.length === 0 && (
                                <div className="text-xs text-gray-600 italic px-2">No outgoing dependencies</div>
                            )}
                        </div>
                    </div>

                    {/* Dependents List */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <ArrowLeft className="w-3 h-3" /> Incoming Dependents
                        </h4>
                        <div className="space-y-2">
                            {details?.dependents.slice(0, 10).map((dep: any) => (
                                <div
                                    key={dep.id}
                                    onClick={() => onNodeSelect?.(dep.id)}
                                    className="p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-colors cursor-pointer flex items-center gap-2 group"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 group-hover:bg-blue-400" />
                                    <span className="text-xs text-gray-300 truncate font-mono">{dep.name || dep.id.split('/').pop()}</span>
                                </div>
                            ))}
                            {details && details.dependents.length > 10 && (
                                <div className="text-[10px] text-gray-500 text-center italic py-1">
                                    + {details.dependents.length - 10} more...
                                </div>
                            )}
                            {details?.dependents.length === 0 && (
                                <div className="text-xs text-gray-600 italic px-2">No incoming dependents</div>
                            )}
                        </div>
                    </div>

                </div>
            </motion.div>
        </AnimatePresence>
    );
}
