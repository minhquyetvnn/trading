import { NextRequest, NextResponse } from 'next/server';
import { updatePredictionResult } from '@/lib/performance-tracker';
import { getCurrentPrices } from '@/lib/market-data';
import { createClient } from '@supabase/supabase-js';
import { telegramService } from '@/lib/telegram-service';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('\n🕐 [CRON] Starting 24h predictions check...');
        const startTime = Date.now();

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!
        );

        // Tương tự 24h route, chỉ thay đổi:
        checkTime.setDate(checkTime.getDate() - 7);
        upperBound.setDate(upperBound.getDate() - 7);
        // ... và timeframe thành '7d'


        const upperBound = new Date();
        upperBound.setHours(upperBound.getHours() - 24);
        upperBound.setMinutes(upperBound.getMinutes() + 30);

        const { data: predictions, error } = await supabase
            .from('predictions')
            .select('*')
            .gte('created_at', checkTime.toISOString())
            .lte('created_at', upperBound.toISOString())
            .is('actual_price_24h', null)
            .limit(100);

        if (error) throw error;

        console.log(`📊 Found ${predictions?.length || 0} predictions to check (24h)`);

        if (!predictions || predictions.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No predictions to check',
                checked: 0
            });
        }

        const coins = [...new Set(predictions.map(p => p.coin))];
        const symbols = coins.map(c => `${c}USDT`);
        const prices = await getCurrentPrices(symbols);

        let checkedCount = 0;
        let correctCount = 0;
        const results: any[] = [];

        for (const pred of predictions) {
            try {
                const symbol = `${pred.coin}USDT`;
                const currentPrice = prices.get(symbol);

                if (!currentPrice) {
                    console.warn(`⚠️ No price found for ${symbol}`);
                    continue;
                }

                await updatePredictionResult(pred.id, '24h', currentPrice);

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

        // Send detailed summary to Telegram
        if (checkedCount > 0) {
            try {
                const summary = results.map(r =>
                    `${r.isCorrect ? '✅' : '❌'} ${r.coin} ${r.action}: ${r.profitLoss}%`
                ).join('\n');

                await telegramService.sendMessage(`
📅 <b>24H Predictions Check Complete</b>

✅ Checked: ${checkedCount} predictions
🎯 Correct: ${correctCount}
📊 Win Rate: ${winRate}%

<b>Results:</b>
${summary}

⏱️ Duration: ${duration}s
        `.trim());
            } catch (err) {
                console.error('Failed to send Telegram notification:', err);
            }
        }

        return NextResponse.json({
            success: true,
            timeframe: '24h',
            checked: checkedCount,
            correct: correctCount,
            winRate: parseFloat(winRate),
            results,
            duration: parseFloat(duration)
        });

    } catch (error: any) {
        console.error('❌ [CRON] Error:', error);

        try {
            await telegramService.sendMessage(`
⚠️ <b>Cron Job Error (24h)</b>

Error: ${error.message}

Time: ${new Date().toLocaleString()}
      `.trim());
        } catch (err) {
            console.error('Failed to send error alert:', err);
        }

        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
