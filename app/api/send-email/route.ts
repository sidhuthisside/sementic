// DEMO MODE: Email sending stubbed — no Nodemailer in demo.
import { NextResponse } from 'next/server';

export async function POST() {
    await new Promise(r => setTimeout(r, 300));
    return NextResponse.json({
        success: true,
        message: 'Email sent successfully (Demo Mode — no actual email delivered)',
    });
}
