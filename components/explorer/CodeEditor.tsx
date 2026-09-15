"use client";

import Editor from "@monaco-editor/react";
import { Loader2 } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function CodeEditor({ code, language, theme = "dark" }: { code: string, language: string, theme?: string }) {
    return (
        <div className="w-full h-full bg-[#1e1e1e]">
            <Editor
                height="100%"
                language={language || "javascript"}
                theme={theme === "dark" ? "vs-dark" : "vs"}
                value={code}
                keepCurrentModel={false}
                options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                    padding: { top: 16, bottom: 16 },
                    fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                    fontLigatures: true,
                    readOnly: false,
                    automaticLayout: true,
                    contextmenu: false, // Disable context menu to prevent some unmount crashes
                    fixedOverflowWidgets: true,
                }}
                loading={
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-neon-cyan" />
                        <p>Loading Editor...</p>
                    </div>
                }
            />
        </div>
    );
}
