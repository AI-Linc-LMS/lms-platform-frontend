// PWANotifications.tsx
import { useState } from "react";
import { pwaManager } from "./pwa";

export function showInAppInstallPromotion() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  const handleInstall = async () => {
    console.log("📱 User clicked install button");
    const installed = await pwaManager.showInstallPrompt();
    if (installed) {
      setShowInstallPrompt(false);
    }
  };

  const dismissInstall = () => {
    console.log("❌ User dismissed install");
    setShowInstallPrompt(false);
  };

  const dismissOffline = () => {
    setShowOfflineBanner(false);
  };

  return (
    <>
      {/* Offline Banner - Top */}
      {showOfflineBanner && (
        <div className="fixed top-0 inset-x-0 z-50 bg-gradient-to-r from-orange-600 to-orange-500 text-white px-4 py-3 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-2xl">📵</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm sm:text-base">
                  You're Offline
                </p>
                <p className="text-xs sm:text-sm text-orange-100 truncate">
                  Some features may be limited
                </p>
              </div>
            </div>
            <button
              onClick={dismissOffline}
              className="flex-shrink-0 text-white hover:bg-orange-700/30 rounded-full p-2 transition-colors"
              aria-label="Dismiss"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Install Notification - Center (Mobile-First) */}
      {showInstallPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 animate-scale-in">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">📱</div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                {"Install App"}
              </h3>
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                {"Install for a better experience"}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleInstall}
                className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-2xl font-bold text-lg hover:from-green-700 hover:to-green-600 active:scale-95 transition-transform shadow-lg"
              >
                Install App
              </button>
              <button
                onClick={dismissInstall}
                className="w-full px-8 py-3 text-gray-600 font-semibold active:scale-95 transition-transform"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add animations to your CSS */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

export default showInAppInstallPromotion;
