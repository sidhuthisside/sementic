"use client";

import { useState } from "react";
import GuidedTour, { TourStep } from "@/components/tutorial/GuidedTour";
import AchievementSystem from "@/components/tutorial/AchievementSystem";
import InteractiveSandbox from "@/components/tutorial/InteractiveSandbox";
import VideoPlayer from "@/components/tutorial/VideoPlayer";
import { GraduationCap, BookOpen, Code, Film, PlayCircle, Lock } from "lucide-react";


export default function TutorialPage() {
    const [showTour, setShowTour] = useState(false);

    const tourSteps: TourStep[] = [
        { targetId: "learning-paths", title: "Learning Paths", content: "Choose a path tailored to your skill level, from Beginner to Expert.", position: "bottom" },
        { targetId: "sandbox", title: "Interactive Sandbox", content: "Practice coding patterns in real-time with instant feedback.", position: "right" },
        { targetId: "video-tutorials", title: "Video Tutorials", content: "Watch expert breakdowns of complex architecture concepts.", position: "top" },
    ];

    const LearningPathCard = ({ title, level, progress, locked }: { title: string, level: string, progress: number, locked?: boolean }) => (
        <div className={`p-6 bg-[#111] border rounded-xl relative overflow-hidden group hover:border-neon-cyan/50 transition-colors ${locked ? 'border-white/5 opacity-50' : 'border-white/10'}`}>
            {locked && <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px] z-10"><Lock className="w-8 h-8 text-white/50" /></div>}

            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/5 rounded-lg group-hover:bg-neon-cyan/10 transition-colors">
                    <BookOpen className={`w-6 h-6 ${locked ? 'text-gray-500' : 'text-neon-cyan'}`} />
                </div>
                <span className="text-xs font-bold text-gray-500 uppercase">{level}</span>
            </div>

            <h3 className="text-xl font-bold mb-2">{title}</h3>

            <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-neon-cyan" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-gray-500">{progress}% Complete</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8">
            <AchievementSystem />
            {showTour && <GuidedTour steps={tourSteps} onComplete={() => setShowTour(false)} />}

            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-8 gap-6 md:gap-0">
                    <div>
                        <h1 className="text-4xl font-black mb-2 flex items-center gap-4">
                            <GraduationCap className="w-10 h-10 text-neon-pink" />
                            Architect Academy
                        </h1>
                        <p className="text-gray-400 max-w-xl">Master software architecture through interactive lessons, real-time feedback, and gamified challenges.</p>
                    </div>
                    <button
                        onClick={() => setShowTour(true)}
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-bold flex items-center gap-2 transition-all w-full md:w-auto justify-center"
                    >
                        <PlayCircle className="w-5 h-5" /> Take Tour
                    </button>
                </div>

                {/* Learning Paths */}
                <section id="learning-paths">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Code className="w-6 h-6 text-neon-purple" /> Learning Paths
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <LearningPathCard title="Pattern Basics" level="Beginner" progress={65} />
                        <LearningPathCard title="System Design" level="Intermediate" progress={30} />
                        <LearningPathCard title="Microservices" level="Expert" progress={0} locked />
                    </div>
                </section>

                {/* Sandbox */}
                <section id="sandbox">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Code className="w-6 h-6 text-neon-cyan" /> Pattern Sandbox
                    </h2>
                    <InteractiveSandbox />
                </section>

                {/* Video Tutorials */}
                <section id="video-tutorials">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Film className="w-6 h-6 text-neon-pink" /> Video Lessons
                    </h2>
                    <VideoPlayer />
                </section>
            </div>
        </div>
    );
}
