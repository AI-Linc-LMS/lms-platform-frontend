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

/** The backend's code for "this person is not a member of this institution" (accounts/login_gate.py). */
export const LOGIN_NOT_PERMITTED_CODE = "login_not_permitted";

/** The `reason` the login page is sent after a session the server stopped honouring is dropped. */
export const NOT_PERMITTED_REASON = "not_permitted";

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

/**
 * Drop a session the server has stopped honouring and send the person to sign in with the reason.
 *
 * Raised by the API client when an AUTHENTICATED request is answered 403 `login_not_permitted`:
 * an admin removed this person from the institution, or the institution now admits only people an
 * admin added and they never were one. The backend answers every request that way from then on,
 * so, as with the deactivation latch above, the tokens are cleared here rather than at the call
 * site: a shell that still looks signed in and fails on everything it touches is the failure mode
 * this exists to prevent. Not raised on the sign-in page itself, whose own form explains the
 * refusal.
 */
export function signOutNotPermitted() {
  authUtils.clearTokens();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.href = `/login?reason=${NOT_PERMITTED_REASON}`;
  }
}
