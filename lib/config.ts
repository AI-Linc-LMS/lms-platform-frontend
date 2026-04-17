export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  /**
   * Job scraper service (Django) — lists jobs at GET /api/jobs.
   * When set, browse merges scraped jobs like the former static JSON feed.
   */
  jobScraperApiUrl: (process.env.NEXT_PUBLIC_JOB_SCRAPER_API_URL || "").replace(/\/$/, ""),
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID || "1",
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
  /** Fallback WebSocket URL when token API does not return `livekit_url` */
  livekitUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL || "",
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
