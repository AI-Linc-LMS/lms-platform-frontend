"use client";

import { useCameraRouteGuard } from "@/lib/hooks/useCameraRouteGuard";

/**
 * Provider component that guards camera access based on routes
 * This should be added to the root layout to work globally
 */
export function CameraRouteGuard({ children }: { children: React.ReactNode }) {
  useCameraRouteGuard();
  return <>{children}</>;
}


