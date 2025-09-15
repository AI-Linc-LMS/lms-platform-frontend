import { useState, useEffect, useCallback } from 'react';
import { isIOSDevice, isPWAInstalled } from '../utils/deviceIdentifier';

export interface UseIOSPWAInstallReturn {
  /** Whether the iOS PWA install prompt should be shown */
  shouldShowPrompt: boolean;
  /** Whether the device is iOS */
  isIOS: boolean;
  /** Whether the PWA is already installed */
  isInstalled: boolean;
  /** Function to manually show the prompt */
  showPrompt: () => void;
  /** Function to dismiss the prompt */
  dismissPrompt: () => void;
  /** Function to permanently dismiss the prompt */
  dismissPermanently: () => void;
  /** Whether the prompt is currently visible */
  isVisible: boolean;
}

export const useIOSPWAInstall = (): UseIOSPWAInstallReturn => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const isIOS = isIOSDevice();
  const isInstalled = isPWAInstalled();

  // Check if user has permanently dismissed
  const isPermanentlyDismissed = useCallback(() => {
    return localStorage.getItem('ios-pwa-install-dismissed') === 'true';
  }, []);

  // Determine if prompt should be shown - show on every page refresh for iOS users
  const shouldShowPrompt = isIOS && 
                          !isInstalled && 
                          !isPermanentlyDismissed() && 
                          !isDismissed;

  const showPrompt = useCallback(() => {
    if (isIOS && !isInstalled && !isPermanentlyDismissed()) {
      setIsVisible(true);
      setIsDismissed(false);
    }
  }, [isIOS, isInstalled, isPermanentlyDismissed]);

  const dismissPrompt = useCallback(() => {
    setIsVisible(false);
    setIsDismissed(true);
    // No session storage - will show again on next refresh
  }, []);

  const dismissPermanently = useCallback(() => {
    setIsVisible(false);
    setIsDismissed(true);
    // Mark as permanently dismissed
    localStorage.setItem('ios-pwa-install-dismissed', 'true');
  }, []);

  // Auto-show prompt on every page refresh for iOS users
  useEffect(() => {
    if (shouldShowPrompt) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000); // Show after 1 second

      return () => clearTimeout(timer);
    }
  }, [shouldShowPrompt]);

  // Hide prompt if conditions change
  useEffect(() => {
    if (!shouldShowPrompt && isVisible) {
      setIsVisible(false);
    }
  }, [shouldShowPrompt, isVisible]);

  return {
    shouldShowPrompt,
    isIOS,
    isInstalled,
    showPrompt,
    dismissPrompt,
    dismissPermanently,
    isVisible
  };
};
