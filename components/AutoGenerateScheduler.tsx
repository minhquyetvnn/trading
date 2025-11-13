'use client';

import { useState, useEffect } from 'react';
import { Clock, Zap, Play, Pause, Settings as SettingsIcon, Server } from 'lucide-react';

interface AutoGenerateSchedulerProps {
    onAutoGenerate: () => Promise<void>;
}

export const AutoGenerateScheduler = ({ onAutoGenerate }: AutoGenerateSchedulerProps) => {
    const [enabled, setEnabled] = useState(false);
    const [intervalMinutes, setIntervalMinutes] = useState(15); // ✅ Đổi tên từ interval thành intervalMinutes
    const [nextRun, setNextRun] = useState<Date | null>(null);
    const [lastRun, setLastRun] = useState<Date | null>(null);
    const [countdown, setCountdown] = useState<string>('');
    const [isRunning, setIsRunning] = useState(false);
    const [backendStatus, setBackendStatus] = useState<'active' | 'inactive' | 'unknown'>('unknown');

    // Fetch backend scheduler status
    const fetchBackendStatus = async () => {
        try {
            const response = await fetch('/api/scheduler/status');
            const data = await response.json();

            setBackendStatus(data.enabled ? 'active' : 'inactive');
            setEnabled(data.enabled);
            setIntervalMinutes(data.interval);
            setIsRunning(data.isRunning);

            if (data.nextRun) {
                setNextRun(new Date(data.nextRun));
            }
            if (data.lastRun) {
                setLastRun(new Date(data.lastRun));
            }
        } catch (error) {
            console.error('Failed to fetch backend status:', error);
            setBackendStatus('unknown');
        }
    };

    // Poll backend status every 5 seconds
    useEffect(() => {
        fetchBackendStatus();
        const pollInterval = setInterval(fetchBackendStatus, 5000);
        return () => clearInterval(pollInterval);
    }, []);

    // Update countdown
    useEffect(() => {
        if (!enabled || !nextRun) {
            setCountdown('');
            return;
        }

        const countdownTimer = setInterval(() => {
            const now = new Date();
            const diff = nextRun.getTime() - now.getTime();

            if (diff <= 0) {
                setCountdown('Running...');
                fetchBackendStatus(); // Refresh status
            } else {
                const minutes = Math.floor(diff / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setCountdown(`${minutes}m ${seconds}s`);
            }
        }, 1000);

        return () => clearInterval(countdownTimer);
    }, [enabled, nextRun]);

    // Toggle backend scheduler
    const handleToggleEnabled = async () => {
        try {
            if (enabled) {
                // Stop backend scheduler
                await fetch('/api/scheduler/stop', { method: 'POST' });
                setEnabled(false);
                setBackendStatus('inactive');
                console.log('⏹️ Backend scheduler stopped');
            } else {
                // Start backend scheduler
                await fetch('/api/scheduler/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ interval: intervalMinutes })
                });
                setEnabled(true);
                setBackendStatus('active');
                console.log(`✅ Backend scheduler started with ${intervalMinutes}m interval`);
            }

            // Refresh status
            await fetchBackendStatus();
        } catch (error) {
            console.error('Failed to toggle scheduler:', error);
            alert('Failed to toggle scheduler. Please try again.');
        }
    };

    // Change interval
    const handleChangeInterval = async (newInterval: number) => {
        setIntervalMinutes(newInterval);

        if (enabled) {
            try {
                // Restart with new interval
                await fetch('/api/scheduler/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ interval: newInterval })
                });

                console.log(`⏰ Interval changed to ${newInterval}m`);
                await fetchBackendStatus();
            } catch (error) {
                console.error('Failed to change interval:', error);
            }
        }
    };

    // Manual trigger
    const handleManualTrigger = async () => {
        if (isRunning) return;

        try {
            setIsRunning(true);
            console.log('🔧 Manual trigger initiated...');

            // Call backend to run now
            await fetch('/api/scheduler/run-now', { method: 'POST' });

            console.log('✅ Manual trigger completed');
            await fetchBackendStatus();
        } catch (error) {
            console.error('❌ Manual trigger error:', error);
            alert('Failed to trigger scheduler. Please try again.');
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200 p-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                        <Server className="text-white" size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Backend Auto-Scheduler</h3>
                        <p className="text-sm text-gray-600">Runs even when browser is closed</p>
                    </div>
                </div>

                {/* Backend Status Indicator */}
                <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        backendStatus === 'active' ? 'bg-green-100 text-green-700' :
                        backendStatus === 'inactive' ? 'bg-gray-100 text-gray-700' :
                        'bg-yellow-100 text-yellow-700'
                    }`}>
                        {backendStatus === 'active' ? '🟢 Backend Active' :
                         backendStatus === 'inactive' ? '⚪ Backend Inactive' :
                         '🟡 Checking...'}
                    </div>

                    {/* Enable/Disable Toggle */}
                    <button
                        onClick={handleToggleEnabled}
                        disabled={backendStatus === 'unknown'}
                        className={`relative w-16 h-9 rounded-full transition-colors disabled:opacity-50 ${
                            enabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                    >
                        <div className={`absolute top-1 left-1 w-7 h-7 bg-white rounded-full transition-transform flex items-center justify-center ${
                            enabled ? 'transform translate-x-7' : ''
                        }`}>
                            {enabled ? <Play size={14} className="text-green-600" /> : <Pause size={14} className="text-gray-600" />}
                        </div>
                    </button>
                </div>
            </div>

            {/* Status */}
            <div className={`p-4 rounded-lg mb-6 ${
                enabled
                    ? 'bg-green-100 border-2 border-green-300'
                    : 'bg-gray-100 border-2 border-gray-300'
            }`}>
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className={`font-semibold ${enabled ? 'text-green-900' : 'text-gray-700'}`}>
                            {enabled ? '🟢 Backend Scheduler Active' : '⚪ Backend Scheduler Paused'}
                        </p>
                        {enabled && nextRun && (
                            <p className="text-sm text-green-700 mt-1">
                                Next run in: <strong>{countdown}</strong>
                            </p>
                        )}
                        {enabled && lastRun && (
                            <p className="text-xs text-green-600 mt-1">
                                Last run: {lastRun.toLocaleTimeString()}
                            </p>
                        )}
                        {!enabled && (
                            <p className="text-sm text-gray-600 mt-1">
                                Enable to start automatic signal generation on server
                            </p>
                        )}
                    </div>

                    {isRunning && (
                        <div className="flex items-center gap-2 text-purple-600">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-600 border-t-transparent"></div>
                            <span className="text-sm font-semibold">Running...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Interval Settings */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <SettingsIcon size={16} className="inline mr-2" />
                    Generation Interval
                </label>
                <div className="grid grid-cols-4 gap-3">
                    {[5, 10, 15, 30].map(mins => (
                        <button
                            key={mins}
                            onClick={() => handleChangeInterval(mins)}
                            disabled={isRunning || backendStatus === 'unknown'}
                            className={`py-2.5 px-4 rounded-lg font-semibold transition-all disabled:opacity-50 ${
                                intervalMinutes === mins
                                    ? 'bg-purple-600 text-white shadow-lg'
                                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300'
                            }`}
                        >
                            {mins}m
                        </button>
                    ))}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                    ⏱️ Backend will generate signals every {intervalMinutes} minutes
                </p>
            </div>

            {/* Manual Trigger */}
            <button
                onClick={handleManualTrigger}
                disabled={isRunning || backendStatus === 'unknown'}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isRunning ? (
                    <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Generating...</span>
                    </>
                ) : (
                    <>
                        <Zap size={20} />
                        <span>Run Now (Backend Trigger)</span>
                    </>
                )}
            </button>

            {/* Info */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-900">
                    <strong>💡 Backend Scheduler:</strong> Runs on server, works even when browser is closed. Automatically sends Telegram notifications for new signals. Interval: {intervalMinutes} minutes.
                </p>
            </div>

            {/* Telegram notification info */}
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-900">
                    <strong>📱 Telegram Notifications:</strong> You will receive automatic notifications on Telegram when new signals are generated, even if your browser is closed!
                </p>
            </div>
        </div>
    );
};
