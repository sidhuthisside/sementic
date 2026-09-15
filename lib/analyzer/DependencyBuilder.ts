// Node.js built-ins should only be used in non-browser environments
let fs: any;
let path: any;
if (typeof window === 'undefined') {
    fs = require('fs');
    path = require('path');
} else {
    // Fallback for browser if needed, though most logic using fs should be skipped
    path = {
        resolve: (...args: string[]) => args.join('/'),
        join: (...args: string[]) => args.join('/'),
        dirname: (p: string) => p.split('/').slice(0, -1).join('/'),
        extname: (p: string) => {
            const parts = p.split('.');
            return parts.length > 1 ? '.' + parts.pop() : '';
        },
        isAbsolute: (p: string) => p.startsWith('/'),
        relative: (from: string, to: string) => to, // Basic fallback
    };
}
import { TreeSitterExtractor } from './TreeSitterExtractor';

export type DependencyNode = {
    id: string;
    name: string;
    type: 'file' | 'module';
    imports: string[];
    exports: string[];
    // Helper for visualization/debugging
    isExternal?: boolean;
};

export type DependencyGraph = {
    nodes: DependencyNode[];
    edges: { source: string; target: string }[];
    circular: string[][];
};

export class DependencyBuilder {
    private fileMap: Map<string, string> = new Map();
    private processedFiles: Set<string> = new Set();
    private extractor = new TreeSitterExtractor();
    private projectRoot: string;

    constructor(projectRoot: string = process.cwd()) {
        console.log("DependencyBuilder: Constructor called with root", projectRoot);
        this.projectRoot = projectRoot;
    }

    async buildGraph(initialFiles: { name: string; content: string }[]): Promise<DependencyGraph> {
        console.log("DependencyBuilder: buildGraph called");
        const nodes: DependencyNode[] = [];
        const edges: { source: string; target: string }[] = [];
        this.processedFiles.clear();
        this.fileMap.clear();

        // Initialize with provided files
        const queue: string[] = [];
        for (const file of initialFiles) {
            this.fileMap.set(file.name, file.content);
            queue.push(file.name);
        }

        // Process queue (expanding as we find new local imports)
        while (queue.length > 0) {
            const fileName = queue.shift()!;
            if (this.processedFiles.has(fileName)) continue;
            this.processedFiles.add(fileName);

            let content = this.fileMap.get(fileName);
            // If content is missing (added via import resolution), try to read from disk
            if (!content && typeof window === 'undefined' && fs) {
                try {
                    const fullPath = path.resolve(this.projectRoot, fileName);
                    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
                        const fileContent = fs.readFileSync(fullPath, 'utf-8');
                        this.fileMap.set(fileName, fileContent);
                        content = fileContent;
                    }
                } catch (e) {
                    console.error(`Error reading file ${fileName}:`, e);
                }
            }

            if (!content) {
                console.warn(`Content not found for ${fileName}, skipping.`);
                continue;
            }

            // Extract imports
            const imports = await this.extractor.extractImports(content, fileName);
            // Simplistic export extraction (keep from original)
            const exports = this.extractExports(content, fileName);

            const resolvedImports: string[] = [];

            for (const imp of imports) {
                const resolved = this.resolveImport(fileName, imp);
                if (resolved) {
                    resolvedImports.push(resolved);
                    edges.push({ source: fileName, target: resolved });

                    // If it's a local file and we haven't processed it, add to queue
                    if (!this.processedFiles.has(resolved) && !this.isExternalModule(resolved)) {
                        // We might not have the content yet, but we'll fetch it when we pop from queue
                        if (!queue.includes(resolved)) {
                            queue.push(resolved);
                        }
                    }
                } else {
                    // It might be an external module or alias we couldn't resolve
                    // For now, we can just add a node for it if we want to show it in the graph
                    // valid external module
                    if (!imp.startsWith('.') && !imp.startsWith('/')) {
                        // It is likely a node_module
                        nodes.push({
                            id: imp,
                            name: imp,
                            type: 'module',
                            imports: [],
                            exports: [],
                            isExternal: true
                        });
                        edges.push({ source: fileName, target: imp });
                    }
                }
            }

            nodes.push({
                id: fileName,
                name: fileName,
                type: 'file',
                imports: resolvedImports,
                exports,
                isExternal: false
            });
        }

        const circular = this.detectCircularDependenciesTarjan(nodes, edges);

        return { nodes, edges, circular };
    }

    private isExternalModule(pathStr: string): boolean {
        return pathStr.includes('node_modules') || (!pathStr.startsWith('.') && !pathStr.startsWith('/') && !path.isAbsolute(pathStr) && !pathStr.includes(this.projectRoot));
    }

    private extractExports(code: string, fileName: string): string[] {
        const exports: string[] = [];
        const ext = path.extname(fileName).toLowerCase();

        // JS/TS
        if (['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'].includes(ext)) {
            const cleanCode = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
            // Matches: export const/function/class/interface/type Name
            const namedRegex = /export\s+(?:const|let|var|function|class|type|interface|enum)\s+(\w+)/g;
            let match;
            while ((match = namedRegex.exec(cleanCode)) !== null) exports.push(match[1]);

            // Matches: export { Name, Name2 as Alias }
            const exportListRegex = /export\s+{([^}]+)}/g;
            while ((match = exportListRegex.exec(cleanCode)) !== null) {
                const content = match[1];
                content.split(',').forEach(part => {
                    const name = part.trim().split(/\s+as\s+/)[0].trim();
                    if (name) exports.push(name);
                });
            }

            if (/export\s+default/i.test(cleanCode)) exports.push('default');
        }
        // Python
        else if (ext === '.py') {
            const defRegex = /^def\s+(\w+)/gm;
            const classRegex = /^class\s+(\w+)/gm;
            let match;
            while ((match = defRegex.exec(code)) !== null) exports.push(match[1]);
            while ((match = classRegex.exec(code)) !== null) exports.push(match[1]);
        }

        return exports;
    }

    private resolveImport(sourceFile: string, importPath: string): string | null {
        // 1. External modules (simple check)
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
            return null; // Treat as external for now, handled in buildGraph
            // Or if we want to resolve node_modules, we'd need require.resolve logic which is complex
        }

        let possiblePaths: string[] = [];

        // 2. Handle Absolute/Alias paths (simplified assuming @/ is root/src)
        if (importPath.startsWith('@/')) {
            // Assume @/ maps to current working directory or src
            const relative = importPath.substring(2);
            possiblePaths.push(path.join(this.projectRoot, relative));
            possiblePaths.push(path.join(this.projectRoot, 'src', relative));
        } else if (path.isAbsolute(importPath)) {
            possiblePaths.push(importPath);
        } else {
            // 3. Relative Paths
            const sourceDir = path.dirname(path.resolve(this.projectRoot, sourceFile));
            possiblePaths.push(path.resolve(sourceDir, importPath));
        }


        for (const p of possiblePaths) {
            // Try distinct extensions
            const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '.d.ts', '.py', '.go', '.json'];

            if (typeof window === 'undefined' && fs) {
                for (const ext of extensions) {
                    const pWithExt = p + ext;
                    try {
                        if (fs.existsSync(pWithExt) && fs.statSync(pWithExt).isFile()) {
                            return path.relative(this.projectRoot, pWithExt).replace(/\\/g, '/');
                        }
                    } catch (e) { }
                }

                // Check for directory/index
                for (const ext of extensions) {
                    const indexP = path.join(p, 'index' + ext);
                    try {
                        if (fs.existsSync(indexP) && fs.statSync(indexP).isFile()) {
                            return path.relative(this.projectRoot, indexP).replace(/\\/g, '/');
                        }
                    } catch (e) { }
                }
            }
        }

        // Fallback: if we simply can't find it on disk, maybe it's in the memory map
        // (This happens in tests where we don't write to disk).
        // In that case, we can't easily resolve relative paths without a "virtual" fs structure.
        // For the existing test to pass, we might need a fallback that mimics the old behavior
        // IF and ONLY IF the file doesn't exist on disk.

        // OLD LOGIC FALLBACK for memory-only tests
        if (importPath.startsWith('.')) {
            const currentDir = sourceFile.split('/').slice(0, -1).join('/');
            const parts = (currentDir + '/' + importPath).split('/');
            const resolvedParts: string[] = [];
            for (const part of parts) {
                if (part === '.' || part === '') continue;
                if (part === '..') resolvedParts.pop();
                else resolvedParts.push(part);
            }
            const memoryPath = resolvedParts.join('/');
            // Try adding extensions
            const extensions = ['', '.ts', '.tsx', '.js', '.jsx'];
            for (const ext of extensions) {
                if (this.fileMap.has(memoryPath + ext)) return memoryPath + ext;
            }
        }

        return null;
    }

    private detectCircularDependenciesTarjan(nodes: DependencyNode[], edges: { source: string; target: string }[]): string[][] {
        const graph = new Map<string, string[]>();
        const nodesSet = new Set<string>();

        // Build adjacency list
        for (const edge of edges) {
            if (!graph.has(edge.source)) graph.set(edge.source, []);
            graph.get(edge.source)!.push(edge.target);
            nodesSet.add(edge.source);
            nodesSet.add(edge.target);
        }

        const ids = new Map<string, number>();
        const low = new Map<string, number>();
        const onStack = new Map<string, boolean>();
        const stack: string[] = [];
        let idCounter = 0;
        const sccs: string[][] = [];

        const dfs = (at: string) => {
            stack.push(at);
            onStack.set(at, true);
            ids.set(at, idCounter);
            low.set(at, idCounter);
            idCounter++;

            const neighbors = graph.get(at) || [];
            for (const to of neighbors) {
                if (!ids.has(to)) {
                    dfs(to);
                    low.set(at, Math.min(low.get(at)!, low.get(to)!));
                } else if (onStack.get(to)) {
                    low.set(at, Math.min(low.get(at)!, ids.get(to)!));
                }
            }

            // After visiting all neighbors, check if we are at the start of an SCC
            if (ids.get(at) === low.get(at)) {
                const scc: string[] = [];
                let node: string;
                do {
                    node = stack.pop()!;
                    onStack.set(node, false);
                    scc.push(node);
                } while (node !== at);

                // An SCC is a cycle if it has > 1 node OR it's a single node with a self-loop
                if (scc.length > 1) {
                    sccs.push(scc.reverse()); // Reverse to show flow direction more naturally? Order doesn't matter for set
                } else if (scc.length === 1) {
                    // Check self-loop
                    const neighbors = graph.get(at) || [];
                    if (neighbors.includes(at)) {
                        sccs.push(scc);
                    }
                }
            }
        };

        for (const node of nodesSet) {
            if (!ids.has(node)) {
                dfs(node);
            }
        }

        return sccs;
    }

    /**
     * Compare two dependency graphs and return added/removed/unchanged edges
     */
    compareDependencyGraphs(graphA: DependencyGraph, graphB: DependencyGraph): {
        added: { source: string; target: string }[];
        removed: { source: string; target: string }[];
        unchanged: { source: string; target: string }[];
    } {
        const added: { source: string; target: string }[] = [];
        const removed: { source: string; target: string }[] = [];
        const unchanged: { source: string; target: string }[] = [];

        // Create sets for easy lookup
        const edgesASet = new Set(graphA.edges.map(e => `${e.source}→${e.target}`));
        const edgesBSet = new Set(graphB.edges.map(e => `${e.source}→${e.target}`));

        // Find added edges (in B but not in A)
        graphB.edges.forEach(edge => {
            const key = `${edge.source}→${edge.target}`;
            if (!edgesASet.has(key)) {
                added.push(edge);
            } else {
                unchanged.push(edge);
            }
        });

        // Find removed edges (in A but not in B)
        graphA.edges.forEach(edge => {
            const key = `${edge.source}→${edge.target}`;
            if (!edgesBSet.has(key)) {
                removed.push(edge);
            }
        });

        return { added, removed, unchanged };
    }

    /**
     * Find new circular dependencies that exist in graphB but not in graphA
     */
    findNewCircularDependencies(graphA: DependencyGraph, graphB: DependencyGraph): string[][] {
        const cyclesA = new Set(graphA.circular.map(cycle => cycle.sort().join('→')));
        const newCycles: string[][] = [];

        graphB.circular.forEach(cycle => {
            const normalized = cycle.sort().join('→');
            if (!cyclesA.has(normalized)) {
                newCycles.push(cycle);
            }
        });

        return newCycles;
    }

    /**
     * Calculate coupling metrics for a specific module
     */
    calculateModuleCoupling(graph: DependencyGraph, moduleId: string): {
        afferent: number;   // Incoming dependencies (who depends on this module)
        efferent: number;   // Outgoing dependencies (what this module depends on)
        total: number;      // Total coupling
    } {
        let afferent = 0;
        let efferent = 0;

        graph.edges.forEach(edge => {
            if (edge.target === moduleId) {
                afferent++; // Someone depends on this module
            }
            if (edge.source === moduleId) {
                efferent++; // This module depends on someone
            }
        });

        return {
            afferent,
            efferent,
            total: afferent + efferent
        };
    }
}

