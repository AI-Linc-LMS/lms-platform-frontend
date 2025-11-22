/**
 * PWA Service Worker Registration and Management - Complete Fixed Version
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
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
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

  // ✅ Enhanced reload guards with persistence
  private static readonly RELOAD_GUARD_KEY = "pwa-reload-guard";
  private hadControllerAtLoad: boolean = false;
  private shouldReloadOnControllerChange: boolean = false;
  private updateCheckInterval: number | null = null;

  constructor() {
    this.setupInstallPrompt();
    this.setupOnlineOfflineDetection();
    this.checkOnlineStatus();
    this.setupPeriodicChecks();
  }

  // ✅ Set PWA configuration
  setConfig(config: PWAConfig): void {
    this.config = { ...this.config, ...config };
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(
          "pwa-config",
          JSON.stringify(this.config)
        );
      } catch (error) {
        console.warn("⚠️ Failed to save PWA config to session storage:", error);
      }
    }
    this.sendConfigToServiceWorker();
  }

  // ✅ Get PWA configuration
  getConfig(): PWAConfig {
    return { ...this.config };
  }

  // ✅ Enhanced service worker registration with proper reload guards
  async registerServiceWorker(): Promise<void> {
    // Disable service worker when PWA flag is enabled
    if (import.meta.env.VITE_ENABLE_PWA === "true") {
      return;
    }

    if ("serviceWorker" in navigator) {
      try {
        // ✅ Check if we just reloaded due to SW update
        const justReloaded = sessionStorage.getItem(
          PWAManager.RELOAD_GUARD_KEY
        );
        if (justReloaded) {
          sessionStorage.removeItem(PWAManager.RELOAD_GUARD_KEY);
          console.log("🔄 Reload completed, skipping immediate update check");
        }

        this.hadControllerAtLoad = !!navigator.serviceWorker.controller;

        this.registration = await navigator.serviceWorker.register(
          "/sw-custom.js",
          {
            scope: "/",
            updateViaCache: "none",
          }
        );

        // ✅ Only check for updates if we didn't just reload
        if (!justReloaded) {
          try {
            await this.registration.update();
          } catch {
            /* no-op */
          }
        }

        this.sendConfigToServiceWorker();

        // ✅ Handle waiting service worker
        if (this.registration.waiting) {
          this.notifyUpdateAvailable();
        }

        // ✅ Setup update detection
        this.setupUpdateHandlers();

        // ✅ Setup controller change with proper guards
        this.setupControllerChangeHandler();

        // ✅ Setup message handling
        this.setupMessageHandling();
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    }
  }

  // ✅ Send configuration to service worker
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

  // ✅ Get client ID from various storage sources
  private getClientIdFromStorage(): string | null {
    // Priority 1: Current config
    if (this.config.clientId) {
      return this.config.clientId;
    }

    // Priority 2: Session storage
    try {
      const storedConfig = window.sessionStorage.getItem("pwa-config");
      if (storedConfig) {
        const parsed = JSON.parse(storedConfig);
        if (parsed.clientId) {
          return parsed.clientId;
        }
      }
    } catch (error) {
      console.warn("⚠️ Error parsing PWA config from sessionStorage:", error);
    }

    // Priority 3: Local storage auth data
    try {
      const authData =
        window.localStorage.getItem("auth") ||
        window.localStorage.getItem("user");
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed.clientId || parsed.client_id) {
          return parsed.clientId || parsed.client_id;
        }
      }
    } catch (error) {
      console.warn("⚠️ Error parsing auth data from localStorage:", error);
    }

    // Priority 4: Environment variable
    return import.meta.env.VITE_CLIENT_ID || null;
  }

  // ✅ Setup install prompt handling
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

  // ✅ Show install prompt
  async showInstallPrompt(): Promise<boolean> {
    if (!this.installPromptEvent) {
      console.warn("⚠️ No install prompt available");
      return false;
    }

    try {
      await this.installPromptEvent.prompt();
      const choiceResult = await this.installPromptEvent.userChoice;

      if (choiceResult.outcome === "accepted") {
        console.log("✅ User accepted install prompt");
        this.installPromptEvent = null;
        return true;
      } else {
        console.log("❌ User dismissed install prompt");
        return false;
      }
    } catch (error) {
      console.error("❌ Error showing install prompt:", error);
      return false;
    }
  }

  // ✅ Check if app can be installed
  canInstall(): boolean {
    return this.installPromptEvent !== null;
  }

  // ✅ Check if app is offline
  isOffline(): boolean {
    return this.isOfflineState;
  }

  // ✅ Safe controller change handler with multiple guards
  private setupControllerChangeHandler(): void {
    // Use a closure to maintain state across potential reloads
    let hasReloaded = false;

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => {
        // ✅ Guard 1: Prevent multiple reloads in same session
        if (hasReloaded) {
          console.log(
            "🛡️ Reload already triggered, ignoring controller change"
          );
          return;
        }

        // ✅ Guard 2: Check session storage guard
        if (sessionStorage.getItem(PWAManager.RELOAD_GUARD_KEY)) {
          console.log("🛡️ Reload guard active, ignoring controller change");
          return;
        }

        // ✅ Guard 3: Only reload if we explicitly requested an update
        if (!this.shouldReloadOnControllerChange && !this.hadControllerAtLoad) {
          console.log("🛡️ No reload requested, ignoring controller change");
          return;
        }

        console.log("🔄 Controller changed, reloading page...");
        hasReloaded = true;

        // ✅ Set session guard before reload
        sessionStorage.setItem(
          PWAManager.RELOAD_GUARD_KEY,
          Date.now().toString()
        );

        // ✅ Small delay to ensure session storage is written
        setTimeout(() => {
          window.location.reload();
        }, 100);
      },
      { once: true }
    ); // ✅ Critical: only fire once per registration
  }

  // ✅ Setup update handlers with proper guards
  private setupUpdateHandlers(): void {
    if (!this.registration) return;

    this.registration.addEventListener("updatefound", () => {
      const newWorker = this.registration?.installing;
      if (newWorker) {
        console.log("🔄 New service worker found, installing...");

        newWorker.addEventListener("statechange", () => {
          console.log(`🔄 Service worker state: ${newWorker.state}`);

          // Only notify when worker is installed and waiting
          if (newWorker.state === "installed" && this.registration?.waiting) {
            // ✅ Don't auto-activate, let user decide
            console.log("✨ New service worker installed and waiting");
            this.notifyUpdateAvailable();
          }
        });
      }
    });
  }

  // ✅ Enhanced periodic checks with backoff and guards
  private setupPeriodicChecks(): void {
    const isDev =
      import.meta.env?.DEV === true || import.meta.env?.MODE === "development";

    // ✅ Longer intervals to prevent excessive checking
    const intervalMs = isDev ? 60_000 : 30 * 60_000; // 1m dev, 30m prod
    let consecutiveFailures = 0;

    const doUpdateCheck = async () => {
      // ✅ Skip if update is pending or just reloaded
      if (
        this.hasUpdate ||
        sessionStorage.getItem(PWAManager.RELOAD_GUARD_KEY)
      ) {
        return;
      }

      try {
        await this.registration?.update();
        consecutiveFailures = 0; // Reset on success
      } catch (error) {
        consecutiveFailures++;
        console.warn(
          `⚠️ Update check failed (${consecutiveFailures}/3):`,
          error
        );

        // ✅ Exponential backoff on failures
        if (consecutiveFailures > 3) {
          console.log("⚠️ Multiple update check failures, pausing checks");
          if (this.updateCheckInterval) {
            clearInterval(this.updateCheckInterval);
            // Resume checks after 10 minutes
            setTimeout(() => this.setupPeriodicChecks(), 10 * 60_000);
          }
        }
      }
    };

    // ✅ Clear existing interval
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }

    this.updateCheckInterval = window.setInterval(doUpdateCheck, intervalMs);

    // ✅ Check on focus, but with throttling
    let lastFocusCheck = 0;
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        if (now - lastFocusCheck > 30_000) {
          // Throttle to 30s
          lastFocusCheck = now;
          doUpdateCheck();
        }
      }
    });

    // ✅ Check when coming back online
    window.addEventListener("online", () => {
      if (!this.hasUpdate) {
        doUpdateCheck();
      }
    });
  }

  // ✅ Safe update service worker with proper flow
  async updateServiceWorker(): Promise<void> {
    if (!this.registration?.waiting) {
      console.log("⚠️ No waiting service worker found");
      this.hasUpdate = false;
      this.notifyUpdateCallbacks();
      return;
    }

    try {
      console.log("🔄 Activating new service worker...");

      // ✅ Set flag BEFORE sending skip waiting
      this.shouldReloadOnControllerChange = true;

      // ✅ Send skip waiting message
      this.registration.waiting.postMessage({ type: "SKIP_WAITING" });

      // ✅ Fallback: if controller doesn't change within 5 seconds, reload manually
      setTimeout(() => {
        if (this.shouldReloadOnControllerChange) {
          console.log("🔄 Manual reload fallback triggered");
          sessionStorage.setItem(
            PWAManager.RELOAD_GUARD_KEY,
            Date.now().toString()
          );
          window.location.reload();
        }
      }, 5000);
    } catch (error) {
      console.error("❌ Failed to update service worker:", error);
      this.shouldReloadOnControllerChange = false;
    }
  }

  // ✅ Clear all caches
  async clearAllCaches(): Promise<void> {
    if (navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: "CLEAR_CACHES",
        });
        console.log("📨 Cache clear request sent to service worker");
      } catch (error) {
        console.error("❌ Failed to send cache clear message:", error);
      }
    }
  }

  // ✅ Setup message handling
  private setupMessageHandling(): void {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "REQUEST_PWA_CONFIG") {
        this.sendConfigToServiceWorker();
      }

      if (event.data?.type === "GET_CLIENT_ID") {
        const clientId = this.getClientIdFromStorage();
        if (event.ports?.[0]) {
          event.ports[0].postMessage({ clientId });
        }
      }

      if (event.data?.type === "CACHE_CLEARED") {
        console.log("✅ Service worker confirmed cache clear");
      }
    });
  }

  // ✅ Subscribe to update notifications
  onUpdateAvailable(callback: (info: PWAUpdateInfo) => void): () => void {
    this.updateCallbacks.push(callback);

    // If an update is already known, notify new subscribers immediately
    if (this.hasUpdate && !this.updateDismissed) {
      const info: PWAUpdateInfo = {
        updateAvailable: true,
        registration: this.registration || undefined,
      };
      try {
        callback(info);
      } catch (error) {
        console.error("❌ Update callback error:", error);
      }
    }

    // Return unsubscribe function
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }

  // ✅ Subscribe to install notifications
  onInstallAvailable(callback: (info: PWAInstallInfo) => void): () => void {
    this.installCallbacks.push(callback);

    // Notify immediately if install is available
    if (this.canInstall()) {
      try {
        callback({
          canInstall: true,
          promptEvent: this.installPromptEvent || undefined,
        });
      } catch (error) {
        console.error("❌ Install callback error:", error);
      }
    }

    return () => {
      const index = this.installCallbacks.indexOf(callback);
      if (index > -1) {
        this.installCallbacks.splice(index, 1);
      }
    };
  }

  // ✅ Subscribe to offline status changes
  onOfflineStatusChange(callback: (isOffline: boolean) => void): () => void {
    this.offlineCallbacks.push(callback);

    // Notify immediately with current status
    try {
      callback(this.isOfflineState);
    } catch (error) {
      console.error("❌ Offline callback error:", error);
    }

    return () => {
      const index = this.offlineCallbacks.indexOf(callback);
      if (index > -1) {
        this.offlineCallbacks.splice(index, 1);
      }
    };
  }

  // ✅ Notify update callbacks
  private notifyUpdateAvailable(): void {
    this.hasUpdate = true;
    this.updateDismissed = false;
    const info: PWAUpdateInfo = {
      updateAvailable: true,
      registration: this.registration || undefined,
    };

    this.updateCallbacks.forEach((callback) => {
      try {
        callback(info);
      } catch (error) {
        console.error("❌ Update callback error:", error);
      }
    });
  }

  // ✅ Mark update as dismissed
  clearUpdateFlag(): void {
    this.hasUpdate = false;
    this.updateDismissed = true;
    console.log("✅ Update flag cleared");
  }

  // ✅ Notify install callbacks
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

  // ✅ Check online status with fetch test
  private async checkOnlineStatus(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(`/vite.svg?_=${Date.now()}`, {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.notifyOnlineStatus(!response.ok);
    } catch (error) {
      console.log("📵 Online check failed, assuming offline");
      this.notifyOnlineStatus(true);
    }
  }

  // ✅ Notify offline status callbacks
  private notifyOnlineStatus(isOffline: boolean): void {
    if (this.isOfflineState === isOffline) return;

    this.isOfflineState = isOffline;
    console.log(isOffline ? "📵 App is offline" : "🌐 App is online");

    this.offlineCallbacks.forEach((callback) => {
      try {
        callback(isOffline);
      } catch (error) {
        console.error("❌ Offline callback error:", error);
      }
    });
  }

  // ✅ Enhanced notification with guards
  private notifyUpdateCallbacks(): void {
    const info: PWAUpdateInfo = {
      updateAvailable: this.hasUpdate && !this.updateDismissed,
      registration: this.registration || undefined,
    };

    this.updateCallbacks.forEach((callback) => {
      try {
        callback(info);
      } catch (error) {
        console.error("❌ Update callback error:", error);
      }
    });
  }

  // ✅ Check if update is available
  isUpdateAvailable(): boolean {
    const waiting = !!this.registration?.waiting;
    const available = this.hasUpdate || waiting;
    return available && !this.updateDismissed;
  }

  // ✅ Cleanup method
  destroy(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }

    // Clear all callbacks
    this.updateCallbacks = [];
    this.installCallbacks = [];
    this.offlineCallbacks = [];

    console.log("🧹 PWA Manager destroyed");
  }
}

// ✅ Global instance
export const pwaManager = new PWAManager();

// ✅ Initialization function
export const initializePWA = async (config?: PWAConfig): Promise<void> => {
  // Disable service worker when PWA flag is enabled
  if (import.meta.env.VITE_ENABLE_PWA === "true") {
    // Unregister any existing service workers (non-blocking)
    // Use setTimeout to avoid blocking initialization
    setTimeout(async () => {
      if ("serviceWorker" in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(
            registrations.map((registration) => registration.unregister())
          );
          
          // Clear all caches
          if ("caches" in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map((name) => caches.delete(name)));
          }
        } catch (error) {
          // Silently fail
        }
      }
    }, 0);
    return;
  }

  if (config) {
    pwaManager.setConfig(config);
  }

  try {
    await pwaManager.registerServiceWorker();
    console.log("🎉 PWA initialized successfully");
  } catch (error) {
    console.error("❌ PWA initialization failed:", error);
  }
};

// ✅ Default export
export default PWAManager;
