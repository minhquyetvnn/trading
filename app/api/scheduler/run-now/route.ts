import { NextResponse } from 'next/server';
import { runBackendSchedulerNow } from '@/lib/backend-scheduler';

export async function POST() {
    try {
        await runBackendSchedulerNow();

        return NextResponse.json({
            success: true,
            message: 'Scheduler executed successfully'
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
