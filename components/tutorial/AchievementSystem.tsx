"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type Achievement = {
    id: string;
    title: string;
    description: string;
    icon: string;
};

export default function AchievementSystem() {
    const [unlocked, setUnlocked] = useState<Achievement | null>(null);

    const triggerAchievement = (achievement: Achievement) => {
        setUnlocked(achievement);
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#00f3ff', '#bc13fe', '#ff00ff']
        });

        setTimeout(() => setUnlocked(null), 4000);
    };

    // Expose trigger globally for demo purposes
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).unlockAchievement = triggerAchievement;
    }, []);

    return (
        <AnimatePresence>
            {unlocked && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.5 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 bg-gradient-to-r from-[#1a1a1a] to-[#0a0a0a] border border-neon-cyan/50 p-4 rounded-xl shadow-[0_0_30px_rgba(0,243,255,0.3)]"
                >
                    <div className="w-12 h-12 bg-neon-cyan/20 rounded-full flex items-center justify-center border border-neon-cyan">
                        <Award className="w-6 h-6 text-neon-cyan animate-pulse" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-neon-cyan uppercase tracking-widest mb-1">Achievement Unlocked!</div>
                        <h3 className="text-lg font-black text-white">{unlocked.title}</h3>
                        <p className="text-sm text-gray-400">{unlocked.description}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
