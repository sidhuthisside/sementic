"use client";

import { motion } from "framer-motion";
import { AnalysisResult } from "@/lib/analyzer/AnalysisOrchestrator";
import { Activity, GitBranch, Target, Lightbulb, AlertTriangle } from "lucide-react";


import { useState } from "react";
import Editor from "@monaco-editor/react";
import { File, Code } from "lucide-react";

export default function ResultsDashboard({ results, files }: { results: AnalysisResult | null, files: { name: string; content: string }[] }) {
    const [selectedFile, setSelectedFile] = useState<{ name: string; content: string } | null>(files.length > 0 ? files[0] : null);

    if (!results) return null;

    return (
        <div className="space-y-6">
            {/* Metrics Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    icon={<Activity className="w-5 h-5" />}
                    label="Lines of Code"
                    value={results.metrics.linesOfCode.toString()}
                    color="cyan"
                />
                <MetricCard
                    icon={<Target className="w-5 h-5" />}
                    label="Complexity"
                    value={(results.metrics.complexity || 0).toFixed(2)}
                    color="purple"
                />
                <MetricCard
                    icon={<Activity className="w-5 h-5" />}
                    label="Maintainability"
                    value={`${(results.metrics.maintainability || 0).toFixed(2)}%`}
                    color="pink"
                />
                <MetricCard
                    icon={<GitBranch className="w-5 h-5" />}
                    label="Functions"
                    value={results.metrics.functionCount.toString()}
                    color="cyan"
                />
            </div>

            {/* Source Code Viewer */}
            {files.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
                    {/* File List */}
                    <div className="lg:col-span-1 bg-[#111] border border-white/10 rounded-xl overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-white/10 bg-white/5">
                            <h3 className="font-bold flex items-center gap-2">
                                <Code className="w-4 h-4 text-neon-cyan" />
                                Source Files
                            </h3>
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-1">
                            {files.map((file, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedFile(file)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${selectedFile?.name === file.name
                                        ? 'bg-neon-cyan/20 text-neon-cyan'
                                        : 'hover:bg-white/5 text-gray-400 hover:text-white'
                                        }`}
                                >
                                    <File className="w-3 h-3" />
                                    <span className="truncate">{file.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Code Editor */}
                    <div className="lg:col-span-2 bg-[#111] border border-white/10 rounded-xl overflow-hidden flex flex-col">
                        <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
                            <span className="text-sm font-mono text-gray-400">
                                {selectedFile?.name || 'Select a file'}
                            </span>
                            <div className="text-xs text-gray-500">
                                Read-only
                            </div>
                        </div>
                        <div className="flex-1 relative">
                            {selectedFile ? (
                                <Editor
                                    height="100%"
                                    defaultLanguage={selectedFile.name.split('.').pop() || 'javascript'}
                                    language={
                                        selectedFile.name.endsWith('.ts') ? 'typescript' :
                                            selectedFile.name.endsWith('.tsx') ? 'typescript' :
                                                selectedFile.name.endsWith('.js') ? 'javascript' :
                                                    selectedFile.name.endsWith('.jsx') ? 'javascript' :
                                                        selectedFile.name.endsWith('.py') ? 'python' :
                                                            selectedFile.name.endsWith('.css') ? 'css' :
                                                                selectedFile.name.endsWith('.html') ? 'html' :
                                                                    selectedFile.name.endsWith('.json') ? 'json' :
                                                                        selectedFile.name.endsWith('.md') ? 'markdown' :
                                                                            'plaintext'
                                    }
                                    value={selectedFile.content}
                                    theme="vs-dark"
                                    options={{
                                        readOnly: true,
                                        minimap: { enabled: false },
                                        fontSize: 13,
                                        scrollBeyondLastLine: false,
                                        padding: { top: 16, bottom: 16 }
                                    }}
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                                    Select a file to view code
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Patterns Detected */}
            {results.patterns.length > 0 && (
                <div className="p-6 bg-[#111] border border-white/10 rounded-xl">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        Detected Patterns
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {results.patterns.map((pattern, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-4 bg-white/5 rounded-lg border border-white/5"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <span className="font-bold text-neon-cyan">{pattern.name}</span>
                                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                                        {pattern.confidence}%
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400">{pattern.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Circular Dependencies Warning */}
            {results.dependencies.circular.length > 0 && (
                <div className="p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                    <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Circular Dependencies Detected
                    </h3>
                    <div className="space-y-2">
                        {results.dependencies.circular.map((cycle, i) => (
                            <div key={i} className="text-xs text-gray-300 font-mono">
                                {cycle.join(' → ')}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Insights */}
            {results.insights && results.insights.length > 0 && (
                <div className="p-6 bg-[#111] border border-white/10 rounded-xl">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                        AI-Powered Insights
                    </h3>
                    <div className="space-y-3">
                        {results.insights.map((insight, i) => (
                            <div key={i} className="flex gap-3 p-3 bg-white/5 rounded-lg">
                                <div className="w-1 bg-neon-purple rounded-full" />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-gray-200">{insight.title}</p>
                                    <p className="text-sm text-gray-400">{insight.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
    return (
        <div className="p-4 bg-[#111] border border-white/10 rounded-xl">
            <div className={`text-neon-${color} mb-2`}>{icon}</div>
            <div className="text-2xl font-bold mb-1">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
        </div>
    );
}
