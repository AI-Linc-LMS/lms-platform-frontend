"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { stopAllMediaTracks } from "@/lib/utils/cameraUtils";

/**
 * Routes where camera is allowed to be active.
 *
 * Note this guard is not only about the camera. `stopAllMediaTracks` also walks every
 * `<audio>` element and stops the tracks on its `srcObject`, which is exactly how a remote
 * WebRTC stream is attached. So a route missing from this list loses its microphone AND
 * its incoming audio. For the AI Tutor that means the tutor goes silent, with the mic
 * permission already granted, which reads to a learner as "it's broken".
 */
const ALLOWED_CAMERA_ROUTES = [
  "/assessments/[slug]/take",
  "/assessments/[slug]/device-check",
  "/mock-interview/[id]/take",
  "/mock-interview/[id]/device-check",
  "/adaptive-courses/[courseId]/interview/[interviewId]",
  "/ai-tutor/session/[id]",
  // The rebuilt interview room. It holds a microphone, an incoming WebRTC audio track and,
  // once proctoring is on, a camera. The guard fires on MOUNT of a route that is not listed,
  // not only on leaving one, so without this entry entering the room arms stopAllMediaTracks
  // against its own streams. It survived until now only because the remote audio element is
  // deliberately detached from the document and the mic lives on the peer connection rather
  // than an element; the moment a <video> is rendered here, the camera dies 50ms later.
  "/interview/room",
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
    /^\/adaptive-courses\/[^/]+\/interview\/[^/]+$/,
    // Trailing segments are matched too, so a recap or sub-route under a live session
    // cannot silently tear the audio down mid-lesson.
    /^\/ai-tutor\/session\/[^/]+/,
    // Trailing segments matched, same reasoning as the tutor above.
    /^\/interview\/room(\/|$)/,
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

