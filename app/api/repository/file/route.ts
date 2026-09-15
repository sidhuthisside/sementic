// DEMO MODE: Returns mock file content for the repository file viewer.
import { NextResponse } from 'next/server';
import { mockData } from '@/lib/mockData';

export async function GET() {
    return NextResponse.json({
        success: true,
        content: mockData.fileContents['App.tsx'],
        language: 'typescript',
    });
}

export async function POST() {
    return NextResponse.json({
        success: true,
        content: mockData.fileContents['App.tsx'],
        language: 'typescript',
    });
}
