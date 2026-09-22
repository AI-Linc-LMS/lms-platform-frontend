import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { cssByMedia } from "@/components/community/cssByMedia.testutil";

/**
 * The top bar on a phone.
 *
 * Reported from an iPhone: seven things in one 390px row - hamburger, logo, guide compass, a
 * "TL" chip, streak, bell, avatar - with the tenant's logo crushed into a 40px tile, and for one
 * tenant (CodePaathshala) the logo request failed and the bar showed the browser's broken-image
 * glyph next to "Code…". What is pinned here:
 *
 *  - the guide and Today's Leaders leave the phone bar for one overflow menu, and stay reachable;
 *  - the logo gets its room on a phone only (the sizes live in the phone media block);
 *  - a logo that fails to load becomes the tenant name, on every width;
 *  - the remaining phone targets are 44px, in the phone block only.
 */

// ---- viewport ---------------------------------------------------------------------------------
const realMatchMedia = window.matchMedia;
function viewport(width: number) {
  window.matchMedia = ((query: string) => {
    const max = /max-width:\s*([\d.]+)px/.exec(query);
    const min = /min-width:\s*([\d.]+)px/.exec(query);
    let matches = false;
    if (max) matches = width <= parseFloat(max[1]);
    else if (min) matches = width >= parseFloat(min[1]);
    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  }) as unknown as typeof window.matchMedia;
}

// ---- app seams --------------------------------------------------------------------------------
const state = vi.hoisted(() => ({
  clientInfo: {
    id: 5,
    name: "CodePaathshala",
    app_icon_url: "https://be.example/branding/asset/1/",
    app_logo_url: "https://be.example/branding/asset/2/",
    features: [],
  } as Record<string, unknown>,
  adminMode: false,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard",
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => (typeof fallback === "string" ? fallback : key === "common.todaysLeaders" ? "Today's Leaders" : key),
    i18n: { language: "en" },
  }),
}));
vi.mock("@/lib/i18n", () => ({ isRtl: () => false }));
vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({ user: { role: "student", first_name: "Aarav", email: "a@x.io" }, isAuthenticated: true, logout: vi.fn() }),
}));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({
  useClientInfo: () => ({ clientInfo: state.clientInfo }),
  useHideLeaderboardView: () => false,
}));
vi.mock("@/lib/contexts/AdminModeContext", () => ({ useAdminMode: () => ({ isAdminMode: state.adminMode, toggleAdminMode: vi.fn() }) }));
vi.mock("@/lib/hooks/useLeaderboardAndStreak", () => ({
  useLeaderboardAndStreak: () => ({
    leaderboard: [],
    streak: { current_streak: 4 },
    isLeaderboardLoading: false,
    isStreakLoading: false,
    leaderboardError: null,
    refreshStreak: vi.fn(),
  }),
}));
vi.mock("@/lib/streak/streakCelebration", () => ({
  useStreakCelebration: () => ({ primed: true, navCount: 4 }),
  primeNavStreak: vi.fn(),
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/lib/hooks/useVisibilityRefresh", () => ({ useVisibilityRefresh: vi.fn() }));
vi.mock("@/lib/notifications/unreadBadge", () => ({
  getUnreadCountCached: () => Promise.resolve(0),
  peekUnreadCount: () => 0,
  setUnreadCountCached: vi.fn(),
}));
vi.mock("@/lib/services/notification.service", () => ({ notificationService: { getNotifications: vi.fn() } }));
vi.mock("@/components/layout/Sidebar", () => ({ DRAWER_WIDTH: 260 }));
vi.mock("@/lib/navigation/useNavigation", () => ({ useNavigation: () => ({ grouped: { top: [], sections: [], bottom: [] }, items: [] }) }));
vi.mock("@/lib/services/community.service", () => ({ communityService: {} }));

import { AppBar } from "./AppBar";

beforeEach(() => viewport(390));
afterEach(() => {
  window.matchMedia = realMatchMedia;
});

const renderBar = () => render(<AppBar DrawerWidth={260} />);

describe("AppBar on a phone", () => {
  it("moves the guide and Today's Leaders into one overflow menu, and both still open", () => {
    renderBar();
    // The phone-only "TL" chip is gone from the bar.
    expect(screen.queryByText("TL")).toBeNull();

    const more = screen.getByTestId("appbar-overflow");
    fireEvent.click(more);
    const menu = screen.getByTestId("appbar-overflow-menu");
    fireEvent.click(within(menu).getByRole("menuitem", { name: /Platform guide/ }));
    // The same platform guide dialog the desktop pill opens.
    expect(screen.getByRole("dialog")).toHaveTextContent(/tour|Got it/i);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    fireEvent.click(more);
    fireEvent.click(within(screen.getByTestId("appbar-overflow-menu")).getByRole("menuitem", { name: /Today's Leaders/ }));
    expect(screen.getByText("Today's Progress Leaders")).toBeInTheDocument();
  });

  it("shows the overflow button on a phone only, and hides the guide pill there", () => {
    renderBar();
    const more = cssByMedia(screen.getByTestId("appbar-overflow"));
    expect(more.unscoped).toContain("display:none");
    expect(more.phone).toContain("display:inline-flex");
    const guide = cssByMedia(screen.getByRole("button", { name: "Take a platform guide" }));
    expect(guide.phone).toContain("display:none");
    expect(guide.unscoped).not.toMatch(/display:none/);
  });

  it("gives the logo real room on a phone only", () => {
    renderBar();
    const logo = cssByMedia(screen.getByTestId("appbar-logo"));
    expect(logo.phone).toContain("flex:0 1 120px");
    expect(logo.phone).toContain("height:32px");
    expect(logo.unscoped).not.toContain("120px");
    // From 600px up the logo tile is the 40px square it always was.
    expect(logo.unscoped).toContain("width:40px");
  });

  it("lets the browser pick one logo: the wide logo on a phone, the icon from 600px up", () => {
    // A <picture>, so the choice does not wait for a JS media query (false during hydration,
    // which made a phone fetch the icon and then the logo). Same markup at every width.
    for (const w of [390, 800]) {
      viewport(w);
      const { container, unmount } = render(<AppBar DrawerWidth={260} />);
      const source = container.querySelector("[data-testid=appbar-logo] picture source");
      expect(source).toHaveAttribute("media", "(max-width:599.95px)");
      expect(source).toHaveAttribute("srcset", "https://be.example/branding/asset/2/");
      expect(container.querySelector("[data-testid=appbar-logo] picture img")).toHaveAttribute("src", "https://be.example/branding/asset/1/");
      unmount();
    }
  });

  it("makes the streak chip, avatar and hamburger 44px on a phone only", () => {
    renderBar();
    const streak = cssByMedia(screen.getByTestId("streak-chip"));
    expect(streak.phone).toContain("min-height:44px");
    expect(streak.unscoped).not.toContain("min-height:44px");
    const avatar = cssByMedia(screen.getByTestId("appbar-avatar-mobile"));
    expect(avatar.phone).toContain("width:44px");
    expect(avatar.unscoped).not.toContain("width:44px");
    const burger = cssByMedia(screen.getByTestId("mobile-menu-button"));
    expect(burger.phone).toContain("width:44px");
    expect(burger.unscoped).toContain("width:42px");
  });

  it("opens the streak card with a tap and closes it with a tap outside, without re-opening", async () => {
    renderBar();
    const chip = screen.getByTestId("streak-chip");
    fireEvent.pointerDown(chip, { pointerType: "touch" });
    fireEvent.mouseEnter(chip); // the compatibility event a tap fires: ignored
    fireEvent.click(chip);
    expect(screen.getByText("Keep it Going!")).toBeInTheDocument();
    // Tap outside: the backdrop closes it, and the click that bubbles through the portal to the
    // chip's React handler must not open it again.
    fireEvent.click(document.querySelector(".MuiPopover-root .MuiBackdrop-root")!);
    await waitFor(() => expect(screen.queryByText("Keep it Going!")).toBeNull());
  });

  it("with a mouse below 600px, a hover-opened card never takes the pointer (no open/close loop)", async () => {
    renderBar();
    const chip = screen.getByTestId("streak-chip");
    fireEvent.pointerEnter(chip, { pointerType: "mouse" });
    fireEvent.mouseEnter(chip);
    expect(screen.getByText("Keep it Going!")).toBeInTheDocument();
    // If the popover root took pointer events it would cover the chip, fire mouseleave (close)
    // and then mouseenter on the next move (open), once per move.
    const root = document.querySelector(".MuiPopover-root")!;
    const css = cssByMedia(root);
    expect(css.unscoped).toContain("pointer-events:none");
    expect(css.phone).not.toContain("pointer-events:auto");
    // Moving within the chip keeps it open; leaving closes it once.
    fireEvent.mouseMove(chip);
    expect(screen.getByText("Keep it Going!")).toBeInTheDocument();
    fireEvent.mouseLeave(chip);
    await waitFor(() => expect(screen.queryByText("Keep it Going!")).toBeNull());
  });
});

describe("AppBar streak card by touch from 600px up (tablet, touch laptop)", () => {
  it("a tap outside closes it, and the page scroll is not left locked", async () => {
    viewport(800);
    renderBar();
    const chip = screen.getByTestId("streak-chip");
    fireEvent.pointerDown(chip, { pointerType: "touch" });
    fireEvent.mouseEnter(chip);
    fireEvent.click(chip);
    expect(screen.getByText("Keep it Going!")).toBeInTheDocument();
    // Touch-opened: the backdrop must catch the tap outside.
    expect(cssByMedia(document.querySelector(".MuiPopover-root")!).unscoped).toContain("pointer-events:auto");
    fireEvent.mouseLeave(chip); // the compatibility event: ignored, the tap outside decides
    fireEvent.click(document.querySelector(".MuiPopover-root .MuiBackdrop-root")!);
    await waitFor(() => expect(screen.queryByText("Keep it Going!")).toBeNull());
    await waitFor(() => expect(document.body.style.overflow).toBe(""));
  });
});

describe("AppBar overflow menu with admin mode on", () => {
  it("focuses the first action, not the admin-mode label, and the arrows cycle the actions", async () => {
    state.adminMode = true;
    try {
      renderBar();
      fireEvent.click(screen.getByTestId("appbar-overflow"));
      const menu = screen.getByTestId("appbar-overflow-menu");
      expect(within(menu).getByTestId("appbar-overflow-admin-mode")).toHaveAttribute("aria-disabled", "true");
      const guide = within(menu).getByRole("menuitem", { name: /Platform guide/ });
      const leaders = within(menu).getByRole("menuitem", { name: /Today's Leaders/ });
      await waitFor(() => expect(document.activeElement).toBe(guide));
      fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
      expect(document.activeElement).toBe(leaders);
      fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
      expect(document.activeElement).toBe(guide);
    } finally {
      state.adminMode = false;
    }
  });
});

describe("AppBar logo fallback (every width)", () => {
  it("on a phone falls back from the app logo to the icon before the name", () => {
    renderBar();
    const img = screen.getByRole("img", { name: "CodePaathshala" });
    // The phone <source> was chosen: the browser reports it as currentSrc.
    Object.defineProperty(img, "currentSrc", { configurable: true, value: "https://be.example/branding/asset/2/" });
    fireEvent.error(img);
    const logo = screen.getByTestId("appbar-logo");
    // The failed logo is dropped from the phone source; every width now gets the icon.
    expect(logo.querySelector("source")).toBeNull();
    expect(within(logo).getByRole("img")).toHaveAttribute("src", "https://be.example/branding/asset/1/");
  });

  it("shows the tenant name for an image that failed before hydration", () => {
    const complete = vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
    const natural = vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(0);
    try {
      renderBar();
      // Both candidates arrive already failed (a <picture> falls through to the next on re-render).
      const logo = screen.getByTestId("appbar-logo");
      expect(within(logo).getByTestId("tenant-wordmark")).toHaveTextContent("CodePaathshala");
      expect(logo.querySelector("img")).toBeNull();
    } finally {
      complete.mockRestore();
      natural.mockRestore();
    }
  });

  it.each([390, 800])("shows the tenant name when no logo loads at %ipx", (w) => {
    viewport(w);
    renderBar();
    // Fail every candidate in turn (a phone tries the app logo, then the icon).
    for (let i = 0; i < 2; i++) {
      const img = screen.queryByRole("img", { name: "CodePaathshala" });
      if (img) fireEvent.error(img);
    }
    const logo = screen.getByTestId("appbar-logo");
    expect(within(logo).getByTestId("tenant-wordmark")).toHaveTextContent("CodePaathshala");
    expect(logo.querySelector("img")).toBeNull();
  });

  it("shows the tenant name when there is no logo url", () => {
    const saved = state.clientInfo;
    state.clientInfo = { id: 5, name: "CodePaathshala", features: [] };
    try {
      renderBar();
      expect(within(screen.getByTestId("appbar-logo")).getByTestId("tenant-wordmark")).toHaveTextContent("CodePaathshala");
    } finally {
      state.clientInfo = saved;
    }
  });
});

describe("AppBar from 600px up", () => {
  it("keeps the guide pill, and the phone overflow never shows", () => {
    viewport(1440);
    renderBar();
    expect(screen.getByRole("button", { name: "Take a platform guide" })).toBeInTheDocument();
    expect(cssByMedia(screen.getByTestId("appbar-overflow")).unscoped).toContain("display:none");
  });
});
