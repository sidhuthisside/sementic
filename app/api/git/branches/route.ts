// DEMO MODE: Git branches stubbed.
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ success: true, branches: ['main', 'develop', 'feature/3d-graph', 'fix/auth-bug'] });
}
export async function POST() {
    return NextResponse.json({ success: true, branches: ['main', 'develop', 'feature/3d-graph', 'fix/auth-bug'] });
}
