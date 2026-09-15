"use client";

import { useState } from "react";
import { Play, Pause, Volume2, Maximize } from "lucide-react";

const transcript = [
    { time: "0:00", text: "Welcome to Architect AI. Let's start with the basics." },
    { time: "0:05", text: "First, upload your repository URL in the input field." },
    { time: "0:12", text: "Our engine analyzes the dependency graph in real-time." },
    { time: "0:18", text: "You can visualize the architecture in 3D space." },
];

export default function VideoPlayer() {
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <div className="flex flex-col md:flex-row gap-4 bg-[#111] border border-white/10 rounded-xl p-4">
            {/* Video Area */}
            <div className="flex-1 relative aspect-video bg-black rounded-lg overflow-hidden group cursor-pointer" onClick={() => setIsPlaying(!isPlaying)}>
                {/* Mock Video Content */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neon-purple/20 to-neon-cyan/20">
                    {!isPlaying && (
                        <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                            <Play className="w-8 h-8 text-white fill-current ml-1" />
                        </div>
                    )}
                </div>

                {/* Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform">
                    <div className="h-1 bg-white/20 rounded-full mb-4 overflow-hidden">
                        <div className="h-full w-1/3 bg-neon-cyan" />
                    </div>
                    <div className="flex justify-between text-white">
                        <div className="flex gap-4">
                            <button>{isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>
                            <Volume2 className="w-4 h-4" />
                            <span className="text-xs self-center">0:15 / 1:45</span>
                        </div>
                        <Maximize className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* Transcript */}
            <div className="w-full md:w-64 h-64 md:h-auto flex flex-col bg-[#1a1a1a] rounded-lg border border-white/5">
                <div className="p-3 border-b border-white/5 text-xs font-bold text-gray-500 uppercase">Transcript</div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {transcript.map((item, i) => (
                        <div key={i} className="p-2 hover:bg-white/5 rounded cursor-pointer group transition-colors">
                            <span className="text-neon-cyan text-xs font-mono mr-2 group-hover:text-white transition-colors">{item.time}</span>
                            <span className="text-gray-400 text-sm group-hover:text-white transition-colors">{item.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
