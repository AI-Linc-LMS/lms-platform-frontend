import type { ClientInfo } from "@/lib/services/client.service";

function pickLogoString(clientInfo: unknown, keys: string[]): string {
  const row = clientInfo as Record<string, unknown> | null | undefined;
  if (!row) return "";
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/**
 * Logos for printed/exported certificates: prefer tenant app brand, then login marketing logo, then icon.
 * (Auth/sidebar may prefer resolveClientLogoUrl login-first — certificates are different.)
 */
export function resolveCertificateLogoUrl(
  clientInfo:
    | Pick<ClientInfo, "app_logo_url" | "login_logo_url" | "app_icon_url">
    | null
    | undefined
): string {
  const app = pickLogoString(clientInfo, ["app_logo_url", "appLogoUrl"]);
  if (app) return app;
  const login = pickLogoString(clientInfo, ["login_logo_url", "loginLogoUrl"]);
  if (login) return login;
  const icon = pickLogoString(clientInfo, ["app_icon_url", "appIconUrl"]);
  if (icon) return icon;
  return "";
}
