/**
 * OpenTelemetry instrumentation for Next.js
 * Server-side instrumentation is disabled — we trace only browser fetches
 * to config.apiBaseUrl (external API calls). See lib/telemetry/browser-tracer.ts
 * @see https://nextjs.org/docs/app/guides/instrumentation
 */

export async function register() {
  // Disabled: server traces everything (HTTP, fetch, etc.). We only want
  // external API calls from the browser (FetchInstrumentation in browser-tracer.ts).
  // if (process.env.NEXT_RUNTIME === "nodejs") { ... }
}
