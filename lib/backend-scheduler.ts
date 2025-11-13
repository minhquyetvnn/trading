import * as cron from 'node-cron';

interface SchedulerConfig {
    interval: number;
    enabled: boolean;
    lastRun?: Date;
    nextRun?: Date;
}

class BackendScheduler {
    private task: cron.ScheduledTask | null = null;
    private config: SchedulerConfig = {
        interval: 15,
        enabled: false
    };
    private isRunning = false;

    constructor() {
        this.loadConfig();
    }

    private loadConfig() {
        console.log('📋 Backend Scheduler initialized');
    }

    start(intervalMinutes: number = 15) {
        if (this.task) {
            console.log('⚠️ Scheduler already running, stopping first...');
            this.stop();
        }

        this.config.interval = intervalMinutes;
        this.config.enabled = true;

        const cronExpression = `*/${intervalMinutes} * * * *`;

        console.log(`🚀 Starting backend scheduler with ${intervalMinutes} minute interval`);
        console.log(`📅 Cron expression: ${cronExpression}`);

        this.task = cron.schedule(cronExpression, async () => {
            await this.executeTask();
        }, {
            scheduled: true,
            timezone: "Asia/Ho_Chi_Minh"
        });

        this.updateNextRun();
        console.log(`✅ Backend scheduler started. Next run at: ${this.config.nextRun?.toLocaleTimeString()}`);
    }

    stop() {
        if (this.task) {
            this.task.stop();
            this.task = null;
            this.config.enabled = false;
            this.config.nextRun = undefined;
            console.log('⏹️ Backend scheduler stopped');
        }
    }

    private async executeTask() {
        if (this.isRunning) {
            console.log('⚠️ Previous task still running, skipping...');
            return;
        }

        this.isRunning = true;
        this.config.lastRun = new Date();

        console.log('🔄 Executing scheduled task...');

        try {
            // Import signal generator
            const { autoGenerateSignals } = await import('./auto-signal-generator');

            // List of coins to analyze
            const coins = ['BTC', 'ETH', 'BNB', 'SOL'];
            const capitalPerSignal = 1000;

            // Generate signals
            const signals = await autoGenerateSignals(coins, capitalPerSignal);

            // Format result
            const result = {
                totalSignals: signals.length,
                excellentCount: signals.filter(s => s.quality?.rating === 'EXCELLENT').length,
                goodCount: signals.filter(s => s.quality?.rating === 'GOOD').length,
                signals: signals
            };

            console.log('✅ Scheduled task completed successfully');
            console.log(`📊 Generated ${result.totalSignals} signals (💎${result.excellentCount} excellent, ✨${result.goodCount} good)`);

            // Send Telegram notification - ALWAYS send for testing
            console.log('🔍 Checking if should send notification...');
            console.log('📊 Total signals:', result.totalSignals);

            await this.sendTelegramNotification(result); // ✅ Luôn gửi để test

            if (result.totalSignals > 0) {
                console.log('✅ Signals generated, notification sent');
            } else {
                console.log('⚠️ No signals generated, but notification still sent for testing');
            }

            this.updateNextRun();
        } catch (error) {
            console.error('❌ Scheduled task error:', error);
            await this.sendErrorNotification(error);
        } finally {
            this.isRunning = false;
        }
    }

    private async sendTelegramNotification(result: any) {
        try {
            const { telegramService } = await import('./telegram-service');

            const message = `
🤖 <b>Auto-Generate Completed</b>

✅ Total Signals: ${result.totalSignals}
💎 Excellent: ${result.excellentCount || 0}
✨ Good: ${result.goodCount || 0}

⏰ Time: ${new Date().toLocaleTimeString()}
📊 Interval: ${this.config.interval} minutes

View signals at your dashboard!
            `.trim();

            await telegramService.sendMessage(message);
            console.log('📱 Telegram notification sent');
        } catch (error) {
            console.error('Failed to send Telegram notification:', error);
        }
    }

    private async sendErrorNotification(error: any) {
        try {
            const { telegramService } = await import('./telegram-service');

            const message = `
⚠️ <b>Auto-Generate Error</b>

❌ Error occurred during scheduled task

Error: ${error.message || 'Unknown error'}

⏰ Time: ${new Date().toLocaleTimeString()}

Please check the logs for more details.
            `.trim();

            await telegramService.sendMessage(message);
        } catch (err) {
            console.error('Failed to send error notification:', err);
        }
    }

    private updateNextRun() {
        const now = new Date();
        this.config.nextRun = new Date(now.getTime() + this.config.interval * 60000);
    }

    getStatus() {
        return {
            enabled: this.config.enabled,
            interval: this.config.interval,
            lastRun: this.config.lastRun?.toISOString() || null,
            nextRun: this.config.nextRun?.toISOString() || null,
            isRunning: this.isRunning
        };
    }

    async runNow() {
        console.log('🔧 Manual trigger from backend...');
        await this.executeTask();
    }
}

export const backendScheduler = new BackendScheduler();

export const startBackendScheduler = (intervalMinutes: number) => {
    backendScheduler.start(intervalMinutes);
};

export const stopBackendScheduler = () => {
    backendScheduler.stop();
};

export const getBackendSchedulerStatus = () => {
    return backendScheduler.getStatus();
};

export const runBackendSchedulerNow = async () => {
    await backendScheduler.runNow();
};
