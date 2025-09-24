import React, { useState, useEffect } from "react";
import { usePWA } from "../hooks/usePWA";
import { RefreshCw, X, CheckCircle } from "lucide-react";

export const PWAUpdateNotification: React.FC = () => {
  const { updateAvailable, isUpdating, update, dismissUpdate } = usePWA();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (updateAvailable) {
      setIsVisible(true);
    }
  }, [updateAvailable]);

  const handleUpdate = async () => {
    await update();
    // The page will reload automatically after update
  };

  const handleDismiss = () => {
    setIsVisible(false);
    dismissUpdate();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[9999]">
      <div
        role="status"
        aria-live="polite"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-4"
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center">
              <RefreshCw
                className={`w-5 h-5 text-emerald-700 dark:text-emerald-300 ${
                  isUpdating ? "animate-spin" : ""
                }`}
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Update Available
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
              A new version of AiLinc is available. Update now for the latest
              features and improvements.
            </p>
            <div className="flex space-x-2 mt-3">
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-[var(--font-light)] text-sm font-medium py-2 px-3 rounded-md transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Update Now</span>
                  </>
                )}
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors duration-200"
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
