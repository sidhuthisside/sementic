import { Pattern } from './PatternDetector';
import { DependencyGraph } from './DependencyBuilder';
import { CodeMetrics } from './MetricsCalculator';

export type FileRole = {
    path: string;
    role: string; // e.g., "Domain Service", "API Endpoint"
    description: string;
    confidence: number;
};

export type Insight = {
    type: 'architectural' | 'maintenance' | 'security' | 'performance';
    title: string;
    description: string;
    evidence: string[]; // "Why" we think this
    severity: 'low' | 'medium' | 'high';
};

export class SemanticSynthesizer {

    /**
     * Generate high-level semantic insights based on analysis data
     */
    generateInsights(
        patterns: Pattern[],
        dependencies: DependencyGraph,
        metrics: CodeMetrics,
        fileRoles: FileRole[]
    ): Insight[] {
        const insights: Insight[] = [];

        // 1. Architectural Integrity Check
        this.checkArchitecture(patterns, dependencies, insights);

        // 2. Maintenance & Erosion Risks
        this.checkErosion(metrics, dependencies, insights);

        // 3. Role-Based Convention Analysis
        this.checkConventions(fileRoles, insights);

        return insights;
    }

    /**
     * Infer the micro-level role of a file based on name, content, and imports
     */
    detectFileRole(path: string, content: string): FileRole {
        const filename = path.split('/').pop() || "";

        // --- Heuristics ---

        // 1. API Controllers
        if (/Controller|Route|Handler/i.test(filename) || /@Get|@Post|NextResponse/i.test(content)) {
            return {
                path,
                role: "API Endpoint / Controller",
                description: "Handles incoming network requests and inputs.",
                confidence: 0.9
            };
        }

        // 2. Domain Services
        if (/Service|Manager/i.test(filename) && !/test|spec/i.test(filename)) {
            return {
                path,
                role: "Domain Service",
                description: "Encapsulates business logic and orchestration.",
                confidence: 0.85
            };
        }

        // 3. Data Repositories
        if (/Repository|Dao|Store/i.test(filename)) {
            return {
                path,
                role: "Data Access Layer",
                description: "Abstracts database interactions and queries.",
                confidence: 0.9
            };
        }

        // 4. UI Components (React)
        if (/[A-Z]\w+\.tsx$/.test(filename) && /return\s*\(|<[A-Z]/.test(content)) {
            return {
                path,
                role: "UI Component",
                description: "Presentational logic and user interaction.",
                confidence: 0.95
            };
        }

        // 5. Hooks
        if (/^use[A-Z]/.test(filename)) {
            return {
                path,
                role: "React Hook",
                description: "Encapsulates reusable stateful logic.",
                confidence: 0.95
            };
        }

        // 6. Configuration
        if (/config|env|settings/i.test(filename)) {
            return {
                path,
                role: "Configuration",
                description: "Application setup and environment variables.",
                confidence: 0.9
            };
        }

        // 7. Utilities
        if (/util|helper|common/i.test(filename) || path.includes('lib/utils')) {
            return {
                path,
                role: "Utility Module",
                description: "Stateless helper functions.",
                confidence: 0.8
            };
        }

        // 8. Types / Interfaces
        if (/types|interface|d\.ts/i.test(filename) || (/\.ts$/.test(filename) && !/func|class|const/i.test(content))) {
            return {
                path,
                role: "Type Definition",
                description: "TypeScript interfaces and type guards.",
                confidence: 0.8
            };
        }

        return {
            path,
            role: "Implementation File",
            description: "General source code module.",
            confidence: 0.5
        };
    }

    private checkArchitecture(patterns: Pattern[], deps: DependencyGraph, insights: Insight[]) {
        // Example: Clean Architecture Detection
        const hasUseCases = patterns.some(p => p.name === "Service Layer" || p.locations.some(l => l.includes('use-case')));
        const hasEntities = patterns.some(p => p.locations.some(l => l.includes('entity') || l.includes('model')));

        if (hasUseCases && hasEntities) {
            insights.push({
                type: 'architectural',
                title: "Layered Architecture Detected",
                description: "The system appears to follow a layered architecture, separating domain entities from application logic.",
                evidence: ["Detected 'Service Layer' pattern", "Found 'entity' or 'model' definitions"],
                severity: 'low'
            });
        }
    }

    private checkErosion(metrics: CodeMetrics, deps: DependencyGraph, insights: Insight[]) {
        // High Complexity + Low Tests
        if (metrics.complexity > 20 && metrics.testCoverage < 30) {
            insights.push({
                type: 'maintenance',
                title: "High Risk of Regression",
                description: "The codebase has high average complexity but low test coverage. Refactoring carries significant risk.",
                evidence: [`Avg Complexity: ${metrics.complexity}`, `Test Coverage: ${metrics.testCoverage}%`],
                severity: 'high'
            });
        }
    }

    private checkConventions(roles: FileRole[], insights: Insight[]) {
        const components = roles.filter(r => r.role === "UI Component");
        const hooks = roles.filter(r => r.role === "React Hook");

        if (components.length > 10 && hooks.length === 0) {
            insights.push({
                type: 'architectural',
                title: "Potential Logic Duplication",
                description: "Many UI components detected but no custom hooks found. Consider extracting stateful logic into hooks.",
                evidence: [`${components.length} UI Components`, "0 Custom Hooks"],
                severity: 'medium'
            });
        }
    }
}
