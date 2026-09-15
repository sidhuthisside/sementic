export type FileSystemItem = {
    id: string;
    name: string;
    type: "folder" | "file";
    children?: FileSystemItem[];
    language?: string;
};

import fs from 'fs';
import path from 'path';

// Helper to recursively scan directory
export function scanDirectory(dir: string, rootDir: string): { paths: string[], metrics: Record<string, number>, keyFiles: Record<string, string> } {
    let results: string[] = [];
    const keyFiles: Record<string, string> = {};
    const metrics = {
        linesOfCode: 0,
        functionCount: 0,
        classCount: 0,
        complexity: 0,
        fileCount: 0,
        commentLines: 0
    };

    if (!fs.existsSync(dir)) return { paths: [], metrics, keyFiles };

    const list = fs.readdirSync(dir);

    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        // Ignore common junk folders
        if (file.startsWith('.') || file === 'node_modules' || file === '__pycache__' || file === 'dist' || file === 'build') {
            return;
        }

        if (stat && stat.isDirectory()) {
            const subResults = scanDirectory(filePath, rootDir);
            results = results.concat(subResults.paths);
            Object.assign(keyFiles, subResults.keyFiles);
            metrics.linesOfCode += subResults.metrics.linesOfCode;
            metrics.functionCount += subResults.metrics.functionCount;
            metrics.classCount += subResults.metrics.classCount;
            metrics.complexity += subResults.metrics.complexity;
            metrics.fileCount += subResults.metrics.fileCount;
            metrics.commentLines += subResults.metrics.commentLines;
        } else {
            // Relative path for frontend
            const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
            results.push(relativePath);
            metrics.fileCount++;

            // Simple Metrics Calculation (Heuristic)
            try {
                // Read first 100k characters for analysis
                const content = fs.readFileSync(filePath, 'utf-8').slice(0, 100000);

                // Blocklist: Ignore known binary/media/lock files
                const binaryExtensions = new Set([
                    // Images
                    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.bmp', '.tiff',
                    // Audio/Video
                    '.mp3', '.mp4', '.wav', '.ogg', '.webm', '.mov', '.avi',
                    // Archives/Binaries
                    '.zip', '.tar', '.gz', '.7z', '.rar', '.exe', '.dll', '.so', '.dylib', '.bin', '.class', '.pyc',
                    // Documents
                    '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
                    // Lockfiles (usually not useful for code analysis)
                    '.lock', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'composer.lock', 'go.sum', 'cargo.lock'
                ]);

                const ext = path.extname(file).toLowerCase();

                // If it's not a known binary/junk file, treat it as potential source
                if (!binaryExtensions.has(ext) && !binaryExtensions.has(file)) {
                    // Check for null bytes to detect binary files without extension
                    if (!content.includes('\0')) {
                        keyFiles[relativePath] = content;
                    }
                }

                const lines = content.split('\n').length;
                metrics.linesOfCode += lines;

                // Simple Metrics Calculation (Heuristic)
                const comments = (content.match(/\/\/|\/\*|\*\/|^\s*\*|^#/gm) || []).length;
                metrics.commentLines += comments;

                // Very basic heuristic for complexity
                const complexity = (content.match(/if |for |while |switch |case |catch /g) || []).length;
                metrics.complexity += complexity;

                // Heuristic for functions/classes
                if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.py') || file.endsWith('.cpp') || file.endsWith('.java')) {
                    const funcs = (content.match(/function |def |=>/g) || []).length;
                    const classes = (content.match(/class /g) || []).length;
                    metrics.functionCount += funcs;
                    metrics.classCount += classes;
                }

            } catch {
                // Ignore binary read errors
            }
        }
    });

    return { paths: results, metrics, keyFiles };
}

export function buildFileTree(paths: string[]): FileSystemItem {
    const root: FileSystemItem = {
        id: "root",
        name: "root",
        type: "folder",
        children: []
    };

    paths.forEach(path => {
        const parts = path.split('/');
        let currentLevel = root.children!;

        parts.forEach((part, index) => {
            const isFile = index === parts.length - 1;
            const existingPath = currentLevel.find(item => item.name === part);

            if (existingPath) {
                if (!isFile) {
                    currentLevel = existingPath.children!;
                }
            } else {
                const newItem: FileSystemItem = {
                    id: path, // Unique ID ideally, for now path works
                    name: part,
                    type: isFile ? "file" : "folder",
                    children: isFile ? undefined : []
                };
                currentLevel.push(newItem);
                if (!isFile) {
                    currentLevel = newItem.children!;
                }
            }
        });
    });

    return root;
}
