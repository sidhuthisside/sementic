"use client";

import { Settings, Moon, Sun, Type } from "lucide-react";

export default function EditorToolbar({ language, theme, setTheme, onSettingsClick }: {
    language: string,
    theme: string,
    setTheme: (theme: string) => void,
    onSettingsClick: () => void
}) {

    return (
        <div className="h-12 border-b border-white/10 bg-[#080808] flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Type className="w-4 h-4" />
                    <span className="capitalize">{language || "plaintext"}</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                >
                    {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button
                    onClick={onSettingsClick}
                    className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                >
                    <Settings className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
