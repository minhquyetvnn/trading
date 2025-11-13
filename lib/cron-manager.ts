import cron from 'node-cron';
import { updatePredictionResult } from './performance-tracker';
import { getCurrentPrices } from './market-data';
import { createClient } from '@supabase/supabase-js';
import { telegramService } from './telegram-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

let cronJobs: cron.ScheduledTask[] = [];

export function startCronJobs() {
  console.log('\n🕐 Starting cron jobs for localhost...\n');

  // Stop existing jobs if any
  stopCronJobs();

  // Job 1: Check 1h predictions every hour at minute 5
  const job1h = cron.schedule('5 * * * *', async () => {
    console.log('\n⏰ [CRON] Running 1h predictions check...');
    await checkPredictions('1h');
  });

  // Job 2: Check 24h predictions every 6 hours
  const job24h = cron.schedule('0 */6 * * *', async () => {
    console.log('\n⏰ [CRON] Running 24h predictions check...');
    await checkPredictions('24h');
  });

  // Job 3: Check 7d predictions daily at 2 AM
  const job7d = cron.schedule('0 2 * * *', async () => {
    console.log('\n⏰ [CRON] Running 7d predictions check...');
    await checkPredictions('7d');
  });

  cronJobs = [job1h, job24h, job7d];

  console.log('✅ Cron jobs started:');
  console.log('  - 1h check: Every hour at minute 5');
  console.log('  - 24h check: Every 6 hours');
  console.log('  - 7d check: Daily at 2:00 AM\n');
}

export function stopCronJobs() {
  cronJobs.forEach(job => job.stop());
  cronJobs = [];
  console.log('⏹️ All cron jobs stopped');
}

async function checkPredictions(timeframe: '1h' | '24h' | '7d') {
  const startTime = Date.now();

  try {
    console.log(`\n📊 Checking ${timeframe} predictions...`);

    // Calculate time range
    let hoursAgo: number;
    let bufferMinutes: number;

    switch (timeframe) {
      case '1h':
        hoursAgo = 1;
        bufferMinutes = 5;
        break;
      case '24h':
        hoursAgo = 24;
        bufferMinutes = 30;
        break;
      case '7d':
        hoursAgo = 168; // 7 * 24
        bufferMinutes = 60;
        break;
    }

    const checkTime = new Date();
    checkTime.setHours(checkTime.getHours() - hoursAgo);
    checkTime.setMinutes(checkTime.getMinutes() - bufferMinutes);

    const upperBound = new Date();
    upperBound.setHours(upperBound.getHours() - hoursAgo);
    upperBound.setMinutes(upperBound.getMinutes() + bufferMinutes);

    // Get predictions to check
    const { data: predictions, error } = await supabase
      .from('predictions')
      .select('*')
      .gte('created_at', checkTime.toISOString())
      .lte('created_at', upperBound.toISOString())
      .is(`actual_price_${timeframe}`, null)
      .limit(100);

    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }

    if (!predictions || predictions.length === 0) {
      console.log(`✅ No ${timeframe} predictions to check`);
      return;
    }

    console.log(`📋 Found ${predictions.length} predictions to check`);

    // Get unique coins
    const coins = [...new Set(predictions.map(p => p.coin))];
    const symbols = coins.map(c => `${c}USDT`);

    // Fetch all prices at once
    console.log(`💰 Fetching prices for: ${coins.join(', ')}`);
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
        await updatePredictionResult(pred.id, timeframe, currentPrice);

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
          `$${pred.entry_price} → $${currentPrice} ` +
          `(${profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)}%)`
        );

      } catch (err) {
        console.error(`❌ Failed to check prediction ${pred.id}:`, err);
      }
    }

    const winRate = checkedCount > 0 ? (correctCount / checkedCount * 100).toFixed(1) : '0';
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n✅ Completed ${timeframe} check in ${duration}s`);
    console.log(`📊 Results: ${correctCount}/${checkedCount} correct (${winRate}% win rate)\n`);

    // Send summary to Telegram
    if (checkedCount > 0) {
      try {
        const emoji = timeframe === '1h' ? '🕐' : timeframe === '24h' ? '📅' : '📆';
        
        let message = `${emoji} <b>${timeframe.toUpperCase()} Predictions Check</b>\n\n`;
        message += `✅ Checked: ${checkedCount}\n`;
        message += `🎯 Correct: ${correctCount}\n`;
        message += `📊 Win Rate: ${winRate}%\n\n`;
        
        if (results.length <= 5) {
          message += '<b>Results:</b>\n';
          results.forEach(r => {
            message += `${r.isCorrect ? '✅' : '❌'} ${r.coin} ${r.action}: ${r.profitLoss}%\n`;
          });
        } else {
          message += `<b>Top Results:</b>\n`;
          results.slice(0, 5).forEach(r => {
            message += `${r.isCorrect ? '✅' : '❌'} ${r.coin} ${r.action}: ${r.profitLoss}%\n`;
          });
          message += `\n... and ${results.length - 5} more`;
        }

        message += `\n⏱️ Duration: ${duration}s`;

        await telegramService.sendMessage(message.trim());
      } catch (err) {
        console.error('⚠️ Failed to send Telegram notification:', err);
      }
    }

  } catch (error: any) {
    console.error(`❌ Error checking ${timeframe} predictions:`, error);
    
    // Send error alert to Telegram
    try {
      await telegramService.sendMessage(`
⚠️ <b>Cron Job Error</b>

Timeframe: ${timeframe}
Error: ${error.message}

Time: ${new Date().toLocaleString()}
      `.trim());
    } catch (err) {
      console.error('Failed to send error alert:', err);
    }
  }
}

// Manual trigger functions for testing
export async function manualCheckPredictions(timeframe: '1h' | '24h' | '7d') {
  console.log(`\n🔧 Manual trigger: Checking ${timeframe} predictions...`);
  await checkPredictions(timeframe);
}
