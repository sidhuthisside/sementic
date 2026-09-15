// DEMO MODE: Returns a mock refactoring plan.
import { NextResponse } from 'next/server';

export async function POST() {
    await new Promise(r => setTimeout(r, 700));
    return NextResponse.json({
        success: true,
        plan: {
            title: 'Refactoring Plan: Reduce AuthService Complexity',
            steps: [
                { id: 1, description: 'Extract token validation into a dedicated TokenValidator class', effort: 'low', impact: 'high' },
                { id: 2, description: 'Break circular dependency between AuthService and UserRepository', effort: 'medium', impact: 'high' },
                { id: 3, description: 'Introduce dependency injection for testability', effort: 'medium', impact: 'medium' },
                { id: 4, description: 'Add interface definitions for all service classes', effort: 'low', impact: 'medium' },
            ],
            estimatedTime: '2-3 days',
            riskLevel: 'low',
        },
    });
}
