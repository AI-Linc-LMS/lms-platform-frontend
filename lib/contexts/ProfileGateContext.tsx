"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { profileService, type ProfileCompletion } from "@/lib/services/profile.service";

/**
 * Whether this learner's profile is complete, and what stays locked until it is.
 *
 * ONE fetch, ONE answer. Both the dashboard widget and the module locks read from here, so the
 * percentage on screen and the modules the API will actually allow can never disagree.
 *
 * `status` matters as much as the data. Everything that renders a lock must wait for `"ready"`,
 * or a learner with a complete profile sees a lock flash on every page load — which reads as the
 * product being broken rather than as loading.
 */

interface ProfileGateValue {
  status: "loading" | "ready" | "error";
  completion: ProfileCompletion | null;
  /** True while loading, so nothing locks before we know. Optimistic ON PURPOSE — see below. */
  isComplete: boolean;
  percentage: number;
  lockedModules: string[];
  missingFields: string[];
  refresh: () => Promise<void>;
  /**
   * Take the server's word for it. When a module endpoint 403s with
   * `{code: "profile_incomplete", missing_fields}`, that is authoritative even if our cached
   * completion says otherwise — the cache can be stale, the API cannot.
   */
  applyServerLock: (body: { missing_fields?: string[]; detail?: string }) => void;
}

const ProfileGateContext = createContext<ProfileGateValue | null>(null);

export function ProfileGateProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [completion, setCompletion] = useState<ProfileCompletion | null>(null);
  const loading = useRef(false);

  const load = useCallback(async () => {
    if (loading.current) return;
    loading.current = true;
    try {
      const profile = await profileService.getUserProfile();
      setCompletion(profile?.profile_completion ?? null);
      setStatus("ready");
    } catch {
      // Fail OPEN. This gate shapes a product flow; it does not protect data — the backend
      // enforces the real rule on every endpoint. Locking someone out because a profile fetch
      // hiccuped would be a self-inflicted outage.
      setCompletion(null);
      setStatus("error");
    } finally {
      loading.current = false;
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const applyServerLock = useCallback((body: { missing_fields?: string[] }) => {
    setCompletion((prev) => ({
      percentage: prev?.percentage ?? 0,
      is_complete: false,
      exempt: false,
      required_fields: prev?.required_fields ?? [],
      missing_fields: body.missing_fields ?? prev?.missing_fields ?? [],
      locked_modules: prev?.locked_modules?.length
        ? prev.locked_modules
        : ["resume", "jobs", "interview"],
    }));
    setStatus("ready");
  }, []);

  const value = useMemo<ProfileGateValue>(() => {
    // Until we know, treat the profile as complete. A brief flash of "locked" on a page the
    // learner is entitled to is worse than a brief flash of "open" on one they are not — the
    // server refuses the request either way.
    const known = status === "ready" && completion !== null;
    return {
      status,
      completion,
      isComplete: known ? completion.is_complete || completion.exempt : true,
      percentage: completion?.percentage ?? 0,
      lockedModules: known && !completion.is_complete ? completion.locked_modules : [],
      missingFields: completion?.missing_fields ?? [],
      refresh: load,
      applyServerLock,
    };
  }, [status, completion, load, applyServerLock]);

  return <ProfileGateContext.Provider value={value}>{children}</ProfileGateContext.Provider>;
}

export function useProfileGate(): ProfileGateValue {
  const ctx = useContext(ProfileGateContext);
  if (ctx) return ctx;
  // Rendered outside the provider (an admin surface, a public page). Report "nothing is locked"
  // rather than throwing — a missing provider must never blank a page.
  return {
    status: "ready",
    completion: null,
    isComplete: true,
    percentage: 0,
    lockedModules: [],
    missingFields: [],
    refresh: async () => {},
    applyServerLock: () => {},
  };
}

/** True when `moduleKey` ("resume" | "jobs" | "interview") is locked for this learner. */
export function useModuleLocked(moduleKey: string): { locked: boolean; ready: boolean } {
  const { lockedModules, status } = useProfileGate();
  return { locked: lockedModules.includes(moduleKey), ready: status !== "loading" };
}
