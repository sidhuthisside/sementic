"use client";

import { useState } from "react";
import CodeEditor from "@/components/explorer/CodeEditor";
import { Play, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InteractiveSandbox() {
    const [code, setCode] = useState(`// Try implementing the Singleton pattern
class Database {
  // TODO: Add private static instance

  constructor() {
    // TODO: Prevent direct instantiation
    console.log("Database initialized");
  }

  // TODO: Add static getInstance method
}

// Usage:
// const db1 = Database.getInstance();
// const db2 = Database.getInstance();
// console.log(db1 === db2); // Should be true`);

    const [output, setOutput] = useState<string>("");
    const [isSuccess, setIsSuccess] = useState(false);

    const runCode = () => {
        setOutput("Running...");
        setTimeout(() => {
            // Mock validation logic
            if (code.includes("getInstance") && code.includes("static instance")) {
                setOutput("✓ Tests Passed!\n> Database initialized\n> true");
                setIsSuccess(true);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((window as any).unlockAchievement) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (window as any).unlockAchievement({
                        title: "Pattern Master",
                        description: "Successfully implemented Singleton Pattern",
                    });
                }
            } else {
                setOutput("✗ Tests Failed\nExpected static getInstance method.");
                setIsSuccess(false);
            }
        }, 800);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[500px] bg-[#111] border border-white/10 rounded-xl overflow-hidden">
            <div className="flex flex-col border-r border-white/10">
                <div className="h-10 border-b border-white/10 bg-[#1a1a1a] flex items-center justify-between px-4">
                    <span className="text-xs font-bold text-gray-400 uppercase">Code Editor</span>
                    <div className="flex gap-2">
                        <button onClick={() => setCode("")} className="p-1 hover:text-white text-gray-500"><RotateCcw className="w-4 h-4" /></button>
                        <button onClick={runCode} className="flex items-center gap-1 text-green-400 hover:text-green-300 text-xs font-bold">
                            <Play className="w-3 h-3 fill-current" /> RUN
                        </button>
                    </div>
                </div>
                <div className="flex-1 min-h-0 bg-[#1e1e1e]">
                    {/* Reusing existing CodeEditor, assume it accepts onChange for real interactivity in full version */}
                    <CodeEditor code={code} language="javascript" />
                </div>
            </div>

            <div className="flex flex-col bg-[#0a0a0a]">
                <div className="h-10 border-b border-white/10 bg-[#1a1a1a] flex items-center px-4">
                    <span className="text-xs font-bold text-gray-400 uppercase">Console Output</span>
                </div>
                <div className="flex-1 p-4 font-mono text-sm overflow-auto">
                    <AnimatePresence mode="wait">
                        {output && (
                            <motion.div
                                key={output}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={isSuccess ? "text-green-400" : "text-red-400"}
                            >
                                <pre className="whitespace-pre-wrap">{output}</pre>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
