export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  jobScraperApiUrl: (process.env.NEXT_PUBLIC_JOB_SCRAPER_API_URL || "").replace(/\/$/, ""),
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID || "1",
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
  livekitUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL || "",
  otelServiceName:
    process.env.OTEL_SERVICE_NAME ||
    process.env.NEXT_PUBLIC_OTEL_SERVICE_NAME ||
    "lms-platform-frontend",
  otelTracesEndpoint:
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
    process.env.NEXT_PUBLIC_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
    "http://localhost:4318/v1/traces",
} as const;
