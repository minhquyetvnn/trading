import { NextRequest, NextResponse } from 'next/server';
import { manualCheckPredictions } from '@/lib/cron-manager';

export async function POST(request: NextRequest) {
  try {
    const { timeframe } = await request.json();

    if (!timeframe || !['1h', '24h', '7d'].includes(timeframe)) {
      return NextResponse.json(
        { error: 'Invalid timeframe. Must be 1h, 24h, or 7d' },
        { status: 400 }
      );
    }

    console.log(`\n🔧 Manual check triggered for ${timeframe}`);
    
    await manualCheckPredictions(timeframe);

    return NextResponse.json({
      success: true,
      message: `Manual check completed for ${timeframe}`
    });

  } catch (error: any) {
    console.error('Manual check error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
