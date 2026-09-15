"use client";

import { DiffEditor, Editor } from "@monaco-editor/react";
import { Loader2 } from "lucide-react";
import { DiffFile } from "@/lib/githubFetcher";

interface CodeDiffProps {
    original?: string;
    modified?: string;
    file?: DiffFile;
}

export default function CodeDiff({ original, modified, file }: CodeDiffProps) {
    if (file && file.patch) {
        return (
            <div className="h-full w-full bg-[#1e1e1e]">
                <Editor
                    height="100%"
                    theme="vs-dark"
                    language="diff"
                    value={file.patch}
                    options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        wordWrap: "on"
                    }}
                    loading={
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-neon-cyan" />
                            <p>Loading Patch...</p>
                        </div>
                    }
                />
            </div>
        );
    }

    if (original !== undefined && modified !== undefined) {
        return (
            <div className="h-full w-full bg-[#1e1e1e]">
                <DiffEditor
                    height="100%"
                    theme="vs-dark"
                    original={original}
                    modified={modified}
                    language="javascript"
                    options={{
                        renderSideBySide: true,
                        readOnly: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                    }}
                    loading={
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-neon-cyan" />
                            <p>Loading Diff...</p>
                        </div>
                    }
                />
            </div>
        );
    }

    return (
        <div className="h-full flex items-center justify-center text-gray-500">
            Select a file to view changes.
        </div>
    );
}
