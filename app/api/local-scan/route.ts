// DEMO MODE: Local file scan stubbed with mock analysis results.
import { NextResponse } from 'next/server';
import { mockData } from '@/lib/mockData';

export async function POST() {
    await new Promise(r => setTimeout(r, 900));
    return NextResponse.json({
        success: true,
        metrics: mockData.metrics,
        graph: mockData.graph,
        patterns: mockData.patterns,
        issues: mockData.issues,
        recommendations: mockData.recommendations,
        fileSystem: mockData.fileSystem,
    });
}
