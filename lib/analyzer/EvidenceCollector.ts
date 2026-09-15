/**
 * File-level evidence for architectural changes
 */
export type FileEvidence = {
    filePath: string;
    lineNumber?: number;
    snippet?: string;
    changeType: 'addition' | 'deletion' | 'modification';
    significance: 'high' | 'medium' | 'low';
};

/**
 * A change with supporting evidence
 */
export type EvidencedChange = {
    description: string;
    impact: string;
    category: 'module' | 'dependency' | 'coupling' | 'centrality' | 'circular';
    evidence: FileEvidence[];
    rank: number; // 1-3 for top changes
};

/**
 * Collects and ranks evidence for architectural changes
 */
export class EvidenceCollector {

    /**
     * Collect evidence for a module change (added/removed/moved)
     */
    collectModuleEvidence(
        changeType: 'added' | 'removed' | 'renamed' | 'moved',
        filePath: string,
        oldPath?: string
    ): FileEvidence {
        let significance: 'high' | 'medium' | 'low' = 'medium';

        // Determine significance based on file type and location
        if (this.isCorePath(filePath)) {
            significance = 'high';
        } else if (this.isTestPath(filePath)) {
            significance = 'low';
        }

        return {
            filePath,
            changeType: changeType === 'removed' ? 'deletion' : 'addition',
            significance,
            snippet: oldPath ? `Moved from: ${oldPath}` : undefined
        };
    }

    /**
     * Collect evidence for a dependency change
     */
    collectDependencyEvidence(
        changeType: 'added' | 'removed',
        sourceFile: string,
        targetFile: string,
        importLine?: number
    ): FileEvidence {
        const significance = this.calculateDependencySignificance(sourceFile, targetFile);

        return {
            filePath: sourceFile,
            lineNumber: importLine,
            changeType: changeType === 'added' ? 'addition' : 'deletion',
            significance,
            snippet: `Dependency: ${sourceFile} → ${targetFile}`
        };
    }

    /**
     * Collect evidence for coupling changes
     */
    collectCouplingEvidence(
        moduleFile: string,
        oldCount: number,
        newCount: number
    ): FileEvidence {
        const delta = newCount - oldCount;
        const percentChange = oldCount > 0 ? ((delta / oldCount) * 100).toFixed(0) : '100';

        let significance: 'high' | 'medium' | 'low' = 'medium';
        if (Math.abs(delta) >= 5 || Math.abs(Number(percentChange)) >= 100) {
            significance = 'high';
        } else if (Math.abs(delta) <= 1) {
            significance = 'low';
        }

        return {
            filePath: moduleFile,
            changeType: 'modification',
            significance,
            snippet: `Dependencies: ${oldCount} → ${newCount} (${delta > 0 ? '+' : ''}${delta}, ${percentChange}%)`
        };
    }

    /**
     * Collect evidence for circular dependency
     */
    collectCircularDependencyEvidence(cycle: string[]): FileEvidence[] {
        return cycle.map((file, index) => ({
            filePath: file,
            changeType: 'modification' as const,
            significance: 'high' as const,
            snippet: `Part of circular dependency: ${cycle.join(' → ')}`
        }));
    }

    /**
     * Rank changes by their significance and impact
     * Returns the top N changes with evidence
     */
    rankChanges(changes: any[], maxCount: number = 3): EvidencedChange[] {
        const evidencedChanges: EvidencedChange[] = [];

        // Process each type of change and assign scores
        const scoredChanges = changes.map(change => {
            let score = 0;
            let description = '';
            let impact = '';
            let category: EvidencedChange['category'] = 'module';
            let evidence: FileEvidence[] = [];

            // Module changes
            if (change.type === 'added' || change.type === 'removed' || change.type === 'renamed') {
                category = 'module';
                description = `Module ${change.type}: ${change.path}`;
                evidence = [this.collectModuleEvidence(change.type, change.path, change.oldPath)];
                score = evidence[0].significance === 'high' ? 10 : 5;
                impact = `New ${change.type} module affects overall architecture`;
            }

            // Dependency changes
            else if (change.source && change.target) {
                category = 'dependency';
                description = `Dependency ${change.type}: ${change.source} → ${change.target}`;
                evidence = [this.collectDependencyEvidence(change.type, change.source, change.target)];
                score = evidence[0].significance === 'high' ? 8 : 4;
                impact = change.type === 'added'
                    ? 'Increases coupling between modules'
                    : 'Reduces coupling between modules';
            }

            // Coupling changes
            else if (change.module && change.oldDependencyCount !== undefined) {
                category = 'coupling';
                description = `Coupling change in ${change.module}`;
                evidence = [this.collectCouplingEvidence(
                    change.module,
                    change.oldDependencyCount,
                    change.newDependencyCount
                )];
                score = change.isSignificant ? 12 : 6;
                impact = change.change > 0
                    ? 'Significant increase in module dependencies (potential maintenance burden)'
                    : 'Dependencies reduced (improved modularity)';
            }

            // Circular dependencies
            else if (Array.isArray(change) && change.length > 0 && typeof change[0] === 'string') {
                category = 'circular';
                description = `New circular dependency detected: ${change.join(' → ')}`;
                evidence = this.collectCircularDependencyEvidence(change);
                score = 15; // Highest priority
                impact = 'Critical: Circular dependencies make code harder to maintain and test';
            }

            // Centrality changes
            else if (change.oldScore !== undefined && change.newScore !== undefined) {
                category = 'centrality';
                const direction = change.change > 0 ? 'increased' : 'decreased';
                description = `Module centrality ${direction}: ${change.module}`;
                evidence = [{
                    filePath: change.module,
                    changeType: 'modification',
                    significance: Math.abs(change.changePercent) > 50 ? 'high' : 'medium',
                    snippet: `Centrality score: ${change.oldScore.toFixed(2)} → ${change.newScore.toFixed(2)} (${change.changePercent.toFixed(0)}%)`
                }];
                score = Math.abs(change.changePercent) > 50 ? 9 : 5;
                impact = change.change > 0
                    ? 'Module became more architecturally important (more dependent modules)'
                    : 'Module became less central (fewer dependents)';
            }

            return {
                description,
                impact,
                category,
                evidence,
                score,
                rank: 0
            };
        });

        // Sort by score (highest first) and take top N
        scoredChanges.sort((a, b) => b.score - a.score);
        const topChanges = scoredChanges.slice(0, maxCount);

        // Assign ranks
        topChanges.forEach((change, index) => {
            change.rank = index + 1;
            evidencedChanges.push(change);
        });

        return evidencedChanges;
    }

    /**
     * Get top N changes from a full architectural comparison
     */
    getTopChanges(
        moduleChanges: any[],
        dependencyChanges: any[],
        couplingChanges: any[],
        circularDependencies: string[][],
        centralityChanges: any[],
        count: number = 3
    ): EvidencedChange[] {
        // Combine all changes
        const allChanges = [
            ...moduleChanges,
            ...dependencyChanges,
            ...couplingChanges,
            ...circularDependencies,
            ...centralityChanges
        ];

        return this.rankChanges(allChanges, count);
    }

    /**
     * Determine if a path is a core/critical file
     */
    private isCorePath(filePath: string): boolean {
        const coreIndicators = [
            '/src/lib/',
            '/src/core/',
            '/lib/',
            '/core/',
            'index.',
            'main.',
            'app.',
            '/api/',
            '/models/',
            '/services/'
        ];

        return coreIndicators.some(indicator => filePath.includes(indicator));
    }

    /**
     * Determine if a path is a test file
     */
    private isTestPath(filePath: string): boolean {
        const testIndicators = [
            '.test.',
            '.spec.',
            '__tests__',
            '/tests/',
            '/test/'
        ];

        return testIndicators.some(indicator => filePath.includes(indicator));
    }

    /**
     * Calculate significance of a dependency change
     */
    private calculateDependencySignificance(
        sourceFile: string,
        targetFile: string
    ): 'high' | 'medium' | 'low' {
        const sourceIsCore = this.isCorePath(sourceFile);
        const targetIsCore = this.isCorePath(targetFile);

        if (sourceIsCore && targetIsCore) {
            return 'high'; // Core to core is most significant
        } else if (sourceIsCore || targetIsCore) {
            return 'medium'; // One core file
        }
        return 'low';
    }
}
