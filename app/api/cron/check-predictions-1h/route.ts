import { NextRequest, NextResponse } from 'next/server';
import { updatePredictionResult } from '@/lib/performance-tracker';
import { getCurrentPrices } from '@/lib/market-data';
import { createClient } from '@supabase/supabase-js';
import { telegramService } from '@/lib/telegram-service';

export const maxDuration = 60; // Vercel: max 60s for hobby plan

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (security)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('❌ Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('\n🕐 [CRON] Starting 1h predictions check...');
    const startTime = Date.now();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Get predictions created 1h ago that haven't been checked
    const checkTime = new Date();
    checkTime.setHours(checkTime.getHours() - 1);
    checkTime.setMinutes(checkTime.getMinutes() - 5); // 5 min buffer

    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    oneHourAgo.setMinutes(oneHourAgo.getMinutes() + 5); // 5 min buffer

    const { data: predictions, error } = await supabase
      .from('predictions')
      .select('*')
      .gte('created_at', checkTime.toISOString())
      .lte('created_at', oneHourAgo.toISOString())
      .is('actual_price_1h', null)
      .limit(100);

    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }

    console.log(`📊 Found ${predictions?.length || 0} predictions to check (1h)`);

    if (!predictions || predictions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No predictions to check',
        checked: 0
      });
    }

    // Get unique coins
    const coins = [...new Set(predictions.map(p => p.coin))];
    const symbols = coins.map(c => `${c}USDT`);

    // Fetch all prices at once
    const prices = await getCurrentPrices(symbols);

    let checkedCount = 0;
    let correctCount = 0;
    const results: any[] = [];

    // Process each prediction
    for (const pred of predictions) {
      try {
        const symbol = `${pred.coin}USDT`;
        const currentPrice = prices.get(symbol);

        if (!currentPrice) {
          console.warn(`⚠️ No price found for ${symbol}`);
          continue;
        }

        // Update result
        await updatePredictionResult(pred.id, '1h', currentPrice);

        // Calculate if correct
        let isCorrect = false;
        let profitLoss = 0;

        if (pred.action === 'BUY') {
          profitLoss = ((currentPrice - pred.entry_price) / pred.entry_price) * 100;
          isCorrect = currentPrice > pred.entry_price;
        } else if (pred.action === 'SELL') {
          profitLoss = ((pred.entry_price - currentPrice) / pred.entry_price) * 100;
          isCorrect = currentPrice < pred.entry_price;
        } else if (pred.action === 'HOLD') {
          profitLoss = ((currentPrice - pred.entry_price) / pred.entry_price) * 100;
          isCorrect = Math.abs(profitLoss) < 2;
        }

        checkedCount++;
        if (isCorrect) correctCount++;

        results.push({
          coin: pred.coin,
          action: pred.action,
          entry: pred.entry_price,
          current: currentPrice,
          profitLoss: profitLoss.toFixed(2),
          isCorrect
        });

        console.log(
          `${isCorrect ? '✅' : '❌'} ${pred.coin} ${pred.action}: ` +
          `Entry $${pred.entry_price} → Current $${currentPrice} ` +
          `(${profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)}%)`
        );

      } catch (err) {
        console.error(`❌ Failed to check prediction ${pred.id}:`, err);
      }
    }

    const winRate = checkedCount > 0 ? (correctCount / checkedCount * 100).toFixed(1) : '0';
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n✅ [CRON] Completed in ${duration}s`);
    console.log(`📊 Results: ${correctCount}/${checkedCount} correct (${winRate}% win rate)`);

    // Send summary to Telegram (optional)
    if (checkedCount > 0) {
      try {
        await telegramService.sendMessage(`
🕐 <b>1H Predictions Check Complete</b>

✅ Checked: ${checkedCount} predictions
🎯 Correct: ${correctCount}
📊 Win Rate: ${winRate}%

⏱️ Duration: ${duration}s
        `.trim());
      } catch (err) {
        console.error('Failed to send Telegram notification:', err);
      }
    }

    return NextResponse.json({
      success: true,
      timeframe: '1h',
      checked: checkedCount,
      correct: correctCount,
      winRate: parseFloat(winRate),
      results,
      duration: parseFloat(duration)
    });

  } catch (error: any) {
    console.error('❌ [CRON] Error:', error);
    
    // Send error alert to Telegram
    try {
      await telegramService.sendMessage(`
⚠️ <b>Cron Job Error (1h)</b>

Error: ${error.message}

Time: ${new Date().toLocaleString()}
      `.trim());
    } catch (err) {
      console.error('Failed to send error alert:', err);
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
