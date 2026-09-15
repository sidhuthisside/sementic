// DEMO MODE: Chat API returns pre-canned AI responses simulating real Ollama output.
import { NextResponse } from 'next/server';

const CANNED_RESPONSES = [
    `## Architectural Analysis

This codebase follows a **layered architecture** pattern with clear separation between presentation, business logic, and data access layers.

### Key Observations:
- **High Cohesion**: Modules are well-scoped with single responsibilities
- **Dependency Direction**: Dependencies flow inward — UI → Services → Data layer ✓
- **Coupling Score**: Low coupling detected (score: 0.23/1.0)

### Recommendations:
1. **Extract AuthService interface** to decouple the auth implementation
2. **Introduce a Repository pattern** for data access to improve testability
3. **Consider event-driven communication** between loosely coupled modules`,

    `## Code Quality Report

I've analyzed the architectural patterns in this repository:

**Detected Patterns:**
- ✅ **MVC Architecture** (confidence: 92%) — clear model-view-controller separation
- ✅ **Observer Pattern** (confidence: 88%) — event emitters used for state changes
- ⚠️ **God Class detected** in \`UserController\` — consider decomposing into smaller services

**Complexity Metrics:**
- Average Cyclomatic Complexity: **14** (target: <10)
- Maintainability Index: **78/100**
- Technical Debt Estimate: **~2.3 days**`,

    `## Refactoring Opportunities

Based on static analysis of your dependency graph:

### High Priority
\`\`\`
UserController.ts → 7 outgoing dependencies (high fan-out)
AuthService.ts → circular dependency with TokenManager
\`\`\`

### Suggested Refactor
Split \`UserController\` into:
- \`UserQueryController\` — read operations
- \`UserMutationController\` — write operations
- \`UserAuthController\` — auth-specific flows

This reduces fan-out from 7 → 3 per module and improves testability.`,

    `## Security Analysis

Scanning for common security patterns...

**Results:**
- 🟢 **Input validation** present on all API endpoints
- 🟢 **Authentication middleware** correctly applied
- 🟡 **Rate limiting** not detected on public endpoints — consider adding
- 🔴 **Hardcoded timeout values** in \`config.ts:L42\` — move to environment variables

**Overall Security Score: 87/100**`,
];

let responseIndex = 0;

export async function POST() {
    const response = CANNED_RESPONSES[responseIndex % CANNED_RESPONSES.length];
    responseIndex++;

    const textEncoder = new TextEncoder();
    const chunks = response.split(' ');

    const readableStream = new ReadableStream({
        async start(controller) {
            for (const word of chunks) {
                const sse = `data: ${JSON.stringify({ content: word + ' ' })}\n\n`;
                controller.enqueue(textEncoder.encode(sse));
                await new Promise(r => setTimeout(r, 20));
            }
            controller.enqueue(textEncoder.encode('data: [DONE]\n\n'));
            controller.close();
        },
    });

    return new Response(readableStream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        },
    });
}
