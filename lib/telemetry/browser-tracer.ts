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
    onEnd(span: { attributes: Record<string, unknown>; name?: string }) {
      const urlStr =
        getAttr(span, "url.full") || getAttr(span, "http.url") || "";
      const serverAddr = getAttr(span, "server.address");
      const statusCode = getAttr(span, "http.response.status_code") || getAttr(span, "http.status_code") || "";

      const matchesByUrl = urlStr.startsWith(apiBaseNormalized);
      const matchesByHost = !matchesByUrl && serverAddr === apiHostname;

      if (matchesByUrl || matchesByHost) {
        batchProcessor.onEnd(span as never);
        if (OTEL_DEBUG) {
          console.log("[OTel] exported span", {
            name: span.name,
            url: urlStr || "(from server.address)",
            statusCode: statusCode || "(none)",
          });
        }
      } else if (OTEL_DEBUG && (urlStr || serverAddr)) {
        console.log("[OTel] filtered span (not API)", {
          name: span.name,
          url: urlStr || "(empty)",
          serverAddress: serverAddr || "(empty)",
          statusCode: statusCode || "(none)",
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
