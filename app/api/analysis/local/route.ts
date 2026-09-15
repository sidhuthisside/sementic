// DEMO MODE: Local analysis persistence stubbed.
// GET returns 404 (no saved data) so the page falls through to fresh analysis.
// POST accepts saves but does nothing.
import { NextResponse } from 'next/server';

export async function GET() {
    // Return 404 so the page skips local persistence and goes straight to fresh mock analysis
    return NextResponse.json({ error: 'No local data' }, { status: 404 });
}

export async function POST() {
    // Accept the save silently
    return NextResponse.json({ success: true });
}
