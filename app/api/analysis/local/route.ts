// DEMO MODE: Returns mock analysis for local file uploads.
import { NextResponse } from 'next/server';
import { mockData } from '@/lib/mockData';

export async function POST() {
    await new Promise(r => setTimeout(r, 600));
    return NextResponse.json({
        success: true,
        metrics: mockData.metrics,
        graph: mockData.graph,
        patterns: mockData.patterns,
        issues: mockData.issues,
        recommendations: mockData.recommendations,
    });
}
