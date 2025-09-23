/**
 * PWA Service Worker Registration and Management
 */

export interface PWAUpdateInfo {
  updateAvailable: boolean;
  registration?: ServiceWorkerRegistration;
}

export interface PWAInstallInfo {
  canInstall: boolean;
  promptEvent?: BeforeInstallPromptEvent;
}

export interface PWAConfig {
  clientId?: string;
  googleClientId?: string;
  baseURL?: string;
  environment?: string;
}

// Custom event interface for beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export class PWAManager {
  private updateCallbacks: ((info: PWAUpdateInfo) => void)[] = [];
  private installCallbacks: ((info: PWAInstallInfo) => void)[] = [];
  private offlineCallbacks: ((isOffline: boolean) => void)[] = [];
  private installPromptEvent: BeforeInstallPromptEvent | null = null;
  private registration: ServiceWorkerRegistration | null = null;
  private config: PWAConfig = {};
  private hasUpdate: boolean = false;
  private updateDismissed: boolean = false;
  private isOfflineState: boolean = !navigator.onLine;
  // Reload behavior guards
  private hadControllerAtLoad: boolean = false;
  private shouldReloadOnControllerChange: boolean = false;
  private reloadGuardTriggered: boolean = false;

  constructor() {
    this.setupInstallPrompt();
    this.setupOnlineOfflineDetection();
    this.checkOnlineStatus(); // Initial check
    window.setInterval(() => this.checkOnlineStatus(), 30000); // Check every 30 seconds
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkOnlineStatus();
      }
    });
  }

  setConfig(config: PWAConfig): void {
    this.config = { ...this.config, ...config };
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('pwa-config', JSON.stringify(this.config));
    }
    this.sendConfigToServiceWorker();
  }

  getConfig(): PWAConfig {
    return { ...this.config };
  }

  async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        // Track whether this page was already controlled by a SW
        this.hadControllerAtLoad = !!navigator.serviceWorker.controller;
        // Allow service worker registration in development for testing
        this.registration = await navigator.serviceWorker.register('/sw-custom.js', {
          scope: '/',
          updateViaCache: 'none',
        });
        // Proactively check for a newer SW right after registration
        try { await this.registration.update(); } catch { /* no-op: update check best-effort */ }
        this.sendConfigToServiceWorker();
        // If there's already an updated SW waiting, notify immediately so UI can prompt user
        if (this.registration.waiting) {
          this.notifyUpdateAvailable();
        }
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration?.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              // Only prompt when there's a waiting worker (i.e., no skipWaiting)
              if (newWorker.state === 'installed' && this.registration?.waiting) {
                this.notifyUpdateAvailable();
              }
            });
          }
        });
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          // Reload only when this tab was already controlled (i.e., real update),
          // or when we explicitly requested an update; and do it just once.
          if ((this.hadControllerAtLoad || this.shouldReloadOnControllerChange) && !this.reloadGuardTriggered) {
            this.reloadGuardTriggered = true;
            window.location.reload();
          }
        });
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'REQUEST_PWA_CONFIG') {
            this.sendConfigToServiceWorker();
          }
          if (event.data && event.data.type === 'GET_CLIENT_ID') {
            const clientId = this.getClientIdFromStorage();
            if (event.ports && event.ports[0]) {
              event.ports[0].postMessage({ clientId });
            }
          }
        });

        // Proactively check for SW updates periodically and on tab focus
        const isDev = import.meta.env?.DEV === true || import.meta.env?.MODE === 'development';
        const intervalMs = isDev ? 30_000 : 15 * 60_000; // 30s dev, 15m prod

        const doUpdateCheck = () => {
          try {
            this.registration?.update();
          } catch { /* no-op */ }
        };

        // Periodic checks
        setInterval(doUpdateCheck, intervalMs);
        // Check when tab gains focus or comes back online
        window.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') doUpdateCheck();
        });
        window.addEventListener('online', doUpdateCheck);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  private sendConfigToServiceWorker(): void {
    if (navigator.serviceWorker.controller && Object.keys(this.config).length > 0) {
      navigator.serviceWorker.controller.postMessage({
        type: 'PWA_CONFIG',
        config: this.config
      });
    }
  }

  private getClientIdFromStorage(): string | null {
    if (this.config.clientId) {
      return this.config.clientId;
    }
    try {
      const storedConfig = window.sessionStorage.getItem('pwa-config');
      if (storedConfig) {
        const parsed = JSON.parse(storedConfig);
        if (parsed.clientId) {
          return parsed.clientId;
        }
      }
    } catch {
      console.log("Error parsing PWA config from sessionStorage");
    }
    try {
      const authData = window.localStorage.getItem('auth') || window.localStorage.getItem('user');
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed.clientId || parsed.client_id) {
          return parsed.clientId || parsed.client_id;
        }
      }
    } catch {
      console.log("Error parsing auth data from localStorage");
    }
    return import.meta.env.VITE_CLIENT_ID || null;
  }

  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPromptEvent = e as BeforeInstallPromptEvent;
      this.notifyInstallAvailable();
    });
    window.addEventListener('appinstalled', () => {
      this.installPromptEvent = null;
      this.notifyInstallAvailable();
    });
  }

  private setupOnlineOfflineDetection(): void {
    window.addEventListener('online', () => {
      this.checkOnlineStatus();
    });
    window.addEventListener('offline', () => {
      this.notifyOnlineStatus(true);
    });
  }

  async showInstallPrompt(): Promise<boolean> {
    if (!this.installPromptEvent) {
      return false;
    }
    try {
      await this.installPromptEvent.prompt();
      const choiceResult = await this.installPromptEvent.userChoice;
      if (choiceResult.outcome === 'accepted') {
        this.installPromptEvent = null;
        return true;
      } else {
        return false;
      }
    } catch {
      return false;
    }
  }

  canInstall(): boolean {
    return this.installPromptEvent !== null;
  }

  isOffline(): boolean {
    return this.isOfflineState;
  }

  async updateServiceWorker(): Promise<void> {
    if (this.registration && this.registration.waiting) {
      // Ensure next controllerchange triggers a single reload
      this.shouldReloadOnControllerChange = true;
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      return;
    }
    // No waiting worker: clear the flag and notify subscribers to reset UI
    this.hasUpdate = false;
    const info: PWAUpdateInfo = { updateAvailable: false, registration: this.registration || undefined };
    this.updateCallbacks.forEach(cb => {
      try { cb(info); } catch { /* no-op */ }
    });
  }

  async clearAllCaches(): Promise<void> {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHES' });
    }
  }

  onUpdateAvailable(callback: (info: PWAUpdateInfo) => void): () => void {
    this.updateCallbacks.push(callback);
    // If an update is already known, notify new subscribers immediately
    if (this.hasUpdate) {
      const info: PWAUpdateInfo = {
        updateAvailable: true,
        registration: this.registration || undefined,
      };
      try {
        callback(info);
      } catch { /* no-op: subscriber errors should not break others */ }
    }
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }

  onInstallAvailable(callback: (info: PWAInstallInfo) => void): () => void {
    this.installCallbacks.push(callback);
    return () => {
      const index = this.installCallbacks.indexOf(callback);
      if (index > -1) {
        this.installCallbacks.splice(index, 1);
      }
    };
  }

  onOfflineStatusChange(callback: (isOffline: boolean) => void): () => void {
    this.offlineCallbacks.push(callback);
    return () => {
      const index = this.offlineCallbacks.indexOf(callback);
      if (index > -1) {
        this.offlineCallbacks.splice(index, 1);
      }
    };
  }

  private notifyUpdateAvailable(): void {
    this.hasUpdate = true;
    this.updateDismissed = false;
    const info: PWAUpdateInfo = {
      updateAvailable: true,
      registration: this.registration || undefined
    };
    this.updateCallbacks.forEach(callback => callback(info));
  }

  /**
   * Mark the current update notification as acknowledged so UI can dismiss it persistently
   */
  clearUpdateFlag(): void {
    this.hasUpdate = false;
    this.updateDismissed = true;
  }

  private notifyInstallAvailable(): void {
    const info: PWAInstallInfo = {
      canInstall: this.canInstall(),
      promptEvent: this.installPromptEvent || undefined
    };
    this.installCallbacks.forEach(callback => callback(info));
  }

  private async checkOnlineStatus(): Promise<void> {
    try {
      const response = await fetch(`/vite.svg?_=${new Date().getTime()}`, {
        method: 'HEAD',
        cache: 'no-store',
      });
      this.notifyOnlineStatus(!response.ok);
    } catch {
      this.notifyOnlineStatus(true);
    }
  }

  private notifyOnlineStatus(isOffline: boolean): void {
    if (this.isOfflineState === isOffline) return;
    this.isOfflineState = isOffline;
    this.offlineCallbacks.forEach(callback => callback(isOffline));
  }

  isUpdateAvailable(): boolean {
    // Consider known flag or explicit waiting worker, unless user dismissed
    const waiting = !!this.registration?.waiting;
    const available = this.hasUpdate || waiting;
    return available && !this.updateDismissed;
  }
}

export const pwaManager = new PWAManager();

export const initializePWA = async (config?: PWAConfig): Promise<void> => {
  if (config) {
    pwaManager.setConfig(config);
  }
  await pwaManager.registerServiceWorker();
};
