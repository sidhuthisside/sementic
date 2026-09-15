// DEMO MODE: Git commits stubbed with mock history.
import { NextResponse } from 'next/server';

const mockCommits = [
    { sha: 'abc1234', message: 'feat: add 3D dependency graph', author: 'Demo User', date: '2024-09-10T10:00:00Z' },
    { sha: 'def5678', message: 'fix: resolve circular dependency in AuthService', author: 'Demo User', date: '2024-09-09T14:30:00Z' },
    { sha: 'ghi9012', message: 'refactor: extract TokenManager from AuthService', author: 'Demo User', date: '2024-09-08T09:15:00Z' },
    { sha: 'jkl3456', message: 'perf: optimize graph rendering with WebGL', author: 'Demo User', date: '2024-09-07T16:45:00Z' },
    { sha: 'mno7890', message: 'docs: update README with architecture diagrams', author: 'Demo User', date: '2024-09-06T11:00:00Z' },
];

export async function GET() {
    return NextResponse.json({ success: true, commits: mockCommits });
}
export async function POST() {
    return NextResponse.json({ success: true, commits: mockCommits });
}
