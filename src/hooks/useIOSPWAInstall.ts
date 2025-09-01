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

const DISMISS_KEY = 'ios-pwa-install-dismissed';
const TEMPORARY_DISMISS_KEY = 'ios-pwa-install-temp-dismissed';
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const useIOSPWAInstall = (): UseIOSPWAInstallReturn => {
  const [isVisible, setIsVisible] = useState(false);
  const [isManuallyDismissed, setIsManuallyDismissed] = useState(false);

  const isIOS = isIOSDevice();
  const isInstalled = isPWAInstalled();

  // Check if user has permanently dismissed
  const isPermanentlyDismissed = useCallback(() => {
    return localStorage.getItem(DISMISS_KEY) === 'true';
  }, []);

  // Check if user has temporarily dismissed (within 24 hours)
  const isTemporarilyDismissed = useCallback(() => {
    const dismissedAt = localStorage.getItem(TEMPORARY_DISMISS_KEY);
    if (!dismissedAt) return false;
    
    const dismissTime = parseInt(dismissedAt, 10);
    const now = Date.now();
    
    // If more than 24 hours have passed, clear the temporary dismiss
    if (now - dismissTime > DISMISS_DURATION) {
      localStorage.removeItem(TEMPORARY_DISMISS_KEY);
      return false;
    }
    
    return true;
  }, []);

  // Determine if prompt should be shown
  const shouldShowPrompt = isIOS && 
                          !isInstalled && 
                          !isPermanentlyDismissed() && 
                          !isTemporarilyDismissed() && 
                          !isManuallyDismissed;

  const showPrompt = useCallback(() => {
    if (isIOS && !isInstalled && !isPermanentlyDismissed()) {
      setIsVisible(true);
      setIsManuallyDismissed(false);
    }
  }, [isIOS, isInstalled, isPermanentlyDismissed]);

  const dismissPrompt = useCallback(() => {
    setIsVisible(false);
    setIsManuallyDismissed(true);
    // Set temporary dismiss for 24 hours
    localStorage.setItem(TEMPORARY_DISMISS_KEY, Date.now().toString());
  }, []);

  const dismissPermanently = useCallback(() => {
    setIsVisible(false);
    setIsManuallyDismissed(true);
    localStorage.setItem(DISMISS_KEY, 'true');
    // Clear temporary dismiss since we're permanently dismissing
    localStorage.removeItem(TEMPORARY_DISMISS_KEY);
  }, []);

  // Auto-show prompt after page load
  useEffect(() => {
    if (shouldShowPrompt) {
      // Delay showing the prompt to avoid being too intrusive
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000); // Show after 3 seconds

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
