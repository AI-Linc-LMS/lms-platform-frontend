declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_APP_URL?: string;
    NEXT_PUBLIC_API_BASE_URL?: string;
    NEXT_PUBLIC_CLIENT_ID?: string;
    NEXT_PUBLIC_GOOGLE_CLIENT_ID?: string;
    NEXT_PUBLIC_LIVEKIT_URL?: string;
    NEXT_PUBLIC_OTEL_SERVICE_NAME?: string;
    NEXT_PUBLIC_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT?: string;
    NEXT_PUBLIC_OTEL_DEBUG?: string;
    OTEL_SERVICE_NAME?: string;
    OTEL_EXPORTER_OTLP_TRACES_ENDPOINT?: string;
  }
}
