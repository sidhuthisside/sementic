import { PatternDetector, Pattern } from './PatternDetector';
import { DependencyBuilder, DependencyGraph } from './DependencyBuilder';
import { MetricsCalculator, CodeMetrics } from './MetricsCalculator';
import { CrossCuttingAnalyzer, CrossCuttingResult } from './CrossCuttingAnalyzer';
import { SemanticSynthesizer, Insight, FileRole } from './SemanticSynthesizer';

export type AnalysisStep =
    | 'parsing'
    | 'patterns'
    | 'dependencies'
    | 'cross-cutting'
    | 'metrics'
    | 'ai-insights'
    | 'complete';

export type AnalysisProgress = {
    step: AnalysisStep;
    progress: number; // 0-100
    message: string;
};

export type AnalysisResult = {
    patterns: Pattern[];
    dependencies: DependencyGraph;
    metrics: CodeMetrics;
    crossCutting: CrossCuttingResult;
    insights?: Insight[];
    fileRoles?: FileRole[];
};

export class AnalysisOrchestrator {
    private patternDetector = new PatternDetector();
    private dependencyBuilder = new DependencyBuilder();
    private metricsCalculator = new MetricsCalculator();
    private crossCuttingAnalyzer = new CrossCuttingAnalyzer();
    private semanticSynthesizer = new SemanticSynthesizer();

    async analyze(
        files: { name: string; content: string }[],
        onProgress?: (progress: AnalysisProgress) => void
    ): Promise<AnalysisResult> {

        // Step 1: Parsing
        onProgress?.({ step: 'parsing', progress: 10, message: 'Parsing code structure...' });

        // Step 2: Pattern Detection
        onProgress?.({ step: 'patterns', progress: 30, message: 'Detecting architecture patterns...' });

        const allPatterns: Pattern[] = [];
        files.forEach(file => {
            const patterns = this.patternDetector.detectPatterns(file.content, file.name);
            allPatterns.push(...patterns);
        });

        // Step 3: Dependency Analysis
        onProgress?.({ step: 'dependencies', progress: 50, message: 'Building dependency graph...' });

        const dependencies = await this.dependencyBuilder.buildGraph(files);

        // Step 4: Cross-Cutting Concerns
        onProgress?.({ step: 'cross-cutting', progress: 65, message: 'Analyzing cross-cutting concerns...' });

        const fileMap = files.reduce((acc, f) => ({ ...acc, [f.name]: f.content }), {} as Record<string, string>);
        const crossCutting = this.crossCuttingAnalyzer.analyze(fileMap);

        // Step 5: Metrics Calculation
        onProgress?.({ step: 'metrics', progress: 80, message: 'Calculating code metrics...' });

        // Aggregate metrics from all files
        const allMetrics = files.map(f => this.metricsCalculator.calculateMetrics(f.content));
        const aggregatedMetrics = this.aggregateMetrics(allMetrics);

        // Step 6: AI Insights (Semantic Synthesis)
        onProgress?.({ step: 'ai-insights', progress: 90, message: 'Synthesizing semantic insights...' });

        // Micro-Level Role Analysis
        const fileRoles = files.map(file =>
            this.semanticSynthesizer.detectFileRole(file.name, file.content)
        );

        // High-Level Semantic Insights
        const insights = this.semanticSynthesizer.generateInsights(
            allPatterns,
            dependencies,
            aggregatedMetrics,
            fileRoles
        );

        // Step 7: Complete
        onProgress?.({ step: 'complete', progress: 100, message: 'Analysis complete!' });

        return {
            patterns: allPatterns,
            dependencies,
            metrics: aggregatedMetrics,
            crossCutting,
            insights,
            fileRoles
        };
    }

    private aggregateMetrics(metrics: CodeMetrics[]): CodeMetrics {
        if (metrics.length === 0) {
            return {
                linesOfCode: 0,
                complexity: 0,
                maintainability: 0,
                testCoverage: 0,
                documentationDensity: 0,
                functionCount: 0,
                classCount: 0
            };
        }

        const sum = metrics.reduce((acc, m) => ({
            linesOfCode: acc.linesOfCode + m.linesOfCode,
            complexity: acc.complexity + m.complexity,
            maintainability: acc.maintainability + m.maintainability,
            testCoverage: acc.testCoverage + m.testCoverage,
            documentationDensity: acc.documentationDensity + m.documentationDensity,
            functionCount: acc.functionCount + m.functionCount,
            classCount: acc.classCount + m.classCount
        }));

        return {
            linesOfCode: sum.linesOfCode,
            complexity: Number((sum.complexity / metrics.length).toFixed(2)),
            maintainability: Number((sum.maintainability / metrics.length).toFixed(2)),
            testCoverage: Number((sum.testCoverage / metrics.length).toFixed(2)),
            documentationDensity: Number((sum.documentationDensity / metrics.length).toFixed(2)),
            functionCount: sum.functionCount,
            classCount: sum.classCount
        };
    }
}
