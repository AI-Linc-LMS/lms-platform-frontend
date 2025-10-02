import React from "react";
import { X, Share, Plus, Smartphone } from "lucide-react";
import { useIOSPWAInstall } from "../hooks/useIOSPWAInstall";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

interface IOSPWAInstallPromptProps {
  appName?: string;
}

export const IOSPWAInstallPrompt: React.FC<IOSPWAInstallPromptProps> = ({
  appName = "AiLinc",
}) => {
  const { isVisible, dismissPrompt, dismissPermanently, isIOS } =
    useIOSPWAInstall();
  const clientInfo = useSelector((state: RootState) => state.clientInfo);
  if (!isVisible || !isIOS) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center p-0 sm:p-4">
        {/* Modal */}
        <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm mx-0 sm:mx-4 mb-0 sm:mb-auto shadow-2xl transform transition-all duration-300 ease-out translate-y-0 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Install{" "}
                  {clientInfo?.data?.name ? clientInfo?.data?.name : appName}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  Add to Home Screen
                </p>
              </div>
            </div>
            <button
              onClick={dismissPrompt}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="text-center">
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                Install our app for the best experience! Get quick access from
                your home screen.
              </p>
            </div>

            {/* Step-by-step instructions */}
            <div className="space-y-3 sm:space-y-4">
              <div className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                Follow these steps:
              </div>

              {/* Step 1 */}
              <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 text-[var(--font-light)] rounded-full flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0">
                  1
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                    <span className="text-xs sm:text-sm font-medium text-gray-900">
                      Tap the Share button
                    </span>
                    <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-blue-500 rounded flex items-center justify-center flex-shrink-0">
                      <Share className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-500" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">
                    Look for the share icon in your browser's toolbar
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 text-[var(--font-light)] rounded-full flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0">
                  2
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                    <span className="text-xs sm:text-sm font-medium text-gray-900">
                      Select "Add to Home Screen"
                    </span>
                    <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-green-500 rounded flex items-center justify-center flex-shrink-0">
                      <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-500" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">
                    Scroll down in the share menu to find this option
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 text-[var(--font-light)] rounded-full flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0">
                  3
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                    <span className="text-xs sm:text-sm font-medium text-gray-900">
                      Tap "Add" to confirm
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    The app will appear on your home screen
                  </p>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
              <h4 className="text-xs sm:text-sm font-medium text-blue-900 mb-2">
                Why install?
              </h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Faster loading times</li>
                <li>• Works offline</li>
                <li>• Native app-like experience</li>
                <li>• No app store required</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-gray-100 space-y-2 sm:space-y-3 pb-safe">
            <button
              onClick={dismissPrompt}
              className="w-full bg-blue-600 hover:bg-blue-700 text-[var(--font-light)] font-medium py-3 px-4 rounded-lg transition-colors touch-manipulation min-h-[44px]"
            >
              Got it!
            </button>
            <button
              onClick={dismissPermanently}
              className="w-full text-gray-500 hover:text-gray-700 text-sm py-2 transition-colors touch-manipulation min-h-[40px]"
            >
              Don't show again
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default IOSPWAInstallPrompt;
