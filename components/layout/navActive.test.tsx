import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import "@/lib/i18n";

/**
 * Exactly ONE navigation entry is ever current.
 *
 * Reported from the admin side: "when selecting Interview Setup, both Interview and Interview
 * Setup are highlighted as active in the navigation bar". Every surface asked each entry the
 * same independent question - "is my path a prefix of the current route?" - so an entry nested
 * under another lit its parent too, and the nav stopped answering the only question it is for.
 *
 * The pair reported is `/admin/admin-mock-interview` and `/admin/admin-mock-interview/templates`.
 * It is not the only one: `.../sessions` ("Interview Attempts") sits under the same parent, and
 * a tenant with `interview_realtime` had three rows lit at once. The guard at the bottom of this
 * file is what keeps the next nested entry from re-introducing it.
 */

const state = vi.hoisted(() => ({
  features: [] as string[],
  role: "admin",
  pathname: "/admin/dashboard",
  adminMode: true,
}));

vi.mock("next/link", () => ({
  // The rest is spread on purpose: the active row is marked with aria-current, and a mock that
  // dropped unknown props would hide the one attribute this file reads.
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
  useAdminMode: () => ({ isAdminMode: state.adminMode, toggleAdminMode: vi.fn() }),
}));
vi.mock("@/lib/contexts/ProfileGateContext", () => ({
  useProfileGate: () => ({ percentage: 100, status: "ready", lockedModules: [], skills: [] }),
}));
vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    user: { id: 1, role: state.role, email: "a@x.com", first_name: "Rohan", last_name: "Mehta" },
    loading: false,
    logout: vi.fn(),
  }),
}));

import { Sidebar } from "./Sidebar";
import { MobileNav as DockOnly } from "./MobileNav";
import { MobileMenuProvider } from "./MobileMenu";
import {
  ADMIN_NAV_ITEMS,
  INSTRUCTOR_NAV_ITEMS,
  STUDENT_NAV_ITEMS,
  resolveActiveNavPath,
} from "@/lib/navigation/navModel";

/** Every admin feature the demo tenants hold, so the whole admin nav renders. */
const ADMIN_STACK = [
  "admin_dashboard",
  "admin_manage_students",
  "admin_cohorts",
  "admin_live_sessions",
  "admin_mock_interview",
  "admin_assessment",
  "admin_tickets",
  "admin_jobs_v2",
];

/** The hrefs the sidebar marks `aria-current="page"` — the rows drawn as active. */
function activeHrefs(): string[] {
  return screen
    .queryAllByRole("link", { current: "page" })
    .map((a) => a.getAttribute("href") ?? "");
}

/**
 * The rows drawn with the ACTIVE accent bar — the `::before` rule the report's screenshot shows
 * down the left edge of both highlighted entries.
 *
 * Read from the paint rather than from `aria-current`, because the paint is what the bug was
 * about and what existed before this fix: counting it is how these tests fail on the old code
 * for the right reason instead of merely missing a new attribute.
 */
function accentedHrefs(): string[] {
  const css = Array.from(document.querySelectorAll("style"))
    .map((el) => el.textContent ?? "")
    .join("\n");
  return Array.from(document.querySelectorAll<HTMLElement>(".MuiListItemButton-root"))
    .filter((row) =>
      Array.from(row.classList)
        .filter((c) => c.startsWith("css-"))
        .some((c) => new RegExp(`\\.${c}::before\\{[^}]*width:3px`).test(css)),
    )
    .map((row) => row.closest("a")?.getAttribute("href") ?? "")
    // One <Sidebar /> paints the permanent drawer AND the phone drawer, so each row appears
    // twice. The question is which ENTRIES are lit, not how many copies of the sidebar exist.
    .filter((href, i, all) => all.indexOf(href) === i);
}

beforeEach(() => {
  state.features = [...ADMIN_STACK];
  state.role = "admin";
  state.adminMode = true;
  state.pathname = "/admin/dashboard";
});

describe("the admin sidebar", () => {
  it("draws the active accent on ONE row on Interview Setup, not on its parent as well", () => {
    // The report, exactly: /admin/admin-mock-interview/templates is "Interview Setup" and it
    // sits under "Interview" (/admin/admin-mock-interview). Both carried the accent bar.
    state.pathname = "/admin/admin-mock-interview/templates";
    render(<Sidebar />);
    expect(accentedHrefs()).toEqual(["/admin/admin-mock-interview/templates"]);
  });

  it("says which row is current, for a screen reader and not by colour alone", () => {
    state.pathname = "/admin/admin-mock-interview/templates";
    render(<Sidebar />);
    expect(activeHrefs()).toEqual(["/admin/admin-mock-interview/templates"]);
  });

  it("resolves Interview Attempts to itself - the same parent's OTHER nested entry", () => {
    // Asserted on the model rather than on a render: "Interview Attempts" is gated on
    // `interview_realtime`, and the sidebar's admin mode only ever considers `admin_*` features,
    // so the row cannot currently appear however the tenant is configured. The prefix bug was
    // still there waiting for it, which is why it is pinned here.
    const paths = ADMIN_NAV_ITEMS.map((i) => i.path);
    expect(resolveActiveNavPath("/admin/admin-mock-interview/sessions", paths)).toBe(
      "/admin/admin-mock-interview/sessions",
    );
    expect(resolveActiveNavPath("/admin/admin-mock-interview/sessions/77", paths)).toBe(
      "/admin/admin-mock-interview/sessions",
    );
  });

  it("still lights the parent on the parent's own page", () => {
    state.pathname = "/admin/admin-mock-interview";
    render(<Sidebar />);
    expect(activeHrefs()).toEqual(["/admin/admin-mock-interview"]);
  });

  it("lights the correct parent on a nested page no entry of its own covers", () => {
    // The fix must not be "deep routes highlight nothing": a candidate's interview page is
    // /admin/admin-mock-interview/interviews/12 and belongs to Interview.
    state.pathname = "/admin/admin-mock-interview/interviews/12";
    render(<Sidebar />);
    expect(activeHrefs()).toEqual(["/admin/admin-mock-interview"]);
  });

  it("lights the nested entry, not the parent, on ITS deep page", () => {
    state.pathname = "/admin/admin-mock-interview/templates/edit/4";
    render(<Sidebar />);
    expect(activeHrefs()).toEqual(["/admin/admin-mock-interview/templates"]);
  });

  it("marks one row on the ordinary routes too, deep ones included", () => {
    for (const [pathname, expected] of [
      ["/admin/dashboard", "/admin/dashboard"],
      ["/admin/live-sessions", "/admin/live-sessions"],
      ["/admin/live-sessions/create", "/admin/live-sessions"],
      ["/admin/cohorts/12", "/admin/cohorts"],
    ] as const) {
      state.pathname = pathname;
      const view = render(<Sidebar />);
      expect(activeHrefs(), pathname).toEqual([expected]);
      view.unmount();
    }
  });

  it("leaves every row unmarked on a route the nav does not own", () => {
    // The admin dashboard is an EXACT match by design, so /admin/dashboard/whatever is nobody's.
    state.pathname = "/admin/dashboard/deep";
    render(<Sidebar />);
    expect(activeHrefs()).toEqual([]);
  });
});

describe("the phone launcher reads the same model", () => {
  function Dock() {
    return (
      <MobileMenuProvider>
        <DockOnly />
      </MobileMenuProvider>
    );
  }

  it("marks one tile on Interview Setup", () => {
    state.pathname = "/admin/admin-mock-interview/templates";
    render(<Dock />);
    // The bar holds four destinations; everything else lives in the launcher.
    fireEvent.click(screen.getByTestId("mobile-nav-more"));
    const menu = screen.getByTestId("mobile-menu");
    const current = within(menu)
      .queryAllByRole("link", { current: "page" })
      .map((a) => a.getAttribute("href"));
    expect(current).toEqual(["/admin/admin-mock-interview/templates"]);
  });
});

describe("no nav list can light two rows at once", () => {
  /**
   * The guard. Any future entry nested under another - and there will be more, the interview
   * module grew two in one release - re-introduces the exact reported bug unless the resolver
   * keeps picking one. This walks every list and every entry's own path plus a deep child of it.
   */
  it.each([
    ["student", STUDENT_NAV_ITEMS],
    ["admin", ADMIN_NAV_ITEMS],
    ["instructor", INSTRUCTOR_NAV_ITEMS],
  ])("resolves one owner for every route in the %s nav", (_name, items) => {
    const paths = items.map((i) => i.path);
    for (const item of items) {
      expect(resolveActiveNavPath(item.path, paths), item.path).toBe(item.path);
      const deep = `${item.path}/9/edit`;
      const owner = resolveActiveNavPath(deep, paths);
      // Either this entry owns its own deep route, or a more specific entry does - never both,
      // because the resolver returns one path.
      if (owner !== null) {
        expect(owner === item.path || owner.startsWith(`${item.path}/`), `${deep} -> ${owner}`).toBe(true);
      }
    }
  });

  it("names the nested pairs that exist today, so a removal is a deliberate act", () => {
    const paths = ADMIN_NAV_ITEMS.map((i) => i.path);
    const nested = paths.filter((p) => paths.some((q) => q !== p && p.startsWith(`${q}/`)));
    expect(nested.sort()).toEqual([
      "/admin/admin-mock-interview/sessions",
      "/admin/admin-mock-interview/templates",
    ]);
  });
});
