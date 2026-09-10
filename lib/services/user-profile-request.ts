import apiClient from "./api";
import { config } from "../config";

/**
 * One user-profile request per boot, shared by every caller.
 *
 * `/accounts/clients/<id>/user-profile/` was requested twice on every authenticated page load:
 * AuthProvider (lib/auth/auth-context.tsx) and ProfileGateProvider
 * (lib/contexts/ProfileGateContext.tsx) are both mounted in the root layout and both called it,
 * through two different services that happen to hit the identical URL. At the measured backend
 * latency of 120-340 ms that is roughly a quarter-second added to every hard navigation, on
 * every route, for a byte-identical second copy.
 *
 * The window is deliberately short. This is not a data cache -- it exists to collapse the
 * concurrent boot fan-out. A later navigation re-fetches, so nothing goes stale in the UI.
 */
const BOOT_WINDOW_MS = 5_000;

/**
 * Generic on purpose. accounts.service and profile.service each declare their OWN `UserProfile`
 * for this one endpoint, and the shapes differ (accounts' has id/user_name/phone). Picking
 * either would force a cast on the other caller, so each states the shape it expects, exactly
 * as both did when they made the request themselves.
 */
let inflight: Promise<unknown> | null = null;
let cached: unknown = null;
let cachedAt = 0;

/**
 * Callers get their OWN shallow copy.
 *
 * auth-context assigns to `userProfile.role` when the API omits it. Handing every caller the
 * same object would let that write land in ProfileGate's copy too -- a shared-mutable-state bug
 * that would only show up for users whose profile has no role, which is exactly the case that
 * code path exists for.
 */
function copy<T>(p: T): T {
  return { ...(p as object) } as T;
}

export async function fetchUserProfileOnce<T>(): Promise<T> {
  if (cached && Date.now() - cachedAt < BOOT_WINDOW_MS) return copy(cached as T);
  if (inflight) return (inflight as Promise<T>).then(copy);

  inflight = apiClient
    .get<T>(`/accounts/clients/${config.clientId}/user-profile/`)
    .then((res) => {
      cached = res.data;
      cachedAt = Date.now();
      return res.data;
    })
    .finally(() => {
      inflight = null;
    });

  return (inflight as Promise<T>).then(copy);
}

/** Drop the boot copy — after a profile edit, or on sign-out. */
export function resetUserProfileCache(): void {
  cached = null;
  cachedAt = 0;
  inflight = null;
}
