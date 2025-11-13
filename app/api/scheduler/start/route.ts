import { NextRequest, NextResponse } from 'next/server';
import { startBackendScheduler } from '@/lib/backend-scheduler';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { interval } = body;

        if (!interval || interval < 1) {
            return NextResponse.json(
                { error: 'Invalid interval' },
                { status: 400 }
            );
        }

        startBackendScheduler(interval);

        return NextResponse.json({
            success: true,
            message: `Backend scheduler started with ${interval} minute interval`
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
