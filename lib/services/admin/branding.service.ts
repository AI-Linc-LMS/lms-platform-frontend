import apiClient from "../api";
import { config } from "@/lib/config";
import axios from "axios";

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
  /** Shared id between default and white-bg variants of the same theme. */
  base_id?: string;
  /** default | white_bg */
  variant?: string;
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
const BRANDING_URL_MAX_LEN = 200;
const ALLOWED_THEME_KEYS = new Set([
  "primary50",
  "primary100",
  "primary200",
  "primary300",
  "primary400",
  "primary500",
  "primary600",
  "primary700",
  "primary800",
  "primary900",
  "secondary50",
  "secondary100",
  "secondary200",
  "secondary300",
  "secondary400",
  "secondary500",
  "secondary600",
  "secondary700",
  "navBackground",
  "navSelected",
  "fontDarkNav",
  "fontLightNav",
  "accentYellow",
  "accentBlue",
  "accentGreen",
  "accentRed",
  "accentOrange",
  "accentTeal",
  "accentPurple",
  "accentPink",
  "neutral50",
  "neutral100",
  "neutral200",
  "neutral300",
  "neutral400",
  "neutral500",
  "neutral600",
  "neutral700",
  "neutral800",
  "success50",
  "success100",
  "success500",
  "warning100",
  "warning500",
  "error100",
  "error500",
  "error600",
  "fontLight",
  "fontDark",
  "courseCta",
  "defaultPrimary",
  "fontImportUrl",
  "fontFamilySans",
  "muiPrimaryMain",
  "muiPrimaryLight",
  "muiPrimaryDark",
  "muiPrimaryContrastText",
  "accentBlueLight",
  "surfaceBlueLight",
  "accentIndigo",
  "accentIndigoDark",
  "surfaceIndigoLight",
  "chartArticles",
  "_preset",
  "loginHeroSlogan",
  "loginHeroSloganFontSize",
  "loginHeroSloganColor",
  "loginHeroSloganFontWeight",
  "loginHeroSloganFontStyle",
  "loginHeroBrandNameFontSize",
  "loginHeroBrandNameColor",
  "loginHeroBrandNameFontWeight",
  "loginHeroLogoMaxWidthPx",
  "loginHeroLogoHeightPx",
  "sidebarLogoMaxWidthPx",
  "sidebarLogoHeightPx",
]);

function normalizeBrandingUrl(
  value: string | null | undefined
): string | null | undefined {
  if (value == null) return value;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    // Preserve original value so backend can return a clear URL validation error.
    return trimmed;
  }
}

function extractApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : "Failed to update branding";
  }
  const data = error.response?.data;
  if (!data || typeof data !== "object") {
    return error.message || "Failed to update branding";
  }
  const record = data as Record<string, unknown>;
  const preferredKeys = ["detail", "message", "non_field_errors"];
  for (const key of preferredKeys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0];
      if (typeof first === "string" && first.trim()) return first;
    }
  }
  for (const [field, value] of Object.entries(record)) {
    if (typeof value === "string" && value.trim()) return `${field}: ${value}`;
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0];
      if (typeof first === "string" && first.trim()) return `${field}: ${first}`;
    }
  }
  return error.message || "Failed to update branding";
}

function sanitizeThemeSettings(
  settings?: Record<string, string>
): Record<string, string> | undefined {
  if (!settings) return settings;
  const cleaned: Record<string, string> = {};
  for (const [key, value] of Object.entries(settings)) {
    if (!ALLOWED_THEME_KEYS.has(key)) continue;
    cleaned[key] = value;
  }
  return cleaned;
}

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
  const normalizedBody: BrandingPatchBody = { ...body };
  normalizedBody.login_img_url = normalizeBrandingUrl(body.login_img_url);
  normalizedBody.login_logo_url = normalizeBrandingUrl(body.login_logo_url);
  normalizedBody.theme_settings = sanitizeThemeSettings(body.theme_settings);

  if (
    typeof normalizedBody.login_img_url === "string" &&
    normalizedBody.login_img_url.length > BRANDING_URL_MAX_LEN
  ) {
    throw new Error(
      `login_img_url is too long after normalization (max ${BRANDING_URL_MAX_LEN} chars).`
    );
  }
  if (
    typeof normalizedBody.login_logo_url === "string" &&
    normalizedBody.login_logo_url.length > BRANDING_URL_MAX_LEN
  ) {
    throw new Error(
      `login_logo_url is too long after normalization (max ${BRANDING_URL_MAX_LEN} chars).`
    );
  }

  try {
    const { data } = await apiClient.patch(
      `/admin-dashboard/api/clients/${clientId()}/branding/`,
      normalizedBody
    );
    return data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
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
