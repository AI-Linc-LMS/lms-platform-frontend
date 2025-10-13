import React from "react";
import { PWAInstallPrompt } from "./PWAInstallPrompt";
// import { PWAUpdateNotification } from "./PWAUpdateNotification";
import { OfflineIndicator } from "./OfflineIndicator";
import PWASplashScreen from "./PWASplashScreen";

// Helper function to detect if the device is mobile
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const showInstallPrompt = isMobileDevice();

  return (
    <>
      {/* Splash overlay for installed PWA launch with a brief loader */}
      <PWASplashScreen />
      {children}
      {/* Only show install prompt on mobile devices */}
      {showInstallPrompt && <PWAInstallPrompt />}
      {/* <PWAUpdateNotification /> */}
      <OfflineIndicator />
    </>
  );
};
