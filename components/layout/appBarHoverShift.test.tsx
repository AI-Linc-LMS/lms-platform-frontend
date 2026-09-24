import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

/**
 * Pointing at the top bar must move nothing else on the page.
 *
 * Reported as "while hovering over today's leader, the support and help button is not static.
 * Same for the current streak button", on every section. Both chips open a MUI `Popover`, and a
 * Popover is a Modal: by default it locks page scroll, which means `overflow: hidden` plus a
 * compensating `padding-right` on the body. That takes the document scrollbar away, the viewport
 * widens by its width, and every `position: fixed` element MUI does not know about - the Support
 * and Help button at `insetInlineEnd: 24px`, the phone dock - jumps sideways by exactly the
 * scrollbar's width, then jumps back when the pointer leaves. Measured on demo.ailinc.com: +15px
 * on the Support and Help button at 1440, 390 and 360.
 *
 * jsdom has no layout, so it cannot show the 15px. What it can show is the cause: MUI's
 * ModalManager writes those inline styles on the body (and on every `.mui-fixed` element) the
 * instant the card opens. This asserts the bar never writes them - while still asserting the card
 * itself opens, so the fix cannot be "delete the hover affordance".
 */

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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard",
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) =>
      typeof fallback === "string" ? fallback : key === "common.todaysLeaders" ? "Today's Leaders" : key,
    i18n: { language: "en" },
  }),
}));
vi.mock("@/lib/i18n", () => ({ isRtl: () => false }));
vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    user: { role: "student", first_name: "Aarav", email: "a@x.io" },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({
  useClientInfo: () => ({ clientInfo: { id: 34, name: "Demo Client", features: [] } }),
  useHideLeaderboardView: () => false,
}));
vi.mock("@/lib/contexts/AdminModeContext", () => ({
  useAdminMode: () => ({ isAdminMode: false, toggleAdminMode: vi.fn() }),
}));
vi.mock("@/lib/hooks/useLeaderboardAndStreak", () => ({
  useLeaderboardAndStreak: () => ({
    leaderboard: [{ name: "Aarav Sharma", score: 42 }],
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
vi.mock("@/lib/navigation/useNavigation", () => ({
  useNavigation: () => ({ grouped: { top: [], sections: [], bottom: [] }, items: [] }),
}));
vi.mock("@/lib/services/community.service", () => ({ communityService: {} }));

import { AppBar } from "./AppBar";

beforeEach(() => {
  viewport(1440);
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
  document.documentElement.style.overflow = "";
});
afterEach(() => {
  window.matchMedia = realMatchMedia;
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
  document.documentElement.style.overflow = "";
});

/** What a scroll lock leaves behind: the writes that change the viewport's usable width. */
const pageLockState = () => ({
  bodyOverflow: document.body.style.overflow,
  bodyPaddingRight: document.body.style.paddingRight,
  htmlOverflow: document.documentElement.style.overflow,
  // Every `.mui-fixed` element is padded by the same amount; the top bar is one of them.
  fixedPadding: Array.from(document.querySelectorAll<HTMLElement>(".mui-fixed")).map(
    (el) => el.style.paddingRight
  ),
});

const UNLOCKED = { bodyOverflow: "", bodyPaddingRight: "", htmlOverflow: "" };

describe("top bar hover cards leave the page geometry alone", () => {
  it("Today's Leaders opens its card without locking page scroll", () => {
    render(<AppBar DrawerWidth={260} />);
    expect(pageLockState()).toMatchObject(UNLOCKED);

    const chip = screen.getByText("Today's Leaders").closest("div.MuiBox-root")!;
    fireEvent.mouseEnter(chip);

    // The affordance still works: the card is open.
    expect(screen.getByText("Today's Progress Leaders")).toBeInTheDocument();
    // ...and nothing that decides the viewport's width has been touched.
    const locked = pageLockState();
    expect(locked).toMatchObject(UNLOCKED);
    expect(locked.fixedPadding.every((p) => p === "")).toBe(true);

    fireEvent.mouseLeave(chip);
    expect(pageLockState()).toMatchObject(UNLOCKED);
  });

  it("the streak pill opens its card without locking page scroll", () => {
    render(<AppBar DrawerWidth={260} />);
    expect(pageLockState()).toMatchObject(UNLOCKED);

    const chip = screen.getByTestId("streak-chip");
    fireEvent.pointerEnter(chip, { pointerType: "mouse" });
    fireEvent.mouseEnter(chip);

    expect(screen.getByText(/Current Streak/)).toBeInTheDocument();
    const locked = pageLockState();
    expect(locked).toMatchObject(UNLOCKED);
    expect(locked.fixedPadding.every((p) => p === "")).toBe(true);

    fireEvent.mouseLeave(chip);
    expect(pageLockState()).toMatchObject(UNLOCKED);
  });
});
