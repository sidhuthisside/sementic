// DEMO MODE: Git commit stubbed.
import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json({ success: true, message: 'Commit created (Demo Mode)', sha: 'abc1234' });
}
