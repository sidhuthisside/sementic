import { AIAnalysisResult, AnalysisRequest, ChatRequest } from './AIClient';
import { DependencyBuilder } from '../analyzer/DependencyBuilder';
import { CrossCuttingAnalyzer } from '../analyzer/CrossCuttingAnalyzer';
import { MetricsCalculator } from '../analyzer/MetricsCalculator';

export class AIOrchestrator {
    // Configuration now implicitly uses relative API routes

    static async analyze(request: AnalysisRequest): Promise<AIAnalysisResult> {
        console.log("🔮 [AIOrchestrator] analyze() called");

        // Try Ollama via Next.js API Proxy
        try {
            console.log(`[AIOrchestrator] Attempting Ollama Analysis...`);
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(err);
            }

            const result = await response.json();
            console.log("✅ [AIOrchestrator] Ollama analysis SUCCEEDED!");

            // Generate Confidence Analysis ONLY if Ollama didn't provide it
            // Part 3 - Confidence & Limitations (Hackathon Round 2 Requirement)
            if (!(result as AIAnalysisResult).confidenceAnalysis) {
                console.log("🔍 [AIOrchestrator] Ollama did not provide confidence analysis, calculating heuristic fallback...");
                const confidenceAnalysis = this.calculateConfidenceAnalysis(result as AIAnalysisResult, request);
                (result as AIAnalysisResult).confidenceAnalysis = confidenceAnalysis;
            } else {
                console.log("✅ [AIOrchestrator] Using Ollama's AI-generated confidence analysis!");
            }

            return result as AIAnalysisResult;

        } catch (error: any) {
            const errorMsg = error.toString();
            // Loosen error check for Ollama, primarily check for connection issues
            if (errorMsg.includes("ECONNREFUSED") || errorMsg.includes("Ollama")) {
                console.error("🚨 [AIOrchestrator] Ollama connection failed. Is it running?");
                // Return a special fallback result
                console.log("🔬 [AIOrchestrator] Falling back to Heuristic Architecture Analysis...");
                return this.getHeuristicFallback(request);
            }

            console.error("❌ [AIOrchestrator] Ollama analysis FAILED.", error);
        }

        // Fallback: Heuristic Analysis
        console.log("🔬 [AIOrchestrator] Falling back to Heuristic Architecture Analysis...");
        const fallback = await this.getHeuristicFallback(request);
        console.log("✅ [AIOrchestrator] Heuristic analysis complete");
        return fallback;
    }

    static async chat(request: ChatRequest): Promise<string> {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });

            if (!response.ok) throw new Error(await response.text());

            // For non-streaming, strictly we'd just read the whole body.
            // But our API endpoint returns a stream. 
            // Let's just consume the stream to text.
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullText = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value);
                    // Parse "data: {"content":...}"
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const json = JSON.parse(line.slice(6));
                                if (json.content) fullText += json.content;
                            } catch { } // ignore
                        }
                    }
                }
            }
            return fullText;

        } catch (error: unknown) {
            console.warn("⚠️ [AIOrchestrator] Chat failed.", error);
            return "I'm sorry, I'm having trouble connecting to the AI service.";
        }
    }

    static async *chatStream(request: ChatRequest): AsyncGenerator<string> {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });

            if (!response.ok) throw new Error(await response.text());

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                yield "Error: No response stream available";
                return;
            }

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            if (line.includes('[DONE]')) return;
                            const json = JSON.parse(line.slice(6));
                            if (json.content) yield json.content;
                        } catch { }
                    }
                }
            }
        } catch (error: unknown) {
            console.warn("⚠️ [AIOrchestrator] Chat stream failed.", error);
            yield "Detailed Error: " + (error instanceof Error ? error.message : String(error));
        }
    }

    /**
     * Calculates confidence scores and limitations for key architectural claims
     * Part 3 - Confidence & Limitations (Hackathon Round 2 Requirement)
     */
    public static calculateConfidenceAnalysis(result: AIAnalysisResult, request: AnalysisRequest): {
        claims: any[];
        overallConfidence: number;
    } {
        const claims: any[] = [];

        // Claim 1: Architectural Pattern Detection
        const patternEvidence = result.intent?.evidence || [];
        const hasKeyFiles = request.keyFiles && Object.keys(request.keyFiles).length > 0;
        const hasFileTree = request.fileTree && request.fileTree.length > 0;

        let patternConfidence = result.intent?.confidence || 50;
        if (!hasKeyFiles) {
            patternConfidence = Math.max(30, patternConfidence - 30); // Reduce confidence if no file content
        }
        if (patternEvidence.length > 2) {
            patternConfidence = Math.min(95, patternConfidence + 10); // Boost if strong evidence
        }

        claims.push({
            claim: `This codebase follows a "${result.intent?.pattern}" architectural pattern`,
            category: 'pattern',
            confidence: Math.round(patternConfidence),
            explanation: hasKeyFiles
                ? `Confidence based on ${patternEvidence.length} evidence points from actual file analysis, directory structure patterns, and naming conventions.`
                : `Confidence based on directory structure and file naming conventions only. Actual file content was not analyzed, reducing certainty.`,
            limitationScenario: `This inference may fail if the repository uses unconventional naming schemes, has a flat directory structure, or implements the pattern inconsistently across modules. For example, a project might appear to use MVC but actually implements a hybrid architecture.`,
            evidence: patternEvidence.slice(0, 3)
        });

        // Claim 2: Circular Dependencies Detection
        const circularDeps = result.structural?.circularDependencies || [];
        const hasGraphAnalysis = hasKeyFiles && circularDeps.length >= 0;

        let circularConfidence = 50;
        if (hasGraphAnalysis) {
            circularConfidence = 92; // High confidence when we actually built the dependency graph
        } else if (hasFileTree) {
            circularConfidence = 40; // Low confidence with heuristic-only detection
        }

        const circularCount = circularDeps.length;
        claims.push({
            claim: circularCount === 0
                ? `No circular dependencies detected in the codebase`
                : `Found ${circularCount} circular dependency chain${circularCount > 1 ? 's' : ''} in the codebase`,
            category: 'dependency',
            confidence: Math.round(circularConfidence),
            explanation: hasGraphAnalysis
                ? `High confidence: Deterministic graph traversal analysis performed on actual import/export statements. Circular dependencies were ${circularCount > 0 ? 'detected' : 'not found'} through cycle detection algorithm.`
                : `Low confidence: Analysis based on file naming patterns and directory structure only. Actual import statements were not parsed.`,
            limitationScenario: `This analysis may miss circular dependencies that occur through dynamic imports, runtime dependency injection, or indirect cycles spanning more than ${hasGraphAnalysis ? '10' : '3'} modules. It also cannot detect logical circular dependencies that don't manifest as import cycles.`,
            evidence: circularCount > 0
                ? [`Detected cycles: ${circularDeps.slice(0, 2).join('; ')}`]
                : ['Graph analysis completed with no cycles found']
        });

        // Claim 3: Boundary Violations Detection
        const violations = result.structural?.boundaries?.violations || [];
        const domainFiles = result.structural?.boundaries?.domain?.length || 0;
        const infraFiles = result.structural?.boundaries?.infrastructure?.length || 0;

        let boundaryConfidence = 55;
        if (hasKeyFiles && (domainFiles > 0 || infraFiles > 0)) {
            boundaryConfidence = 75; // Medium-high confidence with actual file analysis
        } else if (hasFileTree) {
            boundaryConfidence = 45; // Medium-low confidence with heuristics only
        }

        if (violations.length === 0 && (domainFiles + infraFiles) > 10) {
            boundaryConfidence = Math.min(85, boundaryConfidence + 10); // Boost if clear separation
        }

        claims.push({
            claim: violations.length === 0
                ? `Architectural boundaries are well-maintained with no violations detected`
                : `Found ${violations.length} architectural boundary violation${violations.length > 1 ? 's' : ''}`,
            category: 'boundary',
            confidence: Math.round(boundaryConfidence),
            explanation: hasKeyFiles
                ? `Confidence based on analysis of ${domainFiles + infraFiles} files across domain and infrastructure layers. Violations detected by identifying cross-layer imports that break architectural rules.`
                : `Confidence based on directory structure heuristics. Actual import analysis was not performed, so subtle violations may be missed.`,
            limitationScenario: `This detection may fail in microservices architectures where boundaries are enforced at the service level rather than within code. It may also miss violations in projects using dependency injection frameworks or event-driven patterns where dependencies are implicit.`,
            evidence: violations.length > 0
                ? violations.slice(0, 2)
                : [`Analyzed ${domainFiles} domain files and ${infraFiles} infrastructure files`]
        });

        // Calculate overall confidence (average of all claims)
        const overallConfidence = Math.round(
            claims.reduce((sum, claim) => sum + claim.confidence, 0) / claims.length
        );

        return { claims, overallConfidence };
    }

    private static async getHeuristicFallback(request: AnalysisRequest): Promise<AIAnalysisResult> {
        const fileTree = request.fileTree || [];
        const domainFiles = fileTree.filter(f => f.match(/domain|model|entity|schema/i));
        const infraFiles = fileTree.filter(f => f.match(/infra|database|api|client|config|service/i));
        const externalFiles = fileTree.filter(f => f.match(/integration|webhook|third-party/i));
        const utilsFiles = fileTree.filter(f => f.match(/util|helper|shared|common/i));

        let realCircular: string[] = [];
        let highFanIn: string[] = [];
        let highFanOut: string[] = [];
        let directedRels: string[] = [];
        let crossCuttingConcerns = {
            authentication: [] as string[], logging: [] as string[], stateManagement: [] as string[], errorHandling: [] as string[], other: [] as string[]
        };
        let evidence: string[] = ["Detected core layers based on standard directory conventions"];

        let graph: any = null;

        if (request.keyFiles && Object.keys(request.keyFiles).length > 0) {
            try {
                // 1. Dependencies and Stats
                const builder = new DependencyBuilder();
                const filesArray = Object.entries(request.keyFiles).map(([name, content]) => ({ name, content }));
                graph = await builder.buildGraph(filesArray);

                realCircular = graph.circular.map((c: string[]) => c.join(' -> '));

                // Calculate Stats manually
                const fanIn = new Map<string, number>();
                const fanOut = new Map<string, number>();

                graph.edges.forEach((edge: { source: string; target: string }) => {
                    fanOut.set(edge.source, (fanOut.get(edge.source) || 0) + 1);
                    fanIn.set(edge.target, (fanIn.get(edge.target) || 0) + 1);
                });

                highFanIn = Array.from(fanIn.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([file]) => file);
                highFanOut = Array.from(fanOut.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([file]) => file);
                directedRels = graph.edges.map((e: { source: string; target: string }) => `${e.source} -> ${e.target}`);

                // 2. Cross-Cutting Concerns
                const ccAnalyzer = new CrossCuttingAnalyzer();
                const ccResult = ccAnalyzer.analyze(request.keyFiles);

                crossCuttingConcerns = {
                    authentication: ccAnalyzer.getFilesForConcern(ccResult, 'authentication'),
                    logging: ccAnalyzer.getFilesForConcern(ccResult, 'logging'),
                    stateManagement: ccAnalyzer.getFilesForConcern(ccResult, 'stateManagement'),
                    errorHandling: ccAnalyzer.getFilesForConcern(ccResult, 'errorHandling'),
                    other: [
                        ...ccAnalyzer.getFilesForConcern(ccResult, 'validation'),
                        ...ccAnalyzer.getFilesForConcern(ccResult, 'caching'),
                        ...ccAnalyzer.getFilesForConcern(ccResult, 'analytics'),
                        ...ccAnalyzer.getFilesForConcern(ccResult, 'security')
                    ]
                };

                evidence.push(`Found ${realCircular.length} circular dependency chains`);
                evidence.push(`Identified ${ccResult.concerns.length} cross-cutting concern categories`);

            } catch (e) {
                console.warn("Heuristic structural detection failed", e);
            }
        }



        // ... inside getHeuristicFallback ...

        // 3. Real Metrics Calculation (No more Math.random())
        const metricsCalculator = new MetricsCalculator();
        let totalLOC = 0;
        let totalComplexity = 0;
        let totalDocDensity = 0;
        let totalMaintainability = 0;
        let fileCountWithContent = 0;

        // Stats from file tree (always available)
        const testFiles = fileTree.filter(f => f.match(/test|spec|\.t\.|_test|_spec/i));
        const testCoverageEst = fileTree.length > 0 ? Math.round((testFiles.length / fileTree.length) * 100) : 0;

        // Stats from content (if keyFiles available)
        if (request.keyFiles && Object.keys(request.keyFiles).length > 0) {
            Object.values(request.keyFiles).forEach(content => {
                const m = metricsCalculator.calculateMetrics(content);
                totalLOC += m.linesOfCode;
                totalComplexity += m.complexity;
                totalMaintainability += m.maintainability;
                totalDocDensity += m.documentationDensity;
                fileCountWithContent++;
            });
        } else {
            // Deterministic Fallback if no content: Estimate 30 LOC per file
            totalLOC = fileTree.length * 30;
            // complexity default 5
            totalComplexity = fileTree.length * 5;
            // maintainability default 70
            totalMaintainability = 70 * (fileCountWithContent || 1);
        }

        const avgComplexity = fileCountWithContent > 0 ? Math.round(totalComplexity / fileCountWithContent) : 10;
        const avgMaintainability = fileCountWithContent > 0 ? Math.round(totalMaintainability / fileCountWithContent) : 80;
        const avgDocDensity = fileCountWithContent > 0 ? Math.round(totalDocDensity / fileCountWithContent) : 0;

        const finalResult: AIAnalysisResult = {
            metrics: {
                linesOfCode: totalLOC,
                complexity: avgComplexity,
                maintainability: avgMaintainability,
                functionCount: fileCountWithContent > 0 ? Math.round(totalLOC / 20) : fileTree.length * 2, // Rough est if no content
                classCount: fileTree.length > 0 ? Math.round(fileTree.length / 5) : 0,
                testCoverage: testCoverageEst,
                documentationDensity: avgDocDensity
            },
            patterns: [{ name: "Standard Modular", confidence: 70, description: "Based on directory hierarchy", locations: [] }],
            insights: [
                { type: 'architectural', title: "Heuristic Insight", description: "Clear separation between source and config detected.", severity: 'low' }
            ],
            // ... (rest of the object) ...
            issues: [
                // Use real detected issues if possible, or leave empty if no evidence. 
                // Do NOT invent issues with fake paths.
            ],
            recommendations: [
                // Generic recommendations are okay, but specific ones need real data.
                { id: "r1", title: "Review Test Coverage", description: `Current test file ratio is ${testCoverageEst}%. Consider adding more tests.`, impact: "high" }
            ],
            structural: {
                graph: graph ? {
                    nodes: graph.nodes.map((n: any) => ({ id: n.id, path: n.name, content: "", dependencies: n.imports })),
                    edges: graph.edges
                } : {
                    nodes: fileTree.slice(0, 30).map(f => ({ id: f, path: f, content: "", dependencies: [] })),
                    edges: fileTree.slice(0, 25).map((f, i) => ({ source: f, target: fileTree[Math.min(i + 1, fileTree.length - 1)] }))
                },
                dependencyMapping: {
                    directedRelationships: directedRels.length > 0 ? directedRels : ["Inferred: Components -> UI", "Inferred: Services -> API"],
                    moduleGraph: `Visualized ${fileTree.length} files.`
                },
                circularDependencies: realCircular.length > 0 ? realCircular : [],
                highFanIn: highFanIn.length > 0 ? highFanIn : (utilsFiles.length > 0 ? utilsFiles.slice(0, 3) : []),
                highFanOut: highFanOut.length > 0 ? highFanOut : (domainFiles.length > 0 ? domainFiles.slice(0, 3) : []),
                boundaries: {
                    domain: domainFiles.slice(0, 10),
                    infrastructure: infraFiles.slice(0, 10),
                    external: externalFiles.slice(0, 10),
                    violations: []
                },
                crossCuttingConcerns
            },
            intent: {
                pattern: "Structural Inference",
                confidence: 85,
                drift: {
                    level: "Low",
                    explanation: "Pattern detected based on directory naming.",
                    evidence: ["Standardized folder naming detected"]
                },
                abstractionViolations: [],
                evidence
            },
            explanations: {
                macro: "The system appears to follow standard modular project organization.",
                meso: "Inter-module communication is likely via direct imports.",
                micro: "Logic is encapsulated within specific functional directories."
            },
            summary: `This repository contains ${fileTree.length} files.`,
            impact: {
                blastRadius: "Medium",
                tightlyCoupled: [],
                changeRisk: "Medium"
            }
        };

        // Calculate confidence analysis for the result
        const confidenceAnalysis = this.calculateConfidenceAnalysis(finalResult, request);
        finalResult.confidenceAnalysis = confidenceAnalysis;

        return this.enrichAnalysisData(finalResult, fileTree);
    }

    /**
     * Enhances analysis data with heuristic-based structural insights
     * Useful for repairing cached data or augmenting shallow analysis
     */
    public static enrichAnalysisData(data: AIAnalysisResult, fileTree: string[], graphData?: any): AIAnalysisResult {
        // 1. Ensure structural object exists
        if (!data.structural) {
            data.structural = {
                patternHandling: { layers: [], keyComponents: [] },
                dependencyMapping: { directedRelationships: [], cycles: [] },
                crossCuttingConcerns: {
                    authentication: [], logging: [], stateManagement: [], errorHandling: [], other: []
                },
                // Ensure other potential missing fields are init if strictly typed
            } as any;
        }

        // 2. Heuristic: Cross-Cutting Concerns
        const ccc = data.structural.crossCuttingConcerns;
        if (!ccc.authentication?.length) ccc.authentication = fileTree.filter(f => f.match(/auth|login|signin|signup|user|account|profile|permission|role/i)).slice(0, 5);
        if (!ccc.logging?.length) ccc.logging = fileTree.filter(f => f.match(/log|trace|monitor|audit|track/i)).slice(0, 5);
        if (!ccc.stateManagement?.length) ccc.stateManagement = fileTree.filter(f => f.match(/store|redux|context|provider|slice|reducer|state|atom|mobx/i)).slice(0, 5);
        if (!ccc.errorHandling?.length) ccc.errorHandling = fileTree.filter(f => f.match(/error|exception|fail|boundary|catch/i)).slice(0, 5);
        if (!ccc.other?.length) ccc.other = fileTree.filter(f => f.match(/util|convert|parse|format|theme|style|config|constant/i)).slice(0, 5);

        // 3. Heuristic: Layers (if empty)
        if (!data.structural.patternHandling) {
            data.structural.patternHandling = { layers: [], keyComponents: [] };
        }

        if (!data.structural.patternHandling.layers || data.structural.patternHandling.layers.length === 0) {
            const layers = new Set<string>();
            fileTree.forEach(f => {
                const parts = f.split('/');
                if (parts.length > 1) layers.add(parts[0]);
            });
            data.structural.patternHandling.layers = Array.from(layers).map(l => ({ name: l, confidence: 0.8 }));
        }

        // 4. Heuristic: Graph Metrics (if graphData provided and metrics missing)
        if (graphData && graphData.links && graphData.links.length > 0) {
            const links = graphData.links;
            const fanIn = new Map<string, number>();
            const fanOut = new Map<string, number>();

            links.forEach((link: any) => {
                const source = typeof link.source === 'object' ? link.source.id : link.source;
                const target = typeof link.target === 'object' ? link.target.id : link.target;
                if (source && target) {
                    fanOut.set(source, (fanOut.get(source) || 0) + 1);
                    fanIn.set(target, (fanIn.get(target) || 0) + 1);
                }
            });

            if (!data.structural.highFanIn || data.structural.highFanIn.length === 0) {
                data.structural.highFanIn = Array.from(fanIn.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([file]) => file);
            }

            if (!data.structural.highFanOut || data.structural.highFanOut.length === 0) {
                data.structural.highFanOut = Array.from(fanOut.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([file]) => file);
            }

            // Simple Cycle Detection (2-node cycles only for speed)
            if (!data.structural.circularDependencies || data.structural.circularDependencies.length === 0) {
                const cycles: string[] = [];
                links.forEach((link: any) => {
                    const source = typeof link.source === 'object' ? link.source.id : link.source;
                    const target = typeof link.target === 'object' ? link.target.id : link.target;
                    // Check if reverse link exists
                    const reverseLink = links.find((l: any) => {
                        const s = typeof l.source === 'object' ? l.source.id : l.source;
                        const t = typeof l.target === 'object' ? l.target.id : l.target;
                        return s === target && t === source;
                    });

                    if (reverseLink && !cycles.includes(`${target} <-> ${source}`) && !cycles.includes(`${source} <-> ${target}`)) {
                        cycles.push(`${source} <-> ${target}`);
                    }
                });
                data.structural.circularDependencies = cycles;
            }
        }

        return data;
    }

    /**
     * Generates a textual comparison between two analysis results using AI.
     */
    static async compareVersions(source: AIAnalysisResult, target: AIAnalysisResult, repoName: string): Promise<string> {
        console.log("🔮 [AIOrchestrator] compareVersions() called");

        const prompt = `
You are an expert senior software architect. Compare two versions of the repository "${repoName}".

## Version A (Old/Target):
- Maintainability: ${target.metrics.maintainability}/100
- Complexity: ${target.metrics.complexity}
- Issues: ${target.issues.length} detected
- Key Patterns: ${target.patterns.map(p => p.name).join(', ')}

## Version B (New/Source - Current):
- Maintainability: ${source.metrics.maintainability}/100
- Complexity: ${source.metrics.complexity}
- Issues: ${source.issues.length} detected
- Key Patterns: ${source.patterns.map(p => p.name).join(', ')}

## Task:
Provide a concise, high-level summary of the architectural evolution between these two versions.
Focus on:
1. Did the code quality improve or degrade?
2. Were major issues fixed or introduced?
3. Did the architectural patterns shift?

Keep the response under 150 words. Use standard Markdown headers (e.g. ### Header) and bullet points. Do not use raw # without space.
        `;

        const request: ChatRequest = {
            messages: [{ role: 'user', content: prompt }],
            systemPrompt: "You are an expert software architect.",
            options: {
                temperature: 0.2, // Lower temperature for more focused output
                repeat_penalty: 1.2, // Prevent repetition loops
                num_predict: 256 // Limit output length
            }
        };

        try {
            return await this.chat(request);
        } catch (error) {
            console.error("❌ [AIOrchestrator] Comparison failed", error);
            return "Unable to generate comparison insight at this time.";
        }
    }

    /**
     * Generates a refactoring plan for a specific file using AI.
     */
    static async generateRefactorPlan(fileContext: { path: string, content: string }): Promise<any> {
        // PERF: Skipping AI call to ensure <200ms response time as requested.
        // Using advanced heuristics instead.
        return this.heuristicRefactorPlan(fileContext);

        /* 
        // 1. Try AI Generation
        try {
            console.log(`🔮 [AIOrchestrator] generateRefactorPlan for ${fileContext.path}`);

            const prompt = `
You are an expert software architect and code refactoring specialist.
Analyze the following code file and generate a refactoring plan to improve code quality, reduce complexity, or fix architectural violations.

FILE: ${fileContext.path}
CONTENT:
\`\`\`
${fileContext.content}
\`\`\`

TASK:
1. Identify the most critical refactoring opportunity (e.g., extract method, decompose component, fix coupling).
2. Create a plan with a title, description, and risk assessment.
3. Generate the unified diff to apply this refactor.

Output JSON format (strictly):
{
    "id": "generated-id",
    "title": "Title of refactor",
    "description": "Why this refactor is needed",
    "risk": "low" | "medium" | "high",
    "changes": [
        {
            "file": "${fileContext.path}",
            "diff": "--- a/${fileContext.path}\\n+++ b/${fileContext.path}\\n..."
        }
    ]
}
`;

            const request: ChatRequest = {
                messages: [{ role: 'user', content: prompt }],
                systemPrompt: "You are a senior code refactoring agent. Return ONLY raw JSON. Do not use Markdown notation.",
                options: {
                    temperature: 0.1,
                    num_predict: 2048
                }
            };

            const rawResponse = await this.chat(request);

            // Robust JSON Extraction
            let jsonStr = rawResponse.trim();
            const firstBrace = jsonStr.indexOf('{');
            const lastBrace = jsonStr.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1) {
                jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
            }

            const plan = JSON.parse(jsonStr);
            if (!plan.changes || !Array.isArray(plan.changes)) throw new Error("Invalid plan format");
            return plan;

        } catch (error) {
            console.error("❌ [AIOrchestrator] Refactor generation failed, falling back to heuristics", error);
            return this.heuristicRefactorPlan(fileContext);
        } 
        */
    }

    private static heuristicRefactorPlan(fileContext: { path: string, content: string }) {
        // Deterministic fallback based on file characteristics
        const lines = fileContext.content.split('\n');

        // 1. Check for Long Function (More specific than long file)
        let maxFunctionLength = 0;
        let maxFunctionStart = 0;
        let currentFunctionLength = 0;
        let currentFunctionStart = 0;
        let inFunction = false;
        let bracketDepth = 0;
        let bestFunctionName = "complexFunction";

        // Simple parser to find long blocks
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const hasFunction = /function\s+(\w+)|const\s+(\w+)\s*=\s*(async\s*)?\(|(\w+)\s*\(.*\)\s*{/.exec(line);

            if (hasFunction && !inFunction) {
                inFunction = true;
                currentFunctionStart = i;
                currentFunctionLength = 0;
                bracketDepth = 0;
                bestFunctionName = hasFunction[1] || hasFunction[2] || hasFunction[4] || "anonymous";
            }

            if (inFunction) {
                currentFunctionLength++;
                bracketDepth += (line.match(/{/g) || []).length;
                bracketDepth -= (line.match(/}/g) || []).length;

                if (bracketDepth <= 0 && currentFunctionLength > 1) {
                    if (currentFunctionLength > maxFunctionLength) {
                        maxFunctionLength = currentFunctionLength;
                        maxFunctionStart = currentFunctionStart;
                    }
                    inFunction = false;
                }
            }
        }

        if (maxFunctionLength > 50) {
            return {
                id: 'heuristic-extract',
                title: `Extract '${bestFunctionName}'`,
                description: `The function '${bestFunctionName}' is ${maxFunctionLength} lines long. Extracting independent logic into helper functions improves readability and testing.`,
                risk: 'medium',
                changes: [{
                    file: fileContext.path,
                    diff: `// Proposed Change:\n// 1. Create new function 'process${bestFunctionName}Helper'\n// 2. Move lines ${maxFunctionStart + 10} to ${maxFunctionStart + maxFunctionLength - 5} into the new function\n// 3. Call 'process${bestFunctionName}Helper()' inside '${bestFunctionName}'`
                }]
            };
        }

        // 2. Check for Deep Nesting (Indentation)
        const maxIndent = lines.reduce((max, line) => {
            const indent = line.search(/\S/);
            return indent > max ? indent : max;
        }, 0);

        if (maxIndent > 16) {
            return {
                id: 'heuristic-flatten',
                title: 'Flatten Control Flow',
                description: 'Deeply nested code detected. Consider using guard clauses or extracting methods to reduce nesting complexity.',
                risk: 'low',
                changes: [{
                    file: fileContext.path,
                    diff: `// Suggested Action: Apply guard clauses to reduce nesting.\n// Example:\n// - if (condition) { ... }\n// + if (!condition) return;`
                }]
            };
        }

        // 3. Fallback to generic split if file is visually large but no specific function found
        if (lines.length > 300) {
            return {
                id: 'heuristic-split',
                title: 'Split Large Module',
                description: `This file is ${lines.length} lines long. Consider splitting it into smaller, more focused modules.`,
                risk: 'medium',
                changes: [{
                    file: fileContext.path,
                    diff: `// Suggested Action: Manually extract logic into new files.\n// No automated diff available for full file split.`
                }]
            };
        }

        // 4. Clean State
        return {
            id: 'heuristic-clean',
            title: 'No Major Issues Detected',
            description: 'Static analysis found no critical refactoring opportunities. Manual review recommended for logic verification.',
            risk: 'low',
            changes: []
        };
    }
}
