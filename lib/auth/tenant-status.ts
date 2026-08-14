"use client";

/**
 * Tenant deactivation store - a module-level flag (no provider) so the axios response
 * interceptor, which runs outside React, can put the whole app into the "workspace
 * deactivated" state. Mirrors lib/xp/xpCelebration.
 *
 * Kept in its own module rather than inside lib/services/api.ts so a component can subscribe
 * without importing axios, and so api.ts keeps importing nothing that reaches back into the
 * component tree.
 */
import { useSyncExternalStore } from "react";
import { authUtils } from "./auth-utils";

/** The backend's machine-readable code for "this institution has been deactivated". */
export const TENANT_INACTIVE_CODE = "tenant_inactive";

let deactivated = false;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
function getSnapshot() {
  return deactivated;
}

/**
 * Latch the app into the deactivated state and drop the session.
 *
 * One-way on purpose: nothing sets this back to false. It is only ever raised by a server that
 * is refusing every request, so a reactivated tenant needs a fresh load regardless, and a
 * resettable flag would let one stale in-flight response drop the user back into a shell whose
 * every call still 403s.
 *
 * Tokens are cleared here rather than at the call site so no future caller can raise the flag
 * and forget the sign-out: leaving them set lets the user walk back into a shell that looks
 * signed in and fails on everything it touches.
 */
export function markTenantDeactivated() {
  if (deactivated) return;
  deactivated = true;
  authUtils.clearTokens();
  listeners.forEach((l) => l());
}

/** True once the backend has answered any request with 403 `tenant_inactive`. */
export function isTenantDeactivated() {
  return deactivated;
}

export function useTenantDeactivated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
