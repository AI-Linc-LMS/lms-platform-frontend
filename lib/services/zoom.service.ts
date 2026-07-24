import apiClient from "./api";
import { config } from "../config";

/** Zoom credentials per client (GET/PUT .../accounts/clients/<id>/zoom-credentials/) */
/** GET never returns zoom_client_secret. */
export interface ZoomCredentials {
  id?: number;
  account_id?: string | null;
  zoom_client_id?: string | null;
  zoom_client_secret?: string | null;
  zoom_webhook_secret?: string | null;
  is_active?: boolean;
  timezone?: string | null;
  webhook_configured?: boolean;
  webhook_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** OAuth ("Connect Zoom") connection state, returned alongside the credentials. */
export interface ZoomConnection {
  mode: "s2s" | "oauth";
  connected: boolean;
  connected_email?: string | null;
  connected_at?: string | null;
  needs_reconnect?: boolean;
}

/** GET response: zoom_credentials is null when client has no config yet. */
export interface GetZoomCredentialsResponse {
  zoom_credentials: ZoomCredentials | null;
  zoom_connection?: ZoomConnection | null;
  /** Whether the platform Zoom OAuth app is configured on the server (→ show the Connect button). */
  oauth_available?: boolean;
}

export interface ZoomStatus {
  credentials: ZoomCredentials | null;
  connection: ZoomConnection | null;
  oauthAvailable: boolean;
}

interface ZoomConnectResponse {
  authorize_url: string;
}

/** PUT success response (201 create / 200 update). */
export interface PutZoomCredentialsResponse {
  message?: string;
  zoom_credentials: ZoomCredentials;
}

export const zoomService = {
  getZoomCredentials: async (): Promise<ZoomCredentials | null> => {
    const response = await apiClient.get<GetZoomCredentialsResponse>(
      `/accounts/clients/${config.clientId}/zoom-credentials/`
    );
    return response.data.zoom_credentials ?? null;
  },

  putZoomCredentials: async (
    data: Partial<ZoomCredentials>
  ): Promise<ZoomCredentials> => {
    const response = await apiClient.put<PutZoomCredentialsResponse>(
      `/accounts/clients/${config.clientId}/zoom-credentials/`,
      data
    );
    return response.data.zoom_credentials;
  },

  /** Full Zoom status: credentials + OAuth connection + whether one-click Connect is available. */
  getZoomStatus: async (): Promise<ZoomStatus> => {
    const response = await apiClient.get<GetZoomCredentialsResponse>(
      `/accounts/clients/${config.clientId}/zoom-credentials/`
    );
    return {
      credentials: response.data.zoom_credentials ?? null,
      connection: response.data.zoom_connection ?? null,
      oauthAvailable: Boolean(response.data.oauth_available),
    };
  },

  /**
   * Begin the one-click "Connect Zoom" consent flow. Returns the Zoom authorize URL - the caller
   * redirects the browser to it. `returnTo` is where Zoom's callback bounces back (a relative admin
   * path; defaults to /admin/live-sessions).
   */
  startZoomConnect: async (returnTo = "/admin/live-sessions"): Promise<string> => {
    const response = await apiClient.post<ZoomConnectResponse>(
      `/accounts/clients/${config.clientId}/zoom-credentials/connect/`,
      { return_to: returnTo }
    );
    return response.data.authorize_url;
  },

  /** Disconnect Zoom (revoke + clear the stored refresh token). */
  disconnectZoom: async (): Promise<void> => {
    await apiClient.delete(`/accounts/clients/${config.clientId}/zoom-credentials/`);
  },
};
