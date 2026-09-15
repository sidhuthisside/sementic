// DEMO MODE: NextAuth route stubbed — no real OAuth flow in frontend demo.
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ message: 'Demo mode — auth not available' }, { status: 200 });
}

export async function POST() {
    return NextResponse.json({ message: 'Demo mode — auth not available' }, { status: 200 });
}
