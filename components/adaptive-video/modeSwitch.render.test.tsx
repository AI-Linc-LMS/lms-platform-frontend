/**
 * Switching the watch mode takes effect at once, in both directions, without touching the player.
 *
 * Reported as "when switching from Rewatch to Normal pace, the video check-ins do not appear until
 * the page is refreshed". A session opened in rewatch mode is sent NO check-ins - the server
 * withholds them - and the start payload was the only place they ever arrived. Switching told the
 * server the new mode and changed the rail, but the player still held an empty question list, so
 * nothing could fire until a reload fetched the (now normal) session again.
 *
 * Arming them late raised the other half: every check-in the learner had already played past in
 * rewatch mode was "due", so they would all have fired back to back. The schedule starts from where
 * the learner switched.
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

const player = vi.hoisted(() => ({
  currentTime: 0, duration: 200, endedTick: 0, seekTo: vi.fn(), play: vi.fn(), pause: vi.fn(), setRate: vi.fn(),
}));
const api = vi.hoisted(() => ({ startSession: vi.fn(), getCompanion: vi.fn(), sync: vi.fn(), answerCheckIn: vi.fn() }));

vi.mock("./useVimeoController", () => ({
  useVimeoController: () => ({
    setIframe: () => {}, currentTime: player.currentTime, duration: player.duration, isPlaying: false,
    playbackRate: 1, rewinds: [], endedTick: player.endedTick, play: player.play, pause: player.pause,
    seekTo: player.seekTo, setRate: player.setRate,
  }),
}));
vi.mock("@/lib/services/adaptive-video.service", async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  adaptiveVideoService: new Proxy(api as Record<string, unknown>, {
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

const checkIn = (id: number, at: number) => ({
  id, timestamp_seconds: at, concept: `Concept ${id}`, order: id,
  question_text: `Question ${id}?`, option_a: `Right ${id}`, option_b: "Wrong", option_c: "Wrong", option_d: "Wrong",
});
/**
 * 10 is already passed on an earlier visit; 11 sits behind the switch point (0:07); 12 ahead of it.
 * "Behind" means by more than the gate's +/-1s dropped-tick tolerance - a check-in a second behind
 * the playhead is one the learner is still at.
 */
const CHECK_INS = [checkIn(10, 3), checkIn(11, 5), checkIn(12, 9)];

function companion(over: Record<string, unknown> = {}) {
  return {
    id: 800, title: "Recursion", instructions: "", description: "",
    video: { title: "Recursion", vimeo_id: "1", duration_seconds: 200 },
    concept_map: { nodes: [], edges: [] }, chapters: [], takeaways: [], target_skills: [],
    check_ins: CHECK_INS, transcript_segments: [],
    play_url: "https://player.vimeo.com/video/1", source: "catalog",
    rewatch_available: true, my_completed: true, my_passed_check_in_ids: [10], ...over,
  };
}

function session(mode: string) {
  return { id: "s1", status: "active", watch_mode: mode, current_timestamp: 0, completeness_pct: 0,
    max_speed: 1, comprehension_state: {}, comprehension_score: 0, started_at: "", completed_at: null };
}

/** What the server does with a switch: it records the mode and answers with the session. */
function serverAcceptsModes() {
  api.sync.mockImplementation((_id: string, signals: { watch_mode?: string }) =>
    Promise.resolve(session(signals.watch_mode || "normal")));
}

/** A request that answers only when the test says so. */
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => { resolve = r; });
  return { promise, resolve };
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** Move the playhead, one second at a time (playback) or in one jump (a seek). */
async function moveTo(seconds: number, rerender: (ui: ReactNode) => void, { seek = false } = {}) {
  const from = player.currentTime;
  const steps = seek ? [seconds] : Array.from({ length: Math.max(seconds - from, 0) }, (_, i) => from + i + 1);
  for (const s of steps) {
    player.currentTime = s;
    rerender(<VideoCompanion configId={800} />);
    await waitFor(() => expect(screen.getByText(new RegExp(`^${fmt(s)} /`))).toBeInTheDocument());
  }
}

const modeOption = (name: RegExp) => screen.getByRole("radio", { name });
const pick = (label: string) => fireEvent.click(screen.getByText(label));

beforeEach(() => {
  player.currentTime = 0;
  player.endedTick = 0;
  player.duration = 200;
  for (const f of [player.seekTo, player.play, player.pause, player.setRate]) f.mockReset();
  for (const f of Object.values(api)) f.mockReset();
  serverAcceptsModes();
  api.answerCheckIn.mockResolvedValue({ is_correct: true, correct_option: "a", explanation: "", rewind_to_seconds: null });
});

describe("switching from Rewatch to Normal pace", () => {
  beforeEach(() => {
    // The server withholds the questions from a session it opened in rewatch mode.
    api.startSession.mockResolvedValue({ session_id: "s1", companion: companion({ check_ins: [] }), session: session("rewatch") });
    api.getCompanion.mockResolvedValue(companion());
  });

  it("brings the check-ins back without a refresh, asked from where the learner is", async () => {
    const { rerender, container } = render(<VideoCompanion configId={800} />);
    await screen.findByText(/^0:00 \//);
    const iframe = container.querySelector("iframe");
    await moveTo(7, rerender);
    expect(player.pause).not.toHaveBeenCalled();

    pick("Normal pace");
    await waitFor(() => expect(modeOption(/Normal pace/)).toHaveAttribute("aria-checked", "true"));

    // 11 (at 0:05) was played past in rewatch mode. Arming it now would stop the learner for a
    // moment they are no longer at - and with more of them, stop them over and over.
    await moveTo(8, rerender);
    expect(screen.queryByText("Question 11?")).toBeNull();
    expect(player.pause).not.toHaveBeenCalled();

    // 12 (at 0:09) is ahead of the switch: played through, it is asked - on this page, no reload.
    await moveTo(10, rerender);
    expect(await screen.findByText("Question 12?")).toBeInTheDocument();
    expect(player.pause).toHaveBeenCalledTimes(1);
    // Passed on an earlier visit, so never asked again.
    expect(screen.queryByText("Question 10?")).toBeNull();

    // How: the questions were fetched once, and the server was told the new mode.
    expect(api.getCompanion).toHaveBeenCalledTimes(1);
    expect(api.getCompanion).toHaveBeenCalledWith(800);
    expect(api.sync).toHaveBeenCalledWith("s1", { watch_mode: "normal" });
    // The player was neither reloaded, moved nor re-paced.
    expect(container.querySelector("iframe")).toBe(iframe);
    expect(player.seekTo).not.toHaveBeenCalled();
    expect(player.setRate).not.toHaveBeenCalled();
  });

  it("still asks a check-in behind the switch point once it is played through again", async () => {
    const { rerender } = render(<VideoCompanion configId={800} />);
    await screen.findByText(/^0:00 \//);
    await moveTo(7, rerender);
    pick("Normal pace");
    await waitFor(() => expect(api.sync).toHaveBeenCalledWith("s1", { watch_mode: "normal" }));

    await moveTo(4, rerender, { seek: true }); // the learner scrubs back...
    await moveTo(6, rerender); // ...and watches 0:05 again
    expect(await screen.findByText("Question 11?")).toBeInTheDocument();
  });

  it("marks the timeline and counts the checks as soon as the questions arrive", async () => {
    render(<VideoCompanion configId={800} />);
    // Rewatch: nothing is asked, so nothing is counted against the video.
    expect(await screen.findByText("1 check passed")).toBeInTheDocument();
    pick("Normal pace");
    expect(await screen.findByText("1/3 checks")).toBeInTheDocument();
  });

  it("leaves the mode where it was, and says so, when the questions cannot be fetched", async () => {
    api.getCompanion.mockRejectedValue(new Error("offline"));
    const { rerender } = render(<VideoCompanion configId={800} />);
    await screen.findByText(/^0:00 \//);
    pick("Normal pace");
    expect(await screen.findByText(/Couldn't switch the watch mode/)).toBeInTheDocument();
    expect(modeOption(/Rewatch/)).toHaveAttribute("aria-checked", "true");
    // The server was never told about a mode the page could not deliver.
    expect(api.sync).not.toHaveBeenCalledWith("s1", { watch_mode: "normal" });
    await moveTo(10, rerender);
    expect(player.pause).not.toHaveBeenCalled();

    // A second try fetches again, and this time works.
    api.getCompanion.mockResolvedValue(companion());
    pick("Normal pace");
    await waitFor(() => expect(api.sync).toHaveBeenCalledWith("s1", { watch_mode: "normal" }));
    expect(screen.queryByText(/Couldn't switch the watch mode/)).toBeNull();
    expect(api.getCompanion).toHaveBeenCalledTimes(2);
  });

  it("goes back to Rewatch when the server refuses the switch", async () => {
    api.sync.mockRejectedValue(new Error("500"));
    const { rerender } = render(<VideoCompanion configId={800} />);
    await screen.findByText(/^0:00 \//);
    pick("Normal pace");
    expect(await screen.findByText(/Couldn't switch the watch mode/)).toBeInTheDocument();
    expect(modeOption(/Rewatch/)).toHaveAttribute("aria-checked", "true");
    // The page does not ask questions the server's session is not scoring.
    await moveTo(10, rerender);
    expect(player.pause).not.toHaveBeenCalled();
  });

  it("makes one fetch for two quick switches, and only the last one reaches the server", async () => {
    const questions = deferred<ReturnType<typeof companion>>();
    api.getCompanion.mockReturnValue(questions.promise);
    render(<VideoCompanion configId={800} />);
    await screen.findByText(/^0:00 \//);
    pick("Normal pace");
    pick("Pause & ask every 60s");
    await act(async () => questions.resolve(companion()));
    await waitFor(() => expect(api.sync).toHaveBeenCalledWith("s1", { watch_mode: "pause_60s" }));
    expect(api.getCompanion).toHaveBeenCalledTimes(1);
    expect(api.sync).not.toHaveBeenCalledWith("s1", { watch_mode: "normal" });
    expect(modeOption(/Pause & ask/)).toHaveAttribute("aria-checked", "true");
  });

  it("falls back to the mode the server holds, not the one clicked in between", async () => {
    // Normal was clicked but superseded before it was ever sent, so the server is still on Rewatch.
    const questions = deferred<ReturnType<typeof companion>>();
    api.getCompanion.mockReturnValue(questions.promise);
    api.sync.mockRejectedValue(new Error("500"));
    render(<VideoCompanion configId={800} />);
    await screen.findByText(/^0:00 \//);
    pick("Normal pace");
    pick("Pause & ask every 60s");
    await act(async () => questions.resolve(companion()));
    expect(await screen.findByText(/Couldn't switch the watch mode/)).toBeInTheDocument();
    expect(modeOption(/Rewatch/)).toHaveAttribute("aria-checked", "true");
  });
});

describe("switching to Rewatch", () => {
  beforeEach(() => {
    api.startSession.mockResolvedValue({
      session_id: "s1", companion: companion({ my_passed_check_in_ids: [] }), session: session("normal"),
    });
  });

  it("stops asking at once, and closes a check-in that is already open", async () => {
    const { rerender } = render(<VideoCompanion configId={800} />);
    await screen.findByText(/^0:00 \//);
    await moveTo(4, rerender);
    expect(await screen.findByText("Question 10?")).toBeInTheDocument();

    pick("Rewatch");
    await waitFor(() => expect(screen.queryByText("Question 10?")).toBeNull());
    await waitFor(() => expect(api.sync).toHaveBeenCalledWith("s1", { watch_mode: "rewatch" }));

    player.pause.mockReset();
    await moveTo(12, rerender);
    expect(screen.queryByText(/Question 1\d\?/)).toBeNull();
    expect(player.pause).not.toHaveBeenCalled();
    // It already had the questions: nothing to fetch in either direction.
    expect(api.getCompanion).not.toHaveBeenCalled();
    expect(player.setRate).not.toHaveBeenCalled();
  });

  it("and back again resumes from the new position, without fetching the questions twice", async () => {
    const { rerender } = render(<VideoCompanion configId={800} />);
    await screen.findByText(/^0:00 \//);
    pick("Rewatch");
    await waitFor(() => expect(api.sync).toHaveBeenCalledWith("s1", { watch_mode: "rewatch" }));
    await moveTo(7, rerender);
    pick("Normal pace");
    await waitFor(() => expect(api.sync).toHaveBeenCalledWith("s1", { watch_mode: "normal" }));
    await moveTo(10, rerender);
    // 10 and 11 went by in rewatch; 12 is the first one played after switching back.
    expect(await screen.findByText("Question 12?")).toBeInTheDocument();
    expect(screen.queryByText("Question 10?")).toBeNull();
    expect(screen.queryByText("Question 11?")).toBeNull();
    expect(api.getCompanion).not.toHaveBeenCalled();
  });

  it("keeps a check-in passed on this visit passed, through Rewatch and back", async () => {
    const { rerender } = render(<VideoCompanion configId={800} />);
    await screen.findByText(/^0:00 \//);
    await moveTo(4, rerender);
    fireEvent.click(await screen.findByText("Right 10"));
    fireEvent.click(await screen.findByRole("button", { name: /Continue/ }));
    expect(await screen.findByText("1/3 checks")).toBeInTheDocument();

    pick("Rewatch");
    await waitFor(() => expect(api.sync).toHaveBeenCalledWith("s1", { watch_mode: "rewatch" }));
    pick("Normal pace");
    await waitFor(() => expect(api.sync).toHaveBeenCalledWith("s1", { watch_mode: "normal" }));
    await moveTo(1, rerender, { seek: true });
    await moveTo(4, rerender);
    expect(screen.queryByText("Question 10?")).toBeNull();
    expect(screen.getByText("1/3 checks")).toBeInTheDocument();
  });

  it("is overruled by a server that will not honour it", async () => {
    // The server downgrades a rewatch it will not grant; the rail shows the mode in force.
    api.sync.mockResolvedValue(session("normal"));
    render(<VideoCompanion configId={800} />);
    await screen.findByText(/^0:00 \//);
    pick("Rewatch");
    await waitFor(() => expect(api.sync).toHaveBeenCalledWith("s1", { watch_mode: "rewatch" }));
    await waitFor(() => expect(modeOption(/Normal pace/)).toHaveAttribute("aria-checked", "true"));
  });
});

describe("switching to Pause & ask every 60s", () => {
  it("schedules the first stop at the next minute, not at the ones already behind", async () => {
    api.startSession.mockResolvedValue({ session_id: "s1", companion: companion({ check_ins: [] }), session: session("normal") });
    const { rerender } = render(<VideoCompanion configId={800} />);
    await screen.findByText(/^0:00 \//);
    await moveTo(55, rerender, { seek: true });
    await moveTo(65, rerender);

    pick("Pause & ask every 60s");
    await waitFor(() => expect(api.sync).toHaveBeenCalledWith("s1", { watch_mode: "pause_60s" }));
    await act(async () => {});
    expect(screen.queryByText("Still with it?")).toBeNull();
    expect(player.pause).not.toHaveBeenCalled();

    await moveTo(121, rerender);
    expect(await screen.findByText("Still with it?")).toBeInTheDocument();
    expect(screen.getByText("Paused at 2:00")).toBeInTheDocument();
    expect(player.pause).toHaveBeenCalledTimes(1);
  });

  it("does not stop for a minute boundary the learner jumped over", async () => {
    api.startSession.mockResolvedValue({ session_id: "s1", companion: companion({ check_ins: [] }), session: session("pause_60s") });
    const { rerender } = render(<VideoCompanion configId={800} />);
    await screen.findByText(/^0:00 \//);
    await moveTo(150, rerender, { seek: true });
    await act(async () => {});
    expect(screen.queryByText("Still with it?")).toBeNull();
    expect(player.pause).not.toHaveBeenCalled();
  });

  it("does not stop twice at a boundary it has already stopped at", async () => {
    api.startSession.mockResolvedValue({ session_id: "s1", companion: companion({ check_ins: [] }), session: session("pause_60s") });
    const { rerender } = render(<VideoCompanion configId={800} />);
    await screen.findByText(/^0:00 \//);
    await moveTo(58, rerender, { seek: true });
    await moveTo(61, rerender);
    expect(await screen.findByText("Still with it?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Resume/ }));

    await moveTo(55, rerender, { seek: true }); // a rewind over 1:00...
    await moveTo(62, rerender); // ...played through again
    expect(screen.queryByText("Still with it?")).toBeNull();
    expect(player.pause).toHaveBeenCalledTimes(1);
  });
});
