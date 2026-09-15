"use client";

import { GitBranch } from "lucide-react";

export default function ArchitectureSection({ data }: { data: { aiData?: { patterns?: { name: string; description?: string }[] } } }) {
    const patterns = data?.aiData?.patterns || [];

    return (
        <div className="p-8 bg-white text-black">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <GitBranch className="w-6 h-6 text-neon-pink" />
                Module Architecture
            </h2>

            {/* Diagram Container - Changed to be responsive and print-friendly */}
            <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-8 mb-6 flex items-center justify-center">
                <div className="flex gap-4 md:gap-12 items-center flex-wrap justify-center w-full max-w-4xl">

                    {/* Tier 1: Client */}
                    <div className="flex flex-col items-center gap-3 relative group">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl flex items-center justify-center text-white z-10 transition-transform transform hover:-translate-y-1">
                            <span className="font-bold text-lg">Client</span>
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-gray-700">Presentation</p>
                            <p className="text-xs text-gray-500">React / Next.js</p>
                        </div>
                    </div>

                    {/* Arrow 1 */}
                    <div className="hidden md:flex flex-1 h-[2px] bg-gray-300 relative items-center justify-center min-w-[50px]">
                        <span className="absolute -top-3 text-xs text-gray-400 font-mono">HTTPS/JSON</span>
                        <div className="absolute right-0 w-2 h-2 border-t-2 border-r-2 border-gray-300 rotate-45" />
                    </div>

                    {/* Tier 2: API */}
                    <div className="flex flex-col items-center gap-3 relative group">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-xl flex items-center justify-center text-white z-10 transition-transform transform hover:-translate-y-1">
                            <span className="font-bold text-lg">API Logic</span>
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-gray-700">Business Layer</p>
                            <p className="text-xs text-gray-500">Node / Server Actions</p>
                        </div>
                    </div>

                    {/* Arrow 2 */}
                    <div className="hidden md:flex flex-1 h-[2px] bg-gray-300 relative items-center justify-center min-w-[50px]">
                        <span className="absolute -top-3 text-xs text-gray-400 font-mono">SQL/ORM</span>
                        <div className="absolute right-0 w-2 h-2 border-t-2 border-r-2 border-gray-300 rotate-45" />
                    </div>

                    {/* Tier 3: Data */}
                    <div className="flex flex-col items-center gap-3 relative group">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-xl flex items-center justify-center text-white z-10 transition-transform transform hover:-translate-y-1">
                            <span className="font-bold text-lg">Storage</span>
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-gray-700">Persistence</p>
                            <p className="text-xs text-gray-500">Supabase / Postgres</p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Added: Real Pattern List */}
            {patterns.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold mb-3">Detected Patterns</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        {patterns.map((p, i) => (
                            <li key={i} className="text-gray-700">
                                <span className="font-bold">{p.name}</span>: {p.description || "No description detected."}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
