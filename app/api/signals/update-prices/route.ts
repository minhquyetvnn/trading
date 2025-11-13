import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { updateSignalPrice } from '@/lib/signal-manager';
import axios from 'axios';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('\n🔄 Updating signal prices...');

    // Get all active signals
    const { data: signals, error } = await supabase
      .from('trading_signals')
      .select('*')
      .in('status', ['ACTIVE', 'TP1_HIT', 'TP2_HIT']);

    if (error) throw error;

    if (!signals || signals.length === 0) {
      console.log('✓ No active signals to update');
      return NextResponse.json({
        success: true,
        updated: 0,
        message: 'No active signals'
      });
    }

    console.log(`Found ${signals.length} active signals to update`);

    let updated = 0;

    // Update each signal
    for (const signal of signals) {
      try {
        // Fetch current price
        const currentPrice = await getCurrentPrice(signal.coin);
        
        // Update signal with current price and check TP/SL
        await updateSignalPrice(signal.id, currentPrice);
        
        updated++;
        console.log(`✓ Updated ${signal.coin}: $${currentPrice}`);

      } catch (error) {
        console.error(`❌ Error updating signal ${signal.id}:`, error);
      }
    }

    console.log(`✅ Updated ${updated}/${signals.length} signals\n`);

    return NextResponse.json({
      success: true,
      updated,
      total: signals.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Update prices error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update prices' },
      { status: 500 }
    );
  }
}

async function getCurrentPrice(coin: string): Promise<number> {
  try {
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

// POST endpoint để manually update một signal cụ thể
export async function POST(request: NextRequest) {
  try {
    const { signalId } = await request.json();

    if (!signalId) {
      return NextResponse.json(
        { success: false, error: 'Signal ID is required' },
        { status: 400 }
      );
    }

    // Get signal
    const { data: signal, error } = await supabase
      .from('trading_signals')
      .select('*')
      .eq('id', signalId)
      .single();

    if (error || !signal) {
      return NextResponse.json(
        { success: false, error: 'Signal not found' },
        { status: 404 }
      );
    }

    // Get current price
    const currentPrice = await getCurrentPrice(signal.coin);

    // Update signal
    await updateSignalPrice(signalId, currentPrice);

    return NextResponse.json({
      success: true,
      message: 'Signal updated successfully',
      currentPrice
    });

  } catch (error: any) {
    console.error('❌ Manual update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update signal' },
      { status: 500 }
    );
  }
}
