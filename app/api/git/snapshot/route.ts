// DEMO MODE: Git snapshot stubbed.
import { NextResponse } from 'next/server';
import { mockData } from '@/lib/mockData';

export async function POST() {
    return NextResponse.json({ success: true, snapshot: { graph: mockData.graph, metrics: mockData.metrics } });
}
export async function GET() {
    return NextResponse.json({ success: true, snapshot: { graph: mockData.graph, metrics: mockData.metrics } });
}
