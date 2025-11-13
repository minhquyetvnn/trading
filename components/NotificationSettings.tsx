'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Settings } from 'lucide-react';
import { notificationService } from '@/lib/notification-service';

export const NotificationSettings = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState({
    newSignals: true,
    tpHits: true,
    slHits: true,
    priceAlerts: true,
    autoGenerate: true
  });

  useEffect(() => {
    if (notificationService.isSupported()) {
      setPermission(Notification.permission);
    }

    // Load settings from localStorage
    const saved = localStorage.getItem('notification-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const handleToggle = (key: keyof typeof settings) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key]
    };
    setSettings(newSettings);
    localStorage.setItem('notification-settings', JSON.stringify(newSettings));
  };

  const handleEnableNotifications = async () => {
    const granted = await notificationService.requestPermission();
    setPermission(Notification.permission);
    
    if (granted) {
      await notificationService.send({
        title: '✅ Notifications Enabled',
        body: 'You will now receive trading alerts',
        tag: 'settings-enabled'
      });
    }
  };

  const handleTestNotification = async () => {
    await notificationService.send({
      title: '🔔 Test Notification',
      body: 'This is how your notifications will look!',
      tag: 'test'
    });
  };

  if (!notificationService.isSupported()) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <BellOff className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-yellow-900">Notifications Not Supported</p>
            <p className="text-sm text-yellow-800 mt-1">
              Your browser doesn't support notifications. Try using Chrome, Firefox, or Edge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#ff6726] rounded-lg flex items-center justify-center">
          <Bell className="text-white" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Notification Settings</h3>
          <p className="text-sm text-gray-600">Manage your alert preferences</p>
        </div>
      </div>

      {/* Permission Status */}
      <div className={`p-4 rounded-lg mb-6 ${
        permission === 'granted' ? 'bg-green-50 border-2 border-green-200' :
        permission === 'denied' ? 'bg-red-50 border-2 border-red-200' :
        'bg-yellow-50 border-2 border-yellow-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {permission === 'granted' ? (
              <>
                <Bell className="text-green-600" size={20} />
                <div>
                  <p className="font-semibold text-green-900">Notifications Enabled</p>
                  <p className="text-sm text-green-700">You will receive alerts</p>
                </div>
              </>
            ) : permission === 'denied' ? (
              <>
                <BellOff className="text-red-600" size={20} />
                <div>
                  <p className="font-semibold text-red-900">Notifications Blocked</p>
                  <p className="text-sm text-red-700">Enable in browser settings</p>
                </div>
              </>
            ) : (
              <>
                <Settings className="text-yellow-600" size={20} />
                <div>
                  <p className="font-semibold text-yellow-900">Notifications Disabled</p>
                  <p className="text-sm text-yellow-700">Click to enable</p>
                </div>
              </>
            )}
          </div>

          {permission === 'default' && (
            <button
              onClick={handleEnableNotifications}
              className="px-4 py-2 bg-[#ff6726] text-white rounded-lg font-semibold hover:bg-[#e55a1f] transition-colors"
            >
              Enable
            </button>
          )}

          {permission === 'granted' && (
            <button
              onClick={handleTestNotification}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors text-sm"
            >
              Test
            </button>
          )}
        </div>
      </div>

      {/* Settings */}
      {permission === 'granted' && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700 mb-3">Notify me when:</p>

          <SettingToggle
            label="New Quality Signals"
            description="Get notified when EXCELLENT or GOOD signals are generated"
            enabled={settings.newSignals}
            onToggle={() => handleToggle('newSignals')}
          />

          <SettingToggle
            label="Take Profit Hit"
            description="Alert when TP1, TP2, or TP3 levels are reached"
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
            label="Price Alerts"
            description="Important price movements on active signals"
            enabled={settings.priceAlerts}
            onToggle={() => handleToggle('priceAlerts')}
          />

          <SettingToggle
            label="Auto-Generate Alerts"
            description="Notify when new signals are auto-generated"
            enabled={settings.autoGenerate}
            onToggle={() => handleToggle('autoGenerate')}
          />
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
