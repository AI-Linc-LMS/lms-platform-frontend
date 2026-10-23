import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { legacyInterviewDestination } from "@/lib/navigation/legacyInterview";

const state: { clientInfo: Record<string, unknown> | null; loading: boolean } = {
  clientInfo: null,
  loading: false,
};
const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("@/lib/contexts/ClientInfoContext", () => ({
  useClientInfo: () => ({ ...state, error: null, refreshClientInfo: vi.fn() }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/mock-interview",
}));

import MockInterviewLayout from "@/app/mock-interview/layout";

const f = (...names: string[]) => names.map((name) => ({ name }));

afterEach(() => {
  state.clientInfo = null;
  state.loading = false;
  replace.mockClear();
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
