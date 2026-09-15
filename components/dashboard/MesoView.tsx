"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
    FolderTree,
    FileCode,
    ChevronRight,
    Package,
    Link2,
    Zap,
    AlertTriangle,
    Search,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { AIAnalysisResult } from "@/lib/ai/AIClient";

interface MesoViewProps {
    data: AIAnalysisResult | null;
    fileTree: string[];
    keyFiles: Record<string, string>;
    selectedDirectory: string | null;
    onFileSelect: (file: string) => void;
    onDirectorySelect: (dir: string | null) => void;
}

type DirectoryInfo = {
    name: string;
    path: string;
    files: string[];
    subdirs: string[];
    role: string;
    fanIn: number;
    fanOut: number;
};

export default function MesoView({
    data,
    fileTree,
    keyFiles,
    selectedDirectory,
    onFileSelect,
    onDirectorySelect
}: MesoViewProps) {
    const [searchQuery, setSearchQuery] = useState("");

    // Build directory structure
    const directories = useMemo(() => {
        return buildDirectoryStructure(fileTree, selectedDirectory, data);
    }, [fileTree, selectedDirectory, data]);

    // Filter directories by search
    const filteredDirectories = useMemo(() => {
        if (!searchQuery) return directories;
        return directories.filter(d =>
            d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.role.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [directories, searchQuery]);

    // Get meso-level explanation
    const mesoExplanation = data?.explanations?.meso ||
        "The package structure reveals the organizational patterns of this codebase. Each directory typically encapsulates related functionality.";

    return (
        <div className="space-y-4">
            {/* Meso-level Overview */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-xl border border-teal-500/30 p-4"
            >
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FolderTree className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-white mb-1">
                            {selectedDirectory ? `Directory: ${selectedDirectory}` : "Package Structure Overview"}
                        </h3>
                        <p className="text-sm text-slate-300">
                            {mesoExplanation}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Search and Back Navigation */}
            <div className="flex items-center gap-3">
                {selectedDirectory && (
                    <button
                        onClick={() => onDirectorySelect(null)}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-sm text-slate-300 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        Back to root
                    </button>
                )}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search directories..."
                        className="w-full bg-slate-700/30 border border-slate-600/50 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500/50"
                    />
                </div>
            </div>

            {/* Directory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredDirectories.map((dir, i) => (
                    <motion.div
                        key={dir.path}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-slate-700/30 rounded-xl border border-slate-600/50 hover:border-teal-500/40 transition-all overflow-hidden group"
                    >
                        {/* Directory Header */}
                        <div
                            className="p-4 cursor-pointer"
                            onClick={() => dir.subdirs.length > 0 ? onDirectorySelect(dir.path) : null}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-teal-400" />
                                    <span className="font-medium text-white">{dir.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">{dir.files.length} files</span>
                                    {dir.subdirs.length > 0 && (
                                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-colors" />
                                    )}
                                </div>
                            </div>

                            {/* Directory Role */}
                            <p className="text-sm text-slate-400 mb-3">
                                {dir.role}
                            </p>

                            {/* Coupling Metrics */}
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1 text-slate-400">
                                    <ArrowDownRight className="w-3 h-3 text-green-400" />
                                    <span>Fan-in: {dir.fanIn}</span>
                                </div>
                                <div className="flex items-center gap-1 text-slate-400">
                                    <ArrowUpRight className="w-3 h-3 text-blue-400" />
                                    <span>Fan-out: {dir.fanOut}</span>
                                </div>
                            </div>
                        </div>

                        {/* Files Preview */}
                        <div className="border-t border-slate-600/30 p-3 bg-slate-800/30">
                            <div className="text-xs text-slate-500 mb-2">Key files:</div>
                            <div className="flex flex-wrap gap-1">
                                {dir.files.slice(0, 4).map((file) => {
                                    const fileName = file.split('/').pop() || file;
                                    return (
                                        <button
                                            key={file}
                                            onClick={(e) => { e.stopPropagation(); onFileSelect(file); }}
                                            className="flex items-center gap-1 px-2 py-1 bg-slate-700/50 hover:bg-teal-500/20 rounded text-xs text-slate-300 hover:text-teal-300 transition-colors"
                                        >
                                            <FileCode className="w-3 h-3" />
                                            {truncateFileName(fileName, 20)}
                                        </button>
                                    );
                                })}
                                {dir.files.length > 4 && (
                                    <span className="px-2 py-1 text-xs text-slate-500">
                                        +{dir.files.length - 4} more
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Empty State */}
            {filteredDirectories.length === 0 && (
                <div className="text-center py-8">
                    <FolderTree className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No directories found matching your search</p>
                </div>
            )}

            {/* Cross-cutting Concerns Summary */}
            {data?.structural?.crossCuttingConcerns && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-slate-700/30 rounded-xl border border-slate-600/50 p-4"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        <h4 className="font-medium text-white">Cross-cutting Concerns</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(data.structural.crossCuttingConcerns).map(([concern, files]) => {
                            if (!Array.isArray(files) || files.length === 0) return null;
                            return (
                                <div key={concern} className="bg-slate-800/50 rounded-lg p-3">
                                    <div className="text-xs text-slate-400 capitalize mb-1">{formatConcern(concern)}</div>
                                    <div className="text-lg font-semibold text-yellow-400">{files.length}</div>
                                    <div className="text-xs text-slate-500">files</div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </div>
    );
}

// Helper to build directory structure
function buildDirectoryStructure(fileTree: string[], parentDir: string | null, dataContent: AIAnalysisResult | null): DirectoryInfo[] {
    const dirMap = new Map<string, DirectoryInfo>();

    // Calculate real fan-in / fan-out if structural data exists
    const fanInMap: Record<string, number> = {};
    const fanOutMap: Record<string, number> = {};

    if (dataContent?.structural?.dependencyMapping?.directedRelationships) {
        dataContent.structural.dependencyMapping.directedRelationships.forEach((rel: any) => {
            const relStr = typeof rel === 'string' ? rel : `${rel.source} -> ${rel.target}`;
            const parts = relStr.split('->').map(s => s.trim());
            if (parts.length === 2) {
                const [src, dest] = parts;
                const srcDir = src.split('/')[0];
                const destDir = dest.split('/')[0];

                if (srcDir !== destDir) {
                    fanOutMap[srcDir] = (fanOutMap[srcDir] || 0) + 1;
                    fanInMap[destDir] = (fanInMap[destDir] || 0) + 1;
                }
            }
        });
    }

    for (const file of fileTree) {
        const parts = file.split('/').filter(p => p);

        // If we have a parent selected, filter to its children
        if (parentDir) {
            if (!file.startsWith(parentDir + '/') && !file.startsWith(parentDir)) continue;
            // Remove parent prefix
            const relativeParts = file.replace(parentDir, '').split('/').filter(p => p);
            if (relativeParts.length === 0) continue;

            const dirName = relativeParts[0];
            const dirPath = `${parentDir}/${dirName}`;

            if (!dirMap.has(dirPath)) {
                dirMap.set(dirPath, {
                    name: dirName,
                    path: dirPath,
                    files: [],
                    subdirs: [],
                    role: inferDirectoryRole(dirName),
                    fanIn: fanInMap[dirPath] || 0,
                    fanOut: fanOutMap[dirPath] || 0,
                });
            }

            const dirInfo = dirMap.get(dirPath)!;
            if (relativeParts.length === 1 || !relativeParts[1].includes('.')) {
                dirInfo.files.push(file);
            }
            if (relativeParts.length > 1 && !dirInfo.subdirs.includes(relativeParts[1])) {
                dirInfo.subdirs.push(relativeParts[1]);
            }
        } else {
            // Root level
            if (parts.length === 0) continue;
            const dirName = parts[0];

            if (!dirMap.has(dirName)) {
                dirMap.set(dirName, {
                    name: dirName,
                    path: dirName,
                    files: [],
                    subdirs: [],
                    role: inferDirectoryRole(dirName),
                    fanIn: fanInMap[dirName] || 0,
                    fanOut: fanOutMap[dirName] || 0,
                });
            }

            const dirInfo = dirMap.get(dirName)!;
            dirInfo.files.push(file);
            if (parts.length > 1 && !dirInfo.subdirs.includes(parts[1])) {
                dirInfo.subdirs.push(parts[1]);
            }
        }
    }

    return Array.from(dirMap.values()).sort((a, b) => b.files.length - a.files.length);
}

// Infer directory role from name
function inferDirectoryRole(name: string): string {
    const roles: Record<string, string> = {
        src: "Source code root directory",
        lib: "Library and utility functions",
        components: "UI components and widgets",
        pages: "Page-level components and routes",
        app: "Application entry point and routing",
        api: "API routes and handlers",
        utils: "Utility functions and helpers",
        hooks: "Custom React hooks",
        services: "Business logic and external service integrations",
        models: "Data models and type definitions",
        types: "TypeScript type definitions",
        styles: "CSS and styling files",
        public: "Static assets and public files",
        tests: "Test files and fixtures",
        config: "Configuration files",
        middleware: "Request/response middleware",
        controllers: "Request handlers and controllers",
        routes: "Route definitions",
        store: "State management store",
        actions: "Action creators and dispatchers",
        reducers: "State reducers",
        context: "React context providers",
        providers: "Service and context providers",
        helpers: "Helper functions",
        constants: "Constant values and enums",
        assets: "Static assets like images and fonts",
        features: "Feature-based modules",
        modules: "Self-contained feature modules",
        shared: "Shared code across modules",
        common: "Common utilities and components",
        core: "Core business logic",
        domain: "Domain models and logic",
        infrastructure: "Infrastructure and external adaptors",
        adapters: "Adapter pattern implementations",
        repositories: "Data access repositories",
        entities: "Domain entities",
        use_cases: "Application use cases",
        usecases: "Application use cases",
    };

    const lowerName = name.toLowerCase();
    return roles[lowerName] || `Contains ${name}-related functionality`;
}

// Format concern name
function formatConcern(concern: string): string {
    return concern.replace(/([A-Z])/g, ' $1').trim();
}

// Truncate file name
function truncateFileName(name: string, maxLen: number): string {
    if (name.length <= maxLen) return name;
    return name.substring(0, maxLen - 3) + '...';
}
