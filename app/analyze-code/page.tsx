"use client";

import { useState } from "react";
import CodeUploader from "@/components/analyzer/CodeUploader";
import AnalysisProgress from "@/components/analyzer/AnalysisProgress";
import { AnalysisOrchestrator, AnalysisProgress as ProgressType } from "@/lib/analyzer/AnalysisOrchestrator";
import { AIOrchestrator } from "@/lib/ai/AIOrchestrator";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AnalyzeCodePage() {
    const [files, setFiles] = useState<{ name: string; content: string }[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState<ProgressType | null>(null);

    const router = useRouter();
    const { user } = useAuth();

    const handleFilesUploaded = (uploadedFiles: { name: string; content: string }[]) => {
        setFiles(uploadedFiles);
    };

    const handleAnalyze = async () => {
        if (files.length === 0) return;

        setIsAnalyzing(true);
        setProgress(null);

        const orchestrator = new AnalysisOrchestrator();

        try {
            // 1. Run local heuristic analysis
            const analysisResults = await orchestrator.analyze(files, (p) => {
                setProgress(p);
            });

            // 2. Start AI Analysis
            const fileTree = files.map(f => f.name);
            const dependencyFileObj = files.find(f => f.name.endsWith('package.json') || f.name.endsWith('go.mod') || f.name.endsWith('requirements.txt'));
            const dependencyFile = dependencyFileObj ? dependencyFileObj.content : "{}";

            const keyFiles: Record<string, string> = {};
            files.slice(0, 5).forEach(f => keyFiles[f.name] = f.content);

            const aiData = await AIOrchestrator.analyze({
                repoName: "Manual Upload",
                fileTree,
                dependencyFile,
                keyFiles
            });

            // 2.5 Prepare Full Data Object
            const allFilesMap: Record<string, string> = {};
            files.forEach(f => allFilesMap[f.name] = f.content);

            // Construct a graph data object that matches what the dashboard expects
            const graphData = {
                nodes: files.map(f => ({ id: f.name, name: f.name.split('/').pop(), group: 1, val: 5 })),
                links: [], // Links will be populated by AI analysis enrichment if available
                metrics: analysisResults.metrics,
                dependencyFile,
                keyFiles
            };

            // Enrich AI data to get links
            const enrichedAI = AIOrchestrator.enrichAnalysisData(aiData, fileTree, graphData);

            // Enhanced graph logic: add links from AI
            if (enrichedAI.structural?.dependencyMapping?.directedRelationships) {
                const newLinks = enrichedAI.structural.dependencyMapping.directedRelationships
                    .map((rel: string) => {
                        const [source, target] = rel.split(' -> ');
                        if (source && target) return { source, target };
                        return null;
                    })
                    .filter(Boolean);
                // @ts-expect-error - dynamic link addition
                graphData.links = newLinks;
            }

            const repoData = {
                repoName: "Manual-Upload",
                graphData,
                aiData: enrichedAI,
                fileSystem: { fileTree },
                analysisResults: {
                    metrics: { ...analysisResults.metrics, ...enrichedAI.metrics },
                    patterns: enrichedAI.patterns,
                    insights: enrichedAI.insights,
                    issues: enrichedAI.issues,
                    recommendations: enrichedAI.recommendations
                },
                isLoaded: true,
                keyFiles,
                allFiles: allFilesMap
            };

            // 3. Save to Local Persistence API
            await fetch('/api/analysis/local', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repoId: "Manual-Upload", data: repoData })
            });

            // 4. Save to Supabase Storage if user is logged in (Backup)
            if (user) {
                const repoSlug = "Manual-Upload";
                const fileName = `reports/${user.id}/${repoSlug}.json`;

                const fullReport = {
                    metadata: {
                        repoName: "Manual Upload",
                        analyzedAt: new Date().toISOString(),
                    },
                    localAnalysis: graphData,
                    aiAnalysis: enrichedAI,
                    analysisResults: repoData.analysisResults
                };

                const blob = new Blob([JSON.stringify(fullReport, null, 2)], { type: 'application/json' });

                supabase.storage
                    .from('analysis-results')
                    .upload(fileName, blob, { upsert: true })
                    .catch(e => console.error("Supabase upload failed", e));
            }

            // 5. Redirect to Main Dashboard
            router.push('/analyze/Manual-Upload?view=graph');

        } catch (error) {
            console.error('Analysis error:', error);
            setIsAnalyzing(false);
            alert("Analysis failed. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            {/* Header */}
            <div className="border-b border-white/10 bg-[#080808]">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-neon-cyan" />
                                Live Code Analysis
                            </h1>
                            <p className="text-xs text-gray-500">Upload your code for instant AI-powered insights</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="max-w-2xl mx-auto space-y-6">
                    <CodeUploader onFilesUploaded={handleFilesUploaded} />

                    <AnimatePresence>
                        {files.length > 0 && !isAnalyzing && (
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                onClick={handleAnalyze}
                                className="w-full py-3 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink hover:opacity-80 text-white rounded-xl font-bold transition-opacity"
                            >
                                Analyze Code
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {isAnalyzing && (
                        <div className="bg-[#111] border border-white/10 rounded-xl p-6">
                            <AnalysisProgress progress={progress} />
                            <p className="text-center text-gray-400 text-sm mt-4 animate-pulse">
                                Redirecting to dashboard after analysis...
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
