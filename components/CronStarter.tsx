'use client';

import { useEffect } from 'react';

export function CronStarter() {
  useEffect(() => {
    // Only start in development
    if (process.env.NODE_ENV === 'development') {
      fetch('/api/cron/start')
        .then(res => res.json())
        .then(data => console.log('✅ Cron jobs:', data.message))
        .catch(err => console.error('❌ Failed to start cron jobs:', err));
    }
  }, []);

  return null; // This component doesn't render anything
}
