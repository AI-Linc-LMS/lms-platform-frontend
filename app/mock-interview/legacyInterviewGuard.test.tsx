import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  isStandaloneLegacyInterviewPath,
  legacyInterviewDestination,
} from "@/lib/navigation/legacyInterview";

const state: { clientInfo: Record<string, unknown> | null; loading: boolean } = {
  clientInfo: null,
  loading: false,
};
const { replace, nav } = vi.hoisted(() => ({ replace: vi.fn(), nav: { pathname: "/mock-interview" } }));

vi.mock("@/lib/contexts/ClientInfoContext", () => ({
  useClientInfo: () => ({ ...state, error: null, refreshClientInfo: vi.fn() }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => nav.pathname,
}));

import MockInterviewLayout from "@/app/mock-interview/layout";

const f = (...names: string[]) => names.map((name) => ({ name }));

afterEach(() => {
  state.clientInfo = null;
  state.loading = false;
  nav.pathname = "/mock-interview";
  replace.mockClear();
});

describe("isStandaloneLegacyInterviewPath", () => {
  it("names the standalone product's pages and nothing else", () => {
    for (const p of ["/mock-interview", "/mock-interview/", "/mock-interview/quick-start", "/mock-interview/schedule", "/mock-interview/scheduled", "/mock-interview/scheduled/3"]) {
      expect(isStandaloneLegacyInterviewPath(p), p).toBe(true);
    }
    for (const p of ["/mock-interview/courses", "/mock-interview/42", "/mock-interview/42/results", "/mock-interview/previous", "/interview", null, undefined]) {
      expect(isStandaloneLegacyInterviewPath(p), String(p)).toBe(false);
    }
  });
});

describe("legacyInterviewDestination", () => {
  it("lets a tenant holding the row in, and a tenant holding nothing at all", () => {
    expect(legacyInterviewDestination(f("dashboard", "mock_interview"))).toBeNull();
    expect(legacyInterviewDestination([])).toBeNull();
    expect(legacyInterviewDestination(undefined)).toBeNull();
  });

  it("sends a tenant without the row to the rebuilt interview, or to the dashboard", () => {
    expect(legacyInterviewDestination(f("dashboard", "interview_realtime"))).toBe("/interview");
    expect(legacyInterviewDestination(f("dashboard"))).toBe("/dashboard");
  });
});

describe("the legacy mock interview layout", () => {
  it("redirects a tenant that no longer holds the row and draws nothing", () => {
    state.clientInfo = { features: f("dashboard", "interview_realtime") };
    render(<MockInterviewLayout><div data-testid="legacy">legacy</div></MockInterviewLayout>);
    expect(screen.queryByTestId("legacy")).toBeNull();
    expect(replace).toHaveBeenCalledWith("/interview");
  });

  it("renders the page for a tenant that holds the row", () => {
    state.clientInfo = { features: f("dashboard", "mock_interview") };
    render(<MockInterviewLayout><div data-testid="legacy">legacy</div></MockInterviewLayout>);
    expect(screen.getByTestId("legacy")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("renders the page for a tenant with no features configured", () => {
    state.clientInfo = { features: [] };
    render(<MockInterviewLayout><div data-testid="legacy">legacy</div></MockInterviewLayout>);
    expect(screen.getByTestId("legacy")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("draws nothing and decides nothing while client-info is still loading", () => {
    state.clientInfo = { features: f("dashboard") };
    state.loading = true;
    render(<MockInterviewLayout><div data-testid="legacy">legacy</div></MockInterviewLayout>);
    expect(screen.queryByTestId("legacy")).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("the course rounds and the runner under the same prefix", () => {
  it("always render, even for a tenant without the row, because the course governs them", () => {
    state.clientInfo = { features: f("dashboard", "interview_realtime") };
    for (const p of ["/mock-interview/courses", "/mock-interview/42", "/mock-interview/42/results"]) {
      nav.pathname = p;
      const { unmount } = render(<MockInterviewLayout><div data-testid="legacy">legacy</div></MockInterviewLayout>);
      expect(screen.getByTestId("legacy"), p).toBeInTheDocument();
      unmount();
    }
    expect(replace).not.toHaveBeenCalled();
  });

  it("render while client-info is still loading, since no decision is pending for them", () => {
    state.clientInfo = null;
    state.loading = true;
    nav.pathname = "/mock-interview/42";
    render(<MockInterviewLayout><div data-testid="legacy">legacy</div></MockInterviewLayout>);
    expect(screen.getByTestId("legacy")).toBeInTheDocument();
  });
});
