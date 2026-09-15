"use client";

import * as React from "react";
import { AIOrchestrator } from "@/lib/ai/AIOrchestrator";
import { AIAnalysisResult } from "@/lib/ai/AIClient";
import { fetchGithubRepo } from "@/lib/githubFetcher";
import AIInsightsPanel from "@/components/dashboard/AIInsightsPanel";
import AIAssistantChat from "@/components/dashboard/AIAssistantChat";
import { ArrowLeft, Cpu, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthContext";
import { getRepoSlug } from "@/lib/repoUtils";
import { useToast } from "@/lib/ToastContext";


export default function AIArchitectPage({ params }: { params: { id: string } }) {
    const [isMounted, setIsMounted] = React.useState(false);
    const [aiData, setAiData] = React.useState<AIAnalysisResult | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [status, setStatus] = React.useState<string>("Initializing...");
    const [error, setError] = React.useState<string | null>(null);
    const [hasFetched, setHasFetched] = React.useState(false);
    const { user } = useAuth();
    const { showToast } = useToast();

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    React.useEffect(() => {
        // Check cache first - try both AI architect specific and main repo cache
        const normalizedId = decodeURIComponent(params.id);
        const aiCacheKey = `ai_architect_cache_${normalizedId}`;
        const repoCacheKey = `repo_cache_${normalizedId}`;

        // First try AI architect specific cache
        const aiCachedData = typeof window !== 'undefined' ? sessionStorage.getItem(aiCacheKey) : null;

        if (aiCachedData && !hasFetched) {
            try {
                const parsed = JSON.parse(aiCachedData);
                setAiData(parsed);
                setLoading(false);
                setHasFetched(true);
                return;
            } catch {
                console.warn("Failed to parse AI cache");
            }
        }

        // Then try main repo cache which has AI data too
        const repoCachedData = typeof window !== 'undefined' ? sessionStorage.getItem(repoCacheKey) : null;

        if (repoCachedData && !hasFetched) {
            try {
                const parsed = JSON.parse(repoCachedData);
                if (parsed.aiData) {
                    setAiData(parsed.aiData);
                    setLoading(false);
                    setHasFetched(true);
                    // Also save to AI cache for faster access next time
                    sessionStorage.setItem(aiCacheKey, JSON.stringify(parsed.aiData));
                    return;
                }
            } catch {
                console.warn("Failed to parse repo cache");
            }
        }

        // 2b. Check Supabase Storage (Cloud Persistence)
        const checkSupabase = async () => {
            if (!user) return false;

            try {
                const isManual = normalizedId === "Manual Upload";
                const repoSlug = isManual ? "Manual-Upload" : getRepoSlug(normalizedId);

                // Consistent file naming: reports/user-id/slug.json
                const fileName = `reports/${user.id}/${repoSlug}.json`;

                const { data, error } = await supabase.storage
                    .from('analysis-results')
                    .download(fileName);

                if (data && !error) {
                    const text = await data.text();
                    const fullReport = JSON.parse(text);

                    const aiResults = fullReport.aiAnalysis || fullReport.aiData || fullReport;
                    setAiData(aiResults);
                    setLoading(false);
                    setHasFetched(true);

                    // Update cache
                    sessionStorage.setItem(aiCacheKey, JSON.stringify(aiResults));
                    return true;
                }
            } catch (err) {
                console.warn("Supabase fetch failed in AI Architect:", err);
            }
            return false;
        };

        if (hasFetched) {
            return;
        }

        const runInit = async () => {
            const foundInCloud = await checkSupabase();
            if (foundInCloud) return;
            analyzeRepo();
        };

        const analyzeRepo = async () => {
            setHasFetched(true);
            setLoading(true);
            setStatus("Fetching Repository Data...");
            setError(null);

            try {
                const repoUrl = decodeURIComponent(params.id).startsWith("http")
                    ? decodeURIComponent(params.id)
                    : `https://github.com/${decodeURIComponent(params.id)}`;

                // Fetch GitHub data with NEW token
                const githubToken = process.env.NEXT_PUBLIC_GITHUB_TOKEN;

                if (!githubToken) {
                    setError("GitHub token is missing. Please configure NEXT_PUBLIC_GITHUB_TOKEN.");
                    setLoading(false);
                    return;
                }

                const data = await fetchGithubRepo(repoUrl, githubToken);

                if (data.error) {
                    setError(`Failed to fetch repository: ${data.error}`);
                    setLoading(false);
                    return;
                }

                // Run AI Analysis
                setStatus("Analyzing Architecture with Gemini AI...");
                const aiResults = await AIOrchestrator.analyze({
                    repoName: params.id,
                    fileTree: data.filePaths || [],
                    dependencyFile: data.dependencyFile || "",
                    keyFiles: data.keyFiles || {}
                });

                setStatus("Finalizing...");
                setAiData(aiResults);
                showToast("Architectural analysis complete!", "success");

                // Cache the results
                if (typeof window !== 'undefined') {
                    const aiCacheKey = `ai_architect_cache_${decodeURIComponent(params.id)}`;
                    sessionStorage.setItem(aiCacheKey, JSON.stringify(aiResults));
                }
            } catch (err) {
                console.error("AI Analysis Error:", err);
                setError(err instanceof Error ? err.message : "Failed to analyze repository");
                showToast("AI analysis failed", "error");
            } finally {
                setLoading(false);
            }
        };

        runInit();
    }, [params.id, hasFetched, user, showToast]);

    if (!isMounted) {
        return <div className="min-h-screen bg-[#050505]" />;
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            {/* Header */}
            <div className="border-b border-white/10 bg-[#080808] sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/analyze/${encodeURIComponent(params.id)}`}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="min-w-0">
                            <h1 className="text-xl font-bold flex items-center gap-2 text-nowrap">
                                <Cpu className="w-5 h-5 text-neon-cyan shrink-0" />
                                AI Architect Analysis
                            </h1>
                            <p className="text-xs text-gray-500 truncate max-w-[200px] sm:max-w-md">{decodeURIComponent(params.id)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {loading && (
                            <div className="flex items-center gap-2 text-sm text-neon-cyan">
                                <Sparkles className="w-4 h-4 animate-pulse" />
                                Analyzing...
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto px-6 py-12"
            >
                {(!isMounted || loading) ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-6">
                        <div className="relative">
                            <div className="w-20 h-20 border-t-2 border-b-2 border-neon-cyan rounded-full animate-spin"></div>
                            <Cpu className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-neon-cyan animate-pulse" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-white mb-2">{status === "Initializing..." ? "Architecting Solutions" : status}</h2>
                            <p className="text-gray-400">
                                {status === "Analyzing Architecture with Gemini AI..."
                                    ? "This may take 10-20 seconds for deep inspection..."
                                    : "Synthesizing codebase patterns and structural insights..."}
                            </p>
                        </div>
                    </div>
                ) : error ? (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-6"
                    >
                        <h3 className="font-bold text-red-400 mb-2">Analysis Failed</h3>
                        <p className="text-sm text-gray-400">{error}</p>
                        <p className="text-xs text-gray-500 mt-2">
                            Make sure your GitHub token is valid and the repository exists.
                        </p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: AI Analysis Panel */}
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden">
                            <div className="border-b border-white/10 p-4 bg-white/5">
                                <h2 className="font-bold text-lg flex items-center gap-2">
                                    <Cpu className="w-5 h-5 text-neon-cyan" />
                                    Deep Architectural Analysis
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    Powered by Groq Llama 3.3 70B
                                </p>
                            </div>
                            <div className="h-[calc(100vh-250px)] relative">
                                <AIInsightsPanel data={aiData} loading={loading} />
                            </div>
                        </div>

                        {/* Right: AI Assistant Chat */}
                        <div className="h-[calc(100vh-250px)]">
                            <AIAssistantChat analysisData={aiData} />
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
