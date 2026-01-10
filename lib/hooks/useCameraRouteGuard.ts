"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { stopAllMediaTracks } from "@/lib/utils/cameraUtils";

/**
 * Routes where camera is allowed to be active
 */
const ALLOWED_CAMERA_ROUTES = [
  "/assessments/[slug]/take",
  "/assessments/[slug]/device-check",
  "/mock-interview/[id]/take",
  "/mock-interview/[id]/device-check",
];

/**
 * Check if a pathname matches any allowed camera route pattern
 */
function isCameraAllowedRoute(pathname: string): boolean {
  // Check exact matches first
  if (ALLOWED_CAMERA_ROUTES.some((route) => pathname === route)) {
    return true;
  }

  // Check pattern matches for dynamic routes
  const patterns = [
    /^\/assessments\/[^/]+\/take$/,
    /^\/assessments\/[^/]+\/device-check$/,
    /^\/mock-interview\/[^/]+\/take$/,
    /^\/mock-interview\/[^/]+\/device-check$/,
  ];

  return patterns.some((pattern) => pattern.test(pathname));
}

/**
 * Hook to guard camera access based on current route
 * Stops camera when navigating away from allowed routes
 */
export function useCameraRouteGuard() {
  const pathname = usePathname();

  useEffect(() => {
    // Check if current route allows camera
    const isAllowed = isCameraAllowedRoute(pathname);

    if (!isAllowed) {
      // Route doesn't allow camera, stop all media tracks
      // Use a small delay to ensure DOM cleanup happens first
      const timeoutId = setTimeout(() => {
        stopAllMediaTracks();
        // Also stop again after a short delay to catch any streams
        // that might be reattached or missed in the first pass
        setTimeout(() => {
          stopAllMediaTracks();
        }, 100);
      }, 50);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [pathname]);
}

