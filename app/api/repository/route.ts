// DEMO MODE: Returns mock repository metadata.
import { NextResponse } from 'next/server';
import { mockData } from '@/lib/mockData';

export async function GET() {
    await new Promise(r => setTimeout(r, 300));
    return NextResponse.json({
        success: true,
        name: 'facebook/react',
        description: 'The library for web and native user interfaces.',
        stars: 228000,
        language: 'TypeScript',
        fileTree: mockData.fileSystem,
        openIssuesCount: 3,
        topics: ['javascript', 'library', 'react', 'ui'],
    });
}

export async function POST() {
    await new Promise(r => setTimeout(r, 400));
    return NextResponse.json({
        success: true,
        name: 'sample/repository',
        description: 'Sample repository for demo mode.',
        stars: 1200,
        language: 'TypeScript',
        fileTree: mockData.fileSystem,
        openIssuesCount: 3,
        topics: ['typescript', 'demo'],
    });
}
