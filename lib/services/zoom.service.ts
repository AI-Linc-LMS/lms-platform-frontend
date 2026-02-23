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

/** GET response: zoom_credentials is null when client has no config yet. */
export interface GetZoomCredentialsResponse {
  zoom_credentials: ZoomCredentials | null;
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
};
