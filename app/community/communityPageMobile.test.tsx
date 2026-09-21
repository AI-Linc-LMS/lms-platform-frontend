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
  useParams: () => ({}),
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
    },
  };
});

import CommunityPage from "./page";

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
});
