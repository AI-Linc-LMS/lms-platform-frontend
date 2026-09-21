/**
 * Community on a phone.
 *
 * Measured on a 390px iPhone viewport against the demo tenant, Community was the only learner
 * route with genuinely CLIPPED content: elements reached x=423 inside a `MuiPaper` that hides its
 * overflow, so every post card was cut off at the right edge, and 35 controls were under 40px.
 *
 * The cause was the usual one: a flex child's `min-width` is `auto`, so the author line and the
 * action row inside a card's content column could not shrink and pushed the column past the card.
 *
 * jsdom has no layout engine, so these assert the two things that are actually decidable here -
 * the structure a phone renders, and the CSS the component emits - rather than pixel widths.
 */

import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

process.env.NEXT_PUBLIC_CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID ?? "1";

import type { Thread } from "@/lib/services/community.service";
import { ThreadCard } from "./ThreadCard";
import { CommentItem } from "./CommentItem";
import { ShareDialog } from "./ShareDialog";
import { ReportDialog } from "./ReportDialog";
import { CreateThreadDialog } from "./CreateThreadDialog";
import { BountySection } from "./BountySection";
import { cssByMedia } from "./cssByMedia.testutil";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/community",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

vi.mock("@/lib/services/community.service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/community.service")>(
    "@/lib/services/community.service",
  );
  return {
    ...actual,
    communityService: { ...actual.communityService, getTags: () => Promise.resolve([]) },
  };
});

/** MUI reads the viewport through `matchMedia`; this is the only handle a phone test has on it. */
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

/**
 * Emotion writes its rules as text into <style> tags outside production, so the CSS a component
 * emitted for an element is readable. Rules for the phone (the base, un-media-queried ones) are
 * what we check - a `{ xs, sm }` value compiles to the xs value at the top level and the sm value
 * inside `@media (min-width:600px)`.
 */
function emittedCss(el: Element): string {
  const sheets = Array.from(document.querySelectorAll("style"))
    .map((s) => s.textContent ?? "")
    .join("\n");
  const classes = Array.from(el.classList).filter((c) => c.startsWith("css-"));
  return classes
    .flatMap((c) => sheets.split(/(?=\.css-)/).filter((chunk) => chunk.startsWith(`.${c}`)))
    .join("\n");
}

const THREAD: Thread = {
  id: 7,
  title: "How do I handle JWT refresh tokens without logging everyone out?",
  body: "The refresh endpoint 500s for every account and I cannot tell why.",
  author: { id: 3, user_name: "asha", name: "Asha Menon", profile_pic_url: "", role: "student" },
  tags: [{ id: 1, name: "django" }],
  upvotes: 12,
  downvotes: 1,
  user_vote: null,
  bookmarks_count: 4,
  user_bookmarked: false,
  comments_count: 6,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  post_type: "question",
};

const noop = async () => {};

afterEach(() => {
  asViewport(false);
});

describe("a post card on a phone", () => {
  it("lets the content column shrink, so nothing is pushed past a card that hides its overflow", () => {
    asViewport(true);
    render(<ThreadCard thread={THREAD} onVote={noop} onBookmark={noop} onShare={vi.fn()} />);

    // The row holding the vote rail and the content column. Its children used to keep
    // `min-width: auto`, which is exactly how a 423px-wide row ended up inside a 358px card.
    const row = screen.getByTestId("thread-body-row");
    expect(emittedCss(row)).toMatch(/>\s*\*\s*\{[^}]*min-width:\s*0/);
  });

  it("puts the votes in the action row, because the left rail is hidden there", () => {
    asViewport(true);
    render(<ThreadCard thread={THREAD} onVote={noop} onBookmark={noop} onShare={vi.fn()} />);

    const actions = screen.getByTestId("thread-actions");
    expect(within(actions).getByTestId("thread-vote-inline")).toBeInTheDocument();
    // The rail is still rendered for wider screens and chosen by CSS, as the mobile primitives do.
    expect(screen.getByTestId("thread-vote-rail")).toBeInTheDocument();
    expect(screen.getByTestId("thread-vote-rail")).not.toContainElement(actions);
  });

  it("gives every vote button a thumb-sized target", () => {
    asViewport(true);
    render(<ThreadCard thread={THREAD} onVote={noop} onBookmark={noop} onShare={vi.fn()} />);

    const inline = screen.getByTestId("thread-vote-inline");
    const buttons = within(inline).getAllByRole("button");
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      expect(emittedCss(button)).toMatch(/height:\s*44px/);
      expect(emittedCss(button)).toMatch(/width:\s*44px/);
    }
  });

  it("keeps the bookmark a thumb target and folds share and report into a 44px more menu", () => {
    asViewport(true);
    const onShare = vi.fn();
    const onReport = vi.fn();
    render(
      <ThreadCard thread={THREAD} onVote={noop} onBookmark={noop} onShare={onShare} onReport={onReport} />,
    );

    const actions = screen.getByTestId("thread-actions");
    const bookmark = within(actions).getByRole("button", { name: /bookmark/i });
    expect(cssByMedia(bookmark).phone).toMatch(/min-height:\s*44px/);

    // Share and report are hidden on a phone (inline on desktop) ...
    const share = within(actions).getByRole("button", { name: /^share$/i });
    expect(cssByMedia(share).phone).toMatch(/display:\s*none/);
    expect(cssByMedia(share).unscoped).not.toMatch(/display:\s*none/);
    const report = within(actions).getByRole("button", { name: /^report$/i });
    expect(cssByMedia(report).phone).toMatch(/display:\s*none/);

    // ... and reachable from "more", which is itself a 44px target and hidden on desktop.
    const more = within(actions).getByRole("button", { name: /more actions/i });
    expect(cssByMedia(more).phone).toMatch(/width:\s*44px/);
    expect(cssByMedia(more).desktop).toMatch(/display:\s*none/);
    fireEvent.click(more);
    fireEvent.click(screen.getByRole("menuitem", { name: /share/i }));
    expect(onShare).toHaveBeenCalledWith(7);
    fireEvent.click(more);
    fireEvent.click(screen.getByRole("menuitem", { name: /report/i }));
    expect(onReport).toHaveBeenCalledWith(7);
  });

  it("lays the phone action row out as one row: votes left, the rest grouped right", () => {
    asViewport(true);
    render(<ThreadCard thread={THREAD} onVote={noop} onBookmark={noop} onShare={vi.fn()} onReport={vi.fn()} />);

    const actions = cssByMedia(screen.getByTestId("thread-actions"));
    expect(actions.phone).toMatch(/flex-wrap:\s*nowrap/);
    expect(actions.phone).not.toMatch(/space-between/);
    expect(cssByMedia(screen.getByTestId("thread-vote-inline")).phone).toMatch(/margin-right:\s*auto/);
  });

  it("hides the left vote rail on a phone and shows it from sm up", () => {
    asViewport(true);
    render(<ThreadCard thread={THREAD} onVote={noop} onBookmark={noop} onShare={vi.fn()} />);

    const rail = cssByMedia(screen.getByTestId("thread-vote-rail"));
    expect(rail.base).toMatch(/display:\s*none/);
    expect(rail.desktop).toMatch(/display:\s*flex/);
    // And the inline copy is the mirror image.
    const inline = cssByMedia(screen.getByTestId("thread-vote-inline"));
    expect(inline.base).toMatch(/display:\s*flex/);
    expect(inline.desktop).toMatch(/display:\s*none/);
  });
});

describe("phone-only sizes never reach the desktop", () => {
  it("scopes the 44px vote and bookmark targets to the phone media block", () => {
    asViewport(false);
    render(<ThreadCard thread={THREAD} onVote={noop} onBookmark={noop} onShare={vi.fn()} />);

    for (const button of within(screen.getByTestId("thread-vote-rail")).getAllByRole("button")) {
      const css = cssByMedia(button);
      expect(css.phone).toMatch(/height:\s*44px/);
      expect(css.unscoped).not.toMatch(/(^|[^-])height:\s*44px/);
      expect(css.unscoped).not.toMatch(/(^|[^-])width:\s*44px/);
      expect(css.unscoped).not.toMatch(/(^|[;{])(width|height):\s*auto/);
    }
    const bookmark = within(screen.getByTestId("thread-actions")).getByRole("button", { name: /bookmark/i });
    expect(cssByMedia(bookmark).unscoped).not.toMatch(/min-(height|width):\s*44px/);
  });
});

describe("a comment on a phone", () => {
  const COMMENT = {
    id: 21,
    body: "Check whether the refresh token is being rotated on every call.",
    author: { id: 9, user_name: "raj", name: "Raj Patel", profile_pic_url: "", role: "instructor" },
    upvotes: 3,
    downvotes: 0,
    user_vote: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_accepted: false,
    replies: [],
  };

  it("gives Reply a thumb-sized target instead of a 24px hit area", () => {
    asViewport(true);
    render(
      <CommentItem
        comment={COMMENT as never}
        threadId={7}
        onVote={async () => {}}
        onReply={async () => {}}
      />,
    );
    const reply = screen.getByRole("button", { name: /reply/i });
    expect(emittedCss(reply)).toMatch(/min-height:\s*44px/);
  });
});

describe("the dialogs a phone opens", () => {
  it("shares in a bottom sheet on a phone and a centred dialog on a desktop", () => {
    asViewport(true);
    const { container, unmount } = render(
      <ShareDialog open onClose={vi.fn()} url="https://example.test/community/7" title="A post" />,
    );
    expect(document.querySelector(".MuiDrawer-root")).toBeTruthy();
    expect(document.querySelector(".MuiDialog-root")).toBeNull();
    expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
    unmount();
    void container;

    asViewport(false);
    render(
      <ShareDialog open onClose={vi.fn()} url="https://example.test/community/7" title="A post" />,
    );
    expect(document.querySelector(".MuiDialog-root")).toBeTruthy();
    expect(document.querySelector(".MuiDrawer-root")).toBeNull();
  });

  it("reports in a bottom sheet whose actions are pinned under the reasons", () => {
    asViewport(true);
    render(<ReportDialog open onClose={vi.fn()} target="thread" onSubmit={async () => {}} />);

    expect(document.querySelector(".MuiDrawer-root")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /report this thread/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit report/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^cancel$/i })).toBeInTheDocument();
  });

  it("composes a new post in a bottom sheet, with Post still reachable in its footer", () => {
    asViewport(true);
    render(<CreateThreadDialog open onClose={vi.fn()} onSubmit={async () => {}} />);

    expect(document.querySelector(".MuiDrawer-root")).toBeTruthy();
    expect(document.querySelector(".MuiDialog-root")).toBeNull();
    expect(screen.getByRole("button", { name: /post question/i })).toBeInTheDocument();
    // The post-type switch is still there, at a size a thumb can hit.
    const pollChip = screen.getByRole("button", { name: /poll/i });
    expect(emittedCss(pollChip)).toMatch(/height:\s*40px/);
  });

  it("keeps the composer the desktop dialog it was: 16px paper, footer band, no sheet chrome", () => {
    asViewport(false);
    render(<CreateThreadDialog open onClose={vi.fn()} onSubmit={async () => {}} />);
    expect(document.querySelector(".MuiDialog-root")).toBeTruthy();
    expect(document.querySelector(".MuiDrawer-root")).toBeNull();

    const paper = document.querySelector(".MuiDialog-paper")!;
    expect(cssByMedia(paper).unscoped).toMatch(/border-radius:\s*16px/);
    expect(cssByMedia(paper).unscoped).toMatch(/box-shadow:\s*0 24px 64px/);
    // The sheet's title and close button are a phone thing; the desktop composer never had them.
    expect(screen.queryByRole("heading", { name: /new post/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^close$/i })).toBeNull();
    // The running count lives in the footer band, next to Cancel and Post.
    const actions = document.querySelector(".MuiDialogActions-root")!;
    expect(within(actions as HTMLElement).getByText(/chars/)).toBeInTheDocument();
    expect(within(actions as HTMLElement).getByRole("button", { name: /post question/i })).toBeInTheDocument();
  });

  it("keeps share and report as the desktop dialogs they were, icon header and all", () => {
    asViewport(false);
    const { unmount } = render(
      <ShareDialog open onClose={vi.fn()} url="https://example.test/community/7" title="A post" />,
    );
    let paper = document.querySelector(".MuiDialog-paper")!;
    expect(cssByMedia(paper).unscoped).toMatch(/border-radius:\s*14px/);
    expect(cssByMedia(paper).unscoped).toMatch(/border:\s*1px solid/);
    expect(screen.getByRole("heading", { name: /share this post/i }).tagName).toBe("H6");
    unmount();

    render(<ReportDialog open onClose={vi.fn()} target="thread" onSubmit={async () => {}} />);
    paper = document.querySelector(".MuiDialog-paper")!;
    expect(cssByMedia(paper).unscoped).toMatch(/border-radius:\s*14px/);
    // The original subtitle1 header (an h6 beside the flag icon), not the sheet's h2.
    expect(screen.getByRole("heading", { name: /report this thread/i }).tagName).toBe("H6");
  });

  it("will not let a report be closed mid-submit, on either device", async () => {
    for (const phone of [false, true]) {
      asViewport(phone);
      let finish: () => void = () => {};
      const { unmount } = render(
        <ReportDialog
          open
          onClose={vi.fn()}
          target="thread"
          onSubmit={() => new Promise<void>((resolve) => { finish = resolve; })}
        />,
      );
      fireEvent.click(screen.getByText("Spam or promotional"));
      fireEvent.click(screen.getByRole("button", { name: /submit report/i }));
      await screen.findByText(/submitting/i);
      if (phone) {
        // The sheet drops its close button while the request is in flight.
        expect(screen.queryByRole("button", { name: /^close$/i })).toBeNull();
      } else {
        // The desktop header's X is disabled, as it always was.
        const header = screen.getByText("Report this thread").parentElement!;
        expect(within(header).getByRole("button")).toBeDisabled();
      }
      finish();
      unmount();
    }
  });
});

describe("the open-bounties row", () => {
  const BOUNTY = {
    thread_id: 7,
    thread_title: "Why does my refresh token 500?",
    author: { id: 3, user_name: "asha", name: "Asha Menon", profile_pic_url: "" },
    hours_unanswered: 5,
    has_bounty: true,
    points: 20,
    comment_count: 0,
  };

  it("is the shared ScrollRow on a phone and the plain scrolling row on desktop", () => {
    asViewport(true);
    render(<BountySection bounties={[BOUNTY as never, { ...BOUNTY, thread_id: 8 } as never]} />);

    // Walk up from a card to the element that scrolls sideways.
    let scroller: Element | null = screen.getAllByText("Why does my refresh token 500?")[0];
    while (scroller && !/overflow-x:\s*auto/.test(cssByMedia(scroller).unscoped)) scroller = scroller.parentElement;
    expect(scroller).toBeTruthy();
    const css = cssByMedia(scroller!);
    // ScrollRow's phone treatment: snap, fade, hidden scrollbar ...
    expect(css.phone).toMatch(/scroll-snap-type:\s*x proximity/);
    expect(css.base).toMatch(/mask-image:\s*linear-gradient/);
    // ... none of which reaches the desktop, which keeps its 4px scrollbar and no snapping.
    expect(css.unscoped).not.toMatch(/scroll-snap-type:\s*x/);
    expect(css.desktop).toMatch(/mask-image:\s*none/);
  });
});
