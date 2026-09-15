"use client";

import { motion } from "framer-motion";
import { GitMerge, AlertCircle, Check } from "lucide-react";
import { useState } from "react";

export default function MergeWizard() {
    const [step, setStep] = useState(0);

    const suggestions = [
        { id: 1, type: "Performance", title: "Use reduce instead of loop", risk: "Low" },
        { id: 2, type: "Security", title: "Sanitize input in API handler", risk: "Medium" },
    ];

    return (
        <div className="bg-[#111] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <GitMerge className="w-4 h-4 text-neon-purple" />
                    AI Merge Wizard
                </h3>
                <span className="text-xs text-gray-500">Step {step + 1} of 3</span>
            </div>

            {step === 0 && (
                <div className="space-y-2">
                    {suggestions.map(s => (
                        <motion.div
                            key={s.id}
                            whileHover={{ scale: 1.02 }}
                            className="p-3 bg-white/5 border border-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                            onClick={() => setStep(1)}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold text-neon-cyan px-2 py-0.5 bg-neon-cyan/10 rounded">{s.type}</span>
                                <span className={`text-xs ${s.risk === 'Low' ? 'text-green-400' : 'text-yellow-400'}`}>{s.risk} Risk</span>
                            </div>
                            <p className="text-sm text-gray-300">{s.title}</p>
                        </motion.div>
                    ))}
                </div>
            )}

            {step === 1 && (
                <div className="text-center py-4">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                        <AlertCircle className="w-6 h-6 text-yellow-500" />
                    </div>
                    <h4 className="text-sm font-bold mb-2">Confirm Merge Strategy</h4>
                    <p className="text-xs text-gray-400 mb-4">This will apply the &apos;performance&apos; optimization patch. The original code will be backed up.</p>

                    <div className="flex gap-2">
                        <button onClick={() => setStep(0)} className="flex-1 py-2 rounded bg-white/5 hover:bg-white/10 text-xs">Cancel</button>
                        <button onClick={() => setStep(2)} className="flex-1 py-2 rounded bg-neon-purple hover:bg-neon-purple/80 text-white text-xs font-bold">Apply</button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="text-center py-6">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3"
                    >
                        <Check className="w-6 h-6 text-green-500" />
                    </motion.div>
                    <h4 className="text-sm font-bold mb-1">Merged Successfully!</h4>
                    <button onClick={() => setStep(0)} className="text-xs text-gray-500 hover:text-white mt-2">Start Over</button>
                </div>
            )}
        </div>
    );
}
