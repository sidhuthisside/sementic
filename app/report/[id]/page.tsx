"use client";

import { Settings, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import ReportBuilder, { ReportSection } from "@/components/report/ReportBuilder";
import ReportPreview from "@/components/report/ReportPreview";
import ExportControls from "@/components/report/ExportControls";
import { useRepoStore } from "@/lib/RepoStore";

const defaultSections: ReportSection[] = [
    { id: "summary", title: "Executive Summary", isVisible: true },
    { id: "architecture", title: "Architecture Diagram", isVisible: true },
    { id: "metrics", title: "Key Metrics", isVisible: true },
];

export default function ReportPage({ params }: { params: { id: string } }) {
    const [generating, setGenerating] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [reportData, setReportData] = useState<any>(null);
    const { data, getFromCache, setData } = useRepoStore();
    const [sections, setSections] = useState<ReportSection[]>(defaultSections);

    useEffect(() => {
        const loadData = async () => {
            // Try to load from cache first
            if (!data && params.id) {
                const cached = getFromCache(params.id);
                if (cached) {
                    setData(cached);
                    // Also trigger report generation if not exists
                    generateReport(cached);
                }
            } else if (data) {
                generateReport(data);
            }
        };
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id, data, getFromCache, setData]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generateReport = async (repoData: any) => {
        if (generating || (reportData && reportData.latex)) return;

        try {
            setGenerating(true);
            const response = await fetch('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    repoName: repoData.repoName || params.id,
                    metrics: repoData.analysisResults?.metrics || {},
                    summary: repoData.aiData?.summary || repoData.analysisResults?.summary || "No summary available.",
                    insights: [
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        ...(repoData.analysisResults?.patterns || []).map((p: any) => p.name),
                        ...(repoData.analysisResults?.insights || [])
                    ],
                    issues: repoData.analysisResults?.issues || []
                })
            });

            if (response.ok) {
                const result = await response.json();
                setReportData({
                    ...repoData,
                    latex: result.latex
                });
            }
        } catch (e) {
            console.error("Report generation failed", e);
        } finally {
            setGenerating(false);
        }
    };

    const handleToggle = (id: string) => {
        setSections(sections.map(s =>
            s.id === id ? { ...s, isVisible: !s.isVisible } : s
        ));
    };

    const handleReorder = (newSections: ReportSection[]) => {
        setSections(newSections);
    };


    const [isChatOpen, setIsChatOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [chatMessages, setChatMessages] = useState<any[]>([
        { role: 'assistant', content: 'Hello! I am Gemini. I can help you edit this LaTeX report. What would you like to change?' }
    ]);
    const [chatInput, setChatInput] = useState('');

    const handleChatSubmit = async () => {
        if (!chatInput.trim()) return;

        if (!reportData?.latex) {
            const statusMsg = generating
                ? "I'm still generating the initial report. Please wait a moment..."
                : "I don't have enough data to edit the report. Please ensure the analysis is complete.";
            setChatMessages(prev => [...prev, { role: 'user', content: chatInput }, { role: 'assistant', content: statusMsg }]);
            setChatInput('');
            return;
        }

        const newMsg = { role: 'user', content: chatInput };
        setChatMessages(prev => [...prev, newMsg]);
        setChatInput('');

        // Add loading state
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'Processing changes...' }]);

        try {
            const response = await fetch('/api/report/edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentLatex: reportData.latex,
                    instruction: newMsg.content
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to update report');
            }

            const result = await response.json();

            // Update Report Data with new LaTeX
            setReportData({
                ...reportData,
                latex: result.latex
            });

            // Update Chat
            setChatMessages(prev => {
                const msgs = prev.slice(0, -1); // Remove loading message
                return [...msgs, {
                    role: 'assistant',
                    content: `I've updated the report based on your request: "${newMsg.content}".`
                }];
            });

        } catch (e: any) {
            console.error(e);
            setChatMessages(prev => {
                const msgs = prev.slice(0, -1);
                return [...msgs, {
                    role: 'assistant',
                    content: `Sorry, I encountered an error updating the report: ${e.message || 'Unknown error'}`
                }];
            });
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-screen w-screen bg-[#050505] overflow-hidden text-white font-sans">
            {/* Sidebar Controls */}
            <div className={`w-full md:w-80 border-b md:border-b-0 md:border-r border-white/10 flex flex-col p-4 gap-4 bg-[#080808] z-10 shadow-xl flex-shrink-0 ${isChatOpen ? 'hidden md:flex' : 'flex'}`}>
                <Link
                    href={`/analyze/${params.id}`}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-2 py-1 -ml-2 rounded-md hover:bg-white/5 w-fit"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Analysis
                </Link>
                <div className="flex items-center justify-between">
                    {generating && <div className="w-4 h-4 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />}
                </div>

                <div className="flex-1 overflow-y-auto">
                    <ReportBuilder
                        sections={sections}
                        onToggle={handleToggle}
                        onReorder={handleReorder}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${isChatOpen ? 'bg-neon-purple/20 border-neon-purple text-neon-purple' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                    >
                        <Settings className="w-4 h-4" />
                        {isChatOpen ? 'Close Editor' : 'Edit with Gemini'}
                    </button>
                    <ExportControls targetId="report-preview" />
                </div>
            </div>

            {/* Main Preview Area */}
            <div className={`flex-1 bg-[#1a1a1a] overflow-hidden relative flex ${isChatOpen ? 'hidden md:flex' : 'flex'}`}>
                <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center">
                    <div id="report-preview-container" className="w-full max-w-[800px]">
                        <ReportPreview sections={sections} id="report-preview" data={reportData || data} />
                    </div>
                </div>

                {/* Qwen VL Chat Panel */}
                {isChatOpen && (
                    <div className="w-full md:w-96 absolute md:relative inset-0 md:inset-auto bg-[#0c0c0c] border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 z-50">
                        <div className="p-4 border-b border-white/10 bg-[#111]">
                            <h2 className="font-bold flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-neon-purple animate-pulse" />
                                Gemini Editor
                            </h2>
                            <p className="text-xs text-gray-500">Describe changes to update the LaTeX report</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {chatMessages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.role === 'user'
                                        ? 'bg-neon-purple/20 text-white border border-neon-purple/30'
                                        : 'bg-white/5 text-gray-300 border border-white/10'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-white/10 bg-[#111]">
                            <div className="flex gap-2">
                                <input
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                                    placeholder="Type instructions..."
                                    className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-neon-purple outline-none"
                                />
                                <button
                                    onClick={handleChatSubmit}
                                    className="p-2 bg-neon-purple/20 hover:bg-neon-purple/40 text-neon-purple rounded-lg transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4 rotate-180" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
