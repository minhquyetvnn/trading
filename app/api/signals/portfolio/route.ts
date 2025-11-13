import { NextRequest, NextResponse } from 'next/server';
import { getPortfolioStats } from '@/lib/signal-manager';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching portfolio stats...');

    // Get portfolio stats
    const portfolioStats = await getPortfolioStats();

    // Get active signals count
    const { data: activeSignals, error: activeError } = await supabase
      .from('trading_signals')
      .select('*', { count: 'exact', head: true })
      .in('status', ['ACTIVE', 'TP1_HIT', 'TP2_HIT']);

    // Get completed signals stats
    const { data: completedSignals, error: completedError } = await supabase
      .from('trading_signals')
      .select('pnl_usd, status')
      .in('status', ['TP3_HIT', 'SL_HIT', 'CLOSED']);

    // Calculate stats
    let totalTrades = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let totalProfit = 0;
    let totalLoss = 0;

    if (completedSignals) {
      totalTrades = completedSignals.length;
      
      completedSignals.forEach(signal => {
        const pnl = parseFloat(signal.pnl_usd || '0');
        
        if (pnl > 0) {
          winningTrades++;
          totalProfit += pnl;
        } else if (pnl < 0) {
          losingTrades++;
          totalLoss += Math.abs(pnl);
        }
      });
    }

    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;
    const netProfit = totalProfit - totalLoss;
    const currentCapital = 1000 + netProfit; // Starting capital + net profit

    // Update portfolio stats in database
    const today = new Date().toISOString().split('T')[0];
    
    await supabase
      .from('portfolio_stats')
      .upsert({
        date: today,
        starting_capital: 1000,
        current_capital: currentCapital,
        total_trades: totalTrades,
        winning_trades: winningTrades,
        losing_trades: losingTrades,
        win_rate: winRate,
        total_profit: totalProfit,
        total_loss: totalLoss,
        net_profit: netProfit,
        profit_factor: profitFactor,
        active_positions: activeSignals?.length || 0
      }, {
        onConflict: 'date'
      });

    console.log('✅ Portfolio stats calculated');

    return NextResponse.json({
      success: true,
      portfolio: {
        startingCapital: 1000,
        currentCapital: parseFloat(currentCapital.toFixed(2)),
        netProfit: parseFloat(netProfit.toFixed(2)),
        netProfitPercentage: parseFloat(((netProfit / 1000) * 100).toFixed(2)),
        
        totalTrades,
        winningTrades,
        losingTrades,
        winRate: parseFloat(winRate.toFixed(2)),
        
        totalProfit: parseFloat(totalProfit.toFixed(2)),
        totalLoss: parseFloat(totalLoss.toFixed(2)),
        profitFactor: parseFloat(profitFactor.toFixed(2)),
        
        activePositions: activeSignals?.length || 0
      }
    });

  } catch (error: any) {
    console.error('❌ Get portfolio stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch portfolio stats' },
      { status: 500 }
    );
  }
}
