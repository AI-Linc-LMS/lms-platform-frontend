"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  accountsService,
  UserProfile,
  type AuthResponse,
} from "../services/accounts.service";
import { authUtils } from "./auth-utils";
import { clearResumeData } from "@/components/profile/resume/utils";
import { clearTimeTrackingSession } from "../services/activity.service";
import { setLoggingOut } from "../services/api";
import { clearProfileCache } from "@/lib/utils/profile-cache";
import { AuthCelebration } from "@/components/common/AuthCelebration";

export type AuthLoginResult =
  | { profileActive: true }
  | { profileActive: false; inactiveMessage: string };

function isLoginResponseProfileActive(data: {
  is_profile_active?: boolean;
  user?: { is_profile_active?: boolean };
}): boolean {
  if (data.is_profile_active === false) return false;
  if (data.user?.is_profile_active === false) return false;
  return true;
}

function mapResponseUserToProfile(u: AuthResponse["user"]): UserProfile {
  const role = u.role || authUtils.getUserRole() || "";
  let first = u.first_name || "";
  let last = u.last_name || "";
  if (!first && !last && u.full_name?.trim()) {
    const parts = u.full_name.trim().split(/\s+/);
    first = parts[0] || "";
    last = parts.slice(1).join(" ") || "";
  }
  return {
    id: u.id || 0,
    user_name: u.user_name || u.username || u.email,
    first_name: first,
    last_name: last,
    email: u.email,
    phone: u.phone_number || "",
    profile_picture: u.profile_picture || u.profile_pic_url || "",
    role,
    is_profile_active: u.is_profile_active,
  };
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  /** True when user is signed in and user-profile API reports anything other than `is_profile_active: true`. */
  requiresProfileActivation: boolean;
  /** Server message from last login when profile was inactive; UI may fall back to i18n default. */
  profileInactiveMessage: string | null;
  login: (email: string, password: string) => Promise<AuthLoginResult>;
  googleLogin: (token: string) => Promise<AuthLoginResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  /**
   * The sign-in / sign-out tick, owned here rather than by any one screen.
   *
   * It lived in the login page and in AppBar as local state, which meant every NEW way of signing
   * in or out silently shipped without it: Google sign-in showed a toast, and a logout triggered
   * anywhere other than the AppBar menu showed nothing at all. Two rounds of per-component fixes
   * missed paths for exactly that reason.
   *
   * Awaiting this both plays the animation and holds the caller, so the navigation that follows
   * cannot tear the tick down before it has painted.
   */
  celebrate: (kind: "signin" | "signout") => Promise<void>;
  /** True while the tick is on screen. Redirect effects must stand down while it is. */
  celebrating: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMounted, setIsMounted] = useState(false);
  const [requiresProfileActivation, setRequiresProfileActivation] =
    useState(false);
  const [profileInactiveMessage, setProfileInactiveMessage] = useState<
    string | null
  >(null);
  const [celebration, setCelebration] = useState<"signin" | "signout" | null>(null);
  /**
   * An auth flow is in progress: a sign-in request is in flight, or its tick is still playing.
   *
   * Redirect effects must stand down while this is true. It is raised INSIDE login()/googleLogin(),
   * before the request, because the effect on the login page fires the instant isAuthenticated
   * flips — which is earlier than any state a caller could set after its await resolves. Raising
   * it in the provider is also what lets a child component like the Google button participate:
   * it cannot reach into the login page's state, but it goes through this function.
   */
  const [authBusy, setAuthBusy] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (authUtils.isAuthenticated()) {
      const roleFromCookie = authUtils.getUserRole();
      if (roleFromCookie) {
        setUser({
          id: 0,
          user_name: "",
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          profile_picture: "",
          role: roleFromCookie,
        });
      }
    }
  }, [isMounted]);

  const loadUser = async () => {
    if (!authUtils.isAuthenticated()) {
      setRequiresProfileActivation(false);
      setProfileInactiveMessage(null);
      setLoading(false);
      return;
    }

    try {
      const userProfile = await accountsService.getUserProfile();
      if (!userProfile.role) {
        const roleFromCookie = authUtils.getUserRole();
        if (roleFromCookie) {
          userProfile.role = roleFromCookie;
        }
      }

      const active = userProfile.is_profile_active === true;
      setRequiresProfileActivation(!active);
      if (active) {
        setProfileInactiveMessage(null);
      }

      setUser(userProfile);
    } catch {
      const roleFromCookie = authUtils.getUserRole();
      if (roleFromCookie) {
        setUser({
          id: 0,
          user_name: "",
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          profile_picture: "",
          role: roleFromCookie,
        });
        setRequiresProfileActivation(false);
      } else {
        authUtils.clearTokens();
        setUser(null);
        setRequiresProfileActivation(false);
        setProfileInactiveMessage(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted) {
      loadUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  const login = async (email: string, password: string) => {
    setLoggingOut(false);
    setAuthBusy(true);
    let response;
    try {
      response = await accountsService.login({ email, password });
    } catch (err) {
      // Released on failure, or a wrong password would leave every redirect effect frozen.
      setAuthBusy(false);
      throw err;
    }

    if (!isLoginResponseProfileActive(response)) {
      const msg = response.inactive_message?.trim() || null;
      setRequiresProfileActivation(true);
      setProfileInactiveMessage(msg);
      if (response.user) {
        setUser(mapResponseUserToProfile(response.user));
      }
      setLoading(false);
      // An inactive profile is not a celebration; the caller routes to the blocker instead.
      setAuthBusy(false);
      return {
        profileActive: false as const,
        inactiveMessage: response.inactive_message?.trim() ?? "",
      };
    }

    setProfileInactiveMessage(null);
    await loadUser();
    return { profileActive: true as const };
  };

  const googleLogin = async (token: string) => {
    setLoggingOut(false);
    setAuthBusy(true);
    let response;
    try {
      response = await accountsService.googleLogin(token);
    } catch (err) {
      // Released on failure, or a wrong password would leave every redirect effect frozen.
      setAuthBusy(false);
      throw err;
    }

    if (!isLoginResponseProfileActive(response)) {
      const msg = response.inactive_message?.trim() || null;
      setRequiresProfileActivation(true);
      setProfileInactiveMessage(msg);
      if (response.user) {
        setUser(mapResponseUserToProfile(response.user));
      }
      setLoading(false);
      // An inactive profile is not a celebration; the caller routes to the blocker instead.
      setAuthBusy(false);
      return {
        profileActive: false as const,
        inactiveMessage: response.inactive_message?.trim() ?? "",
      };
    }

    setProfileInactiveMessage(null);
    await loadUser();
    return { profileActive: true as const };
  };

  /**
   * Play the tick and hold until it has been seen.
   *
   * 950ms is the animation window: the ring closes and the check finishes stroking by ~700ms,
   * and the remainder keeps the completed mark on screen long enough to register as a
   * confirmation rather than a flicker. Callers await this BEFORE navigating.
   *
   * Under prefers-reduced-motion there is nothing to draw, so the hold collapses to a brief
   * acknowledgement rather than making that user wait out an animation they are not getting.
   */
  const showTick = useCallback((kind: "signin" | "signout") => {
    setCelebration(kind);
    const reduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Resolves when the mark has finished drawing. Returned rather than awaited so a caller can
    // put the tick up FIRST and do its work underneath it.
    return new Promise((r) => setTimeout(r, reduced ? 300 : 950));
  }, []);

  const celebrate = useCallback(
    async (kind: "signin" | "signout") => {
      await showTick(kind);
      // Deliberately NOT cleared here. The caller navigates immediately after awaiting, and
      // clearing first would flash the old screen for a frame between the tick and the new route.
      // AuthCelebration takes it down once the destination has mounted.
    },
    [showTick]
  );

  const logout = async () => {
    // Flag the in-progress logout before anything async or token-clearing
    // happens. The axios interceptor uses this to swallow 401s from
    // requests that were already in flight (dashboard widgets, polling
    // notifications, etc.) so the user doesn't see a "credentials not
    // provided" toast between clearTokens() and the /login redirect.
    setLoggingOut(true);
    // Up BEFORE the network call, not after it. Signing out hits the server, and a blank pause
    // with nothing on screen reads as a hang; the tick covers the whole operation instead of
    // appearing once it is already over. The two run concurrently and the wait below is whatever
    // is left of the animation, so a slow logout never adds to it.
    const drawn = showTick("signout");
    try {
      await accountsService.logout();
    } catch {
      /* ignore */
    } finally {
      authUtils.clearTokens();
      clearResumeData();
      clearTimeTrackingSession();
      if (typeof window !== "undefined") {
        localStorage.removeItem("admin_mode");
        // The profile cache is per-user, but it must not survive a logout on a shared machine.
        clearProfileCache();
      }
      setUser(null);
      setRequiresProfileActivation(false);
      setProfileInactiveMessage(null);
    }
    await drawn;
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const isAuthenticated = isMounted
    ? !!user && authUtils.isAuthenticated()
    : false;

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    requiresProfileActivation,
    profileInactiveMessage,
    login,
    googleLogin,
    logout,
    refreshUser,
    celebrate,
    celebrating: celebration !== null || authBusy,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Rendered by the provider, above whatever is mounted. This is what makes the tick
          impossible to miss: it does not belong to the login page or to the AppBar, so it
          cannot be lost to an early return, a component that unmounts mid-navigation, or a
          new sign-in surface whose author did not know to wire it up. */}
      {celebration && (
        <AuthCelebration
          kind={celebration}
          onDone={() => {
            setCelebration(null);
            // End of the flow. Left raised, a later visit to /login while already signed in
            // would never redirect.
            setAuthBusy(false);
          }}
        />
      )}
    </AuthContext.Provider>
  );
};
