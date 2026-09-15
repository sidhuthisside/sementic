"use client";

import { motion } from "framer-motion";
import ThreeScene from "../ui/ThreeScene";
import GithubInput from "../ui/GithubInput";

export default function Hero() {
    return (
        <section className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden">
            <ThreeScene />

            <div className="relative z-10 text-center space-y-6 md:space-y-8 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="space-y-3 md:space-y-4"
                >
                    <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tighter text-neon-cyan">
                        Uncover Hidden <br />
                        <span className="text-white">Architecture</span>
                    </h1>
                    <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-xl mx-auto px-4">
                        Analyze, visualize, and understand complex codebases in immersive 3D space.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="flex flex-col items-center gap-3 md:gap-4"
                >
                    <GithubInput />
                    <a href="/analyze-code" className="text-xs sm:text-sm text-gray-500 hover:text-neon-cyan transition-colors duration-300 border-b border-transparent hover:border-neon-cyan pb-0.5 mt-2 px-4 text-center">
                        Or upload files manually for Live Analysis &rarr;
                    </a>
                </motion.div>
            </div>

            <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2">
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-5 h-8 md:w-6 md:h-10 border-2 border-white/20 rounded-full flex justify-center p-1"
                >
                    <div className="w-1 h-2 bg-white/50 rounded-full" />
                </motion.div>
            </div>
        </section>
    );
}
