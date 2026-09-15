"use client";

import { motion } from "framer-motion";
import { GitBranch, Activity, FileText, Share2 } from "lucide-react";

const features = [
    {
        title: "3D Dependency Graph",
        desc: "Explore your codebase as a navigable 3D galaxy of dependencies.",
        icon: <GitBranch className="w-8 h-8 text-neon-cyan" />,
    },
    {
        title: "Health Metrics",
        desc: "Real-time health score based on modularity and test coverage.",
        icon: <Activity className="w-8 h-8 text-neon-purple" />,
    },
    {
        title: "Pattern Detection",
        desc: "Identify design patterns and anti-patterns automatically.",
        icon: <FileText className="w-8 h-8 text-neon-pink" />,
    },
    {
        title: "Visual Export",
        desc: "Export interactive 3D reports for your entire team.",
        icon: <Share2 className="w-8 h-8 text-green-400" />,
    },
];

export default function Features() {
    return (
        <section className="py-16 md:py-24 w-full bg-[#050505] relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-col lg:flex-row items-center gap-12 md:gap-16">
                    <div className="lg:w-1/2 space-y-6 md:space-y-8">
                        <h2 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter">
                            The Physics of <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-neon-cyan to-neon-purple">Modern Engineering</span>
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                            {features.map((f, i) => (
                                <div key={i} className="space-y-3 md:space-y-4">
                                    <div className="glass w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center">
                                        {f.icon}
                                    </div>
                                    <h3 className="text-lg md:text-xl font-bold">{f.title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:w-1/2 relative aspect-square w-full max-w-md lg:max-w-none mx-auto">
                        <div className="absolute inset-0 bg-neon-cyan/10 blur-[100px] rounded-full animate-pulse" />
                        <motion.div
                            animate={{ rotateY: 360 }}
                            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                            className="relative z-10 w-full h-full glass rounded-[30px] md:rounded-[40px] border-2 border-white/20 flex items-center justify-center"
                        >
                            <div className="text-center space-y-3 md:space-y-4">
                                <div className="text-5xl md:text-6xl font-mono font-black text-neon-cyan">98.4</div>
                                <div className="text-gray-400 font-bold tracking-widest uppercase text-sm md:text-base">System Health</div>
                                <div className="flex gap-2 justify-center">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ height: [20, 60, 20] }}
                                            transition={{ delay: i * 0.2, repeat: Infinity }}
                                            className="w-2 rounded-full bg-neon-cyan/50"
                                        />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
