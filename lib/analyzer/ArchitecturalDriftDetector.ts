/**
 * Architectural Drift Detector
 * Detects deviations from ideal architectural patterns
 * Part of PS 10: Semantic Codebase Synthesis and Architectural Recovery
 */

import { ArchitecturalInference, PatternDetector } from './PatternDetector';

export type DriftSeverity = 'none' | 'low' | 'medium' | 'high';

export type DriftViolation = {
    type: string;
    description: string;
    file: string;
    severity: DriftSeverity;
    suggestion: string;
};

export type ArchitecturalDrift = {
    detectedPattern: string;
    idealPattern: string;
    driftLevel: DriftSeverity;
    violations: DriftViolation[];
    explanation: string;
    evidence: string[];
};

export type BoundaryViolation = {
    from: string;
    to: string;
    fromLayer: string;
    toLayer: string;
    violationType: 'layer_skip' | 'reverse_dependency' | 'cross_boundary';
    description: string;
};

/**
 * Layer definitions for architectural boundary checking
 */


const LAYER_PATTERNS: Record<string, RegExp[]> = {
    'presentation': [
        /components?[/\\]/i,
        /pages?[/\\]/i,
        /views?[/\\]/i,
        /controllers?[/\\]/i,
        /ui[/\\]/i,
    ],
    'application': [
        /use[-_]?cases?[/\\]/i,
        /application[/\\]/i,
        /services?[/\\]/i,
    ],
    'domain': [
        /domain[/\\]/i,
        /entities[/\\]/i,
        /models?[/\\]/i,
        /core[/\\]/i,
    ],
    'infrastructure': [
        /infra(structure)?[/\\]/i,
        /database[/\\]/i,
        /repositories?[/\\]/i,
        /adapters?[/\\]/i,
        /external[/\\]/i,
        /api[/\\]client/i,
    ],
};

export class ArchitecturalDriftDetector {
    private patternDetector: PatternDetector;

    constructor() {
        this.patternDetector = new PatternDetector();
    }

    /**
     * Detect architectural drift from file structure and dependencies
     */
    detectDrift(
        filePaths: string[],
        dependencyGraph: Map<string, Set<string>>
    ): ArchitecturalDrift {
        // Infer the actual architecture from file structure
        const inferences = this.patternDetector.inferArchitectureFromStructure(filePaths);
        const primaryPattern = inferences.length > 0
            ? inferences.reduce((a, b) => a.confidence > b.confidence ? a : b)
            : null;

        // Check for boundary violations
        const violations = this.detectBoundaryViolations(filePaths, dependencyGraph);
        const driftViolations = this.convertToViolations(violations);

        // Determine ideal pattern based on codebase size and structure
        const idealPattern = this.determineIdealPattern(filePaths, inferences);

        // Calculate drift level
        const driftLevel = this.calculateDriftLevel(violations);

        // Generate explanation
        const explanation = this.generateExplanation(
            primaryPattern?.pattern || 'Unknown',
            idealPattern,
            violations,
            driftLevel
        );

        // Collect evidence
        const evidence = this.collectEvidence(inferences, violations);

        return {
            detectedPattern: primaryPattern?.pattern || 'Unstructured / Ad-hoc',
            idealPattern,
            driftLevel,
            violations: driftViolations,
            explanation,
            evidence
        };
    }

    /**
     * Detect layer boundary violations
     */
    detectBoundaryViolations(
        filePaths: string[],
        dependencyGraph: Map<string, Set<string>>
    ): BoundaryViolation[] {
        const violations: BoundaryViolation[] = [];

        for (const [file, dependencies] of dependencyGraph.entries()) {
            const fromLayer = this.classifyLayer(file);
            if (!fromLayer) continue;

            for (const dep of dependencies) {
                const toLayer = this.classifyLayer(dep);
                if (!toLayer) continue;

                const violation = this.checkLayerViolation(file, dep, fromLayer, toLayer);
                if (violation) {
                    violations.push(violation);
                }
            }
        }

        return violations;
    }

    /**
     * Classify a file into an architectural layer
     */
    private classifyLayer(filePath: string): string | null {
        for (const [layer, patterns] of Object.entries(LAYER_PATTERNS)) {
            if (patterns.some(p => p.test(filePath))) {
                return layer;
            }
        }
        return null;
    }

    /**
     * Check if a dependency violates layer boundaries
     */
    private checkLayerViolation(
        fromFile: string,
        toFile: string,
        fromLayer: string,
        toLayer: string
    ): BoundaryViolation | null {
        // const fromLevel = LAYER_HIERARCHY[fromLayer as keyof typeof LAYER_HIERARCHY];
        // const toLevel = LAYER_HIERARCHY[toLayer as keyof typeof LAYER_HIERARCHY];

        // Infrastructure should not import from presentation
        if (fromLayer === 'infrastructure' && toLayer === 'presentation') {
            return {
                from: fromFile,
                to: toFile,
                fromLayer,
                toLayer,
                violationType: 'reverse_dependency',
                description: `Infrastructure layer (${fromFile}) imports from presentation layer (${toFile}). This violates the dependency rule.`
            };
        }

        // Domain should not import from infrastructure
        if (fromLayer === 'domain' && toLayer === 'infrastructure') {
            return {
                from: fromFile,
                to: toFile,
                fromLayer,
                toLayer,
                violationType: 'reverse_dependency',
                description: `Domain layer (${fromFile}) imports from infrastructure (${toFile}). Domain should be pure and not depend on infrastructure.`
            };
        }

        // Domain should not import from presentation
        if (fromLayer === 'domain' && toLayer === 'presentation') {
            return {
                from: fromFile,
                to: toFile,
                fromLayer,
                toLayer,
                violationType: 'reverse_dependency',
                description: `Domain layer imports from UI/presentation. This breaks the Clean Architecture principle.`
            };
        }

        // Presentation directly importing infrastructure (skipping application/domain)
        if (fromLayer === 'presentation' && toLayer === 'infrastructure') {
            return {
                from: fromFile,
                to: toFile,
                fromLayer,
                toLayer,
                violationType: 'layer_skip',
                description: `Presentation directly accesses infrastructure, bypassing domain logic.`
            };
        }

        return null;
    }

    /**
     * Convert boundary violations to drift violations
     */
    private convertToViolations(boundaryViolations: BoundaryViolation[]): DriftViolation[] {
        return boundaryViolations.map(bv => ({
            type: bv.violationType,
            description: bv.description,
            file: bv.from,
            severity: bv.violationType === 'reverse_dependency' ? 'high' : 'medium',
            suggestion: this.getSuggestion(bv)
        }));
    }

    /**
     * Get suggestion for fixing a violation
     */
    private getSuggestion(violation: BoundaryViolation): string {
        switch (violation.violationType) {
            case 'reverse_dependency':
                return `Invert the dependency by introducing an interface/port in the ${violation.toLayer} layer that ${violation.fromLayer} can implement.`;
            case 'layer_skip':
                return `Route the dependency through the appropriate intermediate layers (domain/application) to maintain separation.`;
            case 'cross_boundary':
                return `Consider using dependency injection or event-based communication to decouple these modules.`;
            default:
                return `Review the dependency and consider refactoring for better separation of concerns.`;
        }
    }

    /**
     * Determine the ideal architectural pattern for this codebase
     */
    private determineIdealPattern(
        filePaths: string[],
        inferences: ArchitecturalInference[]
    ): string {
        const fileCount = filePaths.length;
        // const hasLayers = inferences.some(i => i.pattern.includes('Layered'));
        const hasHexagonal = inferences.some(i => i.pattern.includes('Hexagonal'));
        const hasClean = inferences.some(i => i.pattern.includes('Clean'));

        // If already following a good pattern, that's the ideal
        if (hasHexagonal || hasClean) {
            return hasHexagonal ? 'Hexagonal / Ports & Adapters' : 'Clean Architecture';
        }

        // For larger codebases, recommend more structured patterns
        if (fileCount > 100) {
            return 'Clean Architecture or Hexagonal';
        } else if (fileCount > 50) {
            return 'Layered Architecture';
        } else if (fileCount > 20) {
            return 'Modular / Feature-Sliced';
        }

        return 'Simple Modular Structure';
    }

    /**
     * Calculate overall drift level
     */
    private calculateDriftLevel(
        violations: BoundaryViolation[]
    ): DriftSeverity {
        const highViolations = violations.filter(v => v.violationType === 'reverse_dependency').length;
        const mediumViolations = violations.filter(v => v.violationType === 'layer_skip').length;

        if (highViolations >= 5 || (highViolations >= 2 && mediumViolations >= 5)) {
            return 'high';
        } else if (highViolations >= 2 || mediumViolations >= 3) {
            return 'medium';
        } else if (violations.length > 0) {
            return 'low';
        }

        return 'none';
    }

    /**
     * Generate human-readable explanation of drift
     */
    private generateExplanation(
        detectedPattern: string,
        idealPattern: string,
        violations: BoundaryViolation[],
        driftLevel: DriftSeverity
    ): string {
        if (driftLevel === 'none') {
            return `The codebase follows a ${detectedPattern} pattern with no significant architectural drift detected. Layer boundaries are respected.`;
        }

        const violationSummary = violations.length > 0
            ? `Found ${violations.length} boundary violation(s): ${violations.filter(v => v.violationType === 'reverse_dependency').length} reverse dependencies, ${violations.filter(v => v.violationType === 'layer_skip').length} layer skips.`
            : '';

        if (driftLevel === 'high') {
            return `SIGNIFICANT DRIFT DETECTED: The codebase shows ${detectedPattern} structure but has ${violations.length} architectural violations. ${violationSummary} Consider refactoring towards ${idealPattern} for better maintainability.`;
        } else if (driftLevel === 'medium') {
            return `MODERATE DRIFT: The codebase generally follows ${detectedPattern} but has some boundary violations. ${violationSummary} These should be addressed to prevent architectural erosion.`;
        } else {
            return `MINOR DRIFT: The codebase follows ${detectedPattern} with minor deviations. ${violationSummary} These are low priority but worth tracking.`;
        }
    }

    /**
     * Collect evidence for drift detection
     */
    private collectEvidence(
        inferences: ArchitecturalInference[],
        violations: BoundaryViolation[]
    ): string[] {
        const evidence: string[] = [];

        // Add pattern evidence
        for (const inf of inferences) {
            evidence.push(`Pattern: ${inf.pattern} (${inf.confidence}% confidence) - ${inf.indicators.slice(0, 2).join(', ')}`);
        }

        // Add top violations
        for (const viol of violations.slice(0, 5)) {
            evidence.push(`Violation: ${viol.from} → ${viol.to} (${viol.violationType})`);
        }

        return evidence;
    }
}
