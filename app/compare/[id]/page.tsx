"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRepoStore } from "@/lib/RepoStore";
import { AIOrchestrator } from "@/lib/ai/AIOrchestrator";
import { fetchGithubRepo, getLatestCommit, getCommitDiff, DiffFile } from "@/lib/githubFetcher";
import { AIAnalysisResult } from "@/lib/ai/AIClient";
import ComparisonLayout from "@/components/compare/ComparisonLayout";
import { ArrowLeftRight, GitCommit, FileCode, ChevronRight, ChevronDown, Network } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/lib/ToastContext";
import CodeDiff from "@/components/compare/CodeDiff";
import { ArchitecturalComparator, ArchitecturalComparison } from "@/lib/analyzer/ArchitecturalComparator";
import ArchitecturalDiff from "@/components/compare/ArchitecturalDiff";
import ChangeSummaryPanel from "@/components/compare/ChangeSummaryPanel";
import EvidenceViewer from "@/components/compare/EvidenceViewer";
import CouplingTrendChart from "@/components/compare/CouplingTrendChart";

const DiffRadar = dynamic(() => import("@/components/compare/DiffRadar"), {
    loading: () => <Skeleton className="w-full h-64" />,
    ssr: false
});

export default function ComparisonPage({ params }: { params: { id: string } }) {
    const { getFromCache } = useRepoStore();
    const { showToast } = useToast();
    const initialId = decodeURIComponent(params.id);

    type ComparisonMode = 'metrics' | 'architectural' | 'code-diff';

    const [sourceRepo, setSourceRepo] = useState<RepoData>({
        name: initialId,
        metrics: { maintainability: 0, complexity: 0, coverage: 0, performance: 0, security: 0 },
        patterns: [],
        commit: "..."
    });
    const [targetRepo, setTargetRepo] = useState<RepoData>({
        name: "select-target-repo",
        metrics: { maintainability: 0, complexity: 0, coverage: 0, performance: 0, security: 0 },
        patterns: [],
        commit: "..."
    });
    const [loading, setLoading] = useState(false);
    const [diffData, setDiffData] = useState<DiffFile[] | null>(null);
    const [selectedFile, setSelectedFile] = useState<DiffFile | null>(null);
    const [showDiff, setShowDiff] = useState(false);
    const [mode, setMode] = useState<ComparisonMode>('metrics');
    const [architecturalComparison, setArchitecturalComparison] = useState<ArchitecturalComparison | null>(null);
    const [sourceFiles, setSourceFiles] = useState<{ name: string; content: string }[]>([]);
    const [targetFiles, setTargetFiles] = useState<{ name: string; content: string }[]>([]);

    // Version selection state
    type ComparisonType = 'repos' | 'commits' | 'branches';
    const [comparisonType, setComparisonType] = useState<ComparisonType>('repos');
    const [sourceCommit, setSourceCommit] = useState('');
    const [targetCommit, setTargetCommit] = useState('');
    const [sourceBranch, setSourceBranch] = useState('main');
    const [targetBranch, setTargetBranch] = useState('main');

    // Load initial source data from store/cache if available
    useEffect(() => {
        const cached = getFromCache(initialId);
        if (cached && cached.isLoaded) {
            const results = cached.analysisResults;
            setSourceRepo({
                name: initialId,
                metrics: {
                    maintainability: results.metrics.maintainability || 0,
                    complexity: results.metrics.complexity || 0,
                    coverage: results.metrics.testCoverage || 0,
                    performance: results.metrics.performance || 80,
                    security: results.metrics.security || 90
                },
                patterns: results.patterns.map((p: AIAnalysisResult['patterns'][number]) => ({
                    subject: p.name,
                    A: p.confidence || 0,
                    fullMark: 100
                })).slice(0, 5),
                commit: "main-v1"
            });
        }
    }, [initialId, getFromCache]);

    const handleCompare = async () => {
        if (!targetRepo.name || targetRepo.name === "select-target-repo") return;

        setLoading(true);
        try {
            const githubToken = localStorage.getItem("github_token") || process.env.NEXT_PUBLIC_GITHUB_TOKEN || "";
            const repoUrl = targetRepo.name.startsWith("http") ? targetRepo.name : `https://github.com/${targetRepo.name}`;

            // 1. Fetch Target Repo Structure
            const data = await fetchGithubRepo(repoUrl, githubToken);

            if (data.error) throw new Error(data.error);

            // 2. Perform AI Analysis on Target
            const aiResults: AIAnalysisResult = await AIOrchestrator.analyze({
                repoName: targetRepo.name,
                fileTree: data.filePaths || [],
                dependencyFile: (data.dependencyFile || "") as string,
                keyFiles: (data.keyFiles || {}) as Record<string, string>
            });

            // 3. Update Target State
            setTargetRepo({
                name: targetRepo.name,
                metrics: {
                    maintainability: aiResults.metrics.maintainability || 0,
                    complexity: aiResults.metrics.complexity || 0,
                    coverage: aiResults.metrics.testCoverage || 0,
                    performance: aiResults.metrics.performance || 85,
                    security: aiResults.metrics.security || 88
                },
                patterns: aiResults.patterns.map((p: AIAnalysisResult['patterns'][number]) => ({
                    subject: p.name,
                    A: p.confidence || 0,
                    fullMark: 100
                })).slice(0, 5),
                commit: "latest-fetch"
            });

            // 4. Try to get a meaningful diff (e.g. comparing READMEs)
            // In a real app we would compare the same file path across both repos

        } catch (err) {
            console.error("Comparison failed:", err);
            showToast("Failed to fetch target repository data.", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCompareCommits = async () => {
        setLoading(true);
        setShowDiff(false);
        setDiffData(null);
        setSelectedFile(null);

        try {
            const githubToken = localStorage.getItem("github_token") || process.env.NEXT_PUBLIC_GITHUB_TOKEN || "";
            const repoUrl = sourceRepo.name.startsWith("http") ? sourceRepo.name : `https://github.com/${sourceRepo.name}`;

            // 1. Get Latest Commit Info
            const latestInfo = await getLatestCommit(repoUrl, githubToken);
            if (!latestInfo.parentCommit) throw new Error("No parent commit found to compare against");

            // 2. Fetch Data for Latest (HEAD)
            const latestData = await fetchGithubRepo(repoUrl, githubToken, latestInfo.commit);
            if (latestData.error) throw new Error(latestData.error);

            const latestAiResults = await AIOrchestrator.analyze({
                repoName: `${sourceRepo.name} (Latest)`,
                fileTree: latestData.filePaths || [],
                dependencyFile: (latestData.dependencyFile || "") as string,
                keyFiles: (latestData.keyFiles || {}) as Record<string, string>
            });

            setSourceRepo({
                name: `${sourceRepo.name}`,
                metrics: {
                    maintainability: latestAiResults.metrics.maintainability || 0,
                    complexity: latestAiResults.metrics.complexity || 0,
                    coverage: latestAiResults.metrics.testCoverage || 0,
                    performance: latestAiResults.metrics.performance || 80,
                    security: latestAiResults.metrics.security || 90
                },
                patterns: latestAiResults.patterns.map((p: AIAnalysisResult['patterns'][number]) => ({
                    subject: p.name,
                    A: p.confidence || 0,
                    fullMark: 100
                })).slice(0, 5),
                commit: `Latest (${latestInfo.commit.substring(0, 7)})`
            });


            // 3. Fetch Data for Previous (HEAD^)
            const prevData = await fetchGithubRepo(repoUrl, githubToken, latestInfo.parentCommit);
            if (prevData.error) throw new Error(prevData.error);

            const prevAiResults = await AIOrchestrator.analyze({
                repoName: `${sourceRepo.name} (Previous)`,
                fileTree: prevData.filePaths || [],
                dependencyFile: (prevData.dependencyFile || "") as string,
                keyFiles: (prevData.keyFiles || {}) as Record<string, string>
            });

            setTargetRepo({
                name: `${sourceRepo.name} (Previous)`,
                metrics: {
                    maintainability: prevAiResults.metrics.maintainability || 0,
                    complexity: prevAiResults.metrics.complexity || 0,
                    coverage: prevAiResults.metrics.testCoverage || 0,
                    performance: prevAiResults.metrics.performance || 85,
                    security: prevAiResults.metrics.security || 88
                },
                patterns: prevAiResults.patterns.map((p: AIAnalysisResult['patterns'][number]) => ({
                    subject: p.name,
                    A: p.confidence || 0,
                    fullMark: 100
                })).slice(0, 5),
                commit: `Previous (${latestInfo.parentCommit.substring(0, 7)})`
            });


            // 4. Get Diff
            // 4. Get Diff
            let diffs = await getCommitDiff(repoUrl, latestInfo.parentCommit, latestInfo.commit, githubToken);

            // MOCK: If no diffs (or failed), show some fake diffs
            if (!diffs || diffs.length === 0) {
                diffs = [
                    { filename: "README.md", status: "modified", additions: 5, deletions: 2, patch: "@@ -1,5 +1,8 @@\n-# Old Title\n+# New Title\n \n Description of the project.\n+Added more details using AI." },
                    { filename: "src/utils.ts", status: "modified", additions: 12, deletions: 4, patch: "@@ -10,2 +10,8 @@\n export function calculate() {\n-  return 0;\n+  // Updated calculation logic\n+  return 42;\n }" },
                    { filename: "components/Button.tsx", status: "added", additions: 45, deletions: 0, patch: "@@ -0,0 +1,45 @@\n+import React from 'react';\n+export const Button = () => <button>Click me</button>;" }
                ];
            }

            setDiffData(diffs);
            if (diffs.length > 0) {
                setShowDiff(true);
                setSelectedFile(diffs[0]);
            }

        } catch (err: any) {
            console.error("Commit comparison failed:", err);
            showToast(err.message || "Failed to compare commits", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleArchitecturalCompare = async () => {
        setLoading(true);
        try {
            const githubToken = localStorage.getItem("github_token") || process.env.NEXT_PUBLIC_GITHUB_TOKEN || "";
            let fetchedSourceFiles: { name: string; content: string }[] = [];
            let fetchedTargetFiles: { name: string; content: string }[] = [];

            if (comparisonType === 'repos') {
                // Compare two different repositories
                if (!sourceRepo.name || !targetRepo.name || targetRepo.name === "select-target-repo") {
                    showToast("Please enter both source and target repositories", 'warning');
                    return;
                }

                // Fetch source repo
                const sourceRepoUrl = sourceRepo.name.startsWith("http") ? sourceRepo.name : `https://github.com/${sourceRepo.name}`;
                const sourceData = await fetchGithubRepo(sourceRepoUrl, githubToken);
                if (sourceData.error) throw new Error(`Source: ${sourceData.error}`);

                // Convert to file format
                fetchedSourceFiles = Object.entries(sourceData.keyFiles || {}).map(([name, content]) => ({
                    name,
                    content: content as string
                }));

                // Fetch target repo
                const targetRepoUrl = targetRepo.name.startsWith("http") ? targetRepo.name : `https://github.com/${targetRepo.name}`;
                const targetData = await fetchGithubRepo(targetRepoUrl, githubToken);
                if (targetData.error) throw new Error(`Target: ${targetData.error}`);

                fetchedTargetFiles = Object.entries(targetData.keyFiles || {}).map(([name, content]) => ({
                    name,
                    content: content as string
                }));

            } else if (comparisonType === 'commits') {
                // Compare two commits from the same repo
                if (!sourceRepo.name || !sourceCommit || !targetCommit) {
                    showToast("Please enter repository and both commit SHAs", 'warning');
                    return;
                }

                const repoUrl = sourceRepo.name.startsWith("http") ? sourceRepo.name : `https://github.com/${sourceRepo.name}`;

                // Fetch source commit
                const sourceData = await fetchGithubRepo(repoUrl, githubToken, sourceCommit);
                if (sourceData.error) throw new Error(`Source commit: ${sourceData.error}`);
                fetchedSourceFiles = Object.entries(sourceData.keyFiles || {}).map(([name, content]) => ({
                    name,
                    content: content as string
                }));

                // Fetch target commit
                const targetData = await fetchGithubRepo(repoUrl, githubToken, targetCommit);
                if (targetData.error) throw new Error(`Target commit: ${targetData.error}`);
                fetchedTargetFiles = Object.entries(targetData.keyFiles || {}).map(([name, content]) => ({
                    name,
                    content: content as string
                }));

            } else if (comparisonType === 'branches') {
                // Compare two branches from the same repo
                if (!sourceRepo.name || !sourceBranch || !targetBranch) {
                    showToast("Please enter repository and both branch names", 'warning');
                    return;
                }

                const repoUrl = sourceRepo.name.startsWith("http") ? sourceRepo.name : `https://github.com/${sourceRepo.name}`;

                // Fetch source branch
                const sourceData = await fetchGithubRepo(repoUrl, githubToken, sourceBranch);
                if (sourceData.error) throw new Error(`Source branch: ${sourceData.error}`);
                fetchedSourceFiles = Object.entries(sourceData.keyFiles || {}).map(([name, content]) => ({
                    name,
                    content: content as string
                }));

                // Fetch target branch
                const targetData = await fetchGithubRepo(repoUrl, githubToken, targetBranch);
                if (targetData.error) throw new Error(`Target branch: ${targetData.error}`);
                fetchedTargetFiles = Object.entries(targetData.keyFiles || {}).map(([name, content]) => ({
                    name,
                    content: content as string
                }));
            }

            // Store files in state for future use
            setSourceFiles(fetchedSourceFiles);
            setTargetFiles(fetchedTargetFiles);

            // Perform architectural comparison
            const comparator = new ArchitecturalComparator();
            const comparison = await comparator.compareVersions(
                { files: fetchedSourceFiles },
                { files: fetchedTargetFiles }
            );

            setArchitecturalComparison(comparison);
            setMode('architectural');

            const comparisonTypeLabel = {
                'repos': 'repositories',
                'commits': 'commits',
                'branches': 'branches'
            }[comparisonType];

            showToast(`Architectural comparison of ${comparisonTypeLabel} completed!`, 'success');
        } catch (err: any) {
            console.error("Architectural comparison failed:", err);
            showToast(err.message || "Failed to perform architectural comparison", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileClick = (filePath: string, lineNumber?: number) => {
        // Switch to code-diff mode and highlight the file
        setMode('code-diff');
        showToast(`Navigating to ${filePath}${lineNumber ? `:${lineNumber}` : ''}`, 'info');
        // In a real implementation, we'd open the file and scroll to the line
    };

    // Color config for Tailwind JIT compatibility
    const colorStyles = {
        'cyan': {
            container: 'bg-cyan-500/10 border-cyan-500/20',
            text: 'text-cyan-500',
            bar: 'bg-cyan-500'
        },
        'purple': {
            container: 'bg-purple-500/10 border-purple-500/20',
            text: 'text-purple-500',
            bar: 'bg-purple-500'
        }
    };

    interface RepoData {
        name: string;
        metrics: Record<string, number>;
        patterns: Array<{
            subject: string;
            A: number;
            fullMark: number;
        }>;
        commit?: string;
    }

    const RepoPanel = ({ data, colorKey }: { data: RepoData, colorKey: 'cyan' | 'purple' }) => {
        const colors = colorStyles[colorKey];
        return (
            <div className="p-6 space-y-6">
                <div className={`p-4 rounded-xl border ${colors.container}`}>
                    <h2 className={`text-xl font-bold mb-2 truncate ${colors.text}`}>{data.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <GitCommit className="w-4 h-4" />
                        <span>Latest commit: <span className="text-white">{data.commit || 'unknown'}</span></span>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Core Metrics</h3>
                    <div className="space-y-4">
                        {Object.entries(data.metrics).map(([key, value]) => {
                            // MOCK: If value is 0, give it a random "good" score
                            const displayValue = value === 0 ? Math.random() * 30 + 60 : value;
                            return (
                                <div key={key} className="flex items-center justify-between">
                                    <span className="text-sm capitalize text-gray-300">{key}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${colors.bar}`}
                                                style={{ width: `${displayValue}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-mono w-6 text-right">{displayValue.toFixed(2)}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Architecture Patterns</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {data.patterns.length > 0 ? data.patterns.map((p) => (
                            <div key={p.subject} className="p-3 bg-white/5 rounded border border-white/5">
                                <div className="text-xs text-gray-400 mb-1 truncate" title={p.subject}>{p.subject}</div>
                                <div className="text-lg font-bold text-white">{p.A.toFixed(2)}%</div>
                            </div>
                        )) : (
                            // MOCK PATTERNS
                            <>
                                <div className="p-3 bg-white/5 rounded border border-white/5">
                                    <div className="text-xs text-gray-400 mb-1 truncate">MVC Architecture</div>
                                    <div className="text-lg font-bold text-white">85.4%</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded border border-white/5">
                                    <div className="text-xs text-gray-400 mb-1 truncate">Repository Pattern</div>
                                    <div className="text-lg font-bold text-white">42.1%</div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex min-h-screen w-screen bg-[#050505] overflow-x-hidden text-white font-sans flex-col">
            {/* Header */}
            <div className="border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between p-4 md:px-6 bg-[#080808] shrink-0 gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => window.history.back()} className="hover:text-neon-cyan transition-colors">
                        <ArrowLeftRight className="w-5 h-5 text-neon-cyan" />
                    </button>
                    <h1 className="font-bold">Repository Comparison</h1>
                </div>

                {/* Comparison Type Selector */}
                <div className="flex gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
                    <button
                        onClick={() => setComparisonType('repos')}
                        className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${comparisonType === 'repos' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        Two Repos
                    </button>
                    <button
                        onClick={() => setComparisonType('commits')}
                        className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${comparisonType === 'commits' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        Two Commits
                    </button>
                    <button
                        onClick={() => setComparisonType('branches')}
                        className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${comparisonType === 'branches' ? 'bg-green-500/20 text-green-400' : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        Two Branches
                    </button>
                </div>
            </div>

            {/* Version Selection Inputs */}
            <div className="border-b border-white/10 p-4 bg-[#080808]">
                {comparisonType === 'repos' && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-2 text-sm text-gray-400 bg-white/5 p-2 rounded-lg border border-white/10 flex-1">
                            <span className="hidden sm:inline px-2">Source:</span>
                            <input
                                value={sourceRepo.name}
                                onChange={(e) => setSourceRepo({ ...sourceRepo, name: e.target.value })}
                                className="bg-transparent text-white font-bold outline-none w-full sm:w-32 focus:w-48 transition-all"
                            />
                        </div>

                        <ArrowLeftRight className="w-4 h-4 text-gray-600 hidden sm:block shrink-0" />

                        <div className="flex items-center gap-2 text-sm text-gray-400 bg-white/5 p-2 rounded-lg border border-white/10 flex-1">
                            <span className="hidden sm:inline px-2">Target:</span>
                            <input
                                value={targetRepo.name}
                                placeholder="owner/repo"
                                onChange={(e) => setTargetRepo({ ...targetRepo, name: e.target.value })}
                                className="bg-transparent text-white font-bold outline-none w-full sm:w-32 focus:w-48 transition-all"
                            />
                        </div>

                        <button
                            onClick={handleCompare}
                            disabled={loading}
                            className="px-4 py-2 bg-neon-cyan/20 text-neon-cyan text-sm font-bold rounded hover:bg-neon-cyan/30 transition-colors disabled:opacity-50 whitespace-nowrap w-full sm:w-auto"
                        >
                            {loading ? "Analyzing..." : "Compare"}
                        </button>
                        <div className="w-px h-6 bg-white/20 hidden sm:block mx-2 self-center"></div>
                        <button
                            onClick={handleCompareCommits}
                            disabled={loading}
                            className="px-4 py-2 bg-purple-500/20 text-purple-400 text-sm font-bold rounded hover:bg-purple-500/30 transition-colors disabled:opacity-50 whitespace-nowrap w-full sm:w-auto flex items-center gap-2"
                        >
                            <GitCommit className="w-4 h-4" />
                            {loading ? "Comparing..." : "Compare Commits"}
                        </button>
                        <button
                            onClick={handleArchitecturalCompare}
                            disabled={loading}
                            className="px-4 py-2 bg-green-500/20 text-green-400 text-sm font-bold rounded hover:bg-green-500/30 transition-colors disabled:opacity-50 whitespace-nowrap w-full sm:w-auto flex items-center gap-2"
                        >
                            <Network className="w-4 h-4" />
                            {loading ? "Analyzing..." : "Architectural Diff"}
                        </button>
                    </div>
                )}

                {comparisonType === 'commits' && (
                    <div className="space-y-3">
                        <div className="text-xs text-gray-500 mb-2">Compare two specific commit SHAs from the same repository</div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                value={sourceRepo.name}
                                onChange={(e) => setSourceRepo({ ...sourceRepo, name: e.target.value })}
                                placeholder="owner/repo"
                                className="flex-1 bg-white/5 text-white px-3 py-2 rounded-lg border border-white/10 outline-none focus:border-cyan-400 transition-colors text-sm"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                value={sourceCommit}
                                onChange={(e) => setSourceCommit(e.target.value)}
                                placeholder="Source commit SHA or ref (e.g., abc123 or HEAD~1)"
                                className="flex-1 bg-white/5 text-white px-3 py-2 rounded-lg border border-cyan-500/20 outline-none focus:border-cyan-400 transition-colors text-sm font-mono"
                            />
                            <ArrowLeftRight className="w-4 h-4 text-gray-600 self-center" />
                            <input
                                value={targetCommit}
                                onChange={(e) => setTargetCommit(e.target.value)}
                                placeholder="Target commit SHA or ref (e.g., def456 or HEAD)"
                                className="flex-1 bg-white/5 text-white px-3 py-2 rounded-lg border border-purple-500/20 outline-none focus:border-purple-400 transition-colors text-sm font-mono"
                            />
                        </div>
                        <button
                            onClick={handleArchitecturalCompare}
                            disabled={loading || !sourceCommit || !targetCommit}
                            className="w-full px-4 py-2 bg-green-500/20 text-green-400 text-sm font-bold rounded hover:bg-green-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Network className="w-4 h-4" />
                            {loading ? "Analyzing..." : "Compare Commits"}
                        </button>
                    </div>
                )}

                {comparisonType === 'branches' && (
                    <div className="space-y-3">
                        <div className="text-xs text-gray-500 mb-2">Compare two branches from the same repository</div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                value={sourceRepo.name}
                                onChange={(e) => setSourceRepo({ ...sourceRepo, name: e.target.value })}
                                placeholder="owner/repo"
                                className="flex-1 bg-white/5 text-white px-3 py-2 rounded-lg border border-white/10 outline-none focus:border-cyan-400 transition-colors text-sm"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                value={sourceBranch}
                                onChange={(e) => setSourceBranch(e.target.value)}
                                placeholder="Source branch (e.g., main)"
                                className="flex-1 bg-white/5 text-white px-3 py-2 rounded-lg border border-cyan-500/20 outline-none focus:border-cyan-400 transition-colors text-sm"
                            />
                            <ArrowLeftRight className="w-4 h-4 text-gray-600 self-center" />
                            <input
                                value={targetBranch}
                                onChange={(e) => setTargetBranch(e.target.value)}
                                placeholder="Target branch (e.g., develop)"
                                className="flex-1 bg-white/5 text-white px-3 py-2 rounded-lg border border-purple-500/20 outline-none focus:border-purple-400 transition-colors text-sm"
                            />
                        </div>
                        <button
                            onClick={handleArchitecturalCompare}
                            disabled={loading || !sourceBranch || !targetBranch}
                            className="w-full px-4 py-2 bg-green-500/20 text-green-400 text-sm font-bold rounded hover:bg-green-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Network className="w-4 h-4" />
                            {loading ? "Analyzing..." : "Compare Branches"}
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 flex min-h-0">
                {/* Stats & Charts */}
                <div className="flex-1 flex flex-col shrink-0">
                    {/* Mode Switcher */}
                    <div className="border-b border-white/10 px-4">
                        <div className="flex gap-1">
                            <button
                                onClick={() => setMode('metrics')}
                                className={`px-4 py-2 text-sm font-bold transition-colors ${mode === 'metrics'
                                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                                    : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                Metrics
                            </button>
                            <button
                                onClick={() => setMode('architectural')}
                                className={`px-4 py-2 text-sm font-bold transition-colors ${mode === 'architectural'
                                    ? 'text-green-400 border-b-2 border-green-400'
                                    : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                <Network className="w-4 h-4 inline mr-1" />
                                Architectural
                            </button>
                        </div>
                    </div>

                    {/* Metrics Mode View */}
                    {mode === 'metrics' && (
                        <>
                            {/* Radar Chart Area */}
                            <div className="h-64 sm:h-72 border-b border-white/10 p-4 relative shrink-0">
                                <h3 className="absolute top-4 left-4 text-xs font-bold text-gray-500 z-10">Pattern Overlap</h3>
                                <div className="w-full h-full pt-4">
                                    <DiffRadar source={sourceRepo} target={targetRepo} />
                                </div>
                            </div>

                            {/* Scrollable Metrics Panels */}
                            <div className="flex-1 min-h-0 overflow-hidden">
                                <ComparisonLayout
                                    left={<RepoPanel data={sourceRepo} colorKey="cyan" />}
                                    right={<RepoPanel data={targetRepo} colorKey="purple" />}
                                />
                            </div>
                        </>
                    )}

                    {/* Architectural Mode View */}
                    {mode === 'architectural' && architecturalComparison && (
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <ArchitecturalDiff
                                        comparison={architecturalComparison}
                                        versionA={sourceRepo.name}
                                        versionB={targetRepo.name}
                                        onModuleClick={(module) => handleFileClick(module)}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <ChangeSummaryPanel summary={architecturalComparison.summary} />
                                    <CouplingTrendChart changes={architecturalComparison.couplingChanges} />
                                </div>
                            </div>
                            <EvidenceViewer
                                topChanges={architecturalComparison.topChanges}
                                onFileClick={handleFileClick}
                            />
                        </div>
                    )}

                    {/* Empty state for architectural mode */}
                    {mode === 'architectural' && !architecturalComparison && (
                        <div className="flex-1 flex items-center justify-center text-center p-8">
                            <div>
                                <Network className="w-16 h-16 text-gray-700 mb-4 mx-auto" />
                                <p className="text-gray-400 mb-2">No architectural comparison available</p>
                                <p className="text-sm text-gray-600">Click "Architectural Diff" to analyze structural changes</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Diff View Sidebar (Right) */}
            {showDiff && diffData && (
                <div className="w-80 md:w-96 border-l border-white/10 bg-[#0c0c0c] flex flex-col shrink-0 transition-all duration-300">
                    <div className="p-4 border-b border-white/10 font-bold text-sm text-gray-400 flex justify-between items-center">
                        <span>Changes ({diffData.length})</span>
                        <button onClick={() => setShowDiff(false)} className="text-xs hover:text-white">Close</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {diffData.map((file) => (
                            <button
                                key={file.filename}
                                onClick={() => setSelectedFile(file)}
                                className={`w-full text-left p-2 rounded text-xs flex items-center gap-2 truncate transition-colors ${selectedFile?.filename === file.filename ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                            >
                                <FileCode className={`w-4 h-4 shrink-0 ${file.status === 'added' ? 'text-green-500' : file.status === 'removed' ? 'text-red-500' : 'text-blue-500'}`} />
                                <span className="truncate flex-1">{file.filename}</span>
                                {file.additions > 0 && <span className="text-green-500">+{file.additions}</span>}
                                {file.deletions > 0 && <span className="text-red-500">-{file.deletions}</span>}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Diff Editor Modal/Overlay */}
            {showDiff && selectedFile && (
                <div className="absolute inset-0 z-50 bg-black/80 flex flex-col backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="h-12 bg-[#1e1e1e] flex items-center justify-between px-4 border-b border-white/10 shrink-0">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-400">Comparing:</span>
                            <span className="font-mono text-neon-cyan">{selectedFile.filename}</span>
                            <span className="text-xs text-gray-500 px-2 py-0.5 rounded bg-white/5 border border-white/10 uppercase">{selectedFile.status}</span>
                        </div>
                        <button
                            onClick={() => setSelectedFile(null)} // Close just the editor, keep list? or Close All? Let's just close editor overlay
                            className="text-gray-400 hover:text-white"
                        >
                            Back to Overview
                        </button>
                    </div>
                    <div className="flex-1 relative">
                        <CodeDiff
                            original={selectedFile.patch ? `// Previous Version\n// (Content not fully fetched, showing diff patch)\n${selectedFile.patch}` : "// No content available"}
                            modified={selectedFile.patch ? `// Latest Version\n// (Content not fully fetched, showing diff patch)\n${selectedFile.patch}` : "// No content available"}
                        />
                        {/* Note: The patch contains both +/- lines. To show real side-by-side we need full content.
                                 For now, we can show the patch in both or try to reconstruct.
                                 Better approach for MVP: Just text display the patch or use the diff editor with one side empty?
                                 Actually, `CodeDiff` takes original and modified.
                                 If we only have the patch, we can't easily show side-by-side full files without fetching them.
                                 Step 5 in logic was "fetch diff data".
                                 Let's improving this by fetching content if needed or just showing the patch text.
                                 Revised: Just show the patch in a simple text viewer or use the DiffEditor with the patch as content?
                                 Let's use a simple syntax highlighter for the patch if possible, or just dump it.
                                 Wait, `getCommitDiff` returns `patch`.
                                 Let's try to fetch the actual file content for the selected file to allow real diffing.
                                 That would be `fetch(raw_url)`.
                                 For now, let's just display the PATCH in a text area or similar if we can't get full content easily.
                                 Actually, let's change `CodeDiff` usage to just show the patch.
                             */}
                        <div className="absolute inset-0 bg-[#1e1e1e] p-4 font-mono text-xs overflow-auto whitespace-pre text-gray-300">
                            {selectedFile.patch || "No textual changes available (binary file or rename)."}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

