import apiClient from "./api";

export interface WizardState {
  client_id: number;
  organisation_name: string;
  subdomain: string;
  setup_completed: boolean;
  setup_step: number;
  total_steps: number;
  wizard_state: Record<string, any>;
  logo_url: string | null;
  contact_email: string | null;
}

export interface UploadAssetResponse {
  url: string;
  kind: string;
  filename: string;
}

export const wizardService = {
  async getState(): Promise<WizardState> {
    const res = await apiClient.get<WizardState>("/api/tenant/wizard/state/");
    return res.data;
  },

  async saveState(payload: {
    wizard_state?: Record<string, any>;
    setup_step?: number;
  }): Promise<WizardState> {
    const res = await apiClient.patch<WizardState>(
      "/api/tenant/wizard/state/",
      payload
    );
    return res.data;
  },

  async uploadAsset(file: File, kind: string): Promise<UploadAssetResponse> {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    const res = await apiClient.post<UploadAssetResponse>(
      "/api/tenant/wizard/upload-asset/",
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data;
  },

  async launch(
    finalState?: Record<string, any>
  ): Promise<WizardState> {
    const res = await apiClient.post<WizardState>(
      "/api/tenant/wizard/launch/",
      finalState ? { wizard_state: finalState } : {}
    );
    return res.data;
  },
};
