/**
 * The adaptive video page on a phone.
 *
 * At 390px the progress line under the player (time, concepts, checks, "% watched") was one
 * unwrapped row that overran the card, the full-screen button over the player was a 30px target,
 * and the companion tabs were 34px pills. The phone values must sit inside the max-width:599.95px
 * block so a desktop player is untouched.
 */
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

const start = vi.hoisted(() => vi.fn());
vi.mock("./useVimeoController", () => ({
  useVimeoController: () => ({
    setIframe: () => {}, currentTime: 0, duration: 358, isPlaying: false, playbackRate: 1, rewinds: [], endedTick: 0,
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

const MEDIA_BLOCK = /@media ([^{]+)\{((?:[^{}]*\{[^{}]*\})*)\}/g;
const PHONE_QUERY = "(max-width:599.95px)";
function cssOf(el: Element): { phone: string; unscoped: string } {
  const sheets = Array.from(document.querySelectorAll("style")).map((s) => s.textContent ?? "").join("\n");
  const classes = Array.from(el.classList).filter((c) => c.startsWith("css-") || c.startsWith("mui-"));
  const pick = (text: string) =>
    classes.flatMap((c) => text.split(/(?=\.(?:css|mui)-)/).filter((chunk) => chunk.startsWith(`.${c}`))).join("\n");
  let phone = "";
  for (const m of sheets.matchAll(MEDIA_BLOCK)) if (m[1].trim() === PHONE_QUERY) phone += `\n${m[2]}`;
  const unscoped = sheets.replace(MEDIA_BLOCK, (block, q: string) => (q.trim() === PHONE_QUERY ? "" : block));
  return { phone: pick(phone), unscoped: pick(unscoped) };
}

const companion = {
  id: 800, title: "AI into Business Capital", instructions: "", description: "", video: { title: "AI", vimeo_id: "1", duration_seconds: 358 },
  concept_map: { nodes: [{ id: "root", label: "Root", timestamp_seconds: 0 }], edges: [] },
  chapters: [], takeaways: [], target_skills: [], check_ins: [], transcript_segments: [],
  play_url: "https://vimeo.com/1164028722", source: "catalog",
};
const session = { id: "s1", status: "active", watch_mode: "normal", current_timestamp: 0, completeness_pct: 0,
  max_speed: 1, comprehension_state: {}, comprehension_score: 0, started_at: "", completed_at: null };

describe("video progress UI on a phone", () => {
  it("wraps the progress line and gives the player controls 44px targets, inside the phone block only", async () => {
    start.mockResolvedValue({ session_id: "s1", companion, session });
    render(<VideoCompanion configId={800} />);
    const meta = await screen.findByTestId("video-progress-meta");
    expect(cssOf(meta).phone).toMatch(/flex-wrap:wrap/);
    expect(cssOf(meta).unscoped).not.toMatch(/flex-wrap:wrap/);

    const fullscreen = screen.getByRole("button", { name: "Full screen" });
    expect(cssOf(fullscreen).phone).toMatch(/width:44px/);
    expect(cssOf(fullscreen).unscoped).not.toMatch(/width:44px/);

    const tab = screen.getAllByRole("tab")[0];
    expect(cssOf(tab).phone).toMatch(/min-height:44px/);
    expect(cssOf(tab).unscoped).toMatch(/min-height:0/);
  });
});
