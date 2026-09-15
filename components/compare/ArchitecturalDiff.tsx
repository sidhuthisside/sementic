"use client";

import { motion } from "framer-motion";
import { FileCode, Plus, Minus, ArrowRight, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import {
    ArchitecturalComparison,
    ModuleChange,
    DependencyChange,
    CouplingChange
} from "@/lib/analyzer/ArchitecturalComparator";

interface ArchitecturalDiffProps {
    comparison: ArchitecturalComparison;
    versionA: string;
    versionB: string;
    onModuleClick: (module: string) => void;
}

export default function ArchitecturalDiff({
    comparison,
    versionA,
    versionB,
    onModuleClick
}: ArchitecturalDiffProps) {

    const { moduleChanges, dependencyChanges, newCircularDependencies, couplingChanges } = comparison;

    // Group module changes by type
    const addedModules = moduleChanges.filter(m => m.type === 'added');
    const removedModules = moduleChanges.filter(m => m.type === 'removed');
    const renamedModules = moduleChanges.filter(m => m.type === 'renamed' || m.type === 'moved');

    // Group dependency changes
    const addedDeps = dependencyChanges.filter(d => d.type === 'added');
    const removedDeps = dependencyChanges.filter(d => d.type === 'removed');

    // Significant coupling changes
    const significantCoupling = couplingChanges.filter(c => c.isSignificant);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="p-4 bg-[#111] border border-white/10 rounded-xl">
                <h2 className="text-lg font-bold mb-2">Structural Changes</h2>
                <div className="flex items-center gap-4 text-sm">
                    <span className="text-cyan-400">{versionA}</span>
                    <ArrowRight className="w-4 h-4 text-gray-600" />
                    <span className="text-purple-400">{versionB}</span>
                </div>
            </div>

            {/* Module Changes Card */}
            <div className="p-4 bg-[#111] border border-white/10 rounded-xl">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FileCode className="w-4 h-4" />
                    Module Changes ({moduleChanges.length})
                </h3>

                <div className="space-y-3">
                    {/* Added Modules */}
                    {addedModules.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Plus className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium text-green-400">
                                    Added ({addedModules.length})
                                </span>
                            </div>
                            <div className="space-y-1 ml-6">
                                {addedModules.map((mod, idx) => (
                                    <ModuleItem
                                        key={idx}
                                        change={mod}
                                        color="green"
                                        onClick={onModuleClick}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Removed Modules */}
                    {removedModules.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Minus className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-medium text-red-400">
                                    Removed ({removedModules.length})
                                </span>
                            </div>
                            <div className="space-y-1 ml-6">
                                {removedModules.map((mod, idx) => (
                                    <ModuleItem
                                        key={idx}
                                        change={mod}
                                        color="red"
                                        onClick={onModuleClick}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Renamed/Moved Modules */}
                    {renamedModules.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <ArrowRight className="w-4 h-4 text-yellow-500" />
                                <span className="text-sm font-medium text-yellow-400">
                                    Renamed/Moved ({renamedModules.length})
                                </span>
                            </div>
                            <div className="space-y-1 ml-6">
                                {renamedModules.map((mod, idx) => (
                                    <div key={idx} className="text-xs text-gray-400">
                                        <span className="text-gray-500">{mod.oldPath}</span>
                                        {' → '}
                                        <span className="text-yellow-400">{mod.path}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {moduleChanges.length === 0 && (
                        <p className="text-xs text-gray-500">No module changes detected</p>
                    )}
                </div>
            </div>

            {/* Dependency Changes Card */}
            <div className="p-4 bg-[#111] border border-white/10 rounded-xl">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                    Dependency Changes ({dependencyChanges.length})
                </h3>

                <div className="space-y-3">
                    {addedDeps.length > 0 && (
                        <div>
                            <div className="text-sm font-medium text-green-400 mb-2">
                                Added ({addedDeps.length})
                            </div>
                            <div className="space-y-1">
                                {addedDeps.slice(0, 5).map((dep, idx) => (
                                    <DependencyItem key={idx} change={dep} color="green" />
                                ))}
                                {addedDeps.length > 5 && (
                                    <div className="text-xs text-gray-500">
                                        ...and {addedDeps.length - 5} more
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {removedDeps.length > 0 && (
                        <div>
                            <div className="text-sm font-medium text-red-400 mb-2">
                                Removed ({removedDeps.length})
                            </div>
                            <div className="space-y-1">
                                {removedDeps.slice(0, 5).map((dep, idx) => (
                                    <DependencyItem key={idx} change={dep} color="red" />
                                ))}
                                {removedDeps.length > 5 && (
                                    <div className="text-xs text-gray-500">
                                        ...and {removedDeps.length - 5} more
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {dependencyChanges.length === 0 && (
                        <p className="text-xs text-gray-500">No dependency changes detected</p>
                    )}
                </div>
            </div>

            {/* Risk Indicators Card */}
            <div className="space-y-3">
                {/* Circular Dependencies Warning */}
                {newCircularDependencies.length > 0 && (
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl"
                    >
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-orange-500 mb-2">
                                    New Circular Dependencies Detected ({newCircularDependencies.length})
                                </h4>
                                <div className="space-y-2">
                                    {newCircularDependencies.map((cycle, idx) => (
                                        <div key={idx} className="text-xs font-mono text-gray-300 bg-black/30 p-2 rounded">
                                            {cycle.join(' → ')}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Significant Coupling Changes */}
                {significantCoupling.length > 0 && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-yellow-500 mb-2">
                                    Significant Coupling Changes ({significantCoupling.length})
                                </h4>
                                <div className="space-y-1">
                                    {significantCoupling.slice(0, 3).map((change, idx) => (
                                        <CouplingItem key={idx} change={change} />
                                    ))}
                                    {significantCoupling.length > 3 && (
                                        <div className="text-xs text-gray-500 mt-2">
                                            ...and {significantCoupling.length - 3} more modules
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Risk Score Changes */}
                {comparison.riskChanges && comparison.riskChanges.length > 0 && (
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                    >
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-red-500 mb-2">
                                    Risk Score Increases ({comparison.riskChanges.length})
                                </h4>
                                <div className="space-y-2">
                                    {comparison.riskChanges.slice(0, 5).map((change, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs bg-black/30 p-2 rounded">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="w-3 h-3 text-red-500" />
                                                <span className="font-mono text-gray-300">{change.module.split('/').pop()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500">{change.oldScore} → {change.newScore}</span>
                                                <span className="text-red-400 font-bold">+{change.change}</span>
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${change.level === 'Critical' ? 'bg-red-500/20 text-red-400' :
                                                        change.level === 'High' ? 'bg-orange-500/20 text-orange-400' :
                                                            'bg-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                    {change.level}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {comparison.riskChanges.length > 5 && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            ...and {comparison.riskChanges.length - 5} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

// Helper Components
function ModuleItem({ change, color, onClick }: { change: ModuleChange, color: string, onClick: (path: string) => void }) {
    const basename = change.path.split('/').pop() || change.path;
    const colorClass = color === 'green' ? 'text-green-400' : color === 'red' ? 'text-red-400' : 'text-yellow-400';
    const significanceBadge = change.evidence.significance === 'high' ? '🔴' : change.evidence.significance === 'medium' ? '🟡' : '';

    return (
        <div
            className={`text-xs ${colorClass} flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded`}
            onClick={() => onClick(change.path)}
        >
            <FileCode className="w-3 h-3" />
            <span className="font-mono truncate flex-1">{basename}</span>
            {significanceBadge && <span>{significanceBadge}</span>}
        </div>
    );
}

function DependencyItem({ change, color }: { change: DependencyChange, color: string }) {
    const colorClass = color === 'green' ? 'text-green-400' : 'text-red-400';
    const sourceBasename = change.source.split('/').pop() || change.source;
    const targetBasename = change.target.split('/').pop() || change.target;

    return (
        <div className={`text-xs ${colorClass} font-mono flex items-center gap-2`}>
            <ArrowRight className="w-3 h-3" />
            <span className="truncate">{sourceBasename}</span>
            <span className="text-gray-600">→</span>
            <span className="truncate">{targetBasename}</span>
            {change.impact === 'high' && <span className="text-red-500">⚠️</span>}
        </div>
    );
}

function CouplingItem({ change }: { change: CouplingChange }) {
    const basename = change.module.split('/').pop() || change.module;
    const isIncrease = change.change > 0;

    return (
        <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
                {isIncrease ? (
                    <TrendingUp className="w-3 h-3 text-red-500" />
                ) : (
                    <TrendingDown className="w-3 h-3 text-green-500" />
                )}
                <span className="font-mono text-gray-300">{basename}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-gray-500">{change.oldDependencyCount} → {change.newDependencyCount}</span>
                <span className={isIncrease ? 'text-red-400' : 'text-green-400'}>
                    ({isIncrease ? '+' : ''}{change.change}, {change.changePercent.toFixed(0)}%)
                </span>
            </div>
        </div>
    );
}
