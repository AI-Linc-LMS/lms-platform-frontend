import Cookies from "js-cookie";
import { config } from "@/lib/config";

/**
 * The local profile cache — keyed by USER, and cleared when they leave.
 *
 * It used to be keyed by tenant alone (`user_profile_extra_<clientId>`), which meant one browser
 * had one profile cache shared by every account that ever signed in on it. Sign out, sign up as
 * somebody new, and the profile page merged the previous person's name, phone and date of birth
 * into the new account's empty fields — and the community page built post authors from the same
 * blob. Pressing Save then wrote that data to the new account for real.
 *
 * Two independent defences, because either alone is not enough:
 *   1. The key includes the user id from the access token, so two accounts cannot collide even
 *      if the cache is never cleared.
 *   2. `clearProfileCache()` runs on logout, so nothing is left behind on a shared machine.
 *
 * Legacy tenant-only keys are deleted on first read. They belong to whoever used the browser
 * before and must never be merged into anyone.
 */

const PREFIX = "user_profile_extra";

/** The `user_id` claim from the access token, or null when signed out. */
function currentUserId(): string | null {
  try {
    const token = Cookies.get("access_token");
    if (!token) return null;
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(
      decodeURIComponent(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join(""),
      ),
    );
    const id = json.user_id ?? json.userId ?? json.sub ?? null;
    return id === null || id === undefined ? null : String(id);
  } catch {
    return null;
  }
}

function legacyKey(): string {
  return `${PREFIX}_${config.clientId}`;
}

/** Null when we cannot identify the user — in which case nothing is read or written. */
export function profileCacheKey(): string | null {
  const uid = currentUserId();
  return uid ? `${PREFIX}_${config.clientId}_u${uid}` : null;
}

/** Remove any pre-user-scoping cache. It cannot be attributed to anyone, so it cannot be used. */
function dropLegacy(): void {
  try {
    localStorage.removeItem(legacyKey());
  } catch {
    // storage unavailable
  }
}

export function loadProfileCache<T extends object>(): Partial<T> {
  if (typeof window === "undefined") return {};
  dropLegacy();
  const key = profileCacheKey();
  // No identifiable user => no cache. Returning {} is the safe answer: showing SOMEONE's data
  // is worse than showing none.
  if (!key) return {};
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Partial<T>) : {};
  } catch {
    return {};
  }
}

export function saveProfileCache<T extends object>(data: Partial<T>): void {
  if (typeof window === "undefined") return;
  const key = profileCacheKey();
  if (!key) return;
  try {
    const existing = loadProfileCache<T>();
    localStorage.setItem(key, JSON.stringify({ ...existing, ...data }));
  } catch {
    // storage unavailable
  }
}

/** Called on logout. Clears this user's cache and any legacy blob still lying around. */
export function clearProfileCache(): void {
  if (typeof window === "undefined") return;
  try {
    const key = profileCacheKey();
    if (key) localStorage.removeItem(key);
    dropLegacy();
    // Belt and braces: sweep every profile cache on this device. Logging out on a shared
    // machine should not leave another account's details recoverable.
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) localStorage.removeItem(k);
    }
  } catch {
    // storage unavailable
  }
}
