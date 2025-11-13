import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { signalId, reason } = await request.json();

    if (!signalId) {
      return NextResponse.json(
        { success: false, error: 'Signal ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔒 Closing signal ${signalId}...`);

    // Get signal
    const { data: signal, error: fetchError } = await supabase
      .from('trading_signals')
      .select('*')
      .eq('id', signalId)
      .single();

    if (fetchError || !signal) {
      return NextResponse.json(
        { success: false, error: 'Signal not found' },
        { status: 404 }
      );
    }

    // Get current price
    const response = await axios.get(
      `https://api.binance.com/api/v3/ticker/price?symbol=${signal.coin}USDT`
    );
    const currentPrice = parseFloat(response.data.price);

    // Calculate final P/L
    const entryPrice = signal.entry_price;
    const positionSize = signal.position_size;
    
    let pnlUSD = 0;
    let pnlPercentage = 0;

    if (signal.action === 'BUY') {
      pnlUSD = (currentPrice - entryPrice) * positionSize;
      pnlPercentage = ((currentPrice - entryPrice) / entryPrice) * 100;
    } else {
      pnlUSD = (entryPrice - currentPrice) * positionSize;
      pnlPercentage = ((entryPrice - currentPrice) / entryPrice) * 100;
    }

    // Update signal
    const { error: updateError } = await supabase
      .from('trading_signals')
      .update({
        current_price: currentPrice,
        pnl_usd: pnlUSD,
        pnl_percentage: pnlPercentage,
        status: 'CLOSED',
        closed_at: new Date().toISOString()
      })
      .eq('id', signalId);

    if (updateError) throw updateError;

    console.log(`✅ Signal closed. P/L: $${pnlUSD.toFixed(2)}`);

    return NextResponse.json({
      success: true,
      message: 'Signal closed successfully',
      pnl: {
        usd: parseFloat(pnlUSD.toFixed(2)),
        percentage: parseFloat(pnlPercentage.toFixed(2))
      },
      currentPrice
    });

  } catch (error: any) {
    console.error('❌ Close signal error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to close signal' },
      { status: 500 }
    );
  }
}
