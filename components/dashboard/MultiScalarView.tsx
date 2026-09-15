"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, FolderTree, FileCode, ChevronRight } from "lucide-react";
import { AIAnalysisResult } from "@/lib/ai/AIClient";
import MacroView from "./MacroView";
import MesoView from "./MesoView";
import MicroView from "./MicroView";

type AbstractionLevel = "macro" | "meso" | "micro";

interface MultiScalarViewProps {
    data: AIAnalysisResult | null;
    fileTree: string[];
    keyFiles: Record<string, string>;
    repoName: string;
    loading?: boolean;
}

const LEVELS: { id: AbstractionLevel; label: string; icon: React.ReactNode; description: string }[] = [
    {
        id: "macro",
        label: "Macro",
        icon: <Layers className="w-4 h-4" />,
        description: "Overall system architecture"
    },
    {
        id: "meso",
        label: "Meso",
        icon: <FolderTree className="w-4 h-4" />,
        description: "Package & directory responsibilities"
    },
    {
        id: "micro",
        label: "Micro",
        icon: <FileCode className="w-4 h-4" />,
        description: "Individual file analysis"
    },
];

export default function MultiScalarView({
    data,
    fileTree,
    keyFiles,
    repoName,
    loading = false
}: MultiScalarViewProps) {
    const [activeLevel, setActiveLevel] = useState<AbstractionLevel>("macro");
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);

    const handleFileSelect = (file: string) => {
        setSelectedFile(file);
        setActiveLevel("micro");
    };

    const handleDirectorySelect = (dir: string) => {
        setSelectedDirectory(dir);
        setActiveLevel("meso");
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                        <Layers className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Multi-Scalar Analysis</h2>
                        <p className="text-sm text-slate-400">Loading abstraction levels...</p>
                    </div>
                </div>
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                        <Layers className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Multi-Scalar Semantic Explanations</h2>
                        <p className="text-sm text-slate-400">Understand the system at different abstraction levels</p>
                    </div>
                </div>

                {/* Abstraction Level Tabs */}
                <div className="flex gap-2 mt-4">
                    {LEVELS.map((level) => (
                        <button
                            key={level.id}
                            onClick={() => setActiveLevel(level.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${activeLevel === level.id
                                    ? "bg-purple-500/20 border border-purple-500/50 text-purple-300"
                                    : "bg-slate-700/30 border border-slate-600/30 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300"
                                }`}
                        >
                            {level.icon}
                            <span className="font-medium">{level.label}</span>
                            <ChevronRight className={`w-3 h-3 transition-transform ${activeLevel === level.id ? "rotate-90" : ""
                                }`} />
                        </button>
                    ))}
                </div>

                {/* Level Description */}
                <p className="text-xs text-slate-500 mt-2 ml-1">
                    {LEVELS.find(l => l.id === activeLevel)?.description}
                </p>
            </div>

            {/* Content */}
            <div className="p-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeLevel}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeLevel === "macro" && (
                            <MacroView
                                data={data}
                                fileTree={fileTree}
                                repoName={repoName}
                                onDirectorySelect={handleDirectorySelect}
                            />
                        )}
                        {activeLevel === "meso" && (
                            <MesoView
                                data={data}
                                fileTree={fileTree}
                                keyFiles={keyFiles}
                                selectedDirectory={selectedDirectory}
                                onFileSelect={handleFileSelect}
                                onDirectorySelect={setSelectedDirectory}
                            />
                        )}
                        {activeLevel === "micro" && (
                            <MicroView
                                data={data}
                                fileTree={fileTree}
                                keyFiles={keyFiles}
                                selectedFile={selectedFile}
                                onFileSelect={setSelectedFile}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Breadcrumb Navigation */}
            {(selectedDirectory || selectedFile) && (
                <div className="px-4 pb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-700/20 px-3 py-2 rounded-lg">
                        <button
                            onClick={() => { setActiveLevel("macro"); setSelectedDirectory(null); setSelectedFile(null); }}
                            className="hover:text-purple-400 transition-colors"
                        >
                            {repoName}
                        </button>
                        {selectedDirectory && (
                            <>
                                <ChevronRight className="w-3 h-3" />
                                <button
                                    onClick={() => { setActiveLevel("meso"); setSelectedFile(null); }}
                                    className="hover:text-purple-400 transition-colors"
                                >
                                    {selectedDirectory}
                                </button>
                            </>
                        )}
                        {selectedFile && (
                            <>
                                <ChevronRight className="w-3 h-3" />
                                <span className="text-purple-300">{selectedFile.split('/').pop()}</span>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
