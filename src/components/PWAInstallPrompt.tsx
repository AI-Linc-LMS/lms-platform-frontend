import React, { useState, useEffect } from "react";
import { usePWA } from "../hooks/usePWA";
import { Download, X, Smartphone } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

export const PWAInstallPrompt: React.FC = () => {
  const { canInstall, isInstalling, install, dismissInstall } = usePWA();
  const [isVisible, setIsVisible] = useState(false);

  const clientInfo = useSelector((state: RootState) => state.clientInfo);

  useEffect(() => {
    if (canInstall) {
      setIsVisible(true);
    }
  }, [canInstall]);

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    dismissInstall();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-[var(--font-light)]">
              Install {clientInfo?.data?.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Install our app for a better experience! Quick access from your
              home screen.
            </p>
            <div className="flex space-x-2 mt-3">
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-[var(--font-light)] text-sm font-medium py-2 px-3 rounded-md transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>{isInstalling ? "Installing..." : "Install"}</span>
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
