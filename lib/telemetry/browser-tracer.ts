/**
 * OpenTelemetry browser tracer
 * Tracks only external API calls to config.apiBaseUrl (success + failure).
 * Ignores internal Next.js, static assets, RSC, loaders, etc.
 * @see https://opentelemetry.io/docs/demo/services/frontend/
 */

import { config } from "@/lib/config";

const OTEL_DEBUG = process.env.NEXT_PUBLIC_OTEL_DEBUG === "true";

function getAttr(span: { attributes: Record<string, unknown> }, key: string): string {
  const v = span.attributes[key];
  if (v == null) return "";
  if (typeof v === "string") return v;
  return String(v);
}

/** How each alert was classified - shown in email subject + body. */
export type FailureCategory = "overload" | "latency" | "jobs-api" | "other";

export interface FailureAlertPayload {
  traceId?: string;
  spanId?: string;
  spanName?: string;
  url?: string;
  statusCode?: number;
  durationMs?: number;
  failureCategory: FailureCategory;
  serviceName?: string;
  timestamp?: string;
}

/**
 * Thresholds - override via env vars so you can tune per-environment without
 * redeploying. Both are read once at module init time (browser build).
 *   NEXT_PUBLIC_OTEL_LATENCY_THRESHOLD_MS  default 5000
 */
const LATENCY_THRESHOLD_MS =
  parseInt(process.env.NEXT_PUBLIC_OTEL_LATENCY_THRESHOLD_MS || "5000", 10) || 5000;

/**
 * Classify a span into a failure category.
 * Returns null when the span should NOT trigger an alert.
 */
function classifyFailure(
  urlStr: string,
  statusCode: number | null,
  durationMs: number,
  isOtelEndpoint: boolean
): FailureCategory | null {
  // Never alert on OTEL infra calls - collector may not be deployed for all clients
  if (isOtelEndpoint) return null;

  // Latency: flag slow calls regardless of status code
  if (durationMs >= LATENCY_THRESHOLD_MS) return "latency";

  // Need an HTTP error code for the remaining categories
  if (statusCode === null || isNaN(statusCode) || statusCode < 400) return null;

  // Overload: rate-limited or service unavailable
  if (statusCode === 429 || statusCode === 503) return "overload";

  // Enrollment jobs: any 4xx/5xx on the student-enrollment-jobs async task API
  // Path: /admin-dashboard/api/clients/{clientId}/student-enrollment-jobs/
  if (/\/student-enrollment-jobs/.test(urlStr)) return "jobs-api";

  // Catch-all for remaining HTTP errors
  return "other";
}

async function sendFailureAlert(payload: FailureAlertPayload): Promise<void> {
  try {
    await fetch("/api/telemetry/alert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.NEXT_PUBLIC_TELEMETRY_ALERT_SECRET
          ? { "x-alert-secret": process.env.NEXT_PUBLIC_TELEMETRY_ALERT_SECRET }
          : {}),
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Never throw - alerting must not affect the app
  }
}

export async function initBrowserTracer() {
  if (typeof window === "undefined") return;

  const { WebTracerProvider } = await import(
    "@opentelemetry/sdk-trace-web"
  );
  const { BatchSpanProcessor } = await import(
    "@opentelemetry/sdk-trace-base"
  );
  const { OTLPTraceExporter } = await import(
    "@opentelemetry/exporter-trace-otlp-http"
  );
  const { registerInstrumentations } = await import(
    "@opentelemetry/instrumentation"
  );
  const { FetchInstrumentation } = await import(
    "@opentelemetry/instrumentation-fetch"
  );
  const { XMLHttpRequestInstrumentation } = await import(
    "@opentelemetry/instrumentation-xml-http-request"
  );
  const { resourceFromAttributes } = await import("@opentelemetry/resources");
  const { ATTR_SERVICE_NAME } = await import(
    "@opentelemetry/semantic-conventions"
  );
  const { ZoneContextManager } = await import("@opentelemetry/context-zone");
  const {
    CompositePropagator,
    W3CBaggagePropagator,
    W3CTraceContextPropagator,
  } = await import("@opentelemetry/core");

  const serviceName = config.otelServiceName;
  const traceEndpoint = config.otelTracesEndpoint;
  const apiBaseUrl = config.apiBaseUrl;
  const apiBaseNormalized = apiBaseUrl.replace(/\/$/, "");
  const apiHostname = new URL(apiBaseUrl).hostname;
  const apiOrigin = new URL(apiBaseUrl).origin;
  const escapedOrigin = apiOrigin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (OTEL_DEBUG) {
    console.log("[OTel] init", {
      apiBaseUrl,
      apiBaseNormalized,
      apiHostname,
      traceEndpoint,
    });
  }

  const exporter = new OTLPTraceExporter({ url: traceEndpoint });
  const batchProcessor = new BatchSpanProcessor(exporter, {
    scheduledDelayMillis: 500,
  });

  const apiFilterProcessor = {
    onStart(span: unknown, parentContext: unknown) {
      batchProcessor.onStart(span as never, parentContext as never);
    },
    onEnd(span: {
      attributes: Record<string, unknown>;
      name?: string;
      startTime?: [number, number]; // hrtime tuple [seconds, nanoseconds]
      endTime?: [number, number];
      spanContext?: () => { traceId?: string; spanId?: string };
    }) {
      const urlStr =
        getAttr(span, "url.full") || getAttr(span, "http.url") || "";
      const serverAddr = getAttr(span, "server.address");
      const statusCodeRaw = getAttr(span, "http.response.status_code") || getAttr(span, "http.status_code") || "";

      const matchesByUrl = urlStr.startsWith(apiBaseNormalized);
      const matchesByHost = !matchesByUrl && serverAddr === apiHostname;

      if (matchesByUrl || matchesByHost) {
        batchProcessor.onEnd(span as never);

        // Compute span duration from hrtime tuples if available
        const durationMs: number = (() => {
          if (span.startTime && span.endTime) {
            const startMs = span.startTime[0] * 1000 + span.startTime[1] / 1e6;
            const endMs = span.endTime[0] * 1000 + span.endTime[1] / 1e6;
            return Math.max(0, endMs - startMs);
          }
          return 0;
        })();

        const code = parseInt(String(statusCodeRaw), 10);
        const statusCode = isNaN(code) ? null : code;
        const isOtelEndpoint =
          !!traceEndpoint && urlStr.startsWith(traceEndpoint.replace(/\/$/, ""));

        const failureCategory = classifyFailure(urlStr, statusCode, durationMs, isOtelEndpoint);

        if (failureCategory) {
          const ctx = span.spanContext?.();
          void sendFailureAlert({
            traceId: ctx?.traceId,
            spanId: ctx?.spanId,
            spanName: span.name,
            url: urlStr,
            statusCode: statusCode ?? undefined,
            durationMs,
            failureCategory,
            serviceName,
            timestamp: new Date().toISOString(),
          });
        }

        if (OTEL_DEBUG) {
          console.log("[OTel] exported span", {
            name: span.name,
            url: urlStr || "(from server.address)",
            statusCode: statusCodeRaw || "(none)",
            durationMs,
            failureCategory: classifyFailure(urlStr, statusCode, durationMs, isOtelEndpoint) ?? "-",
          });
        }
      } else if (OTEL_DEBUG && (urlStr || serverAddr)) {
        console.log("[OTel] filtered span (not API)", {
          name: span.name,
          url: urlStr || "(empty)",
          serverAddress: serverAddr || "(empty)",
          statusCode: statusCodeRaw || "(none)",
          apiBase: apiBaseNormalized,
        });
      }
    },
    forceFlush: () => batchProcessor.forceFlush(),
    shutdown: () => batchProcessor.shutdown(),
  };

  const provider = new WebTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
    }),
    spanProcessors: [apiFilterProcessor],
  });

  const contextManager = new ZoneContextManager();

  provider.register({
    contextManager,
    propagator: new CompositePropagator({
      propagators: [
        new W3CBaggagePropagator(),
        new W3CTraceContextPropagator(),
      ],
    }),
  });

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: [new RegExp(`^${escapedOrigin}`)],
        clearTimingResources: true,
      }),
      new XMLHttpRequestInstrumentation(),
    ],
  });

  // Flush pending spans before page unload so 403/errors are not lost
  const flush = () => apiFilterProcessor.forceFlush();
  window.addEventListener("pagehide", flush);
  window.addEventListener("beforeunload", flush);
}
