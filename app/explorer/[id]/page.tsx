"use client";

import { useState, useEffect } from "react";
import FileTree from "@/components/explorer/FileTree";
import CodeEditor from "@/components/explorer/CodeEditor";
import EditorToolbar from "@/components/explorer/EditorToolbar";

import { fetchGithubRepo } from "@/lib/githubFetcher";
import { useRepoStore } from "@/lib/RepoStore";
import { AIAnalysisResult, AnalysisRequest } from "@/lib/ai/AIClient";
import { AIOrchestrator } from "@/lib/ai/AIOrchestrator";
import { useToast } from "@/lib/ToastContext";
import AIAssistantChat from "@/components/dashboard/AIAssistantChat";
import { Layers, Cuboid, Network, LayoutDashboard, Loader2 } from "lucide-react";
import ArchitectureOverview from "@/components/explorer/ArchitectureOverview";
import SettingsModal from "@/components/dashboard/SettingsModal";
import { base64ToUtf8 } from "@/lib/decoder";

// Helper outside component for clean scope and zero hoisting issues
const buildFileSystemFromPaths = (paths: string[]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const root: any = { id: "root", name: "root", type: "folder", children: [] };
    paths.forEach(path => {
        const parts = path.split('/');
        let current = root;
        let currentPath = "";

        parts.forEach((part, i) => {
            const isFile = i === parts.length - 1;
            currentPath = currentPath ? `${currentPath}/${part}` : part;

            if (isFile) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (!current.children.find((c: any) => c.name === part)) {
                    current.children.push({ id: path, name: part, type: "file" });
                }
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let folder = current.children.find((c: any) => c.name === part && c.type === 'folder');
                if (!folder) {
                    folder = { id: currentPath, name: part, type: "folder", children: [] };
                    current.children.push(folder);
                }
                current = folder;
            }
        });
    });
    return root;
};

export default function ExplorerPage({ params }: { params: { id: string } }) {
    const [isMounted, setIsMounted] = useState(false);
    const { data: storeData, setData: setStoreData, getFromCache, saveToCache } = useRepoStore();
    const { showToast } = useToast();

    // Layout State
    const [leftPanelWidth, setLeftPanelWidth] = useState(280);
    const [rightPanelWidth, setRightPanelWidth] = useState(380);


    // Context State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [fileSystem, setFileSystem] = useState<any>(null);
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
    const [repoContext, setRepoContext] = useState<{ fileTree: string[], repoName: string } | undefined>(undefined);
    const [aiData, setAiData] = useState<AIAnalysisResult | null>(null);

    // View State (Center Panel)
    const [centerView, setCenterView] = useState<'structure' | 'code'>('structure');

    // File Content State
    const [fileContent, setFileContent] = useState<string>("");

    const [language, setLanguage] = useState("typescript");
    const [theme, setTheme] = useState("dark");
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Mobile Specific
    const [activeMobileTab, setActiveMobileTab] = useState<'files' | 'code' | 'chat'>('files');
    const [isMobile, setIsMobile] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Load Data (Similar to AnalysisPage but focused on Tree + AI)
    useEffect(() => {
        if (!isMounted) return;

        const normalizedId = decodeURIComponent(params.id);


        const loadData = async () => {
            // 1. Try Store/Cache
            let currentData = storeData;
            if (!currentData || currentData.repoName !== normalizedId) {
                const cached = getFromCache(normalizedId);
                if (cached) {
                    currentData = cached;
                    setStoreData(cached);
                }
            }

            if (currentData && currentData.graphData) {
                // Have data, build tree
                setAiData(currentData.aiData);
                setRepoContext({ fileTree: currentData.fileSystem?.fileTree || [], repoName: normalizedId });

                // Build robust file system for tree
                const root = buildFileSystemFromPaths(currentData.fileSystem?.fileTree || []);
                setFileSystem(root);
                return;
            }

            // 2. Fetch if missing (Quick fetch for explorer)
            console.log("🌍 [AI Architect] Fetching Data...");
            const repoUrl = normalizedId.startsWith("http") ? normalizedId : `https://github.com/${normalizedId}`;
            const githubToken = process.env.NEXT_PUBLIC_GITHUB_TOKEN || "";

            try {
                const data = await fetchGithubRepo(repoUrl, githubToken);
                if (data.filePaths) {
                    const root = buildFileSystemFromPaths(data.filePaths);
                    setFileSystem(root);
                    setRepoContext({ fileTree: data.filePaths, repoName: normalizedId });

                    // Save to store partially
                    const partialData = {
                        repoName: normalizedId,
                        graphData: data,
                        aiData: null, // AI not run yet
                        fileSystem: { fileTree: data.filePaths },
                        isLoaded: true,
                        analysisResults: null
                    };
                    setStoreData(partialData);
                    saveToCache(normalizedId, partialData);
                }
            } catch (e) {
                console.error("Failed to load repo for AI Architect", e);
            }
        };

        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMounted, params.id, storeData?.repoName]);

    // File Selection Handler
    useEffect(() => {
        if (!selectedFileId) return;

        // Auto-switch to code view
        setCenterView('code');
        if (isMobile) setActiveMobileTab('code');

        // Determine Language
        const ext = selectedFileId.split('.').pop()?.toLowerCase();
        const lang =
            ext === "tsx" || ext === "ts" ? "typescript" :
                ext === "js" || ext === "jsx" ? "javascript" :
                    ext === "py" ? "python" :
                        ext === "json" ? "json" :
                            ext === "css" || ext === "scss" ? "css" :
                                ext === "html" ? "html" :
                                    ext === "md" ? "markdown" :
                                        ext === "cpp" || ext === "cc" || ext === "h" || ext === "hpp" ? "cpp" :
                                            ext === "c" ? "c" :
                                                ext === "java" ? "java" :
                                                    ext === "go" ? "go" : "plaintext";
        setLanguage(lang);

        // Fetch Content
        const fetchContent = async () => {
            try {
                const normalizedId = decodeURIComponent(params.id);

                // 1. Check Store/Cache First (Essential for Manual Uploads)
                if (storeData && storeData.repoName === normalizedId) {
                    if (storeData.allFiles && storeData.allFiles[selectedFileId]) {
                        setFileContent(storeData.allFiles[selectedFileId]);
                        return;
                    }
                    if (storeData.keyFiles && storeData.keyFiles[selectedFileId]) {
                        setFileContent(storeData.keyFiles[selectedFileId]);
                        return;
                    }
                }

                // 2. Fallback to GitHub API
                if (normalizedId === "Manual Upload") {
                    setFileContent("// Warning: This file content was not found in the local session.\n// For manual uploads, please ensure you don't refresh the page.");
                    return;
                }

                const [owner, repo] = normalizedId.split('/');
                if (!owner || !repo) {
                    setFileContent("// Invalid repository identifier for GitHub fetch.");
                    return;
                }

                const url = `https://api.github.com/repos/${owner}/${repo}/contents/${selectedFileId}`;
                const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN || "";

                const res = await fetch(url, { headers: { Authorization: `token ${token}` } });
                if (res.ok) {
                    const json = await res.json();
                    if (json.content) {
                        try {
                            setFileContent(base64ToUtf8(json.content));
                        } catch {
                            setFileContent(json.content); // Fallback if not base64
                        }
                    }
                } else {
                    setFileContent(`// Failed to load content from GitHub: ${res.statusText}\n// Path: ${selectedFileId}`);
                }
            } catch (err) {
                console.error("Error fetching file content:", err);
                setFileContent("// Error loading file content.");
            }
        };

        fetchContent();
    }, [selectedFileId, params.id, storeData]);


    // Resizers

    // Resizers
    const startResizeLeft = () => { document.addEventListener('mousemove', onMouseMoveLeft); document.addEventListener('mouseup', onMouseUpLeft); };
    const onMouseMoveLeft = (e: MouseEvent) => setLeftPanelWidth(Math.max(200, Math.min(600, e.clientX)));
    const onMouseUpLeft = () => { document.removeEventListener('mousemove', onMouseMoveLeft); document.removeEventListener('mouseup', onMouseUpLeft); };

    const startResizeRight = () => { document.addEventListener('mousemove', onMouseMoveRight); document.addEventListener('mouseup', onMouseUpRight); };
    const onMouseMoveRight = (e: MouseEvent) => setRightPanelWidth(Math.max(300, Math.min(800, window.innerWidth - e.clientX)));
    const onMouseUpRight = () => { document.removeEventListener('mousemove', onMouseMoveRight); document.removeEventListener('mouseup', onMouseUpRight); };

    const runDeepAnalysis = async () => {
        if (!storeData) return;
        setIsAnalyzing(true);
        showToast("Starting deep analysis... This may take a minute.", 'info');

        try {
            const request: AnalysisRequest = {
                repoName: storeData.repoName,
                fileTree: storeData.fileSystem?.fileTree || [],
                keyFiles: storeData.keyFiles || {},
                dependencyFile: "package.json" // Default for compatibility
            };

            console.log("🚀 [ExplorerPage] Triggering AIOrchestrator Analysis...");
            const data = await AIOrchestrator.analyze(request);

            if (!data) throw new Error("Analysis failed");

            // If the result is missing confidence analysis, calculate it using the orchestrator
            if (!data.confidenceAnalysis) {
                console.log("⚠️ [ExplorerPage] Missing confidence analysis in result. Calculating manually...");
                try {
                    data.confidenceAnalysis = AIOrchestrator.calculateConfidenceAnalysis(data, request);
                } catch (e) {
                    console.error("❌ [ExplorerPage] Failed to calculate confidence manually:", e);
                }
            }

            setAiData(data);

            // Update store
            const updatedStore = { ...storeData, aiData: data };
            setStoreData(updatedStore);
            saveToCache(storeData.repoName, updatedStore);

            showToast("Analysis complete!", 'success');
        } catch (error) {
            console.error(error);
            showToast("Failed to run analysis.", 'error');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleRun = () => {
        showToast("Running " + selectedFileId + "...", 'info');
    };


    if (!isMounted) return <div className="bg-[#050505] w-full h-full" />;

    return (
        <div className="flex h-screen w-screen bg-[#050505] text-white overflow-hidden font-sans flex-col md:flex-row">

            {/* LEFT: File Tree - Hidden on mobile unless tab active */}
            <div
                style={{ width: isMobile ? '100%' : leftPanelWidth, display: (isMobile && activeMobileTab !== 'files') ? 'none' : 'flex' }}
                className={`${isMobile ? 'flex-1 pb-16' : 'flex-shrink-0 border-r border-white/10'} flex flex-col relative`}
            >
                <div className="p-3 border-b border-white/10 bg-[#0A0A0A] font-bold text-xs tracking-wider text-gray-400">
                    EXPLORER
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar">
                    {fileSystem ? (
                        <FileTree data={fileSystem} onSelect={setSelectedFileId} />
                    ) : (
                        <div className="p-4 text-xs text-gray-500 text-center mt-10">Loading File Tree...</div>
                    )}
                </div>
                {/* Drag Handle - Desktop Only */}
                {!isMobile && <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-neon-cyan/50 transition-colors z-10" onMouseDown={startResizeLeft} />}
            </div>

            {/* CENTER: Structure / Code */}
            <div
                style={{ display: (isMobile && activeMobileTab !== 'code') ? 'none' : 'flex' }}
                className={`flex-1 flex-col min-w-0 bg-[#080808] relative ${isMobile ? 'pb-16' : ''}`}
            >
                {/* Tabs */}
                <div className="flex items-center border-b border-white/10 bg-[#0A0A0A]">
                    <button
                        onClick={() => setCenterView('structure')}
                        className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-r border-white/10 hover:bg-white/5 transition-colors ${centerView === 'structure' ? 'text-neon-cyan bg-white/5' : 'text-gray-500'}`}
                    >
                        <Network className="w-3 h-3" /> STRUCTURE MAP
                    </button>
                    <button
                        onClick={() => setCenterView('code')}
                        className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-r border-white/10 hover:bg-white/5 transition-colors ${centerView === 'code' ? 'text-neon-purple bg-white/5' : 'text-gray-500'}`}
                    >
                        <Cuboid className="w-3 h-3" /> CODE VIEW
                    </button>
                </div>

                <div className="flex-1 relative overflow-hidden">
                    {centerView === 'structure' && (
                        <div className="h-full w-full overflow-y-auto p-8 custom-scrollbar">
                            {aiData ? (
                                <ArchitectureOverview data={aiData} repoContext={repoContext} />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 bg-neon-cyan/20 blur-xl rounded-full" />
                                        <Layers className="w-16 h-16 text-gray-400 relative z-10" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Deep Architectural Analysis</h3>
                                    <p className="max-w-md text-center text-gray-400 mb-8 text-sm">
                                        Run a comprehensive scan to generate metrics, map dependencies,
                                        and detect architectural patterns using AI.
                                    </p>

                                    <button
                                        onClick={runDeepAnalysis}
                                        disabled={isAnalyzing}
                                        className={`
                                            group relative px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all
                                            ${isAnalyzing
                                                ? 'bg-white/10 text-gray-400 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-neon-cyan to-neon-blue text-black hover:shadow-[0_0_20px_rgba(0,243,255,0.4)]'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-2">
                                            {isAnalyzing ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>Analyzing Repository...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <LayoutDashboard className="w-4 h-4" />
                                                    <span>Run Deep Analysis</span>
                                                </>
                                            )}
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {centerView === 'code' && (
                        <div className="h-full flex flex-col">
                            {selectedFileId ? (
                                <>
                                    <EditorToolbar
                                        language={language}
                                        theme={theme}
                                        setTheme={setTheme}
                                        onSettingsClick={() => setIsSettingsOpen(true)}
                                    />
                                    <div className="flex-1 relative">
                                        <CodeEditor
                                            key={selectedFileId}
                                            code={fileContent}
                                            language={language}
                                            theme={theme}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                                    Select a file from the explorer to view code
                                </div>
                            )}
                        </div>
                    )}


                </div>
            </div>

            <div
                style={{ width: isMobile ? '100%' : rightPanelWidth, display: (isMobile && activeMobileTab !== 'chat') ? 'none' : 'flex' }}
                className={`${isMobile ? 'flex-1 pb-16' : 'flex-shrink-0 border-l border-white/10'} flex flex-col bg-[#0A0A0A] relative z-20 shadow-2xl`}
            >
                {/* Drag Handle - Desktop Only */}
                {!isMobile && <div className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-neon-purple/50 transition-colors z-30" onMouseDown={startResizeRight} />}

                <div className="flex-1 overflow-hidden">
                    <AIAssistantChat analysisData={aiData} repoContext={repoContext} />
                </div>
            </div>

            {/* Mobile Tab Bar */}
            {
                isMobile && (
                    <div className="flex items-center justify-around bg-[#0A0A0A] border-t border-white/10 p-2 fixed bottom-0 left-0 right-0 z-50">
                        <button
                            onClick={() => setActiveMobileTab('files')}
                            className={`flex flex-col items-center gap-1 text-[10px] ${activeMobileTab === 'files' ? 'text-neon-cyan' : 'text-gray-500'}`}
                        >
                            <Layers className="w-5 h-5" /> Files
                        </button>
                        <button
                            onClick={() => setActiveMobileTab('code')}
                            className={`flex flex-col items-center gap-1 text-[10px] ${activeMobileTab === 'code' ? 'text-neon-purple' : 'text-gray-500'}`}
                        >
                            <Cuboid className="w-5 h-5" /> Code
                        </button>
                        <button
                            onClick={() => setActiveMobileTab('chat')}
                            className={`flex flex-col items-center gap-1 text-[10px] ${activeMobileTab === 'chat' ? 'text-neon-pink' : 'text-gray-500'}`}
                        >
                            <Network className="w-5 h-5" /> Chat
                        </button>
                    </div>
                )
            }

            {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}

        </div >
    );
}
