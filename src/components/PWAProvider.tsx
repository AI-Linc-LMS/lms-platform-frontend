import React from "react";
import { PWAInstallPrompt } from "./PWAInstallPrompt";
// import { PWAUpdateNotification } from "./PWAUpdateNotification";
import { OfflineIndicator } from "./OfflineIndicator";
import PWASplashScreen from "./PWASplashScreen";

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <>
      {/* Splash overlay for installed PWA launch with a brief loader */}
      <PWASplashScreen />
      {children}
      <PWAInstallPrompt />
      {/* <PWAUpdateNotification /> */}
      <OfflineIndicator />
    </>
  );
};
