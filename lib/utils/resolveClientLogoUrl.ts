import type { ClientInfo } from "@/lib/services/client.service";

/**
 * Same order as auth: branded login logo first, then default app logo.
 */
export function resolveClientLogoUrl(
  clientInfo:
    | Pick<ClientInfo, "login_logo_url" | "app_logo_url">
    | null
    | undefined
): string {
  const login = clientInfo?.login_logo_url?.trim();
  if (login) return login;
  const app = clientInfo?.app_logo_url?.trim();
  if (app) return app;
  return "";
}
