'use client';

import { useState, useEffect } from 'react';
import { Send, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';

export const TelegramSettings = () => {
  const [connected, setConnected] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState({
    enabled: true,
    newSignals: true,
    tpHits: true,
    slHits: true,
    dailySummary: true
  });

  useEffect(() => {
    // Check if Telegram is configured
    checkConnection();

    // Load settings
    const saved = localStorage.getItem('telegram-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const checkConnection = async () => {
    try {
      const response = await axios.get('/api/telegram/status');
      setConnected(response.data.connected);
    } catch (error) {
      setConnected(false);
    }
  };

  const handleTestMessage = async () => {
    setTesting(true);
    try {
      const response = await axios.post('/api/telegram/test');
      if (response.data.success) {
        alert('✅ Test message sent to Telegram! Check your bot.');
      } else {
        alert('❌ Failed to send test message');
      }
    } catch (error) {
      alert('❌ Telegram not configured. Check your .env.local file.');
    } finally {
      setTesting(false);
    }
  };

  const handleToggle = (key: keyof typeof settings) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key]
    };
    setSettings(newSettings);
    localStorage.setItem('telegram-settings', JSON.stringify(newSettings));
  };

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
          <Send className="text-white" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Telegram Notifications</h3>
          <p className="text-sm text-gray-600">Get alerts via Telegram messenger</p>
        </div>
      </div>

      {/* Connection Status */}
      <div className={`p-4 rounded-lg mb-6 ${
        connected 
          ? 'bg-green-50 border-2 border-green-200' 
          : 'bg-red-50 border-2 border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {connected ? (
              <>
                <CheckCircle className="text-green-600" size={20} />
                <div>
                  <p className="font-semibold text-green-900">Connected</p>
                  <p className="text-sm text-green-700">Telegram bot is active</p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="text-red-600" size={20} />
                <div>
                  <p className="font-semibold text-red-900">Not Connected</p>
                  <p className="text-sm text-red-700">Configure in .env.local</p>
                </div>
              </>
            )}
          </div>

          {connected && (
            <button
              onClick={handleTestMessage}
              disabled={testing}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm"
            >
              {testing ? 'Sending...' : 'Send Test'}
            </button>
          )}
        </div>
      </div>

      {/* Settings */}
      {connected && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700 mb-3">Send Telegram alerts for:</p>

          <SettingToggle
            label="New Signals"
            description="Get notified when quality signals are generated"
            enabled={settings.newSignals}
            onToggle={() => handleToggle('newSignals')}
          />

          <SettingToggle
            label="Take Profit Hit"
            description="Alert when TP levels are reached"
            enabled={settings.tpHits}
            onToggle={() => handleToggle('tpHits')}
          />

          <SettingToggle
            label="Stop Loss Hit"
            description="Alert when stop loss is triggered"
            enabled={settings.slHits}
            onToggle={() => handleToggle('slHits')}
          />

          <SettingToggle
            label="Daily Summary"
            description="Receive daily performance summary at 8 PM"
            enabled={settings.dailySummary}
            onToggle={() => handleToggle('dailySummary')}
          />
        </div>
      )}

      {/* Setup Instructions */}
      {!connected && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Setup Instructions:</h4>
          <ol className="text-sm text-gray-700 space-y-1">
            <li>1. Open Telegram and search for @BotFather</li>
            <li>2. Send /newbot and follow instructions</li>
            <li>3. Copy the bot token</li>
            <li>4. Add to .env.local: TELEGRAM_BOT_TOKEN=your_token</li>
            <li>5. Send a message to your bot</li>
            <li>6. Get your chat ID and add: TELEGRAM_CHAT_ID=your_id</li>
            <li>7. Restart the server</li>
          </ol>
        </div>
      )}
    </div>
  );
};

// Setting Toggle Component
const SettingToggle = ({ label, description, enabled, onToggle }: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
    <div className="flex-1">
      <p className="font-medium text-gray-900">{label}</p>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
    <button
      onClick={onToggle}
      className={`relative w-14 h-8 rounded-full transition-colors ${
        enabled ? 'bg-green-500' : 'bg-gray-300'
      }`}
    >
      <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
        enabled ? 'transform translate-x-6' : ''
      }`} />
    </button>
  </div>
);