import apiClient from "./api";
import { config } from "../config";

/**
 * Per-client Google (Meet/Calendar) config.
 * GET/PUT/DELETE .../accounts/clients/<id>/google-credentials/
 * POST .../google-credentials/connect/ starts the "Connect Google" consent flow.
 * GET never returns google_client_secret or the refresh token.
 */
export interface GoogleCredentials {
  id?: number;
  is_active?: boolean;
  /** True once an admin has completed the OAuth consent (we hold a refresh token). */
  is_connected?: boolean;
  /** True when the tenant uses its own Google OAuth app instead of the platform default. */
  has_custom_app?: boolean;
  connected_email?: string | null;
  calendar_id?: string | null;
  timezone?: string | null;
  connected_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Fields the admin may set via PUT (per-tenant OAuth app is optional). */
export interface GoogleCredentialsInput {
  google_client_id?: string;
  google_client_secret?: string;
  calendar_id?: string;
  timezone?: string;
  is_active?: boolean;
}

interface GetGoogleCredentialsResponse {
  google_credentials: GoogleCredentials | null;
  /** The OAuth redirect URI to whitelist in Google Cloud Console (platform-wide, always present). */
  redirect_uri?: string;
}

/** Connection status + the redirect URI the admin must register in Google Cloud Console. */
export interface GoogleCredentialsStatus {
  credentials: GoogleCredentials | null;
  redirectUri: string;
}

interface PutGoogleCredentialsResponse {
  message?: string;
  google_credentials: GoogleCredentials;
}

interface ConnectResponse {
  authorize_url: string;
}

const BASE = `/accounts/clients/${config.clientId}/google-credentials`;

export const googleService = {
  getGoogleCredentials: async (): Promise<GoogleCredentialsStatus> => {
    const response = await apiClient.get<GetGoogleCredentialsResponse>(`${BASE}/`);
    return {
      credentials: response.data.google_credentials ?? null,
      redirectUri: response.data.redirect_uri ?? "",
    };
  },

  putGoogleCredentials: async (
    data: GoogleCredentialsInput
  ): Promise<GoogleCredentials> => {
    const response = await apiClient.put<PutGoogleCredentialsResponse>(`${BASE}/`, data);
    return response.data.google_credentials;
  },

  /** Disconnect the Google account (clears the stored refresh token). */
  disconnectGoogle: async (): Promise<void> => {
    await apiClient.delete(`${BASE}/`);
  },

  /**
   * Begin the "Connect Google" consent flow. Returns the Google authorize URL — the caller
   * should redirect the browser to it. `returnTo` is where Google's callback bounces back
   * (a relative admin path; defaults to /admin/live-sessions).
   */
  startConnect: async (returnTo = "/admin/live-sessions"): Promise<string> => {
    const response = await apiClient.post<ConnectResponse>(`${BASE}/connect/`, {
      return_to: returnTo,
    });
    return response.data.authorize_url;
  },
};
