"use client";

import { useLayoutEffect } from "react";
import { initBrowserTracer } from "@/lib/telemetry/browser-tracer";

/**
 * Initializes OpenTelemetry browser instrumentation when the app loads.
 * Uses useLayoutEffect so the tracer runs before paint (before any API calls).
 * @see https://opentelemetry.io/docs/demo/services/frontend/
 */
export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    initBrowserTracer();
  }, []);

  return <>{children}</>;
}
