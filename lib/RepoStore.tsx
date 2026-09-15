"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { AIAnalysisResult } from "@/lib/ai/AIClient";

export interface RepoData {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    graphData: any;
    aiData: AIAnalysisResult | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fileSystem: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    analysisResults: any;
    isLoaded: boolean;
    repoName: string;
    keyFiles?: Record<string, string>;
    allFiles?: Record<string, string>;
    comparisonState?: {
        selectedCommit: string;
        diffData: any[];
        fixedIssues: any[];
        newIssues: any[];
        comparisonInsight: string;
        analyzedCommit: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        targetRepo?: any;
        comparisonType?: 'commits' | 'branches' | 'zip';
        sourceBranch?: string;
        targetBranch?: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        architecturalComparison?: any; // ArchitecturalComparison type
        openFiles?: string[];
    };
}

interface RepoStoreContextType {
    data: RepoData | null;
    setData: (data: RepoData) => void;
    clearData: () => void;
    getFromCache: (repoId: string) => RepoData | null;
    saveToCache: (repoId: string, data: RepoData) => void;
}

// const defaultData: RepoData = {
//     graphData: null,
//     aiData: null,
//     fileSystem: null,
//     analysisResults: null,
//     isLoaded: false,
//     repoName: "",
// };

const RepoStoreContext = createContext<RepoStoreContextType>({
    data: null,
    setData: () => { },
    clearData: () => { },
    getFromCache: () => null,
    saveToCache: () => { },
});

export function RepoStoreProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<RepoData | null>(null);

    const clearData = () => {
        setData(null);
    };

    const getFromCache = (repoId: string): RepoData | null => {
        if (typeof window === "undefined") return null;
        const cacheKey = `unified_repo_cache_${repoId}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch {
                return null;
            }
        }
        return null;
    };

    const saveToCache = (repoId: string, repoData: RepoData) => {
        if (typeof window === "undefined") return;
        const cacheKey = `unified_repo_cache_${repoId}`;
        try {
            localStorage.setItem(cacheKey, JSON.stringify(repoData));
            console.log("💾 Saved unified repo data to cache (localStorage):", repoId);
        } catch (e) {
            console.warn("Failed to save to cache:", e);
        }
    };

    return (
        <RepoStoreContext.Provider value={{ data, setData, clearData, getFromCache, saveToCache }}>
            {children}
        </RepoStoreContext.Provider>
    );
}

export function useRepoStore() {
    return useContext(RepoStoreContext);
}

// Helper to get normalized cache key
export function getCacheKey(repoId: string): string {
    return decodeURIComponent(repoId);
}
