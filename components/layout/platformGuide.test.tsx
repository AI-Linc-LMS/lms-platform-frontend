import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import "@/lib/i18n";

/**
 * Which page the top-nav "Guide" belongs to.
 *
 * The button carries PLATFORM_GUIDE, whose tour is DASHBOARD_TOUR - eight steps anchored to
 * `data-tour-id="dash-*"` elements that only the student dashboard renders. It was mounted
 * unconditionally in the AppBar, which is shared chrome, so it appeared at the top of every
 * page: duplicating each page's own "?" guide, and offering a "Take a tour" that navigated the
 * learner off the page they were reading. It is the dashboard's guide and belongs there only.
 *
 * The per-page "?" (ModulePageHeader + PAGE_GUIDES) is the genuinely app-wide half of this
 * system and must keep working on every page - the last test here is that guard.
 */

const state = vi.hoisted(() => ({
  pathname: "/dashboard",
  role: "student",
  isAuthenticated: true,
  hideLeaderboard: false,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => state.pathname,
}));
vi.mock("next/image", () => ({
  default: ({ alt }: { alt?: string }) => <span data-img={alt ?? ""} />,
}));
vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    user: { id: 1, role: state.role, email: "student1@demo.ailinc.com", full_name: "Aarav Sharma" },
    isAuthenticated: state.isAuthenticated,
    loading: false,
    logout: vi.fn(),
  }),
}));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({
  useClientInfo: () => ({ clientInfo: { id: 34, name: "Demo Client", features: [] }, loading: false }),
  useHideLeaderboardView: () => state.hideLeaderboard,
  useThemePreview: () => ({ themeOverride: null }),
}));
vi.mock("@/lib/contexts/AdminModeContext", () => ({
  useAdminMode: () => ({ isAdminMode: false, toggleAdminMode: vi.fn() }),
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/components/common/LanguageSelect", () => ({ LanguageSelect: () => null }));
vi.mock("./MobileMenu", () => ({ MobileMenuButton: () => null }));
vi.mock("@/components/notifications/NotificationPopover", () => ({
  NotificationPopover: () => null,
  NotificationBell: () => null,
}));
vi.mock("@/lib/services/notification.service", () => ({
  notificationService: {
    getNotifications: vi.fn(async () => ({ results: [] })),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));
vi.mock("@/lib/notifications/unreadBadge", () => ({
  getUnreadCountCached: vi.fn(async () => 0),
  peekUnreadCount: () => 0,
  setUnreadCountCached: vi.fn(),
}));
vi.mock("@/lib/hooks/useLeaderboardAndStreak", () => ({
  useLeaderboardAndStreak: () => ({
    leaderboard: [],
    streak: { current_streak: 0 },
    isLeaderboardLoading: false,
    isStreakLoading: false,
    leaderboardError: null,
    refreshStreak: vi.fn(),
  }),
}));
vi.mock("@/lib/streak/streakCelebration", () => ({
  useStreakCelebration: () => ({ primed: false, navCount: 0 }),
  primeNavStreak: vi.fn(),
}));
vi.mock("@/lib/hooks/useVisibilityRefresh", () => ({ useVisibilityRefresh: vi.fn() }));
vi.mock("@/components/community/TourProvider", () => ({
  useTour: () => ({ startTour: vi.fn(), stopTour: vi.fn(), isRunning: false }),
  TourProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import { AppBar } from "./AppBar";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { PLATFORM_GUIDE_ROUTE, isPlatformGuideRoute } from "@/lib/guide/registry";

/** The top-nav Guide pill, by the accessible name it is published under. */
const NAV_GUIDE = "Take a platform guide";
/** The per-page "?" that ModulePageHeader renders from the route's registry entry. */
const PAGE_GUIDE = "Guide to this page";

function navGuide() {
  return screen.queryByLabelText(NAV_GUIDE);
}

beforeEach(() => {
  state.pathname = "/dashboard";
  state.role = "student";
  state.isAuthenticated = true;
  state.hideLeaderboard = false;
});

/** The phone overflow ("⋮") holds what does not fit the bar; open it and read its items. */
function openOverflow() {
  fireEvent.click(screen.getByTestId("appbar-overflow"));
  return within(screen.getByTestId("appbar-overflow-menu"))
    .queryAllByRole("menuitem")
    .map((i) => i.textContent ?? "");
}

describe("the dashboard's guide", () => {
  it("is offered on the dashboard", () => {
    render(<AppBar DrawerWidth={264} />);
    expect(navGuide()).toBeTruthy();
    expect(screen.getByText("Guide")).toBeTruthy();
  });

  it("is not offered on any other page", () => {
    // Every section the learner moves through: a course list, the job board, their profile,
    // certificates. The report was "[Every Section] at the top".
    for (const route of ["/adaptive-courses", "/jobs-v2", "/profile", "/certificates", "/live-sessions"]) {
      state.pathname = route;
      const { unmount } = render(<AppBar DrawerWidth={264} />);
      expect(navGuide(), `the dashboard guide is still on ${route}`).toBeNull();
      unmount();
    }
  });

  it("leaves nothing behind on those pages - the row closes up", () => {
    // Not hidden with display:none (which would still occupy a flex slot and a `gap`): the node
    // is absent from the DOM entirely, so the actions row collapses with no empty space.
    state.pathname = "/jobs-v2";
    const { container } = render(<AppBar DrawerWidth={264} />);
    expect(container.querySelector(`[aria-label="${NAV_GUIDE}"]`)).toBeNull();
  });

  it("stays off a detail route under the dashboard, not just the exact page", () => {
    state.pathname = "/adaptive-courses/12/module/3";
    render(<AppBar DrawerWidth={264} />);
    expect(navGuide()).toBeNull();
  });

  it("is still withheld from instructors on the dashboard", () => {
    state.role = "instructor";
    render(<AppBar DrawerWidth={264} />);
    expect(navGuide()).toBeNull();
  });

  it("is withheld from a signed-out visitor", () => {
    state.isAuthenticated = false;
    render(<AppBar DrawerWidth={264} />);
    expect(navGuide()).toBeNull();
  });
});

describe("isPlatformGuideRoute", () => {
  it("matches the dashboard and nothing else", () => {
    expect(isPlatformGuideRoute(PLATFORM_GUIDE_ROUTE)).toBe(true);
    expect(isPlatformGuideRoute("/dashboard")).toBe(true);
    expect(isPlatformGuideRoute("/admin/dashboard")).toBe(false);
    expect(isPlatformGuideRoute("/jobs-v2")).toBe(false);
    expect(isPlatformGuideRoute(null)).toBe(false);
    expect(isPlatformGuideRoute(undefined)).toBe(false);
  });
});

describe("the same guide on a phone", () => {
  // From 600px up the guide is the pill; below it the pill is hidden and the "⋮" overflow is the
  // way in. Two triggers, one dialog - so they have to appear and disappear together, or a phone
  // keeps a menu item that opens nothing.
  it("offers it in the phone overflow on the dashboard", () => {
    render(<AppBar DrawerWidth={264} />);
    expect(openOverflow().join("|")).toMatch(/Platform guide/);
  });

  it("does not offer it in the phone overflow on any other page", () => {
    state.pathname = "/jobs-v2";
    render(<AppBar DrawerWidth={264} />);
    expect(openOverflow().join("|")).not.toMatch(/Platform guide/);
  });

  it("drops the overflow button itself rather than opening an empty sheet", () => {
    // A learner whose institution hides the leaderboard, on a page that is not the dashboard:
    // the guide was the only other thing in there.
    state.pathname = "/jobs-v2";
    state.hideLeaderboard = true;
    render(<AppBar DrawerWidth={264} />);
    expect(screen.queryByTestId("appbar-overflow")).toBeNull();
  });

  it("does not pop open again when the learner returns to the dashboard", () => {
    // This bar survives navigation, so the open flag outlives the page that set it. Open the
    // guide, leave, come back: the learner must land on their dashboard, not on a dialog.
    const { rerender } = render(<AppBar DrawerWidth={264} />);
    fireEvent.click(screen.getByTestId("appbar-overflow"));
    fireEvent.click(
      within(screen.getByTestId("appbar-overflow-menu")).getByRole("menuitem", { name: /Platform guide/ })
    );
    expect(screen.getByRole("dialog")).toBeTruthy();

    state.pathname = "/jobs-v2";
    rerender(<AppBar DrawerWidth={264} />);
    expect(screen.queryByRole("dialog")).toBeNull();

    state.pathname = "/dashboard";
    rerender(<AppBar DrawerWidth={264} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps the overflow button while Today's Leaders still lives in it", () => {
    state.pathname = "/jobs-v2";
    render(<AppBar DrawerWidth={264} />);
    expect(screen.getByTestId("appbar-overflow")).toBeTruthy();
    expect(openOverflow().join("|")).toMatch(/Leaders/);
  });
});

describe("the per-page guide, which is genuinely app-wide", () => {
  it("still gives every module page its own '?'", () => {
    // Removing the dashboard guide from the top nav must not leave other pages without help:
    // the route's own guide, resolved from the registry, is untouched.
    state.pathname = "/jobs-v2";
    render(<ModulePageHeader eyebrow="CAREER" title="Jobs" description="Roles matched to you." />);
    expect(screen.getByLabelText(PAGE_GUIDE)).toBeTruthy();
  });

  it("still resolves a detail route back to its module's guide", () => {
    state.pathname = "/live-sessions/482";
    render(<ModulePageHeader eyebrow="LEARN" title="Live Sessions" />);
    expect(screen.getByLabelText(PAGE_GUIDE)).toBeTruthy();
  });
});
