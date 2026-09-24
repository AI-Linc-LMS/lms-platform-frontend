/**
 * The video page's two columns end near each other.
 *
 * Reported with a screenshot: on a laptop the left column was the player, the companion tabs and
 * the "Ask about what's on screen" box, then empty space, while the right column went on with Watch
 * mode, Feeling lost?, Auto chapters and Key takeaways. Measured headlessly at 1280px with a typical
 * companion, the rail ran 255px past the lesson, and 463px once every takeaway was revealed.
 *
 * Between 1200px and 1535px the takeaways - the one panel that grows as the video plays - go below
 * both columns, full width. It is CSS placement only - the takeaways are their own grid item - so
 * nothing is measured, nothing moves while the page is in use, and the player keeps its place in the
 * tree at every width. These tests pin that contract; the pixel measurements are in the PR.
 */
import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

const start = vi.hoisted(() => vi.fn());
vi.mock("./useVimeoController", () => ({
  useVimeoController: () => ({
    setIframe: () => {}, currentTime: 0, duration: 600, isPlaying: false, playbackRate: 1, rewinds: [], endedTick: 0,
    play: vi.fn(), pause: vi.fn(), seekTo: vi.fn(), setRate: vi.fn(),
  }),
}));
vi.mock("@/lib/services/adaptive-video.service", async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  adaptiveVideoService: new Proxy({ startSession: start } as Record<string, unknown>, {
    get: (target, key: string) => target[key] ?? vi.fn().mockResolvedValue({}),
  }),
}));
vi.mock("@/components/scorecard/shared", async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  Reveal: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
class NoopObserver { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = NoopObserver;

import { VideoCompanion } from "./VideoCompanion";

// MUI writes a responsive `xs` value under min-width:0px - it applies at every width, which is why
// the wider breakpoints each restate what they need.
const XS = "(min-width:0px)";
const LG = "(min-width:1200px)";
const XL = "(min-width:1536px)";
const MEDIA_BLOCK = /@media ([^{]+)\{((?:[^{}]*\{[^{}]*\})*)\}/g;

/** The declarations emotion generated for `el`, outside any media query and inside each one. */
function cssOf(el: Element): { base: string; at: (query: string) => string } {
  const sheets = Array.from(document.querySelectorAll("style")).map((s) => s.textContent ?? "").join("\n");
  const classes = Array.from(el.classList).filter((c) => c.startsWith("css-") || c.startsWith("mui-"));
  const pick = (text: string) =>
    classes.flatMap((c) => text.split(/(?=\.(?:css|mui)-)/).filter((chunk) => chunk.startsWith(`.${c}`))).join("\n");
  const blocks = [...sheets.matchAll(MEDIA_BLOCK)];
  return {
    base: pick(sheets.replace(MEDIA_BLOCK, "")),
    at: (query) => pick(blocks.filter((m) => m[1].trim() === query).map((m) => m[2]).join("\n")),
  };
}

function companion(over: Record<string, unknown> = {}) {
  return {
    id: 800, title: "Recursion", instructions: "", description: "",
    video: { title: "Recursion", vimeo_id: "1", duration_seconds: 600 },
    concept_map: { nodes: [], edges: [] }, target_skills: [], check_ins: [],
    transcript_segments: [{ start_seconds: 0, end_seconds: 5, text: "Hello." }],
    chapters: [{ start_seconds: 0, title: "The base case" }, { start_seconds: 300, title: "The recursive step" }],
    takeaways: ["Every recursion needs a base case."],
    play_url: "https://player.vimeo.com/video/1", source: "catalog", rewatch_available: true, ...over,
  };
}
const session = { id: "s1", status: "active", watch_mode: "normal", current_timestamp: 0, completeness_pct: 0,
  max_speed: 1, comprehension_state: {}, comprehension_score: 0, started_at: "", completed_at: null };

/** The page grid, and its three items. */
async function layout() {
  const slot = await screen.findByTestId("takeaways-slot");
  const grid = slot.parentElement as HTMLElement;
  const [main, rail] = Array.from(grid.children) as HTMLElement[];
  return { grid, main, rail, slot };
}

beforeEach(() => start.mockReset());

describe("the video page's columns", () => {
  it("puts the takeaways below both columns at 1200-1535px, and back in the rail from 1536px", async () => {
    start.mockResolvedValue({ session_id: "s1", companion: companion(), session });
    render(<VideoCompanion configId={800} />);
    const { grid, slot } = await layout();
    expect(cssOf(grid).at(LG)).toContain('grid-template-areas:"main rail" "takeaways takeaways"');
    expect(cssOf(slot).at(LG)).toContain("margin-top:0");
    // Back in the rail, the lesson spans both rows, so its spare height goes under the takeaways
    // rather than between them and the chapters.
    expect(cssOf(grid).at(XL)).toContain('grid-template-areas:"main rail" "main takeaways"');
    expect(cssOf(grid).at(LG)).toContain("grid-template-rows:auto 1fr");
    expect(cssOf(slot).at(XL)).toContain("margin-top:-4px");
  });

  it("leaves one column exactly as it was: the takeaways close the stack, 16px after the chapters", async () => {
    start.mockResolvedValue({ session_id: "s1", companion: companion(), session });
    render(<VideoCompanion configId={800} />);
    const { grid, main, rail, slot } = await layout();
    expect(cssOf(grid).at(XS)).toContain('grid-template-areas:"main" "rail" "takeaways"');
    expect(cssOf(slot).at(XS)).toContain("margin-top:-4px");
    expect(Array.from(grid.children)).toEqual([main, rail, slot]);
    // The rail's own order is untouched.
    const titles = ["Watch mode", "Feeling lost?", "Auto chapters"].map((t) => within(rail).getByText(t));
    for (let i = 1; i < titles.length; i++) {
      expect(titles[i - 1].compareDocumentPosition(titles[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    expect(within(slot).getByText("Key takeaways · live")).toBeInTheDocument();
  });

  it("never moves the player: it stays in the main column's item at every width", async () => {
    start.mockResolvedValue({ session_id: "s1", companion: companion(), session });
    const { container } = render(<VideoCompanion configId={800} />);
    const { main, rail, slot } = await layout();
    const iframe = container.querySelector("iframe");
    expect(main.contains(iframe)).toBe(true);
    expect(rail.contains(iframe) || slot.contains(iframe)).toBe(false);
    // One DOM for every width - the placement is CSS - so there is no second player to swap to.
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
  });

  it("keeps the takeaways in the rail for a video with no chapters, which would leave the rail bare", async () => {
    start.mockResolvedValue({ session_id: "s1", companion: companion({ chapters: [] }), session });
    render(<VideoCompanion configId={800} />);
    const { grid, slot } = await layout();
    expect(cssOf(grid).at(LG)).toContain('grid-template-areas:"main rail" "main takeaways"');
    expect(cssOf(slot).at(LG)).toContain("margin-top:-4px");
  });

  it("lays nothing out for takeaways a video does not have", async () => {
    start.mockResolvedValue({ session_id: "s1", companion: companion({ takeaways: [] }), session });
    const { container } = render(<VideoCompanion configId={800} />);
    await screen.findByText("Watch mode");
    expect(screen.queryByTestId("takeaways-slot")).toBeNull();
    // iframe -> player box -> main column -> the grid: the two-column grid it has always been.
    const grid = container.querySelector("iframe")!.parentElement!.parentElement!.parentElement!;
    expect(cssOf(grid).base).toContain("display:grid");
    for (const query of [XS, LG, XL]) expect(cssOf(grid).at(query)).not.toContain("grid-template-areas");
  });
});
