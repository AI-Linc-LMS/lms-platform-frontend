import React from "react";
import { useIOSPWAInstall } from "../hooks/useIOSPWAInstall";
import { IOSPWAInstallButton } from "./IOSPWAInstallButton";
import {
  isIOSDevice,
  isPWAInstalled,
  getDeviceInfo,
} from "../utils/deviceIdentifier";

export const IOSPWATestPage: React.FC = () => {
  const {
    shouldShowPrompt,
    isIOS,
    isInstalled,
    showPrompt,
    dismissPrompt,
    dismissPermanently,
    isVisible,
  } = useIOSPWAInstall();

  const deviceInfo = getDeviceInfo();

  const clearAllDismissals = () => {
    localStorage.removeItem("ios-pwa-install-dismissed");
    localStorage.removeItem("ios-pwa-install-temp-dismissed");
    // window.location.reload();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          iOS PWA Installation Test Page
        </h1>

        {/* Device Information */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Device Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">OS:</span> {deviceInfo.os}
            </div>
            <div>
              <span className="font-medium">Browser:</span> {deviceInfo.browser}
            </div>
            <div>
              <span className="font-medium">Device Type:</span>{" "}
              {deviceInfo.deviceType}
            </div>
            <div>
              <span className="font-medium">Screen Size:</span>{" "}
              {deviceInfo.screenSize}
            </div>
            <div>
              <span className="font-medium">Is iOS:</span>
              <span
                className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  isIOSDevice()
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {isIOSDevice() ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <span className="font-medium">PWA Installed:</span>
              <span
                className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  isPWAInstalled()
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {isPWAInstalled() ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>

        {/* PWA Hook Status */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            PWA Hook Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Should Show Prompt:</span>
              <span
                className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  shouldShowPrompt
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {shouldShowPrompt ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <span className="font-medium">Is iOS (Hook):</span>
              <span
                className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  isIOS
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {isIOS ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <span className="font-medium">Is Installed (Hook):</span>
              <span
                className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  isInstalled
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {isInstalled ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <span className="font-medium">Is Visible:</span>
              <span
                className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  isVisible
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {isVisible ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>

        {/* Install Buttons */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Installation Controls
          </h2>

          <div className="flex flex-wrap gap-4">
            <IOSPWAInstallButton variant="primary">
              Install App (Primary)
            </IOSPWAInstallButton>

            <IOSPWAInstallButton variant="secondary">
              Install App (Secondary)
            </IOSPWAInstallButton>

            <IOSPWAInstallButton variant="minimal" />

            <button
              onClick={showPrompt}
              className="bg-purple-600 hover:bg-purple-700 text-[var(--font-light)] px-4 py-2 rounded-lg transition-colors"
            >
              Manual Show Prompt
            </button>
          </div>
        </div>

        {/* Debug Controls */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Debug Controls
          </h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={dismissPrompt}
              className="bg-gray-600 hover:bg-gray-700 text-[var(--font-light)] px-4 py-2 rounded-lg transition-colors"
            >
              Dismiss Prompt (24h)
            </button>

            <button
              onClick={dismissPermanently}
              className="bg-red-600 hover:bg-red-700 text-[var(--font-light)] px-4 py-2 rounded-lg transition-colors"
            >
              Dismiss Permanently
            </button>

            <button
              onClick={clearAllDismissals}
              className="bg-green-600 hover:bg-green-700 text-[var(--font-light)] px-4 py-2 rounded-lg transition-colors"
            >
              Clear All Dismissals & Reload
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Testing Instructions
          </h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              • <strong>iOS Detection:</strong> This component only shows
              install prompts on iOS devices (iPhone/iPad)
            </p>
            <p>
              • <strong>PWA Detection:</strong> If the app is already installed,
              no install prompts will be shown
            </p>
            <p>
              • <strong>Automatic Prompt:</strong> The modal automatically
              appears 3 seconds after page load (if conditions are met)
            </p>
            <p>
              • <strong>Dismissal Logic:</strong> Users can dismiss temporarily
              (24h) or permanently
            </p>
            <p>
              • <strong>Manual Trigger:</strong> Use the install buttons to
              manually trigger the prompt
            </p>
            <p>
              • <strong>Reset Testing:</strong> Use "Clear All Dismissals" to
              reset for testing purposes
            </p>
          </div>
        </div>

        {/* Local Storage Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Local Storage Status
          </h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <strong>Permanent Dismiss:</strong>{" "}
              {localStorage.getItem("ios-pwa-install-dismissed") || "Not set"}
            </p>
            <p>
              <strong>Temporary Dismiss:</strong>{" "}
              {localStorage.getItem("ios-pwa-install-temp-dismissed") ||
                "Not set"}
            </p>
            {localStorage.getItem("ios-pwa-install-temp-dismissed") && (
              <p className="text-xs">
                Temp dismiss expires:{" "}
                {new Date(
                  parseInt(
                    localStorage.getItem("ios-pwa-install-temp-dismissed")!
                  ) +
                    24 * 60 * 60 * 1000
                ).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IOSPWATestPage;
