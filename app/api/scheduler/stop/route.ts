import { NextResponse } from 'next/server';
import { stopBackendScheduler } from '@/lib/backend-scheduler';

export async function POST() {
    try {
        stopBackendScheduler();

        return NextResponse.json({
            success: true,
            message: 'Backend scheduler stopped'
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
