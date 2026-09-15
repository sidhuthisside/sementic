// DEMO MODE: Git diff stubbed with mock diff data.
import { NextResponse } from 'next/server';
import { mockData } from '@/lib/mockData';

export async function POST() {
    return NextResponse.json({
        success: true,
        original: mockData.comparison.diffCode.original,
        modified: mockData.comparison.diffCode.modified,
    });
}
export async function GET() {
    return NextResponse.json({
        success: true,
        original: mockData.comparison.diffCode.original,
        modified: mockData.comparison.diffCode.modified,
    });
}
