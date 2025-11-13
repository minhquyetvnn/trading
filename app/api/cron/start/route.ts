import { NextResponse } from 'next/server';
import { startCronJobs, stopCronJobs } from '@/lib/cron-manager';

// Singleton to ensure cron jobs only start once
let cronStarted = false;

export async function GET() {
  try {
    if (cronStarted) {
      return NextResponse.json({
        success: true,
        message: 'Cron jobs already running'
      });
    }

    startCronJobs();
    cronStarted = true;

    return NextResponse.json({
      success: true,
      message: 'Cron jobs started successfully'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    stopCronJobs();
    cronStarted = false;

    return NextResponse.json({
      success: true,
      message: 'Cron jobs stopped'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
