import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, within } from "@testing-library/react";
import type { ReactNode } from "react";
import "@/lib/i18n";

/**
 * Which Courses entry a learner is offered, per tenant feature set.
 *
 * Courses are adaptive courses (`adaptive_quiz`). The classic catalogue (`course`) is being
 * retired tenant by tenant, and removing that key must not take anything adaptive with it. The
 * nav used to key the phone's only Courses tab, and part of the sidebar, on `course`.
 */

const state = vi.hoisted(() => ({
  features: [] as string[],
  role: "student",
  pathname: "/dashboard",
}));

// `next/link` needs an app-router context that a unit render does not have.
vi.mock("next/link", () => ({
  // Pass the rest through: the dock names its icon-only tabs with aria-label.
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => state.pathname,
}));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({
  useClientInfo: () => ({
    clientInfo: { features: state.features.map((name, id) => ({ id, name })) },
    loading: false,
  }),
  useThemePreview: () => ({ themeOverride: null }),
}));
vi.mock("@/lib/contexts/AdminModeContext", () => ({
  useAdminMode: () => ({ isAdminMode: false, toggleAdminMode: vi.fn() }),
}));
vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({ user: { id: 1, role: state.role, email: "s@x.com" }, loading: false }),
}));

import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";

/** Visible link label -> href, in render order. */
function links(root: HTMLElement): Array<[string, string]> {
  return within(root)
    .queryAllByRole("link")
    // The accessible name: dock tabs other than the current one are icon-only, named by aria-label.
    .map((a) => [a.getAttribute("aria-label") || a.textContent?.trim() || "", a.getAttribute("href") ?? ""]);
}

function bottomNavLinks() {
  // The phone bar only; the More sheet is a Drawer and renders nothing until it is opened.
  const { container } = render(<MobileNav />);
  return links(container);
}

/** The permanent (desktop) drawer only; the mobile drawer is keepMounted and repeats every row. */
function sidebarLinks() {
  render(<Sidebar />);
  const docked = document.querySelector<HTMLElement>(".MuiDrawer-docked");
  if (!docked) throw new Error("desktop sidebar drawer did not render");
  // The logo is a link home; it is not a nav row.
  return links(docked).filter(([label]) => label !== "");
}

beforeEach(() => {
  state.features = [];
  state.role = "student";
  state.pathname = "/dashboard";
  try {
    window.localStorage.clear();
  } catch {
    /* storage unavailable */
  }
});

describe("phone bottom bar: one Courses tab, and it follows adaptive courses", () => {
  it("gives a tenant with only adaptive courses a Courses tab to its courses", () => {
    state.features = ["dashboard", "adaptive_quiz", "assessment"];
    const tabs = bottomNavLinks();

    const courses = tabs.filter(([, href]) => href === "/adaptive-courses" || href === "/courses");
    expect(courses).toEqual([["Courses", "/adaptive-courses"]]);
  });

  it("sends a tenant holding both keys to its adaptive courses, not the classic catalogue", () => {
    state.features = ["dashboard", "course", "adaptive_quiz", "assessment"];
    const tabs = bottomNavLinks();

    const courses = tabs.filter(([, href]) => href === "/adaptive-courses" || href === "/courses");
    expect(courses).toHaveLength(1);
    expect(courses[0][1]).toBe("/adaptive-courses");
  });

  it("offers no classic tab at all, because there is no classic page left to open", () => {
    // The classic course pages are gone. A tenant that still holds `course` gets no Courses tab
    // on a phone rather than a tab onto a route that 404s - the feature key outlives the pages
    // until each tenant's cutover takes it off them.
    state.features = ["dashboard", "course", "assessment"];
    const tabs = bottomNavLinks();

    expect(tabs.filter(([, href]) => href === "/courses")).toHaveLength(0);
    expect(tabs.filter(([, href]) => href === "/adaptive-courses")).toHaveLength(0);
  });

  it("shows one Courses tab, not two, to a tenant with no features configured (default-allow)", () => {
    state.features = [];
    const tabs = bottomNavLinks();

    const courses = tabs.filter(([, href]) => href === "/adaptive-courses" || href === "/courses");
    expect(courses).toHaveLength(1);
    expect(courses[0][1]).toBe("/adaptive-courses");
  });
});

describe("sidebar: the classic `course` key opens nothing but the classic catalogue", () => {
  it("does not show Certificates on the strength of `course` alone", () => {
    state.features = ["dashboard", "course"];
    const rows = sidebarLinks();

    expect(rows.map(([, href]) => href)).not.toContain("/certificates");
  });

  it("still shows Certificates to a tenant with adaptive courses or assessments", () => {
    state.features = ["dashboard", "adaptive_quiz"];
    expect(sidebarLinks().map(([, href]) => href)).toContain("/certificates");
  });
});
