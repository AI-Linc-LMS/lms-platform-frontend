import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import "@/lib/i18n";

/**
 * The phone navigation: a short bar, and a sheet that reaches everything else the tenant has.
 *
 * The bar this replaced rendered every enabled module side by side, so a full tenant squeezed six
 * labels into 390px, and any module that did not fit (Certificates, Roadmaps, the AI tutor, the
 * resume builder) had no phone entry at all. What matters here is the contract, not the pixels:
 * the bar stays short, and NOTHING a client has switched on is unreachable.
 */

const state = vi.hoisted(() => ({ features: [] as string[], role: "student", pathname: "/dashboard", adminMode: false, hideCertificates: false }));

vi.mock("next/link", () => ({
  // Spread the rest: the bar marks the current route with aria-current, and a mock that drops
  // unknown props would hide exactly the attribute this file is checking.
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => state.pathname,
}));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({
  useClientInfo: () => ({
    clientInfo: {
      features: state.features.map((name, id) => ({ id, name })),
      hide_certificates_from_students: state.hideCertificates,
    },
    loading: false,
  }),
  useThemePreview: () => ({ themeOverride: null }),
}));
vi.mock("@/lib/contexts/AdminModeContext", () => ({
  useAdminMode: () => ({ isAdminMode: state.adminMode, toggleAdminMode: vi.fn() }),
}));
vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({ user: { id: 1, role: state.role, email: "s@x.com" }, loading: false }),
}));

import { MobileNav } from "./MobileNav";

const STUDENT_STACK = [
  "dashboard", "adaptive_quiz", "assessment", "live_sessions", "jobs_v2",
  "community_forum", "roadmaps", "ai_voice_tutor", "mock_interview", "certificates",
];

function bar() {
  return within(screen.getByTestId("mobile-nav")).queryAllByRole("link").map((a) => a.getAttribute("href") ?? "");
}
function openMore() {
  fireEvent.click(screen.getByTestId("mobile-nav-more"));
  const sheet = document.querySelector<HTMLElement>(".MuiDrawer-root .MuiPaper-root");
  if (!sheet) throw new Error("the More sheet did not open");
  return within(sheet).queryAllByRole("link").map((a) => a.getAttribute("href") ?? "");
}

beforeEach(() => {
  state.features = [...STUDENT_STACK];
  state.role = "student";
  state.pathname = "/dashboard";
  state.adminMode = false;
  state.hideCertificates = false;
});

describe("the phone bar", () => {
  it("stays short however many modules the tenant has", () => {
    render(<MobileNav />);
    // Four destinations plus More: the most 390px fits with a readable label.
    expect(bar().length).toBe(4);
    expect(screen.getByTestId("mobile-nav-more")).toBeTruthy();
  });

  it("leads with the places a learner goes daily", () => {
    render(<MobileNav />);
    expect(bar()[0]).toBe("/dashboard");
    expect(bar()).toContain("/adaptive-courses");
  });

  it("marks the current route for a screen reader, not by colour alone", () => {
    state.pathname = "/adaptive-courses";
    render(<MobileNav />);
    const current = within(screen.getByTestId("mobile-nav")).getByRole("link", { current: "page" });
    expect(current.getAttribute("href")).toBe("/adaptive-courses");
  });
});

describe("every module the client has is reachable", () => {
  it("puts what the bar could not hold in the More sheet", () => {
    render(<MobileNav />);
    const reachable = new Set([...bar(), ...openMore()]);
    // The ones the old bar simply dropped.
    for (const href of ["/certificates", "/roadmaps", "/ai-tutor", "/jobs-v2", "/live-sessions", "/community"]) {
      expect(reachable, `${href} unreachable on a phone`).toContain(href);
    }
  });

  it("offers nothing the client has not switched on", () => {
    state.features = ["dashboard", "adaptive_quiz", "assessment"];
    render(<MobileNav />);
    const reachable = new Set([...bar(), ...openMore()]);
    expect(reachable).not.toContain("/community");
    expect(reachable).not.toContain("/live-sessions");
    expect(reachable).not.toContain("/jobs-v2");
    expect(reachable).toContain("/adaptive-courses");
  });

  it("hides the learner certificates page when the institution switched it off", () => {
    // Same tenant setting the sidebar honours: hide_certificates_from_students.
    state.hideCertificates = true;
    render(<MobileNav />);
    expect(new Set([...bar(), ...openMore()])).not.toContain("/certificates");
  });
});

describe("admin mode", () => {
  it("shows admin destinations, never the learner's", () => {
    state.role = "admin";
    state.adminMode = true;
    state.features = ["admin_dashboard", "admin_manage_students", "admin_assessment", "admin_live_sessions", "admin_cohorts", "dashboard", "adaptive_quiz"];
    state.pathname = "/admin/dashboard";
    render(<MobileNav />);
    const reachable = [...bar(), ...openMore()];
    expect(reachable[0]).toBe("/admin/dashboard");
    expect(reachable.every((h) => h.startsWith("/admin") || h === "/profile")).toBe(true);
  });
});
