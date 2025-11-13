'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { notificationService } from '@/lib/notification-service';

export const NotificationPermission = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if browser supports notifications
    if (!notificationService.isSupported()) {
      return;
    }

    // Get current permission
    setPermission(Notification.permission);

    // Show banner if permission is default and not dismissed
    const isDismissed = localStorage.getItem('notification-banner-dismissed');
    if (Notification.permission === 'default' && !isDismissed) {
      setShowBanner(true);
    }
  }, []);

  const handleRequestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setPermission(Notification.permission);
    
    if (granted) {
      setShowBanner(false);
      
      // Send test notification
      await notificationService.send({
        title: '🎉 Notifications Enabled!',
        body: 'You will now receive alerts for new signals and TP/SL hits',
        tag: 'permission-granted'
      });
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('notification-banner-dismissed', 'true');
  };

  // Don't render if not supported
  if (!notificationService.isSupported()) {
    return null;
  }

  // Don't render if already granted or denied
  if (permission === 'granted' || permission === 'denied') {
    return null;
  }

  // Don't render if dismissed
  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 max-w-md z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-[#ff6726] to-[#ff8f5e] rounded-xl shadow-2xl p-5 text-white">
        
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
            <Bell size={24} />
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2">Enable Notifications</h3>
            <p className="text-sm text-white/90 mb-4">
              Get instant alerts when:
            </p>
            <ul className="text-sm text-white/90 space-y-1 mb-4">
              <li>• 💎 New quality signals are generated</li>
              <li>• 🎯 Take profit levels are hit</li>
              <li>• ⚠️ Stop loss is triggered</li>
              <li>• 📊 Important price movements</li>
            </ul>

            <div className="flex gap-3">
              <button
                onClick={handleRequestPermission}
                className="flex-1 py-2.5 bg-white text-[#ff6726] rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Enable Notifications
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2.5 bg-white/20 backdrop-blur-sm rounded-lg font-semibold hover:bg-white/30 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
