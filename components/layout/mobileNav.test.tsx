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
  useAuth: () => ({ user: { id: 1, role: state.role, email: "s@x.com", first_name: "Aarav", last_name: "Sharma" }, loading: false, logout: vi.fn() }),
}));

import { MobileNav as DockOnly } from "./MobileNav";
import { MobileMenuProvider } from "./MobileMenu";

/** The dock as the chrome mounts it: inside the provider that owns the launcher. */
function MobileNav() {
  return (
    <MobileMenuProvider>
      <DockOnly />
    </MobileMenuProvider>
  );
}

const STUDENT_STACK = [
  "dashboard", "adaptive_quiz", "assessment", "live_sessions", "jobs_v2",
  "community_forum", "roadmaps", "ai_voice_tutor", "mock_interview", "certificates",
];

function bar() {
  return within(screen.getByTestId("mobile-nav")).queryAllByRole("link").map((a) => a.getAttribute("href") ?? "");
}
function openMore() {
  fireEvent.click(screen.getByTestId("mobile-nav-more"));
  const menu = screen.getByTestId("mobile-menu");
  return within(menu).queryAllByRole("link").map((a) => a.getAttribute("href") ?? "");
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
    expect(reachable.every((h) => h.startsWith("/admin"))).toBe(true);
  });
});

describe("a module replaced by a newer one", () => {
  it("shows the rebuilt interview only, when a tenant holds both keys", () => {
    // Four tenants hold mock_interview AND interview_realtime, and were offered two entries both
    // called Interview, pointing at two different products.
    state.features = ["dashboard", "adaptive_quiz", "mock_interview", "interview_realtime"];
    render(<MobileNav />);
    const reachable = [...bar(), ...openMore()];
    expect(reachable).toContain("/interview");
    expect(reachable).not.toContain("/mock-interview");
  });

  it("still shows the old interview to a tenant that only has that one", () => {
    state.features = ["dashboard", "adaptive_quiz", "mock_interview"];
    render(<MobileNav />);
    const reachable = [...bar(), ...openMore()];
    expect(reachable).toContain("/mock-interview");
    expect(reachable).not.toContain("/interview");
  });
});

describe("the launcher", () => {
  it("opens from the dock and lists every module, grouped", () => {
    render(<MobileNav />);
    fireEvent.click(screen.getByTestId("mobile-nav-more"));
    expect(screen.getByTestId("menu-group-learn")).toBeTruthy();
    expect(screen.getByTestId("menu-group-career")).toBeTruthy();
    expect(screen.getByTestId("menu-group-engage")).toBeTruthy();
  });

  it("narrows to what you type", () => {
    render(<MobileNav />);
    fireEvent.click(screen.getByTestId("mobile-nav-more"));
    fireEvent.change(screen.getByRole("textbox", { name: "Search modules" }), { target: { value: "road" } });
    const hrefs = within(screen.getByTestId("mobile-menu")).queryAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["/roadmaps"]);
  });

  it("says so when nothing matches, instead of an empty sheet", () => {
    render(<MobileNav />);
    fireEvent.click(screen.getByTestId("mobile-nav-more"));
    fireEvent.change(screen.getByRole("textbox", { name: "Search modules" }), { target: { value: "zzz" } });
    expect(screen.getByText(/No module matches/)).toBeTruthy();
  });

  it("shows only the active tab's label in the dock, and names every tab for a screen reader", () => {
    state.pathname = "/adaptive-courses";
    render(<MobileNav />);
    const dock = screen.getByTestId("mobile-nav");
    const links = within(dock).getAllByRole("link");
    expect(links.map((a) => a.getAttribute("aria-label")).every(Boolean)).toBe(true);
    // Only the current destination draws its name.
    const labelled = links.filter((a) => (a.textContent || "").trim().length > 0);
    expect(labelled).toHaveLength(1);
    expect(labelled[0].getAttribute("href")).toBe("/adaptive-courses");
  });
});

describe("the dock's widths", () => {
  /** Declarations emotion wrote for one element's own class (no media, no nested selectors). */
  function ownCss(el: Element): string {
    const css = Array.from(document.querySelectorAll("style")).map((s) => s.textContent ?? "").join("\n");
    return Array.from(el.classList)
      .filter((c) => c.startsWith("css-"))
      .map((c) => css.match(new RegExp(`(?:^|[{}])\\.${c}\\{([^}]*)\\}`, "m"))?.[1] ?? "")
      .join(";");
  }

  it("gives the active tab all the spare room, so its name is not cut to 'Dashbo…'", () => {
    // With proportional shares (1.9 : 1) the active tab was 104px on an iPhone 14.
    render(<MobileNav />);
    const tabs = within(screen.getByTestId("mobile-nav")).getAllByRole("link");
    const active = tabs.find((a) => a.getAttribute("aria-current") === "page")!;
    expect(ownCss(active)).toMatch(/flex:1 0 46px/);
    for (const t of tabs.filter((a) => a !== active)) expect(ownCss(t)).toMatch(/flex:0 0 46px/);
    expect(ownCss(screen.getByTestId("mobile-nav-more"))).toMatch(/flex:0 0 46px/);
  });
});

describe("the dock's active label", () => {
  /** Every font-size emotion wrote for one element, in any media block. */
  function fontSizes(el: Element): string[] {
    const css = Array.from(document.querySelectorAll("style")).map((s) => s.textContent ?? "").join("\n");
    return Array.from(el.classList)
      .filter((c) => c.startsWith("css-"))
      .flatMap((c) => Array.from(css.matchAll(new RegExp(`\\.${c}\\{([^}]*)\\}`, "g"))).map((m) => m[1]))
      .flatMap((decls) => Array.from(decls.matchAll(/font-size:([\d.]+)rem/g)).map((m) => m[1]));
  }

  it("is never drawn under 12px, at any phone width", () => {
    // It was 0.74rem (11.84px) below 380px, i.e. on every 360px Android.
    render(<MobileNav />);
    const sizes = fontSizes(screen.getByTestId("mobile-nav-label"));
    expect(sizes).toContain("0.75");
    for (const rem of sizes) expect(Number(rem) * 16, `${rem}rem`).toBeGreaterThanOrEqual(12);
  });

  it("uses a short name for a long admin destination, and keeps the full one for a screen reader", () => {
    // "Assessment Management" is 147px at 12px; the active tab has about 86px at 360.
    state.role = "admin";
    state.adminMode = true;
    state.features = ["admin_dashboard", "admin_manage_students", "admin_assessment", "admin_live_sessions"];
    state.pathname = "/admin/assessment";
    render(<MobileNav />);
    const active = within(screen.getByTestId("mobile-nav")).getByRole("link", { current: "page" });
    expect(active.getAttribute("aria-label")).toBe("Assessment Management");
    expect(screen.getByTestId("mobile-nav-label").textContent).toBe("Assessments");
  });

  it("gives every destination the dock can show a name short enough for a 360px screen", async () => {
    // A character budget stands in for the measured one: "Live Sessions" (13 characters) is
    // 76px at 12px, the widest that fits the ~86px an active tab has at 360.
    const { ADMIN_NAV_ITEMS, STUDENT_NAV_ITEMS, INSTRUCTOR_NAV_ITEMS } = await import("@/lib/navigation/navModel");
    const i18n = (await import("@/lib/i18n")).default;
    for (const lng of ["en", "ar"]) {
      const t = i18n.getFixedT(lng, "common");
      for (const item of [...STUDENT_NAV_ITEMS, ...ADMIN_NAV_ITEMS, ...INSTRUCTOR_NAV_ITEMS]) {
        const name = item.dockLabelKey
          ? (t(item.dockLabelKey, item.dockLabel ?? item.label) as string)
          : (t(item.labelKey, item.label) as string);
        expect(name.length, `${lng} ${item.path}: "${name}"`).toBeLessThanOrEqual(lng === "ar" ? 20 : 13);
      }
    }
  });
});

