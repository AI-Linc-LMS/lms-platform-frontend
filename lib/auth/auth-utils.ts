import Cookies from "js-cookie";
import {
  isCourseManagerRole as isCourseManagerRoleNormalized,
  normalizeRole,
} from "./role-utils";

/** Normalize API/cookie role strings (e.g. "Course Manager" → "course_manager"). */
export function normalizeUserRole(role: string | null | undefined): string {
  return normalizeRole(role);
}

export const isCourseManagerRole = isCourseManagerRoleNormalized;

export const authUtils = {
  getAccessToken: (): string | undefined => {
    return Cookies.get("access_token");
  },

  getRefreshToken: (): string | undefined => {
    return Cookies.get("refresh_token");
  },

  getUserRole: (): string | undefined => {
    return Cookies.get("user_role");
  },

  setTokens: (access: string, refresh: string): void => {
    Cookies.set("access_token", access, { expires: 7 });
    Cookies.set("refresh_token", refresh, { expires: 30 });
  },

  setUserRole: (role: string): void => {
    Cookies.set("user_role", role, { expires: 30 });
  },

  clearTokens: (): void => {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    Cookies.remove("user_role");
  },

  /**
   * Is there a session to restore? The access token cookie lasts 7 days and the refresh token 30,
   * so a learner returning after a week has only the refresh token - and is still signed in: the
   * API client trades it for a new access token on the first request. `isAuthenticated` alone
   * called that person signed out, which is how the sidebar came up empty on return (no user, so
   * no role, so no items) until a manual reload found the access token the dashboard's own
   * requests had meanwhile refreshed.
   */
  hasSession: (): boolean => {
    return !!(Cookies.get("access_token") || Cookies.get("refresh_token"));
  },

  isAuthenticated: (): boolean => {
    return !!Cookies.get("access_token");
  },
};
