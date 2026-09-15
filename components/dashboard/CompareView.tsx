"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { AIOrchestrator } from "@/lib/ai/AIOrchestrator";
import { fetchGithubRepo, getLatestCommit, getCommitDiff, DiffFile, getCommits } from "@/lib/githubFetcher";
import { AIAnalysisResult } from "@/lib/ai/AIClient";
import ComparisonLayout from "@/components/compare/ComparisonLayout";
import { ArrowLeftRight, GitCommit, FileCode, History, CheckCircle2, AlertCircle } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/lib/ToastContext";
import CodeDiff from "@/components/compare/CodeDiff";
import { Copy, FileText, LayoutDashboard, Play, X } from "lucide-react";
import { useRepoStore } from "@/lib/RepoStore";
import SimpleInsightChat from "@/components/compare/SimpleInsightChat";
import { ArchitecturalComparator, ArchitecturalComparison } from "@/lib/analyzer/ArchitecturalComparator";
import { Network } from "lucide-react";
import ArchitecturalDiff from "@/components/compare/ArchitecturalDiff";
import ChangeSummaryPanel from "@/components/compare/ChangeSummaryPanel";
import EvidenceViewer from "@/components/compare/EvidenceViewer";
import CouplingTrendChart from "@/components/compare/CouplingTrendChart";

const DiffRadar = dynamic(() => import("@/components/compare/DiffRadar"), {
    loading: () => <Skeleton className="w-full h-64" />,
    ssr: false
});

import { RepoData as GlobalRepoData } from "@/lib/RepoStore";

interface ComparisonRepoSnapshot {
    name: string;
    metrics: Record<string, number>;
    patterns: Array<{
        subject: string;
        A: number;
        fullMark: number;
    }>;
    issues?: Array<{ id: string, title: string, severity: string }>;
    commit?: string;
    commitDate?: string;
}

interface CompareViewProps {
    sourceRepoName: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sourceMetrics: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sourcePatterns: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sourceIssues?: any[];
}

export default function CompareView({ sourceRepoName, sourceMetrics, sourcePatterns, sourceIssues }: CompareViewProps) {
    const { showToast } = useToast();

    const [sourceRepo, setSourceRepo] = useState<ComparisonRepoSnapshot>({
        name: sourceRepoName,
        metrics: { maintainability: 0, complexity: 0, coverage: 0, performance: 0, security: 0 },
        patterns: [],
        issues: sourceIssues || [],
        commit: "Current Analysis"
    });

    const [targetRepo, setTargetRepo] = useState<ComparisonRepoSnapshot>({
        name: "Select Version",
        metrics: { maintainability: 0, complexity: 0, coverage: 0, performance: 0, security: 0 },
        patterns: [],
        issues: [],
        commit: "..."
    });

    const [commits, setCommits] = useState<any[]>([]);
    const [selectedCommit, setSelectedCommit] = useState("");
    const [targetCommit, setTargetCommit] = useState("");
    const [branches, setBranches] = useState<string[]>([]);
    const [sourceBranch, setSourceBranch] = useState("main");
    const [targetBranch, setTargetBranch] = useState("");
    const [loading, setLoading] = useState(false);

    // Comparison Mode
    type ComparisonType = 'commits' | 'branches' | 'zip';
    const [comparisonType, setComparisonType] = useState<ComparisonType>('commits');
    const [architecturalComparison, setArchitecturalComparison] = useState<ArchitecturalComparison | null>(null);

    // Global Store
    const { data, setData, saveToCache } = useRepoStore();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Tab State
    const [sidebarTab, setSidebarTab] = useState<'files' | 'insights'>('files');
    const [mainTab, setMainTab] = useState<string>('overview'); // 'overview' or file path
    const [openFiles, setOpenFiles] = useState<string[]>([]);

    // Caching
    const analysisCache = useRef<Map<string, {
        diffData: DiffFile[],
        fixedIssues: any[],
        newIssues: any[],
        comparisonInsight: string,
        targetRepo?: ComparisonRepoSnapshot
    }>>(new Map());

    // Analysis Results
    const [diffData, setDiffData] = useState<DiffFile[] | null>(null);
    const [analyzedCommit, setAnalyzedCommit] = useState<string | null>(null); // To track which commit is currently shown

    // Sidebar Resize State
    const [sidebarWidth, setSidebarWidth] = useState(400);
    const isResizingRef = useRef(false);

    const startResizing = (mouseDownEvent: React.MouseEvent) => {
        isResizingRef.current = true;
        document.body.style.cursor = 'col-resize';

        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingRef.current) return;
            // Sidebar is on the right, so width is (document width - mouse X)
            const newWidth = document.body.clientWidth - e.clientX;
            setSidebarWidth(Math.max(250, Math.min(newWidth, 800)));
        };

        const stopResizing = () => {
            isResizingRef.current = false;
            document.body.style.cursor = 'default';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', stopResizing);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopResizing);
    };

    // Issue Comparison State
    const [fixedIssues, setFixedIssues] = useState<any[]>([]);
    const [newIssues, setNewIssues] = useState<any[]>([]);

    // AI Insight State
    const [comparisonInsight, setComparisonInsight] = useState<string>("");
    const [insightLoading, setInsightLoading] = useState(false);

    // Initialize source data
    useEffect(() => {
        setSourceRepo({
            name: sourceRepoName,
            metrics: {
                maintainability: sourceMetrics?.maintainability || 0,
                complexity: sourceMetrics?.complexity || 0,
                coverage: sourceMetrics?.testCoverage || 0,
                performance: sourceMetrics?.performance || 80,
                security: sourceMetrics?.security || 90
            },
            patterns: sourcePatterns?.map((p: any) => ({
                subject: p.name,
                A: p.confidence || 0,
                fullMark: 100
            })).slice(0, 5) || [],
            issues: sourceIssues || [],
            commit: "Current Analysis"
        });
    }, [sourceRepoName, sourceMetrics, sourcePatterns, sourceIssues]);

    // Helper to detect local path vs GitHub
    const isLocalRepo = (name: string) => name.includes('\\') || name.startsWith('/') || name === 'local';

    // Load form Persistent Store on Mount AND URL Params
    useEffect(() => {
        if (data && data.comparisonState) {
            const state = data.comparisonState;
            setDiffData(state.diffData || []);
            setFixedIssues(state.fixedIssues || []);
            setNewIssues(state.newIssues || []);
            setComparisonInsight(state.comparisonInsight);
            setAnalyzedCommit(state.analyzedCommit);
            setSelectedCommit(state.selectedCommit);

            // Restore new fields
            if (state.comparisonType) setComparisonType(state.comparisonType);
            if (state.sourceBranch) setSourceBranch(state.sourceBranch);
            if (state.targetBranch) setTargetBranch(state.targetBranch);

            // Restore Target Repo if stored
            if (state.targetRepo) {
                setTargetRepo(state.targetRepo);
            }

            // Restore Architectural Comparison
            if (state.architecturalComparison) {
                setArchitecturalComparison(state.architecturalComparison);
            }

            // Restore Open Files
            if (state.openFiles) {
                setOpenFiles(state.openFiles);
            }

            // Populate cache as well to avoid re-fetch if they click 'Run' again on same commit
            const cacheKey = `${data.repoName}-${state.selectedCommit}`;
            analysisCache.current.set(cacheKey, {
                diffData: state.diffData,
                fixedIssues: state.fixedIssues,
                newIssues: state.newIssues,
                comparisonInsight: state.comparisonInsight,
                targetRepo: state.targetRepo
            });
        }

        // URL Params Logic (Optimization: Only if not already loaded from store or to override?)
        // Let's allow URL params to override store if present
        const typeParam = searchParams.get('compareType') as ComparisonType;
        const sourceCommitParam = searchParams.get('sourceCommit');
        const targetCommitParam = searchParams.get('targetCommit');
        const sourceBranchParam = searchParams.get('sourceBranch');
        const targetBranchParam = searchParams.get('targetBranch');

        if (typeParam) setComparisonType(typeParam);
        if (sourceCommitParam) setSelectedCommit(sourceCommitParam);
        if (targetCommitParam) setTargetCommit(targetCommitParam);
        if (sourceBranchParam) setSourceBranch(sourceBranchParam);
        if (targetBranchParam) setTargetBranch(targetBranchParam);

    }, [data, searchParams]); // Run when data is loaded

    // 2. Fetch Commits
    useEffect(() => {
        const loadCommits = async () => {
            if (!sourceRepoName) return;
            try {
                // STRATEGY: Try Local Git API first (save API quota), fallback to GitHub API

                // 1. Try Local API (using repoUrl to let API resolve path)
                try {
                    const res = await fetch('/api/git/commits', {
                        method: 'POST',
                        body: JSON.stringify({ repoUrl: sourceRepoName, limit: 15 })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        if (data.commits && data.commits.length > 0) {
                            setCommits(data.commits);
                            console.log("Loaded commits from local git history.");
                            return; // Success! Stop here.
                        }
                    } else {
                        // If 404, it means not cloned locally yet. We fallback to GitHub.
                        console.log("Local git history not found, falling back to GitHub API.");
                    }
                } catch (localErr) {
                    console.warn("Local git fetch failed:", localErr);
                }

                // 2. Fallback to GitHub API (if local failed)
                const isLocal = isLocalRepo(sourceRepoName);
                if (isLocal) {
                    // If it was explicitly a local path and failed above, we can't do much.
                    // Retry with repoPath if strictly local? 
                    // The API handles both now.
                    console.warn("Local repo commit fetch failed.");
                } else {
                    // GitHub API
                    const token = localStorage.getItem("github_token") || process.env.NEXT_PUBLIC_GITHUB_TOKEN || "";
                    try {
                        const history = await getCommits(sourceRepoName, token, 15);
                        if (history.length === 0) {
                            showToast(`No commits found. Is this a new repo?`, 'warning');
                        }
                        setCommits(history);
                    } catch (ghError: any) {
                        console.error("GitHub Fetch Error:", ghError.message);
                        if (ghError.message.includes("401") || ghError.message.includes("Unauthorized")) {
                            showToast("Missing/Invalid GitHub Token. Please configure in Settings.", 'error');
                        } else if (ghError.message.includes("403") || ghError.message.includes("Rate Limit")) {
                            showToast("GitHub Rate Limit Exceeded. Please clone the repo locally first by running an analysis.", 'error');
                        } else {
                            showToast(`Failed to load history: ${ghError.message}`, 'error');
                        }
                    }
                }
            } catch (err: any) {
                console.error("❌ Failed to load commits:", err);
            }
        };
        if (sourceRepoName) loadCommits();
    }, [sourceRepoName]);

    // Fetch branches
    useEffect(() => {
        const fetchBranches = async () => {
            if (!sourceRepoName) return;

            console.log('🔍 Fetching branches for:', sourceRepoName);

            try {
                const token = localStorage.getItem("github_token") || process.env.NEXT_PUBLIC_GITHUB_TOKEN || "";

                if (!token) {
                    console.warn('No GitHub token found');
                    showToast('GitHub token not configured. Please add it in Settings.', 'warning');
                    return;
                }

                const response = await fetch(`https://api.github.com/repos/${sourceRepoName}/branches`, {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (response.ok) {
                    const branchData = await response.json();
                    const branchNames = branchData.map((b: any) => b.name);
                    console.log('✅ Found branches:', branchNames);
                    setBranches(branchNames);

                    // Set default source branch if main exists
                    if (branchNames.includes('main')) {
                        setSourceBranch('main');
                    } else if (branchNames.includes('master')) {
                        setSourceBranch('master');
                    } else if (branchNames.length > 0) {
                        setSourceBranch(branchNames[0]);
                    }

                    showToast(`Found ${branchNames.length} branch${branchNames.length !== 1 ? 'es' : ''}`, 'success');
                } else if (response.status === 401) {
                    console.error('GitHub authentication failed');
                    showToast('Invalid GitHub token. Please update it in Settings.', 'error');
                } else if (response.status === 404) {
                    console.error('Repository not found');
                    showToast('Repository not found. Check the repository name.', 'error');
                } else {
                    const errorText = await response.text();
                    console.error('Failed to fetch branches:', response.status, errorText);
                    showToast(`Failed to fetch branches: ${response.statusText}`, 'error');
                }
            } catch (error: any) {
                console.error('❌ Branch fetch error:', error);
                showToast(`Error fetching branches: ${error.message}`, 'error');
            }
        };
        fetchBranches();
    }, [sourceRepoName]);


    // Helper: Calculate diffs locally if API fails
    const calculateLocalDiff = (filesA: { name: string; content: string }[], filesB: { name: string; content: string }[]): DiffFile[] => {
        const diffs: DiffFile[] = [];
        const mapA = new Map(filesA.map(f => [f.name, f.content]));
        const mapB = new Map(filesB.map(f => [f.name, f.content]));

        // Check for modified and removed files
        mapA.forEach((contentA, name) => {
            if (!mapB.has(name)) {
                diffs.push({
                    filename: name,
                    status: 'removed',
                    additions: 0,
                    deletions: contentA.split('\n').length,
                    originalContent: contentA,
                    modifiedContent: undefined
                });
            } else {
                const contentB = mapB.get(name)!;
                if (contentA !== contentB) {
                    diffs.push({
                        filename: name,
                        status: 'modified',
                        additions: 0, // Simplified
                        deletions: 0, // Simplified
                        originalContent: contentA,
                        modifiedContent: contentB
                    });
                }
            }
        });

        // Check for added files
        mapB.forEach((contentB, name) => {
            if (!mapA.has(name)) {
                diffs.push({
                    filename: name,
                    status: 'added',
                    additions: contentB.split('\n').length,
                    deletions: 0,
                    originalContent: undefined,
                    modifiedContent: contentB
                });
            }
        });

        return diffs;
    };

    // 4. Manual Trigger Handler
    const handleRunAnalysis = async () => {
        setLoading(true);
        setAnalyzedCommit(null);
        setDiffData(null);
        setArchitecturalComparison(null);
        setMainTab('overview');

        try {
            console.log('🚀 Starting comparison...');
            const token = localStorage.getItem("github_token") || process.env.NEXT_PUBLIC_GITHUB_TOKEN || "";
            let versionAFiles: { name: string; content: string }[] = [];
            let versionBFiles: { name: string; content: string }[] = [];
            let versionALabel = "";
            let versionBLabel = "";

            // Fetch files based on comparison mode
            if (comparisonType === 'commits') {
                if (!selectedCommit || !targetCommit) {
                    showToast("Please select both commits", 'error');
                    setLoading(false);
                    return;
                }

                console.log('📦 Fetching commit snapshots...');

                // Fetch Version A (source commit) with timeout
                const resA = await Promise.race([
                    fetch('/api/git/snapshot', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            repoUrl: sourceRepoName,
                            sha: selectedCommit
                        })
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout fetching version A (60s limit)')), 60000))
                ]) as Response;

                if (!resA.ok) {
                    throw new Error(`Failed to fetch version A: ${resA.statusText}`);
                }

                const snapshotA = await resA.json();
                // CRITICAL FIX: Only include files that have content
                versionAFiles = Object.entries(snapshotA.keyFiles || {}).map(([path, content]) => ({
                    name: path,
                    content: content as string
                }));
                console.log(`✅ Version A: ${versionAFiles.length} files with content`);
                versionALabel = selectedCommit.substring(0, 7);

                // Fetch Version B (target commit) with timeout
                const resB = await Promise.race([
                    fetch('/api/git/snapshot', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            repoUrl: sourceRepoName,
                            sha: targetCommit
                        })
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout fetching version B (60s limit)')), 60000))
                ]) as Response;

                if (!resB.ok) {
                    throw new Error(`Failed to fetch version B: ${resB.statusText}`);
                }

                const snapshotB = await resB.json();
                // CRITICAL FIX: Only include files that have content
                versionBFiles = Object.entries(snapshotB.keyFiles || {}).map(([path, content]) => ({
                    name: path,
                    content: content as string
                }));
                console.log(`✅ Version B: ${versionBFiles.length} files with content`);
                versionBLabel = targetCommit.substring(0, 7);

            } else if (comparisonType === 'branches') {
                if (!sourceBranch || !targetBranch) {
                    showToast("Please select both branches", 'error');
                    setLoading(false);
                    return;
                }

                console.log(`📦 Fetching branch snapshots: ${sourceBranch} vs ${targetBranch}...`);

                // Fetch Version A (source branch) with timeout
                const resA = await Promise.race([
                    fetch('/api/git/snapshot', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ repoUrl: sourceRepoName, branch: sourceBranch })
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout fetching source branch (60s limit)')), 60000))
                ]) as Response;

                if (!resA.ok) {
                    const errorData = await resA.json();
                    throw new Error(errorData.error || `Failed to fetch branch ${sourceBranch}`);
                }

                const snapshotA = await resA.json();
                // CRITICAL FIX: Only include files that have content
                versionAFiles = Object.entries(snapshotA.keyFiles || {}).map(([path, content]) => ({
                    name: path,
                    content: content as string
                }));
                console.log(`✅ Branch ${sourceBranch}: ${versionAFiles.length} files with content`);
                versionALabel = sourceBranch;

                // Fetch Version B (target branch) with timeout
                const resB = await Promise.race([
                    fetch('/api/git/snapshot', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ repoUrl: sourceRepoName, branch: targetBranch })
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout fetching target branch (60s limit)')), 60000))
                ]) as Response;

                if (!resB.ok) {
                    const errorData = await resB.json();
                    throw new Error(errorData.error || `Failed to fetch branch ${targetBranch}`);
                }

                const snapshotB = await resB.json();
                // CRITICAL FIX: Only include files that have content
                versionBFiles = Object.entries(snapshotB.keyFiles || {}).map(([path, content]) => ({
                    name: path,
                    content: content as string
                }));
                console.log(`✅ Branch ${targetBranch}: ${versionBFiles.length} files with content`);
                versionBLabel = targetBranch;
            }



            // Run all analyses in parallel
            console.log("🔍 Running comprehensive analysis...");
            const comparator = new ArchitecturalComparator();

            // Wait for core data
            const [comparison, diffs, analysisA, analysisB] = await Promise.all([
                // 1. Architectural Comparison
                Promise.race([
                    comparator.compareVersions(
                        { files: versionAFiles },
                        { files: versionBFiles }
                    ),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Comparison timeout')), 60000))
                ]) as Promise<ArchitecturalComparison>,

                // 2. Code Diff (Try API, fallback to basic local diff)
                getCommitDiff(sourceRepoName, versionALabel, versionBLabel, token)
                    .then(diffs => {
                        if (diffs.length === 0) throw new Error("No diffs from API");
                        return diffs;
                    })
                    .catch(() => {
                        console.warn("⚠️ Diff API failed or empty, using local fallback");
                        return calculateLocalDiff(versionAFiles, versionBFiles);
                    }),

                // 3. AI Analysis for Version A
                AIOrchestrator.analyze({
                    repoName: sourceRepoName,
                    fileTree: versionAFiles.map(f => f.name),
                    keyFiles: versionAFiles.reduce((acc, f) => ({ ...acc, [f.name]: f.content }), {}),
                    dependencyFile: ""
                }),

                // 4. AI Analysis for Version B
                AIOrchestrator.analyze({
                    repoName: sourceRepoName,
                    fileTree: versionBFiles.map(f => f.name),
                    keyFiles: versionBFiles.reduce((acc, f) => ({ ...acc, [f.name]: f.content }), {}),
                    dependencyFile: ""
                })
            ]);

            console.log("✅ Analysis complete");
            console.log(`- Architecture: ${comparison.moduleChanges.length} changes`);
            console.log(`- Diffs: ${diffs.length} files`);

            // 5. Generate AI Insight Comparison (Separate step to not block UI)
            setInsightLoading(true);
            // Note: compareVersions expects (New/Source, Old/Target). 
            // versionB is usually Head (New), versionA is Base (Old).
            AIOrchestrator.compareVersions(analysisB, analysisA, sourceRepoName)
                .then(insight => {
                    setComparisonInsight(insight);
                    setInsightLoading(false);

                    // Update Store with Insight (Functional update to ensure we have latest state)
                    setData(((prevData: GlobalRepoData | null) => {
                        if (!prevData || !prevData.comparisonState) return prevData;
                        const updatedData = {
                            ...prevData,
                            comparisonState: {
                                ...prevData.comparisonState,
                                comparisonInsight: insight
                            }
                        };
                        saveToCache(prevData.repoName, updatedData);
                        return updatedData;
                    }) as any);
                })
                .catch(err => {
                    console.error("Failed to generate insight:", err);
                    setComparisonInsight("Failed to generate AI insights.");
                    setInsightLoading(false);
                });

            // Update State
            setArchitecturalComparison(comparison);
            setAnalyzedCommit(versionALabel + " vs " + versionBLabel);
            setDiffData(diffs);

            // Update Source Repo State (Current Version)
            setSourceRepo(prev => ({
                ...prev,
                metrics: {
                    maintainability: analysisA.metrics.maintainability || 0,
                    complexity: analysisA.metrics.complexity || 0,
                    coverage: analysisA.metrics.testCoverage || 0,
                    performance: analysisA.metrics.performance || 85,
                    security: analysisA.metrics.security || 88
                },
                issues: analysisA.issues || []
            }));

            // Update Target Repo State (Historical Version)
            setTargetRepo({
                name: `${sourceRepoName} (@${versionBLabel})`,
                metrics: {
                    maintainability: analysisB.metrics.maintainability || 0,
                    complexity: analysisB.metrics.complexity || 0,
                    coverage: analysisB.metrics.testCoverage || 0,
                    performance: analysisB.metrics.performance || 85,
                    security: analysisB.metrics.security || 88
                },
                patterns: analysisB.patterns.map((p: any) => ({
                    subject: p.name,
                    A: p.confidence || 0,
                    fullMark: 100
                })).slice(0, 5),
                issues: analysisB.issues || [],
                commit: targetCommit || targetBranch,
                commitDate: new Date().toISOString()
            });

            // PERSIST STATE TO STORE
            if (data) {
                const newRepoData = {
                    ...data,
                    comparisonState: {
                        selectedCommit,
                        diffData: diffs,
                        fixedIssues: analysisA.issues || [],
                        newIssues: analysisB.issues || [],
                        comparisonInsight: "", // Will be updated by insight promise if needed, or separate
                        analyzedCommit: versionALabel + " vs " + versionBLabel,
                        targetRepo: {
                            name: `${sourceRepoName} (@${versionBLabel})`,
                            metrics: {
                                maintainability: analysisB.metrics.maintainability || 0,
                                complexity: analysisB.metrics.complexity || 0,
                                coverage: analysisB.metrics.testCoverage || 0,
                                performance: analysisB.metrics.performance || 85,
                                security: analysisB.metrics.security || 88
                            },
                            patterns: analysisB.patterns.map((p: any) => ({
                                subject: p.name,
                                A: p.confidence || 0,
                                fullMark: 100
                            })).slice(0, 5),
                            issues: analysisB.issues || [],
                            commit: targetCommit || targetBranch,
                            commitDate: new Date().toISOString()
                        },
                        comparisonType,
                        sourceBranch,
                        targetBranch,
                        architecturalComparison: comparison // SAVE THIS
                    }
                };
                setData(newRepoData);
                saveToCache(data.repoName, newRepoData);
            }

            // Switch to architectural tab to show results
            setMainTab('architectural');
            showToast(`Comparison complete! Found ${diffs.length} file changes and ${comparison.moduleChanges.length} architectural changes`, 'success');

        } catch (err: any) {
            console.error("❌ Analysis failed:", err);
            showToast(`Failed to run comparison: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };


    // Better: Update store explicitly at end of handleRunAnalysis
    // And update URL params when inputs change
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());

        if (comparisonType) params.set('compareType', comparisonType);
        else params.delete('compareType');

        if (selectedCommit) params.set('sourceCommit', selectedCommit);
        else params.delete('sourceCommit');

        if (targetCommit) params.set('targetCommit', targetCommit);
        else params.delete('targetCommit');

        if (sourceBranch) params.set('sourceBranch', sourceBranch);
        else params.delete('sourceBranch');

        if (targetBranch) params.set('targetBranch', targetBranch);
        else params.delete('targetBranch');

        // Update URL without navigation/refresh
        router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
    }, [comparisonType, selectedCommit, targetCommit, sourceBranch, targetBranch, router, searchParams]);

    const handleFileClick = (file: DiffFile) => {
        if (!openFiles.includes(file.filename)) {
            const newOpenFiles = [...openFiles, file.filename];
            setOpenFiles(newOpenFiles);

            // Persist Open Files
            if (data) {
                const updatedData = {
                    ...data,
                    comparisonState: {
                        ...data.comparisonState!,
                        openFiles: newOpenFiles
                    }
                };
                setData(updatedData);
                saveToCache(data.repoName, updatedData);
            }
        }
        setMainTab(file.filename);
    };

    const handleCloseTab = (fileName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newOpenFiles = openFiles.filter(f => f !== fileName);
        setOpenFiles(newOpenFiles);

        // Persist Open Files
        if (data) {
            const updatedData = {
                ...data,
                comparisonState: {
                    ...data.comparisonState!,
                    openFiles: newOpenFiles
                }
            };
            setData(updatedData);
            saveToCache(data.repoName, updatedData);
        }

        if (mainTab === fileName) {
            setMainTab('overview');
        }
    };

    // System Context for Chat
    const getComparisonSystemContext = () => {
        return `You are an expert software architect analyzing a comparison between two versions of this repository: "${sourceRepoName}".
        
        CURRENT VERSION (Source):
        - Maintainability: ${sourceRepo.metrics.maintainability}
        - Complexity: ${sourceRepo.metrics.complexity}
        - Issues: ${sourceRepo.issues?.length || 0}
        
        OLD VERSION (Target @ ${targetRepo.commit?.substring(0, 7)}):
        - Maintainability: ${targetRepo.metrics.maintainability}
        - Complexity: ${targetRepo.metrics.complexity}
        - Issues: ${targetRepo.issues?.length || 0}
        
        CHANGES:
        - Fixed Issues: ${fixedIssues.length} (${fixedIssues.map(i => i.title).join(', ')})
        - New Issues: ${newIssues.length} (${newIssues.map(i => i.title).join(', ')})
        - Files Changed: ${diffData?.length || 0}
        
        INITIAL ANALYSIS:
        ${comparisonInsight}
        
        Your goal is to answer questions about what changed, why metrics shifted, and the implications of these changes.
        Refer to specific metrics and issues when possible.`;
    };

    return (
        <div className="flex h-full w-full bg-[#050505] text-white font-sans flex-col">
            {/* Toolbar */}
            <div className="border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between p-4 bg-[#080808] shrink-0 gap-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full">
                    <div className="text-sm text-gray-400 flex items-center">
                        Comparing current state of <span className="text-white font-mono font-bold mx-2">{sourceRepo.name}</span> with:
                    </div>
                </div>
            </div>

            {/* Comparison Mode Tabs */}
            <div className="border-b border-white/10 bg-[#080808] px-4 pt-3 shrink-0">
                <div className="flex gap-2">
                    <button
                        onClick={() => setComparisonType('commits')}
                        className={`px-4 py-2 text-sm font-semibold rounded-t transition-colors ${comparisonType === 'commits'
                            ? 'bg-purple-500/20 text-purple-400 border-b-2 border-purple-400'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            }`}
                    >
                        <GitCommit className="w-4 h-4 inline mr-2" />
                        Compare 2 Commits
                    </button>
                    <button
                        onClick={() => setComparisonType('branches')}
                        className={`px-4 py-2 text-sm font-semibold rounded-t transition-colors ${comparisonType === 'branches'
                            ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            }`}
                    >
                        <GitCommit className="w-4 h-4 inline mr-2" />
                        Compare 2 Branches
                    </button>

                </div>
            </div>

            {/* Comparison Inputs */}
            <div className="border-b border-white/10 p-4 bg-[#080808] shrink-0">
                {comparisonType === 'commits' && (
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Source:</span>
                            <select
                                className="bg-[#050505] border border-cyan-500/20 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-500"
                                value={selectedCommit}
                                onChange={(e) => setSelectedCommit(e.target.value)}
                            >
                                <option value="">Select commit...</option>
                                {commits.map((c) => (
                                    <option key={c.sha} value={c.sha}>
                                        {c.sha.substring(0, 7)} - {c.message.substring(0, 40)}... ({new Date(c.date).toLocaleDateString()})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <ArrowLeftRight className="w-4 h-4 text-gray-600" />

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Target:</span>
                            <select
                                className="bg-[#050505] border border-purple-500/20 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-purple-500"
                                value={targetCommit}
                                onChange={(e) => setTargetCommit(e.target.value)}
                            >
                                <option value="">Select commit...</option>
                                {commits.map((c) => (
                                    <option key={c.sha} value={c.sha}>
                                        {c.sha.substring(0, 7)} - {c.message.substring(0, 40)}... ({new Date(c.date).toLocaleDateString()})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleRunAnalysis}
                            disabled={!selectedCommit || !targetCommit || loading}
                            className={`px-4 py-1.5 rounded text-sm font-medium transition flex items-center gap-2 ${!selectedCommit || !targetCommit || loading
                                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-500 text-white'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 fill-white" /> Run Comparison
                                </>
                            )}
                        </button>
                    </div>
                )}

                {comparisonType === 'branches' && (
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Source Branch:</span>
                            <select
                                className="bg-[#050505] border border-cyan-500/20 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-500"
                                value={sourceBranch}
                                onChange={(e) => setSourceBranch(e.target.value)}
                            >
                                {branches.length === 0 ? (
                                    <option value="main">main (only branch)</option>
                                ) : (
                                    branches.map((branch) => (
                                        <option key={branch} value={branch}>
                                            {branch}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        <ArrowLeftRight className="w-4 h-4 text-gray-600" />

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Target Branch:</span>
                            <select
                                className="bg-[#050505] border border-purple-500/20 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-purple-500"
                                value={targetBranch}
                                onChange={(e) => setTargetBranch(e.target.value)}
                            >
                                <option value="">Select branch...</option>
                                {branches.length === 0 ? (
                                    <option disabled>No other branches available</option>
                                ) : (
                                    branches.filter(b => b !== sourceBranch).map((branch) => (
                                        <option key={branch} value={branch}>
                                            {branch}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        <button
                            onClick={handleRunAnalysis}
                            disabled={!targetBranch || loading}
                            className={`px-4 py-1.5 rounded text-sm font-medium transition flex items-center gap-2 ${!targetBranch || loading
                                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 fill-white" /> Run Comparison
                                </>
                            )}
                        </button>
                    </div>
                )}


            </div>


            {insightLoading && !analyzedCommit && (
                <div className="bg-[#080808] border-b border-white/10 p-4 shrink-0 flex justify-center">
                    <div className="flex items-center gap-3 text-sm text-gray-500 animate-pulse">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                        Generating AI comparison insights...
                    </div>
                </div>
            )}

            <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* Main Content Area (Tabs) */}
                <div className="flex-1 flex flex-col shrink-0 overflow-y-auto custom-scrollbar relative">
                    {/* Tab Bar */}
                    <div className="flex items-center gap-1 overflow-x-auto border-b border-white/10 bg-[#0c0c0c] px-2 pt-2 shrink-0">
                        <button
                            onClick={() => setMainTab('overview')}
                            className={`px-4 py-2 text-xs font-medium rounded-t-lg border-t border-x border-transparent transition-all flex items-center gap-2 ${mainTab === 'overview'
                                ? 'bg-[#0A0A0A] border-white/10 text-purple-400 border-b-[#0A0A0A] -mb-[1px] z-10'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                }`}
                        >
                            <LayoutDashboard className="w-3 h-3" /> Overview
                        </button>

                        {architecturalComparison && (
                            <button
                                onClick={() => setMainTab('architectural')}
                                className={`px-4 py-2 text-xs font-medium rounded-t-lg border-t border-x border-transparent transition-all flex items-center gap-2 ${mainTab === 'architectural'
                                    ? 'bg-[#0A0A0A] border-white/10 text-cyan-400 border-b-[#0A0A0A] -mb-[1px] z-10'
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                    }`}
                            >
                                <Network className="w-3 h-3" /> Architectural
                            </button>
                        )}

                        {openFiles.map(fileName => (
                            <button
                                key={fileName}
                                onClick={() => setMainTab(fileName)}
                                className={`group px-3 py-2 text-xs font-medium rounded-t-lg border-t border-x border-transparent transition-all flex items-center gap-2 max-w-[200px] ${mainTab === fileName
                                    ? 'bg-[#0A0A0A] border-white/10 text-white border-b-[#0A0A0A] -mb-[1px] z-10'
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                    }`}
                            >
                                <FileText className="w-3 h-3 shrink-0" />
                                <span className="truncate">{fileName}</span>
                                <span
                                    onClick={(e) => handleCloseTab(fileName, e)}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded ml-1 transition-all"
                                >
                                    <X className="w-3 h-3" />
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-hidden bg-[#0A0A0A] relative">
                        {mainTab === 'overview' ? (
                            <div className="h-full overflow-y-auto p-6 custom-scrollbar">
                                {!analyzedCommit ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                            <Play className="w-8 h-8 text-gray-600 ml-1" />
                                        </div>
                                        <p>Select a commit and click "Run Comparison" to start.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px] mb-6">
                                            {/* Radar Chart */}
                                            <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col">
                                                <h3 className="text-sm font-bold text-gray-300 mb-4">Core Metrics Visualization</h3>
                                                <div className="flex-1 relative">
                                                    <DiffRadar
                                                        source={sourceRepo}
                                                        target={targetRepo}
                                                    />
                                                </div>
                                            </div>

                                            {/* Issue Breakdown */}
                                            <div className="bg-white/5 border border-white/10 rounded-lg p-4 custom-scrollbar overflow-y-auto">
                                                <h3 className="text-sm font-bold text-gray-300 mb-4">Issue Status</h3>
                                                {/* Fixed Issues */}
                                                {fixedIssues.length > 0 && (
                                                    <div className="mb-6">
                                                        <div className="flex items-center gap-2 mb-2 text-green-400 text-xs uppercase font-bold tracking-wider">
                                                            <div className="w-2 h-2 rounded-full bg-green-500" /> Fixed Issues ({fixedIssues.length})
                                                        </div>
                                                        <div className="space-y-2">
                                                            {fixedIssues.map((issue, i) => (
                                                                <div key={i} className="p-3 bg-green-500/10 border border-green-500/20 rounded">
                                                                    <div className="text-sm font-medium text-green-300">{issue.title}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* New Issues */}
                                                <div className="mb-6">
                                                    <div className="flex items-center gap-2 mb-2 text-red-400 text-xs uppercase font-bold tracking-wider">
                                                        <div className="w-2 h-2 rounded-full bg-red-500" /> New Issues ({newIssues.length})
                                                    </div>
                                                    {newIssues.length === 0 ? (
                                                        <div className="text-gray-500 text-sm italic">No new issues detected.</div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {newIssues.map((issue, i) => (
                                                                <div key={i} className="p-3 bg-red-500/10 border border-red-500/20 rounded">
                                                                    <div className="text-sm font-medium text-red-300">{issue.title || issue}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Core Metrics Comparison */}
                                        <div className="grid grid-cols-1 mb-6 gap-4">
                                            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Core Metrics Comparison</h3>
                                                <div className="space-y-3">
                                                    {Object.keys(sourceRepo.metrics).map(key => {
                                                        const metricKey = key as keyof typeof sourceRepo.metrics;
                                                        const sourceVal = sourceRepo.metrics[metricKey];
                                                        const targetVal = targetRepo.metrics[metricKey];
                                                        const diff = sourceVal - targetVal;
                                                        const color = diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : 'text-gray-500';

                                                        return (
                                                            <div key={key} className="grid grid-cols-12 gap-4 items-center hover:bg-white/5 p-2 rounded transition-colors">
                                                                <div className="col-span-4 text-sm capitalize text-gray-300 font-medium">{key}</div>
                                                                <div className="col-span-8 flex items-center justify-between">
                                                                    <div className="flex flex-col items-center w-16">
                                                                        <span className="text-xs text-gray-500 mb-1">Current</span>
                                                                        <span className="font-mono font-bold text-cyan-400">{sourceVal}</span>
                                                                    </div>

                                                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                                                        <ArrowLeftRight className="w-3 h-3" />
                                                                    </div>

                                                                    <div className="flex flex-col items-center w-16">
                                                                        <span className="text-xs text-gray-500 mb-1">Target</span>
                                                                        <span className="font-mono font-bold text-purple-400">{targetVal}</span>
                                                                    </div>

                                                                    <div className={`w-16 text-right font-mono text-sm font-bold ${color}`}>
                                                                        {diff > 0 ? '+' : ''}{diff !== 0 ? diff.toFixed(0) : '-'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-white/5 border border-white/10 rounded-lg flex flex-col items-center justify-center">
                                                    <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">New Issues</div>
                                                    <div className="text-3xl font-bold text-red-500">+{newIssues.length}</div>
                                                </div>
                                                <div className="p-4 bg-white/5 border border-white/10 rounded-lg flex flex-col items-center justify-center">
                                                    <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Fixed Issues</div>
                                                    <div className="text-3xl font-bold text-green-500">-{fixedIssues.length}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : mainTab === 'architectural' && architecturalComparison ? (
                            // Architectural Comparison Tab
                            <div className="h-full overflow-y-auto p-6 custom-scrollbar">
                                <div className="space-y-6">
                                    {/* Summary Panel */}
                                    <ChangeSummaryPanel
                                        summary={architecturalComparison.summary}
                                    />

                                    {/* Module Changes */}
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                            <Network className="w-5 h-5 text-cyan-400" />
                                            Module & Dependency Changes
                                        </h3>
                                        <ArchitecturalDiff
                                            comparison={architecturalComparison}
                                            versionA={analyzedCommit?.split(' vs ')[0] || 'Version A'}
                                            versionB={analyzedCommit?.split(' vs ')[1] || 'Version B'}
                                            onModuleClick={(module) => {
                                                if (!openFiles.includes(module)) {
                                                    const newOpenFiles = [...openFiles, module];
                                                    setOpenFiles(newOpenFiles);

                                                    // Persist Open Files
                                                    if (data) {
                                                        const updatedData = {
                                                            ...data,
                                                            comparisonState: {
                                                                ...data.comparisonState!,
                                                                openFiles: newOpenFiles
                                                            }
                                                        };
                                                        setData(updatedData);
                                                        saveToCache(data.repoName, updatedData);
                                                    }
                                                }
                                                setMainTab(module);
                                            }}
                                        />
                                    </div>

                                    {/* Risk Hotspots - Explicit Section */}
                                    {architecturalComparison.couplingChanges.some(c => c.isSignificant && c.change > 0) && (
                                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                                            <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                                                <AlertCircle className="w-5 h-5" />
                                                New Risk Hotspots
                                            </h3>
                                            <p className="text-sm text-gray-400 mb-4">
                                                The following modules have significantly increased coupling, indicating potential maintenance risks:
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {architecturalComparison.couplingChanges
                                                    .filter(c => c.isSignificant && c.change > 0)
                                                    .map((c, idx) => (
                                                        <div key={idx} className="p-3 bg-black/40 rounded border border-red-500/20 flex justify-between items-center">
                                                            <div>
                                                                <div className="text-sm font-mono text-white">{c.module}</div>
                                                                <div className="text-xs text-red-400">
                                                                    Dependencies: {c.oldDependencyCount} → {c.newDependencyCount}
                                                                </div>
                                                            </div>
                                                            <div className="text-red-500 font-bold">
                                                                +{c.change}
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Coupling Trend Chart */}
                                    {architecturalComparison.couplingChanges && architecturalComparison.couplingChanges.length > 0 && (
                                        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                                            <h3 className="text-lg font-bold text-white mb-4">Coupling Analysis</h3>
                                            <CouplingTrendChart changes={architecturalComparison.couplingChanges} />
                                        </div>
                                    )}

                                    {/* Evidence Viewer */}
                                    {architecturalComparison.moduleChanges && architecturalComparison.moduleChanges.length > 0 && (
                                        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                                            <h3 className="text-lg font-bold text-white mb-4">Detailed Evidence</h3>
                                            <EvidenceViewer
                                                topChanges={architecturalComparison.moduleChanges.slice(0, 10).map((mc, idx) => ({
                                                    description: `${mc.type === 'added' ? 'Added' : mc.type === 'removed' ? 'Removed' : 'Modified'} module: ${mc.path}`,
                                                    impact: mc.type === 'removed' ? 'high' : 'medium',
                                                    category: 'module' as const,
                                                    evidence: [mc.evidence],
                                                    rank: idx + 1
                                                }))}
                                                onFileClick={(filePath) => {
                                                    // Normalize path if needed and open tab
                                                    if (!openFiles.includes(filePath)) {
                                                        setOpenFiles(prev => [...prev, filePath]);
                                                    }
                                                    setMainTab(filePath);
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // File Content Tab
                            <div className="h-full flex flex-col">
                                {/* We find the file in diffData */}
                                {(() => {
                                    const fileData = diffData?.find(f => f.filename === mainTab);
                                    if (!fileData) return <div className="p-10 text-center text-gray-500">File not found in diff.</div>;
                                    return (
                                        <div className="flex-1 overflow-hidden">
                                            <CodeDiff
                                                file={fileData}
                                                original={fileData.originalContent ?? ""}
                                                modified={fileData.modifiedContent ?? ""}
                                            />
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>


                {/* Diff View Sidebar (Right) */}
                <div
                    className="bg-[#0c0c0c] border-l border-white/10 flex flex-col shrink-0 transition-none relative"
                    style={{ width: sidebarWidth }}
                >
                    {/* Drag Handle */}
                    <div
                        className="absolute top-0 bottom-0 left-0 w-1 hover:w-2 hover:bg-neon-cyan/50 cursor-col-resize z-50 transition-all hover:delay-75 group"
                        onMouseDown={startResizing}
                    >
                        <div className="w-[1px] h-full bg-white/10 group-hover:bg-neon-cyan/50 mx-auto" />
                    </div>

                    {/* Sidebar Tabs */}
                    <div className="flex border-b border-white/10 bg-[#0e0e0e]">
                        <button
                            onClick={() => setSidebarTab('files')}
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center transition-colors ${sidebarTab === 'files' ? 'text-white border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Files ({diffData?.length || 0})
                        </button>
                        <button
                            onClick={() => setSidebarTab('insights')}
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center transition-colors ${sidebarTab === 'insights' ? 'text-white border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            AI Insights
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden relative">
                        {/* Files Tab */}
                        {sidebarTab === 'files' && (
                            <div className="absolute inset-0 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                {!analyzedCommit && !loading ? (
                                    <div className="text-center mt-10 text-gray-500 text-xs px-4">
                                        Run comparison to see changed files.
                                    </div>
                                ) : (
                                    diffData?.map((file) => (
                                        <button
                                            key={file.filename}
                                            onClick={() => handleFileClick(file)}
                                            className={`w-full text-left p-2 rounded text-xs flex items-center gap-2 truncate transition-colors ${mainTab === file.filename ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                                        >
                                            <FileCode className={`w-4 h-4 shrink-0 ${file.status === 'added' ? 'text-green-500' : file.status === 'removed' ? 'text-red-500' : 'text-blue-500'}`} />
                                            <span className="truncate flex-1">{file.filename}</span>
                                            {file.additions > 0 && <span className="text-green-500">+{file.additions}</span>}
                                            {file.deletions > 0 && <span className="text-red-500">-{file.deletions}</span>}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Insights Tab */}
                        {sidebarTab === 'insights' && (
                            <div className="absolute inset-0 overflow-hidden bg-[#0c0c0c]">
                                {insightLoading ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500 animate-pulse">
                                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                            <History className="w-4 h-4 text-purple-500 animate-spin" />
                                        </div>
                                        <span className="text-xs">Generating AI comparison...</span>
                                    </div>
                                ) : comparisonInsight ? (
                                    <SimpleInsightChat
                                        initialMessage={comparisonInsight}
                                        systemContext={getComparisonSystemContext()}
                                        repoName={`${sourceRepo.name} vs ${targetRepo.name}`}
                                    />
                                ) : (
                                    <div className="text-center mt-10 text-gray-500 text-xs px-4">
                                        Run comparison to start AI chat.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
