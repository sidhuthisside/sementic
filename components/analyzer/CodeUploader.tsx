"use client";

import { useState, useCallback } from "react";
import { Upload, File, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type UploadedFile = {
    name: string;
    content: string;
    size: number;
};

export default function CodeUploader({ onFilesUploaded }: { onFilesUploaded: (files: UploadedFile[]) => void }) {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const processFiles = useCallback(async (fileList: File[]) => {
        const uploadedFiles: UploadedFile[] = [];

        for (const file of fileList) {
            // Check for junk folders in path
            const path = file.webkitRelativePath || file.name;
            if (path.includes('node_modules') || path.includes('.git') || path.includes('dist') || path.includes('build') || path.includes('.next')) {
                continue;
            }

            // Updated regex to include more languages
            if (file.name.match(/\.(js|ts|tsx|jsx|py|java|go|dart|cpp|c|h|hpp|rs|rb|php|swift|kt|m|mm|scala|vue|svelte)$/)) {
                try {
                    const content = await file.text();
                    uploadedFiles.push({
                        name: path,
                        content,
                        size: file.size
                    });
                } catch (e) {
                    console.warn(`Failed to read file ${file.name}`, e);
                }
            }
        }

        setFiles(prev => [...prev, ...uploadedFiles]);
        onFilesUploaded(uploadedFiles);
    }, [onFilesUploaded]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        processFiles(droppedFiles);
    }, [processFiles]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            processFiles(selectedFiles);
        }
    }, [processFiles]);

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                className={`border-2 border-dashed rounded-xl p-8 transition-all ${isDragging
                    ? 'border-neon-cyan bg-neon-cyan/10'
                    : 'border-white/20 hover:border-white/40'
                    }`}
            >
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isDragging ? 'bg-neon-cyan/20' : 'bg-white/5'
                        }`}>
                        <Upload className={`w-8 h-8 ${isDragging ? 'text-neon-cyan' : 'text-gray-400'}`} />
                    </div>

                    <div>
                        <h3 className="text-lg font-bold mb-1">Upload Code Base</h3>
                        <p className="text-sm text-gray-400">Drag & drop files or folders here</p>
                        <p className="text-xs text-gray-500 mt-2">Supports: JS, TS, Python, Java, Go, C++, Dart, Rust, & more</p>
                    </div>

                    <div className="flex gap-3 mt-2">
                        {/* File Upload Input */}
                        <input
                            type="file"
                            multiple
                            accept=".js,.ts,.tsx,.jsx,.py,.java,.go,.dart,.cpp,.c,.h,.hpp,.rs,.rb,.php,.swift,.kt,.m,.mm,.scala,.vue,.svelte"
                            onChange={handleFileInput}
                            className="hidden"
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer transition-colors font-bold flex items-center gap-2"
                        >
                            <File className="w-4 h-4" />
                            Select Files
                        </label>

                        {/* Folder Upload Input */}
                        <input
                            type="file"
                            multiple
                            // @ts-expect-error - directory upload support
                            webkitdirectory=""
                            directory=""
                            onChange={handleFileInput}
                            className="hidden"
                            id="folder-upload"
                        />
                        <label
                            htmlFor="folder-upload"
                            className="px-6 py-2 bg-neon-purple hover:bg-neon-purple/80 text-white rounded-lg cursor-pointer transition-colors font-bold flex items-center gap-2"
                        >
                            <Upload className="w-4 h-4" />
                            Select Folder
                        </label>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                    >
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Uploaded Files ({files.length})</h4>
                        {files.map((file, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                            >
                                <div className="flex items-center gap-3">
                                    <File className="w-4 h-4 text-neon-cyan" />
                                    <div>
                                        <div className="text-sm font-medium">{file.name}</div>
                                        <div className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFile(i)}
                                    className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
