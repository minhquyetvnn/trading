import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { updatePredictionResult } from '@/lib/performance-tracker';
import axios from 'axios';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('\n🔄 Starting automated results update...');

    const timeframes = [
      { name: '1h', hours: 1 },
      { name: '4h', hours: 4 },
      { name: '24h', hours: 24 },
      { name: '48h', hours: 48 },
      { name: '7d', hours: 168 }
    ];

    let totalUpdated = 0;

    for (const timeframe of timeframes) {
      console.log(`\n📊 Checking ${timeframe.name} predictions...`);

      const targetDate = new Date();
      targetDate.setHours(targetDate.getHours() - timeframe.hours);

      // Lấy predictions cần update
      const { data: predictions, error } = await supabase
        .from('predictions')
        .select('*')
        .is(`actual_price_${timeframe.name}`, null)
        .lte('created_at', targetDate.toISOString())
        .limit(50); // Limit để tránh timeout

      if (error) {
        console.error(`❌ Error fetching ${timeframe.name} predictions:`, error);
        continue;
      }

      if (!predictions || predictions.length === 0) {
        console.log(`✓ No ${timeframe.name} predictions to update`);
        continue;
      }

      console.log(`Found ${predictions.length} predictions to update`);

      // Update từng prediction
      for (const prediction of predictions) {
        try {
          // Fetch current price
          const currentPrice = await getCurrentPrice(prediction.coin);
          
          // Update result
          await updatePredictionResult(
            prediction.id,
            timeframe.name as any,
            currentPrice
          );

          totalUpdated++;

        } catch (error) {
          console.error(`❌ Error updating prediction ${prediction.id}:`, error);
        }
      }
    }

    console.log(`\n✅ Results update completed! Total updated: ${totalUpdated}\n`);

    return NextResponse.json({
      success: true,
      updated: totalUpdated,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Update results error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update results' },
      { status: 500 }
    );
  }
}

async function getCurrentPrice(coin: string): Promise<number> {
  try {
    // Try Binance first
    const response = await axios.get(
      `https://api.binance.com/api/v3/ticker/price?symbol=${coin}USDT`,
      { timeout: 5000 }
    );
    return parseFloat(response.data.price);
  } catch (error) {
    console.error(`❌ Error fetching price for ${coin}:`, error);
    throw error;
  }
}

// POST endpoint để manually trigger update
export async function POST(request: NextRequest) {
  try {
    const { predictionId, timeframe } = await request.json();

    if (!predictionId || !timeframe) {
      return NextResponse.json(
        { success: false, error: 'predictionId and timeframe are required' },
        { status: 400 }
      );
    }

    // Get prediction
    const { data: prediction, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('id', predictionId)
      .single();

    if (error || !prediction) {
      return NextResponse.json(
        { success: false, error: 'Prediction not found' },
        { status: 404 }
      );
    }

    // Get current price
    const currentPrice = await getCurrentPrice(prediction.coin);

    // Update result
    await updatePredictionResult(predictionId, timeframe, currentPrice);

    return NextResponse.json({
      success: true,
      message: 'Result updated successfully'
    });

  } catch (error: any) {
    console.error('❌ Manual update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update result' },
      { status: 500 }
    );
  }
}
