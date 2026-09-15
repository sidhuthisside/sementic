"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { AnalysisProgress as ProgressType } from "@/lib/analyzer/AnalysisOrchestrator";

const steps = [
    { id: 'parsing', label: 'Parsing Code' },
    { id: 'patterns', label: 'Detecting Patterns' },
    { id: 'dependencies', label: 'Building Graph' },
    { id: 'metrics', label: 'Calculating Metrics' },
    { id: 'ai-insights', label: 'AI Analysis' },
    { id: 'complete', label: 'Complete' }
];

export default function AnalysisProgress({ progress }: { progress: ProgressType | null }) {
    if (!progress) return null;

    const currentStepIndex = steps.findIndex(s => s.id === progress.step);

    return (
        <div className="p-6 bg-[#111] border border-white/10 rounded-xl">
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold">Analyzing Code...</h3>
                    <span className="text-xs text-gray-500">{progress.progress}%</span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress.progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                </div>

                <p className="text-xs text-gray-400 mt-2">{progress.message}</p>
            </div>

            {/* Step Indicators */}
            <div className="space-y-3">
                {steps.map((step, index) => {
                    const isComplete = index < currentStepIndex;
                    const isCurrent = index === currentStepIndex;


                    return (
                        <div key={step.id} className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isComplete ? 'bg-green-500/20 text-green-500' :
                                isCurrent ? 'bg-neon-cyan/20 text-neon-cyan' :
                                    'bg-white/5 text-gray-600'
                                }`}>
                                {isComplete ? (
                                    <Check className="w-4 h-4" />
                                ) : isCurrent ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <span className="text-xs">{index + 1}</span>
                                )}
                            </div>

                            <span className={`text-sm ${isComplete || isCurrent ? 'text-white font-medium' : 'text-gray-500'
                                }`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
