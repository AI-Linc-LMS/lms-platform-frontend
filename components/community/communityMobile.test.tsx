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

import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

process.env.NEXT_PUBLIC_CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID ?? "1";

import type { Thread } from "@/lib/services/community.service";
import { ThreadCard } from "./ThreadCard";
import { CommentItem } from "./CommentItem";
import { ShareDialog } from "./ShareDialog";
import { ReportDialog } from "./ReportDialog";
import { CreateThreadDialog } from "./CreateThreadDialog";

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

  it("keeps the bookmark and share controls reachable rather than clipped off the edge", () => {
    asViewport(true);
    render(
      <ThreadCard thread={THREAD} onVote={noop} onBookmark={noop} onShare={vi.fn()} onReport={vi.fn()} />,
    );

    const actions = screen.getByTestId("thread-actions");
    const bookmark = within(actions).getByRole("button", { name: /bookmark/i });
    expect(emittedCss(bookmark)).toMatch(/min-height:\s*44px/);
    const share = within(actions).getByRole("button", { name: /share/i });
    expect(emittedCss(share)).toMatch(/min-height:\s*44px/);
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

  it("keeps the composer a centred dialog on a desktop", () => {
    asViewport(false);
    render(<CreateThreadDialog open onClose={vi.fn()} onSubmit={async () => {}} />);
    expect(document.querySelector(".MuiDialog-root")).toBeTruthy();
    expect(document.querySelector(".MuiDrawer-root")).toBeNull();
  });
});
