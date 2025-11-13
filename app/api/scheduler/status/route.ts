import { NextResponse } from 'next/server';
import { getBackendSchedulerStatus } from '@/lib/backend-scheduler';

export async function GET() {
    try {
        const status = getBackendSchedulerStatus();

        return NextResponse.json(status);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
