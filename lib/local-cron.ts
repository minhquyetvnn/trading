// Local cron simulator for development
export class LocalCron {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  // Start a cron job
  start(name: string, callback: () => Promise<void>, intervalMinutes: number) {
    // Clear existing interval if any
    this.stop(name);

    console.log(`🕐 [LocalCron] Starting "${name}" (every ${intervalMinutes} minutes)`);

    // Run immediately
    callback();

    // Set interval
    const interval = setInterval(async () => {
      console.log(`\n⏰ [LocalCron] Triggering "${name}"...`);
      await callback();
    }, intervalMinutes * 60 * 1000);

    this.intervals.set(name, interval);
  }

  // Stop a cron job
  stop(name: string) {
    const interval = this.intervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(name);
      console.log(`🛑 [LocalCron] Stopped "${name}"`);
    }
  }

  // Stop all cron jobs
  stopAll() {
    this.intervals.forEach((interval, name) => {
      clearInterval(interval);
      console.log(`🛑 [LocalCron] Stopped "${name}"`);
    });
    this.intervals.clear();
  }

  // Get status
  getStatus(): { name: string; active: boolean }[] {
    return Array.from(this.intervals.keys()).map(name => ({
      name,
      active: true
    }));
  }
}

// Export singleton
export const localCron = new LocalCron();
