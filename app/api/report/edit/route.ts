// DEMO MODE: Report edit stubbed.
import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json({ success: true, message: 'Report updated (Demo Mode)' });
}

export async function PUT() {
    return NextResponse.json({ success: true, message: 'Report updated (Demo Mode)' });
}
