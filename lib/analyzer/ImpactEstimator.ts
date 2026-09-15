/**
 * Impact Estimator - Calculates change impact and blast radius for files
 * Part of PS 10: Semantic Codebase Synthesis and Architectural Recovery
 */

export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';

export type FileImpact = {
    file: string;
    directDependents: string[];
    transitiveDependents: string[];
    impactLevel: ImpactLevel;
    riskScore: number; // 0-100
};

export type BlastRadiusResult = {
    targetFile: string;
    directImpact: string[];
    transitiveImpact: string[];
    totalAffectedFiles: number;
    blastRadius: ImpactLevel;
    tightlyCoupled: string[];
    changeRisk: string;
    hotspots: string[];
};

export type CouplingAnalysis = {
    file: string;
    afferentCoupling: number;  // Fan-in: number of files that depend on this file
    efferentCoupling: number;  // Fan-out: number of files this file depends on
    instability: number;       // Ce / (Ca + Ce) - 0 = stable, 1 = unstable
    isHotspot: boolean;
};

export class ImpactEstimator {
    private dependencyGraph: Map<string, Set<string>> = new Map(); // file -> files it imports
    private reverseDependencyGraph: Map<string, Set<string>> = new Map(); // file -> files that import it

    /**
     * Build dependency graphs from file contents
     */
    buildFromFiles(files: Record<string, string>): void {
        this.dependencyGraph.clear();
        this.reverseDependencyGraph.clear();

        // First pass: build forward dependency graph
        for (const [filePath, content] of Object.entries(files)) {
            const imports = this.extractImports(content, filePath);
            this.dependencyGraph.set(filePath, new Set(imports));
        }

        // Second pass: build reverse graph
        for (const [file, dependencies] of this.dependencyGraph.entries()) {
            for (const dep of dependencies) {
                if (!this.reverseDependencyGraph.has(dep)) {
                    this.reverseDependencyGraph.set(dep, new Set());
                }
                this.reverseDependencyGraph.get(dep)!.add(file);
            }
        }
    }

    /**
     * Calculate blast radius for a specific file
     */
    calculateBlastRadius(targetFile: string): BlastRadiusResult {
        const directImpact = this.getDirectDependents(targetFile);
        const transitiveImpact = this.getTransitiveDependents(targetFile);
        const totalAffected = new Set([...directImpact, ...transitiveImpact]).size;

        // Identify tightly coupled files (both depend on and are depended by target)
        const tightlyCoupled: string[] = [];
        const targetDeps = this.dependencyGraph.get(targetFile) || new Set();
        for (const dep of directImpact) {
            if (targetDeps.has(dep)) {
                tightlyCoupled.push(dep);
            }
        }

        // Calculate blast radius level
        let blastRadius: ImpactLevel;
        if (totalAffected >= 20) {
            blastRadius = 'critical';
        } else if (totalAffected >= 10) {
            blastRadius = 'high';
        } else if (totalAffected >= 5) {
            blastRadius = 'medium';
        } else {
            blastRadius = 'low';
        }

        // Find hotspots (files with highest fan-in)
        const hotspots = this.identifyHotspots().slice(0, 5);

        // Generate change risk description
        const changeRisk = this.assessChangeRisk(targetFile, totalAffected, tightlyCoupled.length);

        return {
            targetFile,
            directImpact,
            transitiveImpact: transitiveImpact.filter(f => !directImpact.includes(f)),
            totalAffectedFiles: totalAffected,
            blastRadius,
            tightlyCoupled,
            changeRisk,
            hotspots
        };
    }

    /**
     * Get files that directly depend on the target file
     */
    getDirectDependents(file: string): string[] {
        return Array.from(this.reverseDependencyGraph.get(file) || []);
    }

    /**
     * Get all files that transitively depend on the target file
     */
    getTransitiveDependents(file: string): string[] {
        const visited = new Set<string>();
        const queue = [file];

        while (queue.length > 0) {
            const current = queue.shift()!;
            const dependents = this.reverseDependencyGraph.get(current) || new Set();

            for (const dep of dependents) {
                if (!visited.has(dep)) {
                    visited.add(dep);
                    queue.push(dep);
                }
            }
        }

        return Array.from(visited);
    }

    /**
     * Calculate coupling analysis for all files
     */
    analyzeCoupling(): CouplingAnalysis[] {
        const analysis: CouplingAnalysis[] = [];
        const allFiles = new Set([
            ...this.dependencyGraph.keys(),
            ...this.reverseDependencyGraph.keys()
        ]);

        for (const file of allFiles) {
            const afferent = (this.reverseDependencyGraph.get(file) || new Set()).size;
            const efferent = (this.dependencyGraph.get(file) || new Set()).size;
            const total = afferent + efferent;
            const instability = total > 0 ? efferent / total : 0;

            analysis.push({
                file,
                afferentCoupling: afferent,
                efferentCoupling: efferent,
                instability,
                isHotspot: afferent >= 5 || efferent >= 8
            });
        }

        return analysis.sort((a, b) => b.afferentCoupling - a.afferentCoupling);
    }

    /**
     * Identify hotspot files (high fan-in)
     */
    identifyHotspots(): string[] {
        return this.analyzeCoupling()
            .filter(c => c.isHotspot)
            .map(c => c.file);
    }

    /**
     * Get high fan-in files
     */
    getHighFanIn(threshold: number = 3): string[] {
        return Array.from(this.reverseDependencyGraph.entries())
            .filter(([, deps]) => deps.size >= threshold)
            .sort((a, b) => b[1].size - a[1].size)
            .map(([file]) => file);
    }

    /**
     * Get high fan-out files
     */
    getHighFanOut(threshold: number = 5): string[] {
        return Array.from(this.dependencyGraph.entries())
            .filter(([, deps]) => deps.size >= threshold)
            .sort((a, b) => b[1].size - a[1].size)
            .map(([file]) => file);
    }

    /**
     * Extract import statements from file content
     */
    private extractImports(content: string, fromFile: string): string[] {
        const imports: string[] = [];

        // ES6 imports
        const es6Regex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
        let match;
        while ((match = es6Regex.exec(content)) !== null) {
            const resolved = this.resolveImportPath(fromFile, match[1]);
            if (resolved) imports.push(resolved);
        }

        // CommonJS require
        const cjsRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
        while ((match = cjsRegex.exec(content)) !== null) {
            const resolved = this.resolveImportPath(fromFile, match[1]);
            if (resolved) imports.push(resolved);
        }

        // Dynamic imports
        const dynamicRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
        while ((match = dynamicRegex.exec(content)) !== null) {
            const resolved = this.resolveImportPath(fromFile, match[1]);
            if (resolved) imports.push(resolved);
        }

        return imports;
    }

    /**
     * Resolve relative import path to normalized path
     */
    private resolveImportPath(fromFile: string, importPath: string): string | null {
        // Skip external packages
        if (!importPath.startsWith('.') && !importPath.startsWith('/') && !importPath.startsWith('@/')) {
            return null;
        }

        // Handle alias imports like @/
        if (importPath.startsWith('@/')) {
            return importPath.replace('@/', '');
        }

        // For relative imports, we'll use a simplified resolution
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
            const fromDir = fromFile.substring(0, fromFile.lastIndexOf('/'));
            const parts = [...fromDir.split('/'), ...importPath.split('/')];
            const resolved: string[] = [];

            for (const part of parts) {
                if (part === '.' || part === '') continue;
                if (part === '..') {
                    resolved.pop();
                } else {
                    resolved.push(part);
                }
            }

            return resolved.join('/');
        }

        return importPath;
    }

    /**
     * Assess change risk based on impact metrics
     */
    private assessChangeRisk(
        file: string,
        totalAffected: number,
        tightlyCoupledCount: number
    ): string {
        const coupling = this.analyzeCoupling().find(c => c.file === file);
        const fanIn = coupling?.afferentCoupling || 0;
        const fanOut = coupling?.efferentCoupling || 0;

        if (tightlyCoupledCount >= 3 || totalAffected >= 15) {
            return `HIGH RISK: ${totalAffected} files affected, ${tightlyCoupledCount} bidirectional dependencies. Changes require extensive testing and careful review.`;
        } else if (fanIn >= 5 || totalAffected >= 8) {
            return `MEDIUM RISK: Core module with ${fanIn} dependents. Changes should be reviewed for breaking changes.`;
        } else if (fanOut >= 8) {
            return `MEDIUM RISK: High external dependency (${fanOut} imports). Changes may cascade unexpectedly.`;
        } else {
            return `LOW RISK: Limited blast radius with ${totalAffected} affected files. Standard review process applies.`;
        }
    }
}
