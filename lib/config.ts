export const config = {
  /**
   * Canonical origin of this LMS web app (e.g. https://your-app.netlify.app).
   * Set in Netlify and locally as NEXT_PUBLIC_APP_URL so links and redirects stay correct.
   */
  appUrl: (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, ""),
  apiBaseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(
    /\/$/,
    ""
  ),
  jobScraperApiUrl: (process.env.NEXT_PUBLIC_JOB_SCRAPER_API_URL || "").replace(/\/$/, ""),
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID || "1",
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
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
