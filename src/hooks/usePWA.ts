import { useState, useEffect, useCallback } from "react";
import { pwaManager, PWAUpdateInfo, PWAInstallInfo } from "../pwa";

export interface PWAState {
  // Installation state
  canInstall: boolean;
  isInstalling: boolean;

  // Update state
  updateAvailable: boolean;
  isUpdating: boolean;

  // Offline state
  isOffline: boolean;

  // Actions
  install: () => Promise<boolean>;
  update: () => Promise<void>;
  dismissUpdate: () => void;
  dismissInstall: () => void;
}

/**
 * React hook for managing PWA functionality
 */
export const usePWA = (): PWAState => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(() =>
    pwaManager.isUpdateAvailable()
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOffline, setIsOffline] = useState(() => pwaManager.isOffline());

  // Handle install prompt
  const install = useCallback(async (): Promise<boolean> => {
    if (!canInstall || isInstalling) return false;

    // Check manifest link
    const manifestLink = document.querySelector(
      'link[rel="manifest"]'
    ) as HTMLLinkElement;
    if (!manifestLink || !manifestLink.href) {
      console.warn("No manifest found to use for install.");
    } else {
      console.log("Using manifest:", manifestLink.href);
      // Optionally you could refresh or cache-bust the manifest here
    }

    setIsInstalling(true);
    try {
      const result = await pwaManager.showInstallPrompt();
      if (result) {
        setCanInstall(false);
      }
      return result;
    } catch (error) {
      console.error("Error during installation:", error);
      return false;
    } finally {
      setIsInstalling(false);
    }
  }, [canInstall, isInstalling]);

  // Handle service worker update
  const update = useCallback(async (): Promise<void> => {
    if (!updateAvailable || isUpdating) {
      return;
    }

    setIsUpdating(true);
    try {
      await pwaManager.updateServiceWorker();
      // The page will reload automatically after update
    } catch (error) {
      console.error("Error during update:", error);
      setIsUpdating(false);
    }
  }, [updateAvailable, isUpdating]);

  // Dismiss update notification
  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
    // Persistently clear PWA-level update flag to avoid repeated prompts
    try {
      pwaManager.clearUpdateFlag?.();
    } catch {
      /* no-op */
    }
  }, []);

  // Dismiss install notification
  const dismissInstall = useCallback(() => {
    setCanInstall(false);
  }, []);

  // Set up event listeners
  useEffect(() => {
    // Listen for install availability changes
    const unsubscribeInstall = pwaManager.onInstallAvailable(
      (info: PWAInstallInfo) => {
        setCanInstall(info.canInstall);
        setIsInstalling(false); // Reset installing state when install state changes
      }
    );

    // Listen for update availability changes
    const unsubscribeUpdate = pwaManager.onUpdateAvailable(
      (info: PWAUpdateInfo) => {
        setUpdateAvailable(info.updateAvailable);
        setIsUpdating(false); // Reset updating state when update state changes
      }
    );

    // Listen for offline status changes
    const unsubscribeOffline = pwaManager.onOfflineStatusChange(
      (offline: boolean) => {
        setIsOffline(offline);
      }
    );

    // Initial state check
    setCanInstall(pwaManager.canInstall());
    setIsOffline(pwaManager.isOffline());
    // Re-check update availability shortly after mount to avoid race conditions
    const timer = setTimeout(() => {
      if (pwaManager.isUpdateAvailable()) {
        setUpdateAvailable(true);
      }
    }, 1000);

    // Cleanup subscriptions
    return () => {
      unsubscribeInstall();
      unsubscribeUpdate();
      unsubscribeOffline();
      clearTimeout(timer);
    };
  }, []);

  return {
    canInstall,
    isInstalling,
    updateAvailable,
    isUpdating,
    isOffline,
    install,
    update,
    dismissUpdate,
    dismissInstall,
  };
};

/**
 * Hook for just offline status (lightweight version)
 */
export const useOfflineStatus = (): boolean => {
  const [isOffline, setIsOffline] = useState(() => pwaManager.isOffline());

  useEffect(() => {
    const unsubscribe = pwaManager.onOfflineStatusChange((offline: boolean) => {
      setIsOffline(offline);
    });

    return unsubscribe;
  }, []);

  return isOffline;
};

/**
 * Hook for just install functionality
 */
export const usePWAInstall = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const install = useCallback(async (): Promise<boolean> => {
    if (!canInstall || isInstalling) {
      return false;
    }

    setIsInstalling(true);
    try {
      const result = await pwaManager.showInstallPrompt();
      if (result) {
        setCanInstall(false);
      }
      return result;
    } catch (error) {
      console.error("Error during installation:", error);
      return false;
    } finally {
      setIsInstalling(false);
    }
  }, [canInstall, isInstalling]);

  useEffect(() => {
    const unsubscribe = pwaManager.onInstallAvailable(
      (info: PWAInstallInfo) => {
        setCanInstall(info.canInstall);
        setIsInstalling(false);
      }
    );

    setCanInstall(pwaManager.canInstall());

    return unsubscribe;
  }, []);

  return {
    canInstall,
    isInstalling,
    install,
  };
};
