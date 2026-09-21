/**
 * The Community feed page on a phone.
 *
 * Eight filter chips wrapped into four rows on a 390px screen and pushed the feed below the fold,
 * the leaderboard was reachable only from a sidebar that is hidden below `md`, and Offer Bounty
 * was a hand-rolled fixed overlay with a 340px card. jsdom has no layout, so these assert the
 * structure a phone renders instead of pixel widths.
 */

import type { ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

process.env.NEXT_PUBLIC_CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID ?? "1";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/community",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ threadId: "7" }),
}));

vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/common/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/common/ModulePageHeader", () => ({
  ModulePageHeader: () => <div data-testid="page-header" />,
  HeaderActionButton: () => null,
}));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({ user: { id: 1, user_name: "me", first_name: "Me" } }),
}));

vi.mock("@/components/community/XPGainProvider", () => ({
  useXPGain: () => ({ showXPGain: vi.fn() }),
}));

vi.mock("@/components/common/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock("@/lib/services/community.service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/community.service")>(
    "@/lib/services/community.service",
  );
  return {
    ...actual,
    communityService: {
      ...actual.communityService,
      getThreads: () => Promise.resolve([]),
      getMyBookmarks: () => Promise.resolve([]),
      getFollowingFeed: () => Promise.resolve([]),
      getBounties: () => Promise.resolve([]),
      getUserXP: () => Promise.reject(new Error("offline")),
      getTags: () => Promise.resolve([]),
      getLeaderboard: () => Promise.resolve({ period: "all", results: [] }),
      getThreadDetail: () => Promise.resolve(THREAD_DETAIL),
    },
  };
});

const THREAD_DETAIL = {
  id: 7,
  title: "How do I handle JWT refresh tokens without logging everyone out?",
  body: "The refresh endpoint 500s for every account.",
  author: { id: 3, user_name: "asha", name: "Asha Menon", profile_pic_url: "", role: "student" },
  tags: [{ id: 1, name: "django" }],
  upvotes: 12,
  downvotes: 1,
  user_vote: null,
  bookmarks_count: 4,
  user_bookmarked: false,
  comments_count: 0,
  comments: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  post_type: "question",
};

import CommunityPage from "./page";
import ThreadDetailPage from "./[threadId]/page";
import LeaderboardPage from "./leaderboard/page";
import { cssByMedia } from "@/components/community/cssByMedia.testutil";

function asViewport(phone: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: phone ? /max-width/.test(query) : /min-width/.test(query),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => asViewport(false));

describe("the community feed on a phone", () => {
  it("puts the filter chips in one scrolling row instead of four wrapped rows", async () => {
    asViewport(true);
    render(<CommunityPage />);

    const row = await screen.findByRole("group", { name: /post filters/i });
    // Every filter is reachable from the scrolling row.
    for (const label of ["All Posts", "Saved"]) {
      expect(within(row).getByRole("button", { name: new RegExp(`^${label}$`, "i") })).toBeInTheDocument();
    }
    expect(within(row).getAllByRole("button").length).toBeGreaterThanOrEqual(8);
  });

  it("gives a phone a way to the leaderboard below the feed", async () => {
    asViewport(true);
    render(<CommunityPage />);
    await waitFor(() => expect(screen.getAllByText("Top contributors").length).toBe(2));
    // Only the sidebar copy carries the tour target, so the tour never highlights a hidden card.
    expect(document.querySelectorAll('[data-tour-id="tour-leaderboard"]')).toHaveLength(1);
  });

  it("hides the wrapping desktop chip row on a phone, and only there", async () => {
    asViewport(true);
    render(<CommunityPage />);
    await screen.findByRole("group", { name: /post filters/i });

    const wrap = cssByMedia(screen.getByTestId("filter-chips-wrap"));
    expect(wrap.base).toMatch(/display:\s*none/);
    expect(wrap.desktop).toMatch(/display:\s*flex/);
  });
});

describe("a thread on a phone", () => {
  it("makes a tag a 40px target on a phone without touching the 24px desktop chip", async () => {
    asViewport(true);
    render(<ThreadDetailPage />);
    const tag = (await screen.findByText("#django")).closest(".MuiChip-root")!;

    const css = cssByMedia(tag);
    expect(css.phone).toMatch(/height:\s*40px/);
    expect(css.unscoped).not.toMatch(/height:\s*40px/);
    expect(css.unscoped).not.toMatch(/(^|[;{])height:\s*auto/);
  });

  it("keeps the action row to one line: votes left, bookmark and more right", async () => {
    asViewport(true);
    render(<ThreadDetailPage />);
    const actions = await screen.findByTestId("detail-actions");

    const row = cssByMedia(actions);
    expect(row.phone).toMatch(/flex-wrap:\s*nowrap/);
    expect(row.unscoped).not.toMatch(/space-between/);
    expect(cssByMedia(screen.getByTestId("detail-vote-inline")).phone).toMatch(/margin-right:\s*auto/);

    // Share and Report move into "more" on a phone; on desktop they stay inline buttons.
    const share = within(actions).getByRole("button", { name: /^share$/i });
    expect(cssByMedia(share).phone).toMatch(/display:\s*none/);
    expect(cssByMedia(share).unscoped).not.toMatch(/display:\s*none/);
    const more = within(actions).getByRole("button", { name: /more actions/i });
    expect(cssByMedia(more).desktop).toMatch(/display:\s*none/);
    // The desktop row gets none of it.
    expect(row.unscoped).not.toMatch(/min-height:\s*44px/);
  });
});

describe("the leaderboard tabs", () => {
  it("leave MUI's 48px Tab floor alone at every width", async () => {
    asViewport(false);
    render(<LeaderboardPage />);
    const tabs = (await screen.findByRole("tab", { name: /all-time/i })).closest(".MuiTabs-root")!;

    const css = cssByMedia(tabs);
    // The old `{ xs: 48, sm: "auto" }` dropped the floor to `auto` on desktop.
    expect(css.unscoped).not.toMatch(/min-height:\s*auto/);
    expect(css.phone).not.toMatch(/min-height/);
  });
});
