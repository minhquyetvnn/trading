import { createClient } from '@supabase/supabase-js';
import { TradingSignal } from './signal-generator';
import { telegramService } from './telegram-service';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

export async function saveSignal(signal: TradingSignal): Promise<string> {
    try {
        console.log('💾 Saving trading signal...');

        // Calculate expiration (15m for 15m timeframe, 1h for 1h, etc.)
        const expiresAt = new Date();
        if (signal.timeframe === '15m') expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        else if (signal.timeframe === '1h') expiresAt.setHours(expiresAt.getHours() + 1);
        else if (signal.timeframe === '4h') expiresAt.setHours(expiresAt.getHours() + 4);
        else expiresAt.setHours(expiresAt.getHours() + 24);

        const { data, error } = await supabase
            .from('trading_signals')
            .insert({
                coin: signal.coin,
                action: signal.action,
                signal_type: signal.signalType,
                confidence: signal.confidence,
                timeframe: signal.timeframe,

                entry_price: signal.entryPrice,
                current_price: signal.entryPrice,

                stop_loss: signal.stopLoss,
                take_profit_1: signal.takeProfit1,
                take_profit_2: signal.takeProfit2,
                take_profit_3: signal.takeProfit3,

                capital_allocated: signal.capitalAllocated,
                position_size: signal.positionSize,
                risk_reward_ratio: signal.riskRewardRatio,
                risk_percentage: signal.riskPercentage,

                rsi: signal.rsi,
                macd: signal.macd,
                volume_24h: signal.volume24h,

                reasoning: signal.reasoning,
                key_factors: signal.keyFactors,

                status: 'ACTIVE',
                signal_expires_at: expiresAt.toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ Signal saved: ${data.id}`);
        return data.id;

    } catch (error) {
        console.error('❌ Save signal error:', error);
        throw error;
    }
}

export async function updateSignalPrice(
    signalId: string,
    currentPrice: number
): Promise<void> {
    try {
        // Get signal
        const { data: signal, error: fetchError } = await supabase
            .from('trading_signals')
            .select('*')
            .eq('id', signalId)
            .single();

        if (fetchError || !signal) return;

        // Calculate P/L
        const entryPrice = signal.entry_price;
        const positionSize = signal.position_size;

        let pnlUSD = 0;
        let pnlPercentage = 0;
        let newStatus = signal.status;

        if (signal.action === 'BUY') {
            pnlUSD = (currentPrice - entryPrice) * positionSize;
            pnlPercentage = ((currentPrice - entryPrice) / entryPrice) * 100;

            // Check TP hits
            if (currentPrice >= signal.take_profit_3 && !signal.tp3_hit) {
                newStatus = 'TP3_HIT';
                await updateTPHit(signalId, 3);
                // Send Telegram notification
                await telegramService.notifyTPHit(signal, 3);
            } else if (currentPrice >= signal.take_profit_2 && !signal.tp2_hit) {
                newStatus = 'TP2_HIT';
                await updateTPHit(signalId, 2);
                // Send Telegram notification
                await telegramService.notifyTPHit(signal, 2);
            } else if (currentPrice >= signal.take_profit_1 && !signal.tp1_hit) {
                newStatus = 'TP1_HIT';
                await updateTPHit(signalId, 1);
                // Send Telegram notification
                await telegramService.notifyTPHit(signal, 1);
            }

            // Check SL hit
            if (currentPrice <= signal.stop_loss) {
                newStatus = 'SL_HIT';
                // Send Telegram notification
                await telegramService.notifySLHit(signal);
            }

        } else { // SELL
            pnlUSD = (entryPrice - currentPrice) * positionSize;
            pnlPercentage = ((entryPrice - currentPrice) / entryPrice) * 100;

            // Check TP hits
            if (currentPrice <= signal.take_profit_3 && !signal.tp3_hit) {
                newStatus = 'TP3_HIT';
                await updateTPHit(signalId, 3);
            } else if (currentPrice <= signal.take_profit_2 && !signal.tp2_hit) {
                newStatus = 'TP2_HIT';
                await updateTPHit(signalId, 2);
            } else if (currentPrice <= signal.take_profit_1 && !signal.tp1_hit) {
                newStatus = 'TP1_HIT';
                await updateTPHit(signalId, 1);
            }

            // Check SL hit
            if (currentPrice >= signal.stop_loss) {
                newStatus = 'SL_HIT';
            }
        }

        // Update signal
        await supabase
            .from('trading_signals')
            .update({
                current_price: currentPrice,
                pnl_usd: pnlUSD,
                pnl_percentage: pnlPercentage,
                status: newStatus,
                closed_at: (newStatus === 'TP3_HIT' || newStatus === 'SL_HIT') ? new Date().toISOString() : null
            })
            .eq('id', signalId);

    } catch (error) {
        console.error('❌ Update signal price error:', error);
    }
}

async function updateTPHit(signalId: string, tpLevel: number): Promise<void> {
    const updateData: any = {};
    updateData[`tp${tpLevel}_hit`] = true;
    updateData[`tp${tpLevel}_hit_at`] = new Date().toISOString();

    await supabase
        .from('trading_signals')
        .update(updateData)
        .eq('id', signalId);
}

export async function getActiveSignals(coin?: string): Promise<any[]> {
    try {
        let query = supabase
            .from('trading_signals')
            .select('*')
            .in('status', ['ACTIVE', 'TP1_HIT', 'TP2_HIT'])
            .order('created_at', { ascending: false });

        if (coin) {
            query = query.eq('coin', coin);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data || [];

    } catch (error) {
        console.error('❌ Get active signals error:', error);
        return [];
    }
}

export async function getCompletedSignals(limit: number = 50): Promise<any[]> {
    try {
        const { data, error } = await supabase
            .from('trading_signals')
            .select('*')
            .in('status', ['TP3_HIT', 'SL_HIT', 'EXPIRED', 'CLOSED'])
            .order('closed_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return data || [];

    } catch (error) {
        console.error('❌ Get completed signals error:', error);
        return [];
    }
}

export async function getPortfolioStats(): Promise<any> {
    try {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('portfolio_stats')
            .select('*')
            .eq('date', today)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (!data) {
            // Create initial stats
            const { data: newData, error: insertError } = await supabase
                .from('portfolio_stats')
                .insert({
                    date: today,
                    starting_capital: 1000,
                    current_capital: 1000
                })
                .select()
                .single();

            if (insertError) throw insertError;
            return newData;
        }

        return data;

    } catch (error) {
        console.error('❌ Get portfolio stats error:', error);
        return null;
    }
}
