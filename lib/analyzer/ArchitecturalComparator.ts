import { DependencyGraph, DependencyBuilder } from './DependencyBuilder';
import { AnalysisOrchestrator, AnalysisResult } from './AnalysisOrchestrator';
import { CentralityAnalyzer, CentralityChange } from './CentralityAnalyzer';
import { EvidenceCollector, FileEvidence, EvidencedChange } from './EvidenceCollector';
import { StructuralRiskAnalyzer, StructuralRiskMetrics } from './StructuralRisk';

/**
 * Version identifier for comparison
 */
export type VersionIdentifier = {
    type: 'commit' | 'branch' | 'zip';
    reference: string; // commit SHA, branch name, or zip path
};

/**
 * Module-level change between versions
 */
export type ModuleChange = {
    type: 'added' | 'removed' | 'renamed' | 'moved';
    path: string;
    oldPath?: string; // For renamed/moved files
    evidence: FileEvidence;
};

/**
 * Dependency change between modules
 */
export type DependencyChange = {
    type: 'added' | 'removed';
    source: string;
    target: string;
    impact: 'low' | 'medium' | 'high';
};

/**
 * Coupling change for a module
 */
export type CouplingChange = {
    module: string;
    oldDependencyCount: number;
    newDependencyCount: number;
    change: number; // Delta
    changePercent: number;
    isSignificant: boolean; // > 50% increase or > 5 deps added
};

/**
 * Summary of architectural changes
 */
export type ArchitecturalChangeSummary = {
    narrative: string;              // Human-readable summary
    couplingTrend: 'increased' | 'decreased' | 'stable';
    couplingChange: number;         // Percentage change in average coupling
    topCentralModules: {
        before: string[];
        after: string[];
        new: string[];              // Became central
        lost: string[];             // Lost centrality
    };
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
};

/**
 * Complete architectural comparison result
 */
export type ArchitecturalComparison = {
    moduleChanges: ModuleChange[];
    dependencyChanges: DependencyChange[];
    newCircularDependencies: string[][];
    couplingChanges: CouplingChange[];
    centralityChanges: CentralityChange[];
    riskChanges: {
        module: string;
        oldScore: number;
        newScore: number;
        change: number;
        level: string;
    }[];
    summary: ArchitecturalChangeSummary;
    topChanges: EvidencedChange[];
};

/**
 * Main class for comparing architectural changes between two versions
 */
export class ArchitecturalComparator {
    private dependencyBuilder = new DependencyBuilder();
    private centralityAnalyzer = new CentralityAnalyzer();
    private evidenceCollector = new EvidenceCollector();
    private orchestrator = new AnalysisOrchestrator();
    private riskAnalyzer = new StructuralRiskAnalyzer();

    /**
     * Compare two versions and detect all architectural changes
     */
    async compareVersions(
        versionA: { files: { name: string; content: string }[] },
        versionB: { files: { name: string; content: string }[] }
    ): Promise<ArchitecturalComparison> {

        // Validate and filter files with actual content
        const validFilesA = versionA.files.filter(f => f && f.name && f.content && typeof f.content === 'string');
        const validFilesB = versionB.files.filter(f => f && f.name && f.content && typeof f.content === 'string');

        console.log(`[ArchitecturalComparator] Processing ${validFilesA.length} valid files in version A`);
        console.log(`[ArchitecturalComparator] Processing ${validFilesB.length} valid files in version B`);

        if (validFilesA.length === 0 || validFilesB.length === 0) {
            console.warn('[ArchitecturalComparator] One or both versions have no valid files');
            return this.createEmptyComparison();
        }

        // Build dependency graphs for both versions
        const graphA = await this.dependencyBuilder.buildGraph(validFilesA);
        const graphB = await this.dependencyBuilder.buildGraph(validFilesB);

        // Detect module changes
        const moduleChanges = this.detectModuleChanges(
            validFilesA.map(f => f.name),
            validFilesB.map(f => f.name)
        );

        // Detect dependency changes
        const dependencyChanges = this.detectDependencyChanges(graphA, graphB);

        // Detect new circular dependencies
        const newCircularDependencies = this.detectNewCircularDeps(graphA, graphB);

        // Analyze coupling changes
        const couplingChanges = this.analyzeCouplingChanges(graphA, graphB);

        // Calculate centrality changes
        const centralityA = this.centralityAnalyzer.calculateCentrality(graphA);
        const centralityB = this.centralityAnalyzer.calculateCentrality(graphB);
        const centralityChanges = this.centralityAnalyzer.compareCentrality(centralityA, centralityB);

        // Calculate Structural Risk Changes
        const riskA = this.riskAnalyzer.analyze(graphA);
        const riskB = this.riskAnalyzer.analyze(graphB);
        const riskChanges = this.compareStructuralRisk(riskA, riskB);

        // Generate summary
        const summary = this.generateSummary({
            moduleChanges,
            dependencyChanges,
            newCircularDependencies,
            couplingChanges,
            centralityChanges,
            centralityA,
            centralityB
        });

        // Get top 3 changes with evidence
        const topChanges = this.evidenceCollector.getTopChanges(
            moduleChanges,
            dependencyChanges,
            couplingChanges,
            newCircularDependencies,
            centralityChanges,
            3
        );

        return {
            moduleChanges,
            dependencyChanges,
            newCircularDependencies,
            couplingChanges,
            centralityChanges,
            riskChanges,
            summary,
            topChanges
        };
    }

    /**
     * Detect added, removed, renamed, or moved modules
     */
    detectModuleChanges(filesA: string[], filesB: string[]): ModuleChange[] {
        const changes: ModuleChange[] = [];
        const setA = new Set(filesA);
        const setB = new Set(filesB);

        // Detect added modules
        filesB.forEach(file => {
            if (!setA.has(file)) {
                changes.push({
                    type: 'added',
                    path: file,
                    evidence: this.evidenceCollector.collectModuleEvidence('added', file)
                });
            }
        });

        // Detect removed modules
        filesA.forEach(file => {
            if (!setB.has(file)) {
                // Check if it was renamed/moved by looking for similar names
                const possibleRename = this.findPossibleRename(file, filesB, filesA);
                if (possibleRename) {
                    changes.push({
                        type: 'renamed',
                        path: possibleRename,
                        oldPath: file,
                        evidence: this.evidenceCollector.collectModuleEvidence('renamed', possibleRename, file)
                    });
                } else {
                    changes.push({
                        type: 'removed',
                        path: file,
                        evidence: this.evidenceCollector.collectModuleEvidence('removed', file)
                    });
                }
            }
        });

        return changes;
    }

    /**
     * Detect added or removed dependencies between modules
     */
    detectDependencyChanges(graphA: DependencyGraph, graphB: DependencyGraph): DependencyChange[] {
        const comparison = this.dependencyBuilder.compareDependencyGraphs(graphA, graphB);
        const changes: DependencyChange[] = [];

        // Convert added edges to DependencyChanges
        comparison.added.forEach(edge => {
            changes.push({
                type: 'added',
                source: edge.source,
                target: edge.target,
                impact: this.calculateDependencyImpact(edge.source, edge.target)
            });
        });

        // Convert removed edges to DependencyChanges
        comparison.removed.forEach(edge => {
            changes.push({
                type: 'removed',
                source: edge.source,
                target: edge.target,
                impact: this.calculateDependencyImpact(edge.source, edge.target)
            });
        });

        return changes;
    }

    /**
     * Detect new circular dependencies
     */
    detectNewCircularDeps(graphA: DependencyGraph, graphB: DependencyGraph): string[][] {
        return this.dependencyBuilder.findNewCircularDependencies(graphA, graphB);
    }

    /**
     * Analyze coupling changes for all modules
     */
    analyzeCouplingChanges(graphA: DependencyGraph, graphB: DependencyGraph): CouplingChange[] {
        const changes: CouplingChange[] = [];

        // Get all unique module IDs from both graphs
        const allModules = new Set<string>([
            ...graphA.nodes.map(n => n.id),
            ...graphB.nodes.map(n => n.id)
        ]);

        allModules.forEach(moduleId => {
            const couplingA = this.dependencyBuilder.calculateModuleCoupling(graphA, moduleId);
            const couplingB = this.dependencyBuilder.calculateModuleCoupling(graphB, moduleId);

            const change = couplingB.total - couplingA.total;
            const changePercent = couplingA.total > 0
                ? (change / couplingA.total) * 100
                : (couplingB.total > 0 ? 100 : 0);

            // Only track if there's a change
            if (change !== 0) {
                const isSignificant = Math.abs(changePercent) > 50 || Math.abs(change) >= 5;

                changes.push({
                    module: moduleId,
                    oldDependencyCount: couplingA.total,
                    newDependencyCount: couplingB.total,
                    change,
                    changePercent,
                    isSignificant
                });
            }
        });

        // Sort by absolute change
        changes.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

        return changes;
    }

    /**
     * Generate architectural change summary
     */
    generateSummary(data: {
        moduleChanges: ModuleChange[];
        dependencyChanges: DependencyChange[];
        newCircularDependencies: string[][];
        couplingChanges: CouplingChange[];
        centralityChanges: CentralityChange[];
        centralityA: Map<string, any>;
        centralityB: Map<string, any>;
    }): ArchitecturalChangeSummary {
        const {
            moduleChanges,
            dependencyChanges,
            newCircularDependencies,
            couplingChanges,
            centralityChanges,
            centralityA,
            centralityB
        } = data;

        // Build narrative
        const addedCount = moduleChanges.filter(m => m.type === 'added').length;
        const removedCount = moduleChanges.filter(m => m.type === 'removed').length;
        const renamedCount = moduleChanges.filter(m => m.type === 'renamed').length;

        let narrative = '';
        if (addedCount > 0) narrative += `Added ${addedCount} new module(s). `;
        if (removedCount > 0) narrative += `Removed ${removedCount} module(s). `;
        if (renamedCount > 0) narrative += `Renamed/moved ${renamedCount} module(s). `;
        if (dependencyChanges.length > 0) {
            narrative += `Modified ${dependencyChanges.length} dependency relationship(s). `;
        }
        if (newCircularDependencies.length > 0) {
            narrative += `⚠️ Introduced ${newCircularDependencies.length} new circular ${newCircularDependencies.length === 1 ? 'dependency' : 'dependencies'}. `;
        }

        // Calculate coupling trend
        let totalCouplingChange = 0;
        let couplingCount = 0;
        couplingChanges.forEach(c => {
            totalCouplingChange += c.change;
            couplingCount++;
        });
        const avgCouplingChange = couplingCount > 0 ? totalCouplingChange / couplingCount : 0;
        const couplingTrend: 'increased' | 'decreased' | 'stable' =
            avgCouplingChange > 0.5 ? 'increased' :
                avgCouplingChange < -0.5 ? 'decreased' : 'stable';

        // Identify top central modules
        const topCentralA = this.centralityAnalyzer.identifyTopCentralModules(centralityA, 5);
        const topCentralB = this.centralityAnalyzer.identifyTopCentralModules(centralityB, 5);

        const setA = new Set(topCentralA);
        const setB = new Set(topCentralB);
        const newCentral = topCentralB.filter(m => !setA.has(m));

        // Enhance narrative
        if (couplingTrend !== 'stable') {
            narrative += `Global coupling ${couplingTrend} (avg ${avgCouplingChange > 0 ? '+' : ''}${avgCouplingChange.toFixed(2)}). `;
        }
        if (newCentral.length > 0) {
            narrative += `Modules ${newCentral.join(', ')} became more central. `;
        }
        const lostCentral = topCentralA.filter(m => !setB.has(m));

        // Calculate risk level
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (newCircularDependencies.length > 0 || couplingChanges.filter(c => c.isSignificant).length > 3) {
            riskLevel = 'high';
        } else if (couplingTrend === 'increased' || couplingChanges.some(c => c.isSignificant)) {
            riskLevel = 'medium';
        }

        // Generate recommendations
        const recommendations: string[] = [];
        if (newCircularDependencies.length > 0) {
            recommendations.push('Break circular dependencies to improve maintainability and testing');
        }
        if (couplingTrend === 'increased') {
            recommendations.push('Consider refactoring highly coupled modules to reduce dependencies');
        }
        if (newCentral.length > 0) {
            recommendations.push(`Monitor newly central modules (${newCentral.join(', ')}) for potential bottlenecks`);
        }
        if (recommendations.length === 0) {
            recommendations.push('Architecture changes appear well-structured');
        }

        return {
            narrative: narrative.trim() || 'No significant architectural changes detected',
            couplingTrend,
            couplingChange: avgCouplingChange,
            topCentralModules: {
                before: topCentralA,
                after: topCentralB,
                new: newCentral,
                lost: lostCentral
            },
            riskLevel,
            recommendations
        };
    }

    /**
     * Try to find if a file was renamed by comparing similarity
     */
    private findPossibleRename(oldFile: string, newFiles: string[], oldFiles: string[]): string | null {
        const oldBasename = oldFile.split('/').pop()?.split('.')[0] || '';

        for (const newFile of newFiles) {
            if (oldFiles.includes(newFile)) continue; // Skip unchanged files

            const newBasename = newFile.split('/').pop()?.split('.')[0] || '';

            // Simple heuristic: if basenames match, it's likely a move/rename
            if (oldBasename === newBasename) {
                return newFile;
            }
        }

        return null;
    }

    /**
     * Calculate impact of a dependency change
     */
    private calculateDependencyImpact(source: string, target: string): 'low' | 'medium' | 'high' {
        const isSourceCore = this.isCoreModule(source);
        const isTargetCore = this.isCoreModule(target);

        if (isSourceCore && isTargetCore) return 'high';
        if (isSourceCore || isTargetCore) return 'medium';
        return 'low';
    }

    /**
     * Check if a module is a core module
     */
    private isCoreModule(modulePath: string): boolean {
        const coreIndicators = [
            '/lib/',
            '/core/',
            '/api/',
            '/models/',
            '/services/',
            'index.',
            'main.',
            'app.'
        ];

        return coreIndicators.some(indicator => modulePath.includes(indicator));
    }

    /**
     * Create an empty comparison result for edge cases
     */
    private createEmptyComparison(): ArchitecturalComparison {
        return {
            moduleChanges: [],
            dependencyChanges: [],
            newCircularDependencies: [],
            couplingChanges: [],
            centralityChanges: [],
            riskChanges: [],
            summary: {
                narrative: 'No valid files found for comparison.',
                couplingTrend: 'stable',
                couplingChange: 0,
                topCentralModules: {
                    before: [],
                    after: [],
                    new: [],
                    lost: []
                },
                riskLevel: 'low',
                recommendations: ['Ensure both versions have valid source files.']
            },
            topChanges: []
        };
    }

    /**
     * Compare Structural Risk between two versions
     */
    private compareStructuralRisk(
        riskA: Map<string, StructuralRiskMetrics>,
        riskB: Map<string, StructuralRiskMetrics>
    ): {
        module: string;
        oldScore: number;
        newScore: number;
        change: number;
        level: string;
    }[] {
        const changes: any[] = [];
        const allModules = new Set([...riskA.keys(), ...riskB.keys()]);

        allModules.forEach(moduleId => {
            const metricsA = riskA.get(moduleId);
            const metricsB = riskB.get(moduleId);

            const oldScore = metricsA ? metricsA.score : 0;
            const newScore = metricsB ? metricsB.score : 0;
            const change = newScore - oldScore;

            if (Math.abs(change) > 0 || (metricsB && metricsB.level === 'Critical')) {
                changes.push({
                    module: moduleId,
                    oldScore,
                    newScore,
                    change,
                    level: metricsB ? metricsB.level : 'Low'
                });
            }
        });

        // Sort by risk level (Critical first) then by score change
        return changes.sort((a, b) => {
            const levelScore = (l: string) => l === 'Critical' ? 4 : l === 'High' ? 3 : l === 'Medium' ? 2 : 1;
            const levelDiff = levelScore(b.level) - levelScore(a.level);
            if (levelDiff !== 0) return levelDiff;
            return b.newScore - a.newScore; // descending score
        });
    }
}
