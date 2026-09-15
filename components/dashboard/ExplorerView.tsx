"use client";

import React, { useState, useEffect } from "react";
import FileTree from "@/components/explorer/FileTree";
import CodeEditor from "@/components/explorer/CodeEditor";
import EditorToolbar from "@/components/explorer/EditorToolbar";
import AIAssistantChat from "@/components/dashboard/AIAssistantChat";
import { Layers, Cuboid, Network } from "lucide-react";
import ArchitectureOverview from "@/components/explorer/ArchitectureOverview";
import { AIAnalysisResult } from "@/lib/ai/AIClient";
import SettingsModal from "@/components/dashboard/SettingsModal";

// Helper for file system building
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

interface ExplorerViewProps {
    fileTree: string[];
    repoName: string;
    aiData: AIAnalysisResult | null;
    storeData: any; // Using any for store data to match structure
    paramsId: string; // The URL param ID
}

export default function ExplorerView({ fileTree, repoName, aiData, storeData, paramsId }: ExplorerViewProps) {
    // Layout State
    const [leftPanelWidth, setLeftPanelWidth] = useState(280);
    const [rightPanelWidth, setRightPanelWidth] = useState(380);

    // Context State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [fileSystem, setFileSystem] = useState<any>(null);
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState<string>("");

    // View State
    const [centerView, setCenterView] = useState<'structure' | 'code'>('structure');
    const [language, setLanguage] = useState("typescript");
    const [theme, setTheme] = useState("dark");
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Mobile
    const [activeMobileTab, setActiveMobileTab] = useState<'files' | 'code' | 'chat'>('files');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Build File System Tree
    useEffect(() => {
        if (fileTree && fileTree.length > 0) {
            const root = buildFileSystemFromPaths(fileTree);
            setFileSystem(root);
        }
    }, [fileTree]);

    // Handle File Selection
    useEffect(() => {
        if (!selectedFileId) return;

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
                // 1. Check Store/Cache
                if (storeData) {
                    if (storeData.allFiles && storeData.allFiles[selectedFileId]) {
                        setFileContent(storeData.allFiles[selectedFileId]);
                        return;
                    }
                    if (storeData.keyFiles && storeData.keyFiles[selectedFileId]) {
                        setFileContent(storeData.keyFiles[selectedFileId]);
                        return;
                    }
                }

                // 2. Fetch from Server
                const repoUrl = paramsId.startsWith("http") ? paramsId :
                    paramsId.startsWith("github.com/") ? `https://${paramsId}` :
                        `https://github.com/${paramsId}`;

                const res = await fetch('/api/repository/file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ repoUrl, filePath: selectedFileId })
                });

                if (res.ok) {
                    const json = await res.json();
                    setFileContent(json.content || "// Empty file.");
                } else {
                    const err = await res.json();
                    if (res.status === 404) {
                        setFileContent(`// ⚠️ Source file not found locally.\n// The analysis data is cached, but the repository cache might have been cleared.\n// Run a "Live Analysis" or "Re-sync" to download the source code again.\n// \n// Path: ${selectedFileId}`);
                    } else {
                        setFileContent(`// Failed to load content: ${err.error}\n// Path: ${selectedFileId}`);
                    }
                }
            } catch (e) {
                setFileContent(`// Error loading file content: ${e}\n// Path: ${selectedFileId}`);
            }
        };

        fetchContent();
    }, [selectedFileId, storeData, paramsId]); // Dependencies

    // Resizers
    const startResizeLeft = () => { document.addEventListener('mousemove', onMouseMoveLeft); document.addEventListener('mouseup', onMouseUpLeft); };
    const onMouseMoveLeft = (e: MouseEvent) => setLeftPanelWidth(Math.max(200, Math.min(600, e.clientX)));
    const onMouseUpLeft = () => { document.removeEventListener('mousemove', onMouseMoveLeft); document.removeEventListener('mouseup', onMouseUpLeft); };

    const startResizeRight = () => { document.addEventListener('mousemove', onMouseMoveRight); document.addEventListener('mouseup', onMouseUpRight); };
    const onMouseMoveRight = (e: MouseEvent) => setRightPanelWidth(Math.max(300, Math.min(800, window.innerWidth - e.clientX)));
    const onMouseUpRight = () => { document.removeEventListener('mousemove', onMouseMoveRight); document.removeEventListener('mouseup', onMouseUpRight); };

    return (
        <div className="flex h-full w-full bg-[#050505] text-white overflow-hidden font-sans flex-col md:flex-row">

            {/* LEFT: File Tree */}
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
                {!isMobile && <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-neon-cyan/50 transition-colors z-10" onMouseDown={startResizeLeft} />}
            </div>

            {/* CENTER: Structure / Code */}
            <div
                style={{ display: (isMobile && activeMobileTab !== 'code') ? 'none' : 'flex' }}
                className={`flex-1 flex-col min-w-0 bg-[#080808] relative ${isMobile ? 'pb-16' : ''}`}
            >
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
                                <ArchitectureOverview
                                    data={aiData}
                                    repoContext={{ fileTree, repoName }}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <Layers className="w-16 h-16 text-gray-400 mb-4" />
                                    <p>Select "Run Deep Analysis" from the main dashboard to generate structure.</p>
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

            {/* RIGHT: Chat */}
            <div
                style={{ width: isMobile ? '100%' : rightPanelWidth, display: (isMobile && activeMobileTab !== 'chat') ? 'none' : 'flex' }}
                className={`${isMobile ? 'flex-1 pb-16' : 'flex-shrink-0 border-l border-white/10'} flex flex-col bg-[#0A0A0A] relative z-20 shadow-2xl`}
            >
                {!isMobile && <div className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-neon-purple/50 transition-colors z-30" onMouseDown={startResizeRight} />}
                <div className="flex-1 overflow-hidden">
                    <AIAssistantChat
                        analysisData={aiData}
                        repoContext={{ fileTree, repoName }}
                        activeFile={selectedFileId ? { path: selectedFileId, content: fileContent } : undefined}
                    />
                </div>
            </div>

            {/* Mobile Tab Bar */}
            {isMobile && (
                <div className="flex items-center justify-around bg-[#0A0A0A] border-t border-white/10 p-2 fixed bottom-0 left-0 right-0 z-50">
                    <button onClick={() => setActiveMobileTab('files')} className={`flex flex-col items-center gap-1 text-[10px] ${activeMobileTab === 'files' ? 'text-neon-cyan' : 'text-gray-500'}`}>
                        <Layers className="w-5 h-5" /> Files
                    </button>
                    <button onClick={() => setActiveMobileTab('code')} className={`flex flex-col items-center gap-1 text-[10px] ${activeMobileTab === 'code' ? 'text-neon-purple' : 'text-gray-500'}`}>
                        <Cuboid className="w-5 h-5" /> Code
                    </button>
                    <button onClick={() => setActiveMobileTab('chat')} className={`flex flex-col items-center gap-1 text-[10px] ${activeMobileTab === 'chat' ? 'text-neon-pink' : 'text-gray-500'}`}>
                        <Network className="w-5 h-5" /> Chat
                    </button>
                </div>
            )}

            {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
        </div>
    );
}
