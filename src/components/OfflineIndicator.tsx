import React from 'react';
import { useOfflineStatus } from '../hooks/usePWA';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOffline = useOfflineStatus();

  if (!isOffline) return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-lg p-3">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <WifiOff className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-red-700 dark:text-red-300">
              You're currently offline. Some features may not work properly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
