"use client";

import React, { useState, useEffect } from 'react';
import { Bot, Code2, AlertTriangle, ArrowRight, Check, X, FileCode, Play, GitBranch, ShieldAlert, Cpu } from 'lucide-react';
import { AIAnalysisResult, RefactorPlan } from '@/lib/ai/AIClient';
import { motion, AnimatePresence } from 'framer-motion';

interface RefactorEngineProps {
    files?: string[];
    aiData: AIAnalysisResult | null;
    repoContext?: { fileTree: string[], repoName: string };
}

export default function RefactorEngine({ aiData, repoContext }: RefactorEngineProps) {
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState<RefactorPlan | null>(null);
    const [activeTab, setActiveTab] = useState<'diff' | 'explanation'>('diff');

    // Extract issues from AI analysis data
    const issues = aiData?.issues?.map((issue: any) => ({
        id: issue.id,
        // Try multiple variations of file path property
        file: (issue.file || issue.filePath || issue.location || issue.title || "Unknown").toString(),
        type: issue.type || 'complexity',
        severity: issue.severity,
        description: issue.description || issue.title,
    })).filter((i: any) => i.file !== "Unknown" && !i.file.includes(' ')) || []; // Filter out likely invalid files (spaces in title used as file)

    // If no issues found, maybe suggest high complexity files if available?
    // For now, we'll just show what we have.

    const handleAnalyze = async () => {
        if (!selectedFile) return;
        setAnalyzing(true);
        setGeneratedPlan(null);

        try {
            const response = await fetch('/api/refactor/plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath: selectedFile })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to generate plan");
            }

            setGeneratedPlan(data);

        } catch (error: any) {
            console.error("Analysis failed", error);
            setGeneratedPlan({
                id: 'error',
                title: 'Analysis Failed',
                description: error.message || 'Could not generate refactor plan. Ensure the API is running and the file exists.',
                risk: 'low',
                changes: []
            });
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="h-full flex flex-col md:flex-row bg-[#080808] text-white overflow-hidden rounded-xl border border-white/5">
            {/* Sidebar: File Explorer & Issues */}
            <div className="w-full md:w-80 border-r border-white/10 flex flex-col bg-[#0A0A0A]">
                <div className="p-4 border-b border-white/10 bg-gradient-to-r from-purple-900/10 to-transparent">
                    <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-purple-400">
                        <Bot className="w-4 h-4" />
                        Refactor Engine
                    </h2>
                    <p className="text-[10px] text-gray-500 mt-1">AI-powered defect improvement</p>
                </div>

                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {issues.length > 0 ? (
                        <>
                            <div className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider px-2 mt-2">Detected Issues</div>
                            {issues.map((issue, idx) => (
                                <div
                                    key={issue.id || idx}
                                    onClick={() => setSelectedFile(issue.file)}
                                    className={`p-3 rounded-lg mb-2 cursor-pointer transition-all border group ${selectedFile === issue.file
                                        ? 'bg-purple-500/10 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                                        : 'bg-[#111] border-white/5 hover:border-white/20'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <FileCode className={`w-3.5 h-3.5 flex-shrink-0 ${selectedFile === issue.file ? 'text-purple-400' : 'text-gray-500'}`} />
                                            <span className={`font-medium text-xs truncate ${selectedFile === issue.file ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`} title={issue.file}>
                                                {issue.file.split('/').pop()}
                                            </span>
                                        </div>
                                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${issue.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                                            issue.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {issue.severity}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-gray-500 line-clamp-2 mt-1 pl-5.5">
                                        {issue.description}
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="p-4 text-center text-gray-500 text-xs">
                            <Check className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p>No major issues detected!</p>
                            <p className="mt-1 opacity-50">Select a file manually to force check.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative bg-[#080808]">
                {selectedFile ? (
                    <>
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0A0A0A]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded bg-white/5 border border-white/10">
                                    <FileCode className="w-4 h-4 text-cyan-400" />
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Target File</div>
                                    <div className="font-mono text-sm text-gray-200">{selectedFile}</div>
                                </div>
                            </div>
                            <button
                                onClick={handleAnalyze}
                                disabled={analyzing}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all
                                    ${analyzing
                                        ? 'bg-purple-500/20 text-purple-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20'
                                    }
                                `}
                            >
                                {analyzing ? <Bot className="w-3.5 h-3.5 animate-bounce" /> : <Play className="w-3.5 h-3.5" />}
                                {analyzing ? 'Generating Plan...' : 'Generate Refactor Plan'}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <AnimatePresence mode="wait">
                                {analyzing ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="h-full flex flex-col items-center justify-center text-gray-400"
                                    >
                                        <div className="relative mb-8">
                                            <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full" />
                                            <div className="relative bg-[#111] border border-white/10 p-6 rounded-2xl flex items-center justify-center">
                                                <Bot className="w-16 h-16 text-purple-400 animate-pulse" />
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">Analyzing Code Structure...</h3>
                                        <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
                                            <span className="flex items-center gap-2"><Cpu className="w-3 h-3" /> Cyclomatic Complexity</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-700" />
                                            <span className="flex items-center gap-2"><GitBranch className="w-3 h-3" /> Coupling</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-700" />
                                            <span className="flex items-center gap-2"><ShieldAlert className="w-3 h-3" /> Risk Assessment</span>
                                        </div>
                                    </motion.div>
                                ) : generatedPlan ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="max-w-5xl mx-auto space-y-6"
                                    >
                                        {/* Plan Header */}
                                        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-3xl -mr-16 -mt-16" />
                                            <div className="relative z-10">
                                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="bg-purple-500/20 p-1.5 rounded text-purple-400">
                                                                <Bot className="w-5 h-5" />
                                                            </div>
                                                            <h3 className="text-xl font-bold text-white">{generatedPlan.title}</h3>
                                                        </div>
                                                        <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">{generatedPlan.description}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Risk Level</div>
                                                        <div className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wide flex items-center gap-2 ${generatedPlan.risk === 'high' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                                                            generatedPlan.risk === 'medium' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' :
                                                                'bg-green-500/10 border-green-500/30 text-green-400'
                                                            }`}>
                                                            {generatedPlan.risk === 'high' ? <ShieldAlert className="w-3.5 h-3.5" /> :
                                                                generatedPlan.risk === 'medium' ? <AlertTriangle className="w-3.5 h-3.5" /> :
                                                                    <Check className="w-3.5 h-3.5" />
                                                            }
                                                            {generatedPlan.risk} Risk
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Stats/Metrics Impact - Mocked for visual completeness */}
                                                <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6 mt-2">
                                                    <div>
                                                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Complexity Reduction</div>
                                                        <div className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                                                            <ArrowRight className="w-3 h-3 rotate-45" /> -15%
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Modularity Score</div>
                                                        <div className="text-blue-400 font-mono font-bold flex items-center gap-1">
                                                            <ArrowRight className="w-3 h-3 -rotate-45" /> +8.5
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Affected Modules</div>
                                                        <div className="text-gray-300 font-mono font-bold">1 File</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Plan Content */}
                                        <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0D0D0D]">
                                            <div className="flex items-center border-b border-white/10 bg-white/[0.02]">
                                                <button
                                                    onClick={() => setActiveTab('diff')}
                                                    className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'diff' ? 'border-purple-500 text-purple-400 bg-white/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                                                >
                                                    Code Patch (Diff)
                                                </button>
                                                <button
                                                    onClick={() => setActiveTab('explanation')}
                                                    className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'explanation' ? 'border-purple-500 text-purple-400 bg-white/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                                                >
                                                    Step-by-Step
                                                </button>
                                            </div>

                                            <div className="p-0">
                                                {activeTab === 'diff' ? (
                                                    <div className="bg-[#050505] p-4 text-xs font-mono overflow-x-auto custom-scrollbar">
                                                        <pre className="text-gray-300 leading-relaxed whitespace-pre font-mono">
                                                            {generatedPlan.changes[0]?.diff || "// No diff available in this plan."}
                                                        </pre>
                                                    </div>
                                                ) : (
                                                    <div className="p-8">
                                                        <div className="flex items-start gap-4 mb-6">
                                                            <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm border border-purple-500/30">1</div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-white mb-1">Backup Original File</h4>
                                                                <p className="text-xs text-gray-400">Ensure {generatedPlan.changes[0]?.file} is committed or stashed before applying changes.</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-4 mb-6">
                                                            <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm border border-purple-500/30">2</div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-white mb-1">Apply Automated Patch</h4>
                                                                <p className="text-xs text-gray-400">The engine will rewrite the file buffer with the optimization strategies applied.</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm border border-purple-500/30">3</div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-white mb-1">Verify Behavior</h4>
                                                                <p className="text-xs text-gray-400">Run unit tests associated with this module to confirm no regression.</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Bar */}
                                        <div className="flex justify-end gap-3 pt-4">
                                            <button
                                                onClick={() => setGeneratedPlan(null)}
                                                className="px-6 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 text-xs font-bold uppercase tracking-wider transition-all"
                                            >
                                                Discard
                                            </button>
                                            <button className="px-6 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/50 text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all flex items-center gap-2">
                                                <Check className="w-4 h-4" /> Apply Refactor
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4"
                                    >
                                        <div className="w-24 h-24 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center group">
                                            <Code2 className="w-10 h-10 text-gray-600 group-hover:text-purple-500/50 transition-colors" />
                                        </div>
                                        <div className="text-center max-w-sm">
                                            <h3 className="text-lg font-bold text-gray-300 mb-2">Ready to Optimize</h3>
                                            <p className="text-xs text-gray-500 leading-relaxed">
                                                Select a file from the list to view specific refactoring opportunities, or manually browse to any file in the explorer.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        <div className="text-center opacity-40 hover:opacity-100 transition-opacity duration-700">
                            <Bot className="w-24 h-24 mx-auto mb-6 text-purple-500/20" />
                            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">AI Refactor Engine</h3>
                            <p className="max-w-md mx-auto text-sm">Select a file from the sidebar to initialize the refactoring context.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
