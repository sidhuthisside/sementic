export type AnalysisRequest = {
    fileTree: string[];
    dependencyFile: string;
    keyFiles: Record<string, string>;
    repoName: string;
    openIssuesCount?: number;
};

export type ChatMessage = {
    role: "user" | "assistant" | "system";
    content: string;
};

export type ChatRequest = {
    messages: ChatMessage[];
    systemPrompt?: string;
    options?: {
        temperature?: number;
        repeat_penalty?: number;
        num_predict?: number;
    };
};

export type ArchitecturalClaim = {
    claim: string;
    category: 'pattern' | 'boundary' | 'dependency' | 'coupling';
    confidence: number; // 0-100
    explanation: string;
    limitationScenario: string;
    evidence: string[];
};

export type AIAnalysisResult = {
    metrics: {
        linesOfCode: number;
        complexity: number;
        maintainability: number;
        functionCount: number;
        classCount: number;
        testCoverage: number;
        documentationDensity: number;
        performance?: number;
        security?: number;
    };
    patterns: { name: string; confidence: number; description: string; locations: string[] }[];
    fileRoles?: {
        path: string;
        role: string;
        description: string;
        confidence: number;
    }[];
    insights?: {
        type: string;
        title: string;
        description: string;
        evidence?: string[];
        severity: "low" | "medium" | "high";
    }[];
    summary?: string; // Executive summary
    issues: { id: string; title: string; description?: string; severity: "low" | "medium" | "high"; location?: string }[];
    recommendations: { id: string; title: string; description: string; impact: "low" | "medium" | "high" }[];
    structural: {
        graph?: {
            nodes: { id: string; path: string; content: string; dependencies: string[] }[];
            edges: { source: string; target: string }[];
        };
        dependencyMapping: {
            directedRelationships: string[];
            moduleGraph: string;
        };
        circularDependencies: string[];
        highFanIn: string[];
        highFanOut: string[];
        boundaries: {
            domain: string[];
            infrastructure: string[];
            external: string[];
            violations: string[];
        };
        crossCuttingConcerns: {
            authentication: string[];
            logging: string[];
            stateManagement: string[];
            errorHandling: string[];
            other: string[];
        };
        patternHandling?: {
            layers: { name: string; confidence: number }[];
            keyComponents: string[];
        };
    };
    intent: {
        pattern: string;
        confidence: number;
        drift: {
            level: string;
            explanation: string;
            evidence: string[];
        };
        abstractionViolations: string[];
        evidence: string[];
    };
    explanations: {
        macro: string;
        meso: string;
        micro: string;
    };
    impact: {
        blastRadius: string;
        tightlyCoupled: string[];
        changeRisk: string;
    };
    confidenceAnalysis?: {
        claims: ArchitecturalClaim[];
        overallConfidence: number;
    };
};

export interface RefactorIssue {
    id: string;
    file: string;
    type: 'complexity' | 'coupling' | 'duplication' | 'style';
    severity: 'high' | 'medium' | 'low';
    description: string;
    line: number;
}

export interface RefactorPlan {
    id: string;
    title: string;
    description: string;
    risk: 'high' | 'medium' | 'low';
    changes: {
        file: string;
        diff: string; // Unified diff format
    }[];
}

export interface AIClient {
    analyze(request: AnalysisRequest): Promise<AIAnalysisResult>;
    chat(request: ChatRequest): Promise<string>;
    chatStream(request: ChatRequest): AsyncGenerator<string>;
    parse(code: string, language: string): Promise<unknown>;
}
