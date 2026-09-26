// @vitest-environment jsdom
/**
 * A learner could not save her profile: "CORS error" on the request, "Not saved: could not reach
 * the server" on screen, and a column of ERR_CONNECTION_REFUSED next to it, all to `traces`.
 *
 * Those two were the same fault. `config.otelTracesEndpoint` falls back to
 * `http://localhost:4318/v1/traces` - right for a developer with a collector beside the dev
 * server, wrong for every learner, because no tenant site sets the variable. So the tracer
 * started everywhere and fired exports at a port on the LEARNER's own machine.
 *
 * The noise was the smaller half. Starting the tracer also installs fetch instrumentation that
 * propagates `traceparent` onto the API, and a header the API did not allow made the BROWSER
 * refuse the preflight - so the request failed before it was sent, leaving no server-side trace.
 * The endpoint was healthy the whole time and answering other people's saves in ~20ms.
 */

import { describe, expect, it } from "vitest";
import { shouldStartBrowserTracer } from "./browser-tracer";

describe("the browser tracer needs somewhere to send a span", () => {
  it("does not start on a tenant site left on the localhost default", () => {
    // Every tenant site. The exports could only ever hit the learner's own machine, and the
    // instrumentation it installs adds a header that makes the API preflight fail.
    expect(shouldStartBrowserTracer("http://localhost:4318/v1/traces", "impacteers.ailinc.com")).toBe(false);
    expect(shouldStartBrowserTracer("http://127.0.0.1:4318/v1/traces", "staging.ailinc.com")).toBe(false);
  });

  it("does not start when the endpoint is blank or missing", () => {
    expect(shouldStartBrowserTracer("", "impacteers.ailinc.com")).toBe(false);
    expect(shouldStartBrowserTracer(undefined, "impacteers.ailinc.com")).toBe(false);
    expect(shouldStartBrowserTracer("   ", "impacteers.ailinc.com")).toBe(false);
  });

  it("still starts for a developer running a collector locally", () => {
    // The localhost default exists for exactly this case and must keep working.
    expect(shouldStartBrowserTracer("http://localhost:4318/v1/traces", "localhost")).toBe(true);
  });

  it("starts when a real collector is configured", () => {
    expect(shouldStartBrowserTracer("https://otel.ailinc.com/v1/traces", "impacteers.ailinc.com")).toBe(true);
  });
});
