import React from "react";
import { Smartphone, X } from "lucide-react";
import { useIOSPWAInstall } from "../hooks/useIOSPWAInstall";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

export const IOSInstallBanner: React.FC = () => {
  const { isIOS, isInstalled, showPrompt, dismissPrompt } = useIOSPWAInstall();
  const clientInfo = useSelector((state: RootState) => state.clientInfo);

  if (!isIOS || isInstalled) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-blue-600 text-[var(--font-light)] z-[9998] px-4 py-3 shadow-lg">
      <div className="flex items-center justify-between max-w-sm mx-auto">
        <div className="flex items-center space-x-3">
          <Smartphone className="w-5 h-5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              Install {clientInfo?.data?.name} for better experience
            </p>
            <p className="text-xs opacity-90 truncate">
              Add to home screen for quick access
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={showPrompt}
            className="bg-white text-blue-600 px-3 py-1 rounded-full text-xs font-medium hover:bg-gray-100 transition-colors touch-manipulation"
          >
            Install
          </button>
          <button
            onClick={dismissPrompt}
            className="p-1 hover:bg-blue-700 rounded-full transition-colors touch-manipulation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IOSInstallBanner;
