// DEMO MODE: Git status stubbed.
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ success: true, status: 'clean', branch: 'main', ahead: 0, behind: 0 });
}
export async function POST() {
    return NextResponse.json({ success: true, status: 'clean', branch: 'main', ahead: 0, behind: 0 });
}
