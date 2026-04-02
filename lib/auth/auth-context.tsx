"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
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
    const response = await accountsService.login({ email, password });

    if (!isLoginResponseProfileActive(response)) {
      const msg = response.inactive_message?.trim() || null;
      setRequiresProfileActivation(true);
      setProfileInactiveMessage(msg);
      if (response.user) {
        setUser(mapResponseUserToProfile(response.user));
      }
      setLoading(false);
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
    const response = await accountsService.googleLogin(token);

    if (!isLoginResponseProfileActive(response)) {
      const msg = response.inactive_message?.trim() || null;
      setRequiresProfileActivation(true);
      setProfileInactiveMessage(msg);
      if (response.user) {
        setUser(mapResponseUserToProfile(response.user));
      }
      setLoading(false);
      return {
        profileActive: false as const,
        inactiveMessage: response.inactive_message?.trim() ?? "",
      };
    }

    setProfileInactiveMessage(null);
    await loadUser();
    return { profileActive: true as const };
  };

  const logout = async () => {
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
      }
      setUser(null);
      setRequiresProfileActivation(false);
      setProfileInactiveMessage(null);
    }
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
