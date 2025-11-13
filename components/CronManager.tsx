'use client';

import { useState, useEffect } from 'react';
import { Clock, Play, Square, Activity } from 'lucide-react';
import axios from 'axios';

export const CronManager = () => {
  const [jobs, setJobs] = useState([
    { name: 'Update Prices', path: '/api/signals/update-prices', interval: 5, running: false },
    { name: 'Auto-Generate Signals', path: '/api/signals/auto-generate', interval: 15, running: false },
    { name: 'Update Results', path: '/api/update-results', interval: 60, running: false }
  ]);

  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  const runJob = async (job: any) => {
    addLog(`🚀 Running: ${job.name}`);
    try {
      const response = await axios.get(job.path);
      if (response.data.success) {
        addLog(`✅ ${job.name} completed successfully`);
      } else {
        addLog(`❌ ${job.name} failed: ${response.data.error}`);
      }
    } catch (error: any) {
      addLog(`❌ ${job.name} error: ${error.message}`);
    }
  };

  const toggleJob = (index: number) => {
    const newJobs = [...jobs];
    const job = newJobs[index];
    job.running = !job.running;
    setJobs(newJobs);

    if (job.running) {
      addLog(`▶️ Started: ${job.name} (every ${job.interval} min)`);
      // Run immediately
      runJob(job);
      // Set interval
      const intervalId = setInterval(() => runJob(job), job.interval * 60 * 1000);
      (job as any).intervalId = intervalId;
    } else {
      addLog(`⏸️ Stopped: ${job.name}`);
      if ((job as any).intervalId) {
        clearInterval((job as any).intervalId);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      jobs.forEach(job => {
        if ((job as any).intervalId) {
          clearInterval((job as any).intervalId);
        }
      });
    };
  }, []);

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <Clock className="text-white" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Cron Job Manager</h3>
          <p className="text-sm text-gray-600">Development Mode - Manual Control</p>
        </div>
      </div>

      {/* Jobs */}
      <div className="space-y-3 mb-6">
        {jobs.map((job, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Activity size={16} className={job.running ? 'text-green-600' : 'text-gray-400'} />
                <p className="font-semibold text-gray-900">{job.name}</p>
              </div>
              <p className="text-sm text-gray-600">
                {job.path} • Every {job.interval} minutes
              </p>
            </div>

            <button
              onClick={() => toggleJob(index)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                job.running
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {job.running ? (
                <>
                  <Square size={16} />
                  Stop
                </>
              ) : (
                <>
                  <Play size={16} />
                  Start
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Logs */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Activity Log</h4>
        <div className="bg-gray-900 rounded-lg p-4 h-48 overflow-y-auto font-mono text-xs">
          {logs.length === 0 ? (
            <p className="text-gray-500">No activity yet. Start a job to see logs.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="text-green-400 mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Warning */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
        <p className="text-xs text-yellow-900">
          <strong>⚠️ Development Only:</strong> In production, Vercel Cron will handle these automatically. This manager is for testing locally.
        </p>
      </div>
    </div>
  );
};
