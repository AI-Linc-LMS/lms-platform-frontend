import React from 'react';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { PWAUpdateNotification } from './PWAUpdateNotification';
import { OfflineIndicator } from './OfflineIndicator';

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {children}
      <PWAInstallPrompt />
      <PWAUpdateNotification />
      <OfflineIndicator />
    </>
  );
};
