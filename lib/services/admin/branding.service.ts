import apiClient from "../api";
import { config } from "@/lib/config";

export interface BrandingPresetPreview {
  sidebar: string;
  primary: string;
  active: string;
  surface: string;
}

export interface BrandingPresetSummary {
  id: string;
  label: string;
  /** classic | vibrant | high_contrast */
  category?: string;
  tagline?: string;
  preview?: BrandingPresetPreview;
}

export interface BrandingGetResponse {
  theme_settings: Record<string, string>;
  login_img_url: string | null;
  login_logo_url: string | null;
  theme_preset_id: string | null;
}

export interface BrandingPatchBody {
  theme_preset_id?: string;
  theme_settings?: Record<string, string>;
  login_img_url?: string | null;
  login_logo_url?: string | null;
}

const clientId = () => Number(config.clientId);

export async function fetchBrandingPresets(): Promise<BrandingPresetSummary[]> {
  const { data } = await apiClient.get<{ presets: BrandingPresetSummary[] }>(
    "/admin-dashboard/api/branding/presets/"
  );
  return data.presets ?? [];
}

export async function fetchBrandingPresetDetail(presetId: string) {
  const { data } = await apiClient.get<{
    id: string;
    label: string;
    theme_settings: Record<string, string>;
  }>(`/admin-dashboard/api/branding/presets/${presetId}/`);
  return data;
}

export async function fetchClientBranding(): Promise<BrandingGetResponse> {
  const { data } = await apiClient.get<BrandingGetResponse>(
    `/admin-dashboard/api/clients/${clientId()}/branding/`
  );
  return data;
}

export async function patchClientBranding(
  body: BrandingPatchBody
): Promise<BrandingGetResponse & { message?: string }> {
  const { data } = await apiClient.patch(
    `/admin-dashboard/api/clients/${clientId()}/branding/`,
    body
  );
  return data;
}

export async function uploadLoginBackground(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await apiClient.post<{
    id: number;
    url: string | null;
    filename: string;
    module: string;
  }>(`/admin-dashboard/api/clients/${clientId()}/branding/login-background/`, fd);
  return data;
}
