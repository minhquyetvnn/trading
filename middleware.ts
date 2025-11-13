import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Flag to track if cron jobs have been started
let cronInitialized = false;

export async function middleware(request: NextRequest) {
  // Start cron jobs on first request
  if (!cronInitialized && process.env.NODE_ENV === 'development') {
    cronInitialized = true;
    
    // Trigger cron start in background
    fetch('http://localhost:3000/api/cron/start')
      .then(() => console.log('✅ Cron jobs auto-started'))
      .catch(err => console.error('Failed to auto-start cron jobs:', err));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
