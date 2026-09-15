"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";

export default function SummarySection({ data }: { data: { repoName?: string; aiData?: { summary?: string; intent?: { pattern?: string }; metrics?: { maintainability?: number }; issues?: Record<string, unknown>[]; explanations?: { macro?: string } } } }) {
    const repoName = data?.repoName || "Repository";
    const aiSummary = data?.aiData?.summary || data?.aiData?.explanations?.macro || "No AI summary available yet.";
    const intent = data?.aiData?.intent?.pattern || "Unknown Pattern";

    // Heuristic or AI grade
    const score = data?.aiData?.metrics?.maintainability || 85;
    const grade = score > 90 ? "A" : score > 80 ? "B" : score > 70 ? "C" : "D";

    return (
        <div className="p-8 bg-white text-black min-h-[200px]">
            <h2 className="text-3xl font-bold mb-6 border-b-4 border-neon-cyan pb-2 inline-block">Executive Summary</h2>

            <div className="flex gap-8 mb-8">
                <div className="flex-1 space-y-4">
                    <p className="text-gray-700 leading-relaxed">
                        The repository <span className="font-bold">{repoName}</span> has been analyzed.
                        {data?.aiData ? (
                            <span> It exhibits characteristics of a <span className="font-bold">{intent}</span>.</span>
                        ) : (
                            <span> Analysis data is currently being generated.</span>
                        )}
                    </p>
                    <div className="text-gray-700 leading-relaxed p-4 bg-gray-50 rounded-lg italic border-l-4 border-neon-cyan">
                        &quot;{aiSummary}&quot;
                    </div>
                </div>

                <div className="w-1/3 bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="text-center">
                        <div className="text-5xl font-black text-neon-cyan mb-2">{grade}</div>
                        <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Overall Grade</div>
                    </div>
                    <div className="mt-6 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-green-700">
                            <CheckCircle2 className="w-4 h-4" /> Maintainability: {score.toFixed(2)}/100
                        </div>
                        {(data?.aiData?.issues?.length ?? 0) > 0 && (
                            <div className="flex items-center gap-2 text-sm text-yellow-600">
                                <AlertTriangle className="w-4 h-4" /> {data?.aiData?.issues?.length} Issues Detected
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
