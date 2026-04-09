import { config } from "@/lib/config";
import { CLIENT_28_ID } from "@/lib/theme/client28-theme";

export type AuthLayoutVariantId = "default" | "client28";

/**
 * Resolves auth landing layout variant from deployment client id (env).
 * Add new branches here as more clients get custom auth shells.
 */
export function resolveAuthLayoutVariant(): AuthLayoutVariantId {
  const id = Number(config.clientId);
  if (!Number.isFinite(id)) return "default";
  if (id === CLIENT_28_ID) return "client28";
  return "default";
}

export const authLayoutClient28Tokens = {
  logoMaxWidthPx: 780,
  logoHeightMdPx: 204,
  sloganFontSizeMd: "1.3125rem",
  sloganFontSizeLg: "1.5rem",
  /** Latin hover effect (large, bottom panel) */
  hoverBrandText: "INUN",
} as const;
