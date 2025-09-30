/**
 * PWA Manager for Immediate Activation Mode
 */

export interface PWAUpdateInfo {
  updateAvailable: boolean;
  registration?: ServiceWorkerRegistration;
  version?: string;
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

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export class PWAManager {
  private updateCallbacks: ((info: PWAUpdateInfo) => void)[] = [];
  private installCallbacks: ((info: PWAInstallInfo) => void)[] = [];
  private offlineCallbacks: ((isOffline: boolean) => void)[] = [];
  private installPromptEvent: BeforeInstallPromptEvent | null = null;
  private registration: ServiceWorkerRegistration | null = null;
  private config: PWAConfig = {};
  private isOfflineState: boolean = !navigator.onLine;
  private currentVersion: string | null = null;

  constructor() {
    this.setupInstallPrompt();
    this.setupOnlineOfflineDetection();
    this.checkOnlineStatus();
  }

  setConfig(config: PWAConfig): void {
    this.config = { ...this.config, ...config };
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(
          "pwa-config",
          JSON.stringify(this.config)
        );
      } catch (error) {
        console.warn("⚠️ Failed to save PWA config:", error);
      }
    }
    this.sendConfigToServiceWorker();
  }

  getConfig(): PWAConfig {
    return { ...this.config };
  }

  // ✅ Simplified registration for immediate mode
  async registerServiceWorker(): Promise<void> {
    if ("serviceWorker" in navigator) {
      try {
        console.log("🚀 Registering Service Worker in IMMEDIATE MODE");

        this.registration = await navigator.serviceWorker.register(
          "/sw-custom.js",
          {
            scope: "/",
            updateViaCache: "none",
          }
        );

        console.log("✅ Service Worker registered successfully");

        // ✅ Get current version immediately
        await this.getCurrentVersion();

        // ✅ Setup listeners for immediate activation
        this.setupImmediateActivationListeners();

        // ✅ Check for updates periodically
        this.startUpdateChecking();
      } catch (error) {
        console.error("❌ Service Worker registration failed:", error);
      }
    }
  }

  // ✅ Setup listeners for immediate activation
  private setupImmediateActivationListeners(): void {
    if (!this.registration) return;

    // Listen for immediate activation messages
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "SW_IMMEDIATE_ACTIVATION") {
        console.log(
          "🎉 Received immediate activation notification:",
          event.data
        );
        this.currentVersion = event.data.version;

        // Notify callbacks that we have the latest version
        this.notifyUpdateCallbacks(false, event.data.version);
      }
    });

    // Listen for new installations
    this.registration.addEventListener("updatefound", () => {
      console.log("🔄 New service worker found - will activate immediately");
      const newWorker = this.registration?.installing;

      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "activated") {
            console.log("✅ New service worker activated immediately");
            // No need for user intervention in immediate mode
            this.getCurrentVersion();
          }
        });
      }
    });

    // ✅ No controllerchange listener needed - immediate mode handles this
  }

  // ✅ Simplified update checking for immediate mode
  private startUpdateChecking(): void {
    const isDev =
      import.meta.env?.DEV === true || import.meta.env?.MODE === "development";
    const intervalMs = isDev ? 30_000 : 15 * 60_000; // 30s dev, 15m prod

    const doUpdateCheck = async () => {
      try {
        await this.registration?.update();
        // No need to notify - immediate mode handles activation automatically
      } catch (error) {
        console.warn("⚠️ Update check failed:", error);
      }
    };

    // Periodic checks
    setInterval(doUpdateCheck, intervalMs);

    // Check on focus
    let lastFocusCheck = 0;
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        if (now - lastFocusCheck > 30_000) {
          lastFocusCheck = now;
          doUpdateCheck();
        }
      }
    });

    // Check when coming online
    window.addEventListener("online", doUpdateCheck);
  }

  // ✅ No manual update needed in immediate mode
  async updateServiceWorker(): Promise<void> {
    console.log("ℹ️ Manual updates not needed in immediate activation mode");
    console.log(
      "🚀 Service worker updates are applied automatically upon deployment"
    );
  }

  // ✅ Clear all caches
  async clearAllCaches(): Promise<void> {
    if (navigator.serviceWorker.controller) {
      try {
        const channel = new MessageChannel();

        return new Promise((resolve) => {
          channel.port1.onmessage = (event) => {
            if (event.data.type === "CACHES_CLEARED") {
              console.log("✅ All caches cleared");
            }
            resolve();
          };

          navigator.serviceWorker.controller!.postMessage(
            { type: "CLEAR_CACHES" },
            [channel.port2]
          );

          setTimeout(resolve, 5000);
        });
      } catch (error) {
        console.error("❌ Failed to clear caches:", error);
      }
    }
  }

  // ✅ Setup install prompt
  private setupInstallPrompt(): void {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.installPromptEvent = e as BeforeInstallPromptEvent;
      this.notifyInstallAvailable();
    });

    window.addEventListener("appinstalled", () => {
      console.log("🎉 PWA installed successfully");
      this.installPromptEvent = null;
      this.notifyInstallAvailable();
    });
  }

  // ✅ Setup online/offline detection
  private setupOnlineOfflineDetection(): void {
    window.addEventListener("online", () => {
      console.log("🌐 Back online");
      this.checkOnlineStatus();
    });

    window.addEventListener("offline", () => {
      console.log("📵 Gone offline");
      this.notifyOnlineStatus(true);
    });
  }

  // ✅ Send config to service worker
  private sendConfigToServiceWorker(): void {
    if (
      navigator.serviceWorker.controller &&
      Object.keys(this.config).length > 0
    ) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: "PWA_CONFIG",
          config: this.config,
        });
      } catch (error) {
        console.warn("⚠️ Failed to send config to service worker:", error);
      }
    }
  }

  // ✅ Install prompt methods
  async showInstallPrompt(): Promise<boolean> {
    if (!this.installPromptEvent) return false;

    try {
      await this.installPromptEvent.prompt();
      const choiceResult = await this.installPromptEvent.userChoice;

      if (choiceResult.outcome === "accepted") {
        this.installPromptEvent = null;
        return true;
      }
      return false;
    } catch (error) {
      console.error("❌ Install prompt error:", error);
      return false;
    }
  }

  canInstall(): boolean {
    return this.installPromptEvent !== null;
  }

  isOffline(): boolean {
    return this.isOfflineState;
  }

  // ✅ Event subscription methods
  onUpdateAvailable(callback: (info: PWAUpdateInfo) => void): () => void {
    this.updateCallbacks.push(callback);
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) this.updateCallbacks.splice(index, 1);
    };
  }

  onInstallAvailable(callback: (info: PWAInstallInfo) => void): () => void {
    this.installCallbacks.push(callback);
    if (this.canInstall()) {
      callback({ canInstall: true, promptEvent: this.installPromptEvent! });
    }
    return () => {
      const index = this.installCallbacks.indexOf(callback);
      if (index > -1) this.installCallbacks.splice(index, 1);
    };
  }

  onOfflineStatusChange(callback: (isOffline: boolean) => void): () => void {
    this.offlineCallbacks.push(callback);
    callback(this.isOfflineState);
    return () => {
      const index = this.offlineCallbacks.indexOf(callback);
      if (index > -1) this.offlineCallbacks.splice(index, 1);
    };
  }

  // ✅ Private notification methods
  private notifyUpdateCallbacks(
    updateAvailable: boolean,
    version?: string
  ): void {
    const info: PWAUpdateInfo = {
      updateAvailable,
      registration: this.registration || undefined,
      version: version || this.currentVersion || undefined,
    };

    this.updateCallbacks.forEach((callback) => {
      try {
        callback(info);
      } catch (error) {
        console.error("❌ Update callback error:", error);
      }
    });
  }

  private notifyInstallAvailable(): void {
    const info: PWAInstallInfo = {
      canInstall: this.canInstall(),
      promptEvent: this.installPromptEvent || undefined,
    };

    this.installCallbacks.forEach((callback) => {
      try {
        callback(info);
      } catch (error) {
        console.error("❌ Install callback error:", error);
      }
    });
  }

  private async checkOnlineStatus(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`/vite.svg?_=${Date.now()}`, {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.notifyOnlineStatus(!response.ok);
    } catch (error) {
      this.notifyOnlineStatus(true);
    }
  }

  private notifyOnlineStatus(isOffline: boolean): void {
    if (this.isOfflineState === isOffline) return;

    this.isOfflineState = isOffline;
    console.log(isOffline ? "📵 App offline" : "🌐 App online");

    this.offlineCallbacks.forEach((callback) => {
      try {
        callback(isOffline);
      } catch (error) {
        console.error("❌ Offline callback error:", error);
      }
    });
  }

  getCurrentVersion(): string | null {
    return this.currentVersion;
  }
}

export const pwaManager = new PWAManager();

export const initializePWA = async (config?: PWAConfig): Promise<void> => {
  if (config) {
    pwaManager.setConfig(config);
  }

  try {
    await pwaManager.registerServiceWorker();
    console.log("🎉 PWA initialized in IMMEDIATE ACTIVATION mode");
  } catch (error) {
    console.error("❌ PWA initialization failed:", error);
  }
};
