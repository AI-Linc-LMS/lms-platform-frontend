import Cookies from "js-cookie";

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

  isAuthenticated: (): boolean => {
    return !!Cookies.get("access_token");
  },
};
