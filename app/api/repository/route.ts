// DEMO MODE: Returns mock repository data in the exact shape the analyze page expects.
import { NextResponse } from 'next/server';
import { mockData } from '@/lib/mockData';

const MOCK_REPO_RESPONSE = {
    nodes: mockData.graph.nodes,
    links: mockData.graph.links,
    filePaths: [
        'src/components/Button.tsx',
        'src/components/Header.tsx',
        'src/components/Modal.tsx',
        'src/services/AuthService.ts',
        'src/services/UserService.ts',
        'src/services/TokenManager.ts',
        'src/controllers/UserController.ts',
        'src/controllers/ApiGateway.ts',
        'src/models/User.ts',
        'src/models/Token.ts',
        'src/utils/helpers.ts',
        'src/utils/validators.ts',
        'src/config/database.ts',
        'package.json',
        'README.md',
    ],
    metrics: {
        linesOfCode: 12400,
        complexity: 14,
        maintainability: 78,
        functionCount: 247,
        classCount: 38,
        testCoverage: 72,
        documentationDensity: 0.31,
    },
    dependencyFile: JSON.stringify({ dependencies: { react: '^18.0.0', typescript: '^5.0.0' } }),
    keyFiles: mockData.fileContents,
    openIssuesCount: 3,
    starsCount: 228000,
    forksCount: 46000,
    description: 'The library for web and native user interfaces.',
    error: null,
};

export async function GET() {
    await new Promise(r => setTimeout(r, 300));
    return NextResponse.json(MOCK_REPO_RESPONSE);
}

export async function POST() {
    // Simulate realistic repo clone + scan delay
    await new Promise(r => setTimeout(r, 1500));
    return NextResponse.json(MOCK_REPO_RESPONSE);
}
