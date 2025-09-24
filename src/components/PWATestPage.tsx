import React from "react";
import { usePWA } from "../hooks/usePWA";

export const PWATestPage: React.FC = () => {
  const {
    canInstall,
    isInstalling,
    updateAvailable,
    isUpdating,
    isOffline,
    install,
    update,
    dismissUpdate,
    dismissInstall,
  } = usePWA();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-[var(--font-light)] mb-8">
          PWA Test Page
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PWA Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[var(--font-light)] mb-4">
              PWA Status
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Service Worker:
                </span>
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    "serviceWorker" in navigator
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {"serviceWorker" in navigator ? "Supported" : "Not Supported"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Offline Status:
                </span>
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    isOffline
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  }`}
                >
                  {isOffline ? "Offline" : "Online"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Can Install:
                </span>
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    canInstall
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  }`}
                >
                  {canInstall ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Update Available:
                </span>
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    updateAvailable
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  }`}
                >
                  {updateAvailable ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>

          {/* PWA Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[var(--font-light)] mb-4">
              PWA Actions
            </h2>
            <div className="space-y-3">
              {canInstall && (
                <button
                  onClick={install}
                  disabled={isInstalling}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-[var(--font-light)] font-medium py-2 px-4 rounded-md transition-colors duration-200"
                >
                  {isInstalling ? "Installing..." : "Install App"}
                </button>
              )}

              {updateAvailable && (
                <button
                  onClick={update}
                  disabled={isUpdating}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-[var(--font-light)] font-medium py-2 px-4 rounded-md transition-colors duration-200"
                >
                  {isUpdating ? "Updating..." : "Update App"}
                </button>
              )}

              {canInstall && (
                <button
                  onClick={dismissInstall}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-[var(--font-light)] font-medium py-2 px-4 rounded-md transition-colors duration-200"
                >
                  Dismiss Install Prompt
                </button>
              )}

              {updateAvailable && (
                <button
                  onClick={dismissUpdate}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-[var(--font-light)] font-medium py-2 px-4 rounded-md transition-colors duration-200"
                >
                  Dismiss Update
                </button>
              )}
            </div>
          </div>

          {/* Service Worker Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[var(--font-light)] mb-4">
              Service Worker Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Controller:
                </span>
                <span className="text-sm text-gray-900 dark:text-[var(--font-light)]">
                  {navigator.serviceWorker?.controller ? "Active" : "None"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Registration:
                </span>
                <span className="text-sm text-gray-900 dark:text-[var(--font-light)]">
                  Service Worker Available
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Scope:</span>
                <span className="text-sm text-gray-900 dark:text-[var(--font-light)]">
                  /
                </span>
              </div>
            </div>
          </div>

          {/* Testing Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 md:col-span-2">
            <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4">
              How to Test PWA Features
            </h2>
            <div className="space-y-3 text-blue-800 dark:text-blue-200">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>
                  <strong>Install Prompt:</strong> The install button will
                  appear when the app meets PWA criteria. Try accessing from a
                  mobile device or Chrome desktop.
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>
                  <strong>Offline Testing:</strong> Use Chrome DevTools →
                  Network tab → check "Offline" to test offline functionality.
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>
                  <strong>Service Worker:</strong> Check Chrome DevTools →
                  Application → Service Workers to see the active service
                  worker.
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>
                  <strong>Manifest:</strong> Check Chrome DevTools → Application
                  → Manifest to see PWA configuration.
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>
                  <strong>Updates:</strong> Make changes to the code and rebuild
                  to test update notifications.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
