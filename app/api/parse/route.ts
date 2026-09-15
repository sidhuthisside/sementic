// DEMO MODE: Returns mock parsed AST/dependency data.
import { NextResponse } from 'next/server';
import { mockData } from '@/lib/mockData';

export async function POST() {
    await new Promise(r => setTimeout(r, 500));
    return NextResponse.json({
        success: true,
        graph: mockData.graph,
        fileSystem: mockData.fileSystem,
        patterns: mockData.patterns,
    });
}
