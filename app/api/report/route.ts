// DEMO MODE: Returns mock report data.
import { NextResponse } from 'next/server';
import { mockData } from '@/lib/mockData';

export async function GET() {
    return NextResponse.json({
        success: true,
        reports: [
            { id: '1', name: 'React Architecture Report', createdAt: new Date().toISOString(), metrics: mockData.metrics },
            { id: '2', name: 'Django Framework Report', createdAt: new Date().toISOString(), metrics: mockData.metrics },
        ],
    });
}

export async function POST() {
    return NextResponse.json({
        success: true,
        id: 'demo-report-1',
        message: 'Report generated successfully (Demo Mode)',
        url: null,
    });
}
