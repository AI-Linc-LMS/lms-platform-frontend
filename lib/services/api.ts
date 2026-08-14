import axios, {
  AxiosInstance,
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from "axios";
import Cookies from "js-cookie";
import { config } from "../config";
import { getClientDeviceClass } from "../utils/assessment-device";
import {
  markTenantDeactivated,
  TENANT_INACTIVE_CODE,
} from "../auth/tenant-status";

// Create axios instance.
// A request timeout is essential: without it a slow/hung prod endpoint (or a flaky network)
// leaves the XHR pending forever, which surfaces to the UI as a confusing "Network Error"
// while navigating. A bounded timeout fails fast so callers can show a real/retryable state.
const apiClient: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 45000,
});

// Module flag so the response interceptor and any caller can tell that a
// logout is in progress. While set, 401s from in-flight requests are
// swallowed silently - the page is about to be replaced by /login anyway,
// and surfacing "Authentication credentials were not provided" toasts from
// half-completed dashboard fetches just confuses the user.
let isLoggingOut = false;
export function setLoggingOut(value: boolean) {
  isLoggingOut = value;
}
export function getIsLoggingOut() {
  return isLoggingOut;
}

// Single-flight token refresh. When many requests fire at once (e.g. navigating into adaptive
// content fans out dashboard/journey/leaderboard calls) and the access token has expired, they
// all 401 together. Without this gate each would POST /token/refresh independently - a stampede
// that, with ROTATE_REFRESH_TOKENS on, races a rotated refresh token and logs the user out.
// This collapses concurrent refreshes into one shared promise.
let refreshPromise: Promise<string> | null = null;

// Refresh this many seconds BEFORE the access token actually expires, so a request never has to
// pay the 401 -> refresh -> retry round-trip on its critical path.
const REFRESH_SKEW_SECONDS = 90;

/** Read the `exp` claim (seconds since epoch) from a JWT without verifying its signature. */
function readJwtExp(token: string): number | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = JSON.parse(atob(padded));
    return typeof json.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

/** True when the token is missing, unreadable, expired, or expires within the skew window. */
function isAccessTokenStale(token: string | undefined): boolean {
  if (!token) return false; // No token at all -> nothing to refresh (public/logged-out calls).
  const exp = readJwtExp(token);
  if (exp == null) return false; // Unreadable -> let the reactive 401 path handle it.
  return exp - Date.now() / 1000 <= REFRESH_SKEW_SECONDS;
}

/**
 * Run (or join) the single-flight refresh. Shared by the PROACTIVE request-interceptor path and the
 * REACTIVE 401 path so concurrent callers can never stampede /token/refresh (which, with
 * ROTATE_REFRESH_TOKENS on, would race a rotated token and log the user out).
 */
function runRefresh(refreshToken: string): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${config.apiBaseUrl}/accounts/token/refresh/`, { refresh: refreshToken })
      .then((response) => {
        const { access } = response.data;
        Cookies.set("access_token", access, { expires: 7 });
        return access as string;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * Ensure a usable access token BEFORE a request goes out.
 *
 * Why this exists: refresh used to be purely reactive (only on a 401). After the tab sat idle past
 * the access-token lifetime, the first navigation fanned out N requests that ALL 401'd, queued
 * behind one refresh, then ALL retried — so the first interaction after returning cost a double
 * round-trip on every call and felt like the app had hung. Refreshing proactively (once, ahead of
 * expiry) makes a stale return cost the same as a warm one.
 *
 * Returns the token to use, or undefined to send the request as-is.
 */
export async function ensureFreshAccessToken(): Promise<string | undefined> {
  const token = Cookies.get("access_token");
  if (!isAccessTokenStale(token)) return token;
  const refreshToken = Cookies.get("refresh_token");
  if (!refreshToken || isLoggingOut) return token;
  try {
    return await runRefresh(refreshToken);
  } catch {
    // Let the request proceed; the reactive 401 path owns the logout/redirect decision so the
    // failure is handled in exactly one place.
    return Cookies.get("access_token");
  }
}

// Request interceptor to add auth token and fix FormData uploads
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const method = (config.method || "get").toLowerCase();
    // Proactively refresh an expired/expiring token so this request doesn't pay 401 -> refresh ->
    // retry. Single-flight, so a fan-out of calls after an idle return costs ONE refresh total.
    const token = await ensureFreshAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Only set JSON content-type for methods that send request bodies.
    if (
      config.headers &&
      ["post", "put", "patch", "delete"].includes(method) &&
      !(config.data instanceof FormData) &&
      !config.headers["Content-Type"]
    ) {
      config.headers["Content-Type"] = "application/json";
    }
    // When sending FormData, remove Content-Type so the browser sets it with the correct boundary.
    if (config.data instanceof FormData && config.headers) {
      const h = config.headers;
      if (h instanceof AxiosHeaders) {
        h.delete("Content-Type");
        h.delete("content-type");
      } else {
        const rec = h as Record<string, unknown>;
        delete rec["Content-Type"];
        delete rec["content-type"];
      }
    }
    const path = `${config.baseURL ?? ""}${config.url ?? ""}`;
    if (
      typeof window !== "undefined" &&
      path.includes("/assessment/api/client/") &&
      !path.includes("/active-assessments/") &&
      config.headers
    ) {
    }
    
    // config.headers["X-Client-Device-Type"] = getClientDeviceClass();
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // The institution has been deactivated. The backend answers EVERY request with this code
    // while that lasts, so there is nothing to retry and nothing a caller could usefully show.
    // Latch the app into the deactivated screen and swallow the rejection: a settled rejection
    // here lets each in-flight widget stack its own "something went wrong" toast on top of the
    // one screen that is already explaining the real reason.
    const body = error.response?.data as { code?: string } | undefined;
    if (error.response?.status === 403 && body?.code === TENANT_INACTIVE_CODE) {
      markTenantDeactivated();
      return new Promise(() => {});
    }

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If a logout is in progress, drop the error silently. The page is
      // already navigating to /login; a refresh attempt or a surfaced
      // "credentials not provided" detail would just race the redirect.
      if (isLoggingOut) {
        return new Promise(() => {});
      }
      originalRequest._retry = true;

      const refreshToken = Cookies.get("refresh_token");
      if (refreshToken) {
        try {
          // Reuse the shared single-flight (also used by the proactive path above).
          const access = await runRefresh(refreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access}`;
          }

          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// Warm the token the moment the tab becomes visible again, so returning after a long idle finds a
// valid token already in place instead of refreshing on the critical path of the first click.
// Fire-and-forget + single-flight: at most one refresh, and it never blocks anything.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !isLoggingOut) {
      void ensureFreshAccessToken();
    }
  });
}

export default apiClient;
