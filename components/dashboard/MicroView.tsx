"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
    FileCode,
    ChevronRight,
    Search,
    ArrowDownRight,
    ArrowUpRight,
    AlertTriangle,
    CheckCircle,
    Target,
    Zap,
    FileText,
    Link2
} from "lucide-react";
import { AIAnalysisResult } from "@/lib/ai/AIClient";

interface MicroViewProps {
    data: AIAnalysisResult | null;
    fileTree: string[];
    keyFiles: Record<string, string>;
    selectedFile: string | null;
    onFileSelect: (file: string | null) => void;
}

type FileAnalysis = {
    name: string;
    path: string;
    role: string;
    patterns: string[];
    dependencies: string[];
    dependents: string[];
    linesOfCode: number;
    complexity: number;
    isHotspot: boolean;
    changeRisk: "low" | "medium" | "high";
};

export default function MicroView({
    data,
    fileTree,
    keyFiles,
    selectedFile,
    onFileSelect
}: MicroViewProps) {
    const [searchQuery, setSearchQuery] = useState("");

    // Get file-level analysis
    const fileAnalysis = useMemo(() => {
        if (!selectedFile) return null;
        return analyzeFile(selectedFile, fileTree, keyFiles, data);
    }, [selectedFile, fileTree, keyFiles, data]);

    // Get filtered file list
    const filteredFiles = useMemo(() => {
        const sourceFiles = fileTree.filter(f =>
            f.match(/\.(ts|tsx|js|jsx|py|java|go|rs|rb|php|cs|cpp|c|h)$/)
        );
        if (!searchQuery) return sourceFiles.slice(0, 20);
        return sourceFiles.filter(f =>
            f.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 20);
    }, [fileTree, searchQuery]);

    // Get micro-level explanation
    const microExplanation = data?.explanations?.micro ||
        "Individual files serve specific roles within the system architecture. Understanding each file's responsibilities and dependencies is crucial for safe modifications.";

    return (
        <div className="space-y-4">
            {/* Micro Overview */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 rounded-xl border border-rose-500/30 p-4"
            >
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileCode className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-white mb-1">
                            {selectedFile ? `File: ${selectedFile.split('/').pop()}` : "File-Level Analysis"}
                        </h3>
                        <p className="text-sm text-slate-300">
                            {microExplanation}
                        </p>
                    </div>
                </div>
            </motion.div>

            {selectedFile && fileAnalysis ? (
                /* Detailed File View */
                <FileDetailView
                    analysis={fileAnalysis}
                    fileContent={keyFiles[selectedFile]}
                    onBack={() => onFileSelect(null)}
                    data={data}
                />
            ) : (
                /* File Selector */
                <>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search files..."
                            className="w-full bg-slate-700/30 border border-slate-600/50 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500/50"
                        />
                    </div>

                    <div className="space-y-2">
                        {filteredFiles.map((file, i) => {
                            const fileName = file.split('/').pop() || file;
                            const isHotspot = data?.structural?.highFanIn?.some(f => file.includes(f));

                            return (
                                <motion.button
                                    key={file}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    onClick={() => onFileSelect(file)}
                                    className="w-full flex items-center justify-between p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg border border-slate-600/30 hover:border-rose-500/40 transition-all text-left group"
                                >
                                    <div className="flex items-center gap-3">
                                        <FileCode className="w-4 h-4 text-rose-400" />
                                        <div>
                                            <div className="text-sm font-medium text-white group-hover:text-rose-300 transition-colors">
                                                {fileName}
                                            </div>
                                            <div className="text-xs text-slate-500 truncate max-w-[200px]">
                                                {file}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isHotspot && (
                                            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">
                                                Hotspot
                                            </span>
                                        )}
                                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors" />
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>

                    {filteredFiles.length === 0 && (
                        <div className="text-center py-8">
                            <FileCode className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400">No files found matching your search</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// Detailed File View Component
function FileDetailView({
    analysis,
    fileContent,
    onBack,
    data
}: {
    analysis: FileAnalysis;
    fileContent?: string;
    onBack: () => void;
    data: AIAnalysisResult | null;
}) {
    return (
        <div className="space-y-4">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-sm text-slate-300 transition-colors"
            >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to file list
            </button>

            {/* File Role Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-700/30 rounded-xl border border-slate-600/50 p-4"
            >
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-medium text-white">{analysis.name}</h4>
                        <p className="text-sm text-slate-400 mt-1">{analysis.role}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${analysis.changeRisk === "low" ? "bg-green-500/20 text-green-400" :
                        analysis.changeRisk === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-red-500/20 text-red-400"
                        }`}>
                        {analysis.changeRisk} risk
                    </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Lines of Code</div>
                        <div className="text-lg font-semibold text-slate-200">{analysis.linesOfCode}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Complexity</div>
                        <div className={`text-lg font-semibold ${analysis.complexity < 10 ? "text-green-400" :
                            analysis.complexity < 20 ? "text-yellow-400" : "text-red-400"
                            }`}>{analysis.complexity}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Dependencies</div>
                        <div className="flex items-center gap-1">
                            <ArrowUpRight className="w-4 h-4 text-blue-400" />
                            <span className="text-lg font-semibold text-slate-200">{analysis.dependencies.length}</span>
                        </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Dependents</div>
                        <div className="flex items-center gap-1">
                            <ArrowDownRight className="w-4 h-4 text-green-400" />
                            <span className="text-lg font-semibold text-slate-200">{analysis.dependents.length}</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Detected Patterns */}
            {analysis.patterns.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-700/30 rounded-xl border border-slate-600/50 p-4"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Target className="w-5 h-5 text-purple-400" />
                        <h4 className="font-medium text-white">Detected Patterns</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {analysis.patterns.map((pattern, i) => (
                            <span
                                key={i}
                                className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-sm"
                            >
                                <CheckCircle className="w-3 h-3" />
                                {pattern}
                            </span>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Dependencies & Dependents */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Outgoing Dependencies */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-slate-700/30 rounded-xl border border-slate-600/50 p-4"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <ArrowUpRight className="w-5 h-5 text-blue-400" />
                        <h4 className="font-medium text-white">Dependencies (imports)</h4>
                    </div>
                    {analysis.dependencies.length > 0 ? (
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                            {analysis.dependencies.map((dep, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-slate-400">
                                    <Link2 className="w-3 h-3" />
                                    <span className="truncate">{dep}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 italic">No dependencies detected</p>
                    )}
                </motion.div>

                {/* Incoming Dependents */}
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-700/30 rounded-xl border border-slate-600/50 p-4"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <ArrowDownRight className="w-5 h-5 text-green-400" />
                        <h4 className="font-medium text-white">Dependents (imported by)</h4>
                    </div>
                    {analysis.dependents.length > 0 ? (
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                            {analysis.dependents.map((dep, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-slate-400">
                                    <Link2 className="w-3 h-3" />
                                    <span className="truncate">{dep}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 italic">No dependents detected</p>
                    )}
                </motion.div>
            </div>

            {/* Hotspot Warning */}
            {analysis.isHotspot && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-orange-400" />
                        <h4 className="font-medium text-orange-300">Hotspot Warning</h4>
                    </div>
                    <p className="text-sm text-orange-200/80">
                        This file has high fan-in (many dependents). Changes here may have significant impact across the codebase.
                        Consider extra testing and code review.
                    </p>
                </motion.div>
            )}

            {/* Change Impact Estimation */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-slate-700/30 rounded-xl border border-slate-600/50 p-4"
            >
                <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <h4 className="font-medium text-white">Change Impact Estimation</h4>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Blast Radius</span>
                        <span className="text-slate-200">{analysis.dependents.length + 1} files</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Risk Level</span>
                        <span className={`font-medium ${analysis.changeRisk === "low" ? "text-green-400" :
                            analysis.changeRisk === "medium" ? "text-yellow-400" : "text-red-400"
                            }`}>{analysis.changeRisk.charAt(0).toUpperCase() + analysis.changeRisk.slice(1)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Recommendation</span>
                        <span className="text-slate-200">
                            {analysis.changeRisk === "low" ? "Safe to modify with standard review" :
                                analysis.changeRisk === "medium" ? "Review carefully, test dependents" :
                                    "Extensive testing required, consider refactoring"}
                        </span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// Analyze a file
function analyzeFile(
    filePath: string,
    fileTree: string[],
    keyFiles: Record<string, string>,
    data: AIAnalysisResult | null
): FileAnalysis {
    const fileName = filePath.split('/').pop() || filePath;
    const content = keyFiles[filePath] || "";

    // Extract imports from content
    const imports = extractImports(content);

    // Find files that import this file
    const dependents = findDependents(filePath, fileTree, keyFiles);

    // Detect patterns
    const patterns = detectFilePatterns(content, fileName);

    // Calculate metrics
    const lines = content.split('\n').length;
    const complexity = calculateComplexity(content);

    // Determine if hotspot
    const isHotspot = dependents.length >= 5 ||
        (data?.structural?.highFanIn?.some(f => filePath.includes(f)) ?? false);

    // Calculate change risk
    const changeRisk: "low" | "medium" | "high" =
        dependents.length >= 10 ? "high" :
            dependents.length >= 5 ? "medium" : "low";

    return {
        name: fileName,
        path: filePath,
        role: inferFileRole(fileName, filePath),
        patterns,
        dependencies: imports,
        dependents,
        linesOfCode: lines,
        complexity,
        isHotspot,
        changeRisk,
    };
}

// Extract imports from code
function extractImports(code: string): string[] {
    const imports: string[] = [];

    // ES6 imports
    const es6Regex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = es6Regex.exec(code)) !== null) {
        imports.push(match[1]);
    }

    // CommonJS require
    const cjsRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = cjsRegex.exec(code)) !== null) {
        imports.push(match[1]);
    }

    return [...new Set(imports)];
}

// Find files that depend on a given file
function findDependents(targetFile: string, fileTree: string[], keyFiles: Record<string, string>): string[] {
    const dependents: string[] = [];
    const targetName = targetFile.split('/').pop()?.replace(/\.(ts|tsx|js|jsx)$/, '');

    for (const [file, content] of Object.entries(keyFiles)) {
        if (file === targetFile) continue;
        if (content.includes(targetName || '')) {
            // Simple heuristic - check if filename appears in imports
            const imports = extractImports(content);
            if (imports.some(imp => imp.includes(targetName || ''))) {
                dependents.push(file);
            }
        }
    }

    return dependents;
}

// Detect patterns in file
function detectFilePatterns(code: string, fileName: string): string[] {
    const patterns: string[] = [];

    if (/class\s+\w+.*extends\s+Component/.test(code)) patterns.push("React Class Component");
    if (/export\s+default\s+function/.test(code) && /return\s*\(/.test(code)) patterns.push("React Functional Component");
    if (/useState|useEffect|useContext|useReducer|useMemo|useCallback/.test(code)) patterns.push("React Hooks");
    if (/\.getInstance\(\)|private static instance/.test(code)) patterns.push("Singleton");
    if (/create\w+\(|factory|Factory/.test(code)) patterns.push("Factory");
    if (/subscribe|unsubscribe|notify|observer|Observer/.test(code)) patterns.push("Observer");
    if (/async\s+function|await\s+/.test(code)) patterns.push("Async/Await");
    if (/export\s+type|interface\s+\w+/.test(code)) patterns.push("TypeScript Types");
    if (/Controller|handler|Handler/.test(fileName)) patterns.push("Controller");
    if (/Service|service/.test(fileName)) patterns.push("Service");
    if (/Repository|repository/.test(fileName)) patterns.push("Repository");
    if (/Model|model|Entity|entity/.test(fileName)) patterns.push("Model/Entity");

    return [...new Set(patterns)];
}

// Calculate cyclomatic complexity
function calculateComplexity(code: string): number {
    let complexity = 1;
    const patterns = [
        /\bif\s*\(/g,
        /\belse\s+if\s*\(/g,
        /\bwhile\s*\(/g,
        /\bfor\s*\(/g,
        /\bcase\s+/g,
        /\bcatch\s*\(/g,
        /&&/g,
        /\|\|/g,
        /\?/g,
    ];

    patterns.forEach(regex => {
        const matches = code.match(regex);
        if (matches) complexity += matches.length;
    });

    return Math.min(complexity, 50);
}

// Infer file role
function inferFileRole(fileName: string, filePath: string): string {
    if (/component|\.tsx?$/.test(fileName.toLowerCase()) && /component/.test(filePath.toLowerCase())) {
        return "UI Component - Renders visual elements and handles user interactions";
    }
    if (/page\.tsx?$|pages?\//.test(filePath)) {
        return "Page Component - Top-level route handler";
    }
    if (/service/i.test(fileName)) {
        return "Service - Business logic and external API integrations";
    }
    if (/hook|use[A-Z]/i.test(fileName)) {
        return "Custom Hook - Reusable stateful logic";
    }
    if (/util|helper/i.test(fileName)) {
        return "Utility - Helper functions and common operations";
    }
    if (/model|entity|type/i.test(fileName)) {
        return "Type Definition - Data models and TypeScript interfaces";
    }
    if (/controller/i.test(fileName)) {
        return "Controller - Request handling and routing logic";
    }
    if (/repository/i.test(fileName)) {
        return "Repository - Data access layer";
    }
    if (/config/i.test(fileName)) {
        return "Configuration - Application and environment settings";
    }
    if (/test|spec/i.test(fileName)) {
        return "Test - Unit or integration test file";
    }
    if (/index\.(ts|js)/i.test(fileName)) {
        return "Index/Barrel - Module exports and public API";
    }
    if (/middleware/i.test(fileName)) {
        return "Middleware - Request/response interceptor";
    }
    if (/context|provider/i.test(fileName)) {
        return "Context Provider - React context for state sharing";
    }
    if (/reducer|store|action/i.test(fileName)) {
        return "State Management - Redux or similar state handling";
    }

    return "Source File - Part of the application codebase";
}
