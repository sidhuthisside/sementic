"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight, X } from "lucide-react";

export type TourStep = {
    targetId: string;
    title: string;
    content: string;
    position?: "top" | "bottom" | "left" | "right";
};

export default function GuidedTour({ steps, onComplete }: { steps: TourStep[], onComplete: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        const updateTarget = () => {
            const element = document.getElementById(steps[currentStep].targetId);
            if (element) {
                setTargetRect(element.getBoundingClientRect());
                element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        };

        updateTarget();
        window.addEventListener("resize", updateTarget);
        return () => window.removeEventListener("resize", updateTarget);
    }, [currentStep, steps]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    if (!targetRect) return null;

    return (
        <div className="fixed inset-0 z-50 pointer-events-none">
            {/* Dark Overlay with cutout */}
            <svg className="absolute inset-0 w-full h-full opacity-70">
                <defs>
                    <mask id="tour-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        <rect
                            x={targetRect.left - 4}
                            y={targetRect.top - 4}
                            width={targetRect.width + 8}
                            height={targetRect.height + 8}
                            fill="black"
                            rx="8"
                        />
                    </mask>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="black" mask="url(#tour-mask)" />
            </svg>

            {/* Highlighter Pulse */}
            <motion.div
                layoutId="highlight"
                className="absolute border-2 border-neon-cyan rounded-lg pointer-events-none"
                style={{
                    left: targetRect.left - 4,
                    top: targetRect.top - 4,
                    width: targetRect.width + 8,
                    height: targetRect.height + 8,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                <div className="absolute -inset-1 border border-neon-cyan/50 rounded-lg animate-ping" />
            </motion.div>

            {/* Tooltip Card */}
            <div
                className="absolute pointer-events-auto"
                style={{
                    left: targetRect.left + (steps[currentStep].position === "right" ? targetRect.width + 20 : 0),
                    top: targetRect.top + (steps[currentStep].position === "bottom" ? targetRect.height + 20 : 0),
                }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    key={currentStep}
                    className="bg-[#1a1a1a] border border-neon-cyan/50 text-white p-4 rounded-xl shadow-2xl max-w-xs"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-neon-cyan uppercase tracking-wider">Step {currentStep + 1}/{steps.length}</span>
                        <button onClick={onComplete} className="text-gray-500 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <h3 className="text-lg font-bold mb-2">{steps[currentStep].title}</h3>
                    <p className="text-sm text-gray-300 mb-4 leading-relaxed">{steps[currentStep].content}</p>

                    <div className="flex justify-end">
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-4 py-2 bg-neon-cyan text-black font-bold rounded-lg hover:bg-cyan-400 transition-colors"
                        >
                            {currentStep === steps.length - 1 ? "Finish" : "Next"} <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
