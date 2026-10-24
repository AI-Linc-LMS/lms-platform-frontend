import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  isStandaloneLegacyInterviewPath,
  legacyInterviewDestination,
} from "@/lib/navigation/legacyInterview";
import {
  ADMIN_NAV_ITEMS,
  STUDENT_NAV_ITEMS,
  filterNavigationItems,
} from "@/lib/navigation/navModel";

/**
 * The STANDALONE legacy mock interview is retired for EVERY tenant, and the course rounds that
 * share its URL prefix are not.
 *
 * The case that matters is the first one below: a tenant that HOLDS `mock_interview` used to be
 * let straight in, and 14 tenants hold that row. A feature-row check could never have retired
 * this product anyway - 5 tenants hold no feature rows at all and the catalogue has always read
 * "no rows" as "holds everything" - so the rule here no longer reads the row.
 *
 * What must keep working: /mock-interview/courses and the runner /mock-interview/<id>, which are
 * the course and journey interview ROUNDS (468 live templates across 9 tenants), and the admin
 * surfaces, where those rounds are still built and historical attempts still read.
 */

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
  it("sends a tenant that HOLDS the retired row away all the same", () => {
    // THE case. 14 tenants hold `mock_interview`; the product is retired for all of them, so
    // holding the row is no longer a way in. Before this it returned null, meaning "render".
    expect(legacyInterviewDestination(f("dashboard", "mock_interview"))).toBe("/dashboard");
    expect(legacyInterviewDestination(f("dashboard", "mock_interview", "interview_realtime"))).toBe(
      "/interview",
    );
  });

  it("sends a tenant with NO features configured away too", () => {
    // 5 tenants hold no feature rows at all, and "no rows" has always meant "holds everything".
    // That is why a feature-row check could not retire this product for them.
    expect(legacyInterviewDestination([])).toBe("/dashboard");
    expect(legacyInterviewDestination(undefined)).toBe("/dashboard");
  });

  it("never answers 'render this page' for anyone", () => {
    for (const features of [
      undefined,
      [],
      f("dashboard"),
      f("mock_interview"),
      f("interview_realtime"),
      f("mock_interview", "interview_realtime"),
    ]) {
      expect(legacyInterviewDestination(features), JSON.stringify(features)).not.toBeNull();
    }
  });

  it("prefers the rebuilt interview when the tenant holds it, else the dashboard", () => {
    expect(legacyInterviewDestination(f("dashboard", "interview_realtime"))).toBe("/interview");
    expect(legacyInterviewDestination(f("dashboard"))).toBe("/dashboard");
  });
});

describe("the retired standalone pages", () => {
  it("never render for a tenant that holds the row", () => {
    state.clientInfo = { features: f("dashboard", "mock_interview") };
    render(<MockInterviewLayout><div data-testid="legacy">legacy</div></MockInterviewLayout>);
    expect(screen.queryByTestId("legacy")).toBeNull();
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });

  it("never render for a tenant with no features configured", () => {
    state.clientInfo = { features: [] };
    render(<MockInterviewLayout><div data-testid="legacy">legacy</div></MockInterviewLayout>);
    expect(screen.queryByTestId("legacy")).toBeNull();
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });

  it("send a tenant on the rebuilt interview there instead", () => {
    state.clientInfo = { features: f("dashboard", "interview_realtime") };
    render(<MockInterviewLayout><div data-testid="legacy">legacy</div></MockInterviewLayout>);
    expect(screen.queryByTestId("legacy")).toBeNull();
    expect(replace).toHaveBeenCalledWith("/interview");
  });

  it("cover quick-start, schedule and scheduled, not just the hub", () => {
    state.clientInfo = { features: f("dashboard", "mock_interview") };
    for (const p of ["/mock-interview/quick-start", "/mock-interview/schedule", "/mock-interview/scheduled"]) {
      nav.pathname = p;
      const { unmount } = render(<MockInterviewLayout><div data-testid="legacy">legacy</div></MockInterviewLayout>);
      expect(screen.queryByTestId("legacy"), p).toBeNull();
      expect(replace, p).toHaveBeenCalledWith("/dashboard");
      unmount();
    }
  });

  it("draw nothing and decide nothing while client-info is still loading", () => {
    state.clientInfo = { features: f("dashboard") };
    state.loading = true;
    render(<MockInterviewLayout><div data-testid="legacy">legacy</div></MockInterviewLayout>);
    expect(screen.queryByTestId("legacy")).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });

  it("still leave, to the dashboard, when client-info never answers", () => {
    // A retired page that waits forever on a failed request is a blank screen, not a redirect.
    state.clientInfo = null;
    state.loading = false;
    render(<MockInterviewLayout><div data-testid="legacy">legacy</div></MockInterviewLayout>);
    expect(screen.queryByTestId("legacy")).toBeNull();
    expect(replace).toHaveBeenCalledWith("/dashboard");
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

  it("render for a tenant holding nothing at all, and for one still holding the retired row", () => {
    for (const features of [[], f("dashboard", "mock_interview")]) {
      state.clientInfo = { features };
      for (const p of ["/mock-interview/courses", "/mock-interview/42/take"]) {
        nav.pathname = p;
        const { unmount } = render(<MockInterviewLayout><div data-testid="legacy">legacy</div></MockInterviewLayout>);
        expect(screen.getByTestId("legacy"), `${p} ${JSON.stringify(features)}`).toBeInTheDocument();
        unmount();
      }
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

describe("the navigation", () => {
  const learnerNav = (...features: string[]) =>
    filterNavigationItems({
      items: STUDENT_NAV_ITEMS,
      featureNames: new Set(features),
      effectiveAdminMode: false,
      isOrgAdmin: false,
    }).map((i) => i.path);

  it("no longer offers the learner a Mock Interview entry, however the tenant is configured", () => {
    expect(learnerNav("dashboard", "mock_interview")).not.toContain("/mock-interview");
    expect(learnerNav("dashboard", "mock_interview", "interview_realtime")).not.toContain(
      "/mock-interview",
    );
    // A tenant with no features configured is default-allow: every entry there is. That is
    // exactly why the entry has to be gone from the model rather than filtered out of it.
    expect(learnerNav()).not.toContain("/mock-interview");
  });

  it("has no learner entry left anywhere under the retired prefix", () => {
    expect(STUDENT_NAV_ITEMS.filter((i) => i.path.startsWith("/mock-interview"))).toEqual([]);
    expect(STUDENT_NAV_ITEMS.filter((i) => i.featureName === "mock_interview")).toEqual([]);
  });

  it("still offers the rebuilt interview to a tenant that holds it", () => {
    expect(learnerNav("dashboard", "interview_realtime")).toContain("/interview");
  });

  it("keeps every admin interview surface, Interview Setup included", () => {
    // Rounds are BUILT at .../templates and historical attempts read at .../sessions. Retiring
    // the learner's standalone product must not touch either. The attempts page carries its own
    // gate (`interview_realtime`), which is why both keys are in this set.
    const adminNav = filterNavigationItems({
      items: ADMIN_NAV_ITEMS,
      featureNames: new Set([
        "admin_dashboard",
        "admin_mock_interview",
        "interview_realtime",
        "admin_tickets",
      ]),
      effectiveAdminMode: true,
      isOrgAdmin: true,
    }).map((i) => i.path);
    expect(adminNav).toContain("/admin/admin-mock-interview");
    expect(adminNav).toContain("/admin/admin-mock-interview/templates");
    expect(adminNav).toContain("/admin/admin-mock-interview/sessions");
  });
});
