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

  constructor() {
    this.setupInstallPrompt();
    this.setupOnlineOfflineDetection();
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
        // Allow service worker registration in development for testing
        this.registration = await navigator.serviceWorker.register('/sw-custom.js', { scope: '/' });
        this.sendConfigToServiceWorker();
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration?.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.notifyUpdateAvailable();
              }
            });
          }
        });
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
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
      this.notifyOnlineStatus(false);
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
    return !navigator.onLine;
  }

  async updateServiceWorker(): Promise<void> {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  onUpdateAvailable(callback: (info: PWAUpdateInfo) => void): () => void {
    this.updateCallbacks.push(callback);
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
    const info: PWAUpdateInfo = {
      updateAvailable: true,
      registration: this.registration || undefined
    };
    this.updateCallbacks.forEach(callback => callback(info));
  }

  private notifyInstallAvailable(): void {
    const info: PWAInstallInfo = {
      canInstall: this.canInstall(),
      promptEvent: this.installPromptEvent || undefined
    };
    this.installCallbacks.forEach(callback => callback(info));
  }

  private notifyOnlineStatus(isOffline: boolean): void {
    this.offlineCallbacks.forEach(callback => callback(isOffline));
  }
}

export const pwaManager = new PWAManager();

export const initializePWA = async (config?: PWAConfig): Promise<void> => {
  if (config) {
    pwaManager.setConfig(config);
  }
  await pwaManager.registerServiceWorker();
};
