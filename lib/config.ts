/**
 * Resolve the tenant id, throwing if it's not set in the build env.
 *
 * Kept as a getter on the config object (rather than an IIFE that runs at
 * module load) so Next.js's page-data collection step can import this
 * module during `next build` even when the env var is provided only at
 * runtime. The throw still fires the first time real application code
 * reads `config.clientId`, so we never silently fall back to a hardcoded
 * prod tenant — which is the whole reason this guard exists.
 */
function resolveClientId(): string {
  const v = process.env.NEXT_PUBLIC_CLIENT_ID;
  if (!v) {
    throw new Error(
      "NEXT_PUBLIC_CLIENT_ID must be set — refusing to fall back to a hardcoded tenant id (would risk cross-tenant data leak).",
    );
  }
  return v;
}

export const config = {
  /**
   * Canonical origin of this LMS web app (e.g. https://your-app.netlify.app).
   * Set in Netlify and locally as NEXT_PUBLIC_APP_URL so links and redirects stay correct.
   */
  appUrl: (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, ""),
  apiBaseUrl: (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "")
  ).replace(/\/$/, ""),
  get clientId(): string {
    return resolveClientId();
  },
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
  /**
   * Tenant slug (subdomain) — passed to the central auth proxy so it can route
   * the OAuth callback back to the correct tenant. Set per-Netlify-site by the
   * backend provisioning task (provisioning/tasks.py).
   */
  tenantSlug: process.env.NEXT_PUBLIC_TENANT_SLUG || "",
  /**
   * Central Google OAuth proxy origin. One Google Cloud Console entry covers
   * every tenant; the proxy hands a short-lived JWT back to this app via
   * /auth/handoff. Default points to the production backend that hosts the
   * /central-auth routes.
   */
  authProxyUrl: (
    process.env.NEXT_PUBLIC_AUTH_PROXY_URL || "https://be-app.ailinc.com"
  ).replace(/\/$/, ""),
  /** Fallback WebSocket URL when token API does not return `livekit_url` */
  livekitUrl: (process.env.NEXT_PUBLIC_LIVEKIT_URL || "").replace(/\/$/, ""),
  /** OpenTelemetry: service name for traces */
  otelServiceName:
    process.env.OTEL_SERVICE_NAME ||
    process.env.NEXT_PUBLIC_OTEL_SERVICE_NAME ||
    "lms-platform-frontend",
  /** OpenTelemetry: OTLP traces endpoint (server + browser) */
  otelTracesEndpoint:
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
    process.env.NEXT_PUBLIC_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
    "http://localhost:4318/v1/traces",
} as const;

/** Browser: prefer configured app URL, else current origin. Server: configured app URL or empty. */
export function getPublicAppOrigin(): string {
  if (typeof window !== "undefined") {
    return config.appUrl || window.location.origin;
  }
  return config.appUrl;
}
