"use client";

import { useState, useEffect } from "react";
import { Activity, Cpu, Database, Wifi } from "lucide-react";
import { motion } from "framer-motion";

export default function PerformanceMonitor() {
    const [fps, setFps] = useState(60);
    const [memory, setMemory] = useState<{ usedJSHeapSize: number; jsHeapSizeLimit: number } | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        let frameCount = 0;
        let lastTime = performance.now();

        const update = () => {
            frameCount++;
            const now = performance.now();
            if (now - lastTime >= 1000) {
                setFps(Math.round((frameCount * 1000) / (now - lastTime)));
                frameCount = 0;
                lastTime = now;

                // Check memory usage if available (Chrome only)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((performance as any).memory) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    setMemory((performance as any).memory);
                }
            }
            requestAnimationFrame(update);
        };

        const handleId = requestAnimationFrame(update);
        return () => cancelAnimationFrame(handleId);
    }, []);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 left-4 z-30 p-2 bg-black/50 backdrop-blur border border-white/10 rounded-full text-xs font-mono text-neon-cyan hover:bg-white/10 transition-colors"
            >
                FPS: {fps}
            </button>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed bottom-4 left-4 z-30 w-64 bg-[#111]/90 backdrop-blur border border-white/10 rounded-xl p-4 shadow-2xl font-mono text-xs"
        >
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-neon-pink" /> System Status
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">close</button>
            </div>

            <div className="space-y-3">
                {/* FPS Meter */}
                <div>
                    <div className="flex justify-between text-gray-400 mb-1">
                        <span>Frame Rate</span>
                        <span className={fps < 30 ? 'text-red-500' : 'text-green-500'}>{fps} FPS</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${fps < 30 ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(100, (fps / 60) * 100)}%` }}
                        />
                    </div>
                </div>

                {/* Memory Usage */}
                {memory && (
                    <div>
                        <div className="flex justify-between text-gray-400 mb-1 items-center">
                            <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> Memory</span>
                            <span>{Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-neon-purple"
                                style={{ width: `${Math.min(100, (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="flex justify-between text-gray-400 pt-2 border-t border-white/10">
                    <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> Network</span>
                    <span className="text-green-400">Online</span>
                </div>

                <div className="flex justify-between text-gray-400">
                    <span className="flex items-center gap-1"><Database className="w-3 h-3" /> Cache</span>
                    <span className="text-neon-cyan">Active</span>
                </div>
            </div>
        </motion.div>
    );
}
