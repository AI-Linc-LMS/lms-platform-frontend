import apiClient from "./api";

/**
 * Asset upload constraints - must stay in sync with
 * provisioning/wizard_views.py (MAX_ASSET_BYTES + ALLOWED_ASSET_TYPES).
 * Backend enforces these too; we mirror them client-side so the user gets
 * an immediate, specific error instead of a generic 400.
 */
export const WIZARD_ASSET_MAX_BYTES = 4 * 1024 * 1024;

// Logos + hero images: backend rejects ICO for these (it's only meaningful
// for favicons). Keeping the accept list narrow stops the OS file picker
// from offering HEIC/GIF/AVIF/etc. that would 400 on submit.
export const WIZARD_IMAGE_ACCEPT =
  "image/png,image/jpeg,image/svg+xml,image/webp";

// Favicons: same as images plus the two ICO MIME types + the .ico extension
// hint (some OSes report ICO as application/octet-stream).
export const WIZARD_FAVICON_ACCEPT =
  "image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon,image/vnd.microsoft.icon,.ico";

/** Pre-flight check. Returns null when the file is valid, otherwise a
 *  human-readable error string ready to drop into the UI. */
export function validateWizardAsset(
  file: File,
  variant: "image" | "favicon"
): string | null {
  if (file.size > WIZARD_ASSET_MAX_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return `File is ${mb} MB - please upload under 4 MB.`;
  }
  const accept =
    variant === "favicon" ? WIZARD_FAVICON_ACCEPT : WIZARD_IMAGE_ACCEPT;
  const allowed = accept.split(",").map((s) => s.trim());
  // Some browsers report ICO as application/octet-stream - fall back to
  // extension matching so we don't bounce a legitimate favicon.
  const ext = (file.name.match(/\.[^.]+$/)?.[0] || "").toLowerCase();
  const matches =
    (file.type && allowed.includes(file.type)) || allowed.includes(ext);
  if (!matches) {
    const label = variant === "favicon" ? "PNG, SVG, ICO, or WebP" : "PNG, JPG, SVG, or WebP";
    return `That file type isn't supported. Please upload a ${label}.`;
  }
  return null;
}

/** Pull the backend's `detail` message off an axios error, falling back to
 *  a generic string. Used to surface server-side validation failures
 *  (e.g. 400 from /upload-asset/) in the UI. */
export function extractWizardUploadError(err: unknown): string {
  const e = err as { response?: { data?: { detail?: string } }; message?: string };
  return (
    e?.response?.data?.detail ||
    e?.message ||
    "Upload failed. Please try again."
  );
}

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
