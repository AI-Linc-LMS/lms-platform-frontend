"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { accountsService, UserProfile } from "../services/accounts.service";
import { authUtils } from "./auth-utils";
import { clearResumeData } from "@/components/profile/resume/utils";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (token: string) => Promise<void>;
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
  // Initialize with null to avoid hydration mismatch (cookies not available on server)
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted flag on client side only
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize user from cookie on client side only (after mount)
  useEffect(() => {
    if (!isMounted) return;

    // Set initial user from cookie if available (for immediate role-based checks)
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
      setLoading(false);
      return;
    }

    try {
      const userProfile = await accountsService.getUserProfile();
      // Ensure role is set from API or fallback to cookie
      if (!userProfile.role) {
        const roleFromCookie = authUtils.getUserRole();
        if (roleFromCookie) {
          userProfile.role = roleFromCookie;
        }
      }
      setUser(userProfile);
    } catch (error) {
      // If API fails, try to get role from cookie for basic role-based checks
      const roleFromCookie = authUtils.getUserRole();
      if (roleFromCookie) {
        // Set minimal user data with role from cookie
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
      } else {
        authUtils.clearTokens();
        setUser(null);
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
    // Tokens are already stored in cookies by accountsService
    // Use the user object from response if available, otherwise fetch from API
    if (response.user) {
      // Get role from response or fallback to cookie (in case response doesn't have it)
      const roleFromResponse = response.user.role;
      const roleFromCookie = authUtils.getUserRole();
      const userRole = roleFromResponse || roleFromCookie || "";

      // Map the user object to UserProfile format
      setUser({
        id: response.user.id || 0,
        first_name: response.user.first_name || "",
        last_name: response.user.last_name || "",
        email: response.user.email || "",
        phone: response.user.phone_number || "",
        user_name:
          response.user.user_name ||
          response.user.username ||
          response.user.email,
        profile_picture: response.user.profile_picture || "",
        role: userRole,
      });
      setLoading(false);
    } else {
      await loadUser();
    }
  };

  const googleLogin = async (token: string) => {
    const response = await accountsService.googleLogin(token);
    // Tokens are already stored in cookies by accountsService
    // Use the user object from response if available, otherwise fetch from API
    if (response.user) {
      // Get role from response or fallback to cookie (in case response doesn't have it)
      const roleFromResponse = response.user.role;
      const roleFromCookie = authUtils.getUserRole();
      const userRole = roleFromResponse || roleFromCookie || "";

      // Map the user object to UserProfile format
      setUser({
        id: response.user.id || 0,
        first_name: response.user.first_name || "",
        last_name: response.user.last_name || "",
        email: response.user.email || "",
        phone: response.user.phone_number || "",
        user_name:
          response.user.user_name ||
          response.user.username ||
          response.user.email,
        profile_picture: response.user.profile_picture || "",
        role: userRole,
      });
      setLoading(false);
    } else {
      await loadUser();
    }
  };

  const logout = async () => {
    try {
      await accountsService.logout();
    } catch (error) {
      // Logout error
    } finally {
      authUtils.clearTokens();
      clearResumeData(); // Clear saved resume data from localStorage
      setUser(null);
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  // Only check authentication on client side to avoid hydration mismatch
  const isAuthenticated = isMounted
    ? !!user && authUtils.isAuthenticated()
    : false;

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    login,
    googleLogin,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
