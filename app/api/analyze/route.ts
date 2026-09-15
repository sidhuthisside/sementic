// DEMO MODE: Returns rich mock analysis data — no Ollama or real AST parsing needed.
import { NextResponse } from 'next/server';
import { mockData } from '@/lib/mockData';

export async function POST() {
    // Simulate a brief processing delay for realism
    await new Promise(r => setTimeout(r, 800));

    return NextResponse.json({
        success: true,
        metrics: mockData.metrics,
        graph: mockData.graph,
        patterns: mockData.patterns,
        issues: mockData.issues,
        recommendations: mockData.recommendations,
        fileSystem: mockData.fileSystem,
        mermaidGraph: `graph TD
    UserController --> AuthService
    AuthService --> TokenManager
    AuthService --> UserRepository
    UserRepository --> Database
    UserController --> UserRepository
    ApiGateway --> UserController
    ApiGateway --> NotificationService
    NotificationService --> EmailProvider
    classDef default fill:#1a1a1a,stroke:#00f3ff,stroke-width:1px;`,
        aiSummary: `## Architecture Overview\n\nThis is a **well-structured** multi-layer application following MVC principles.\n\n### Strengths\n- Clear separation of concerns\n- Low coupling between modules\n- Consistent naming conventions\n\n### Areas for Improvement\n- Reduce circular dependencies in the auth layer\n- Extract shared utilities into a dedicated module\n- Add integration tests for the API gateway`,
    });
}
