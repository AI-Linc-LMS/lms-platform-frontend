import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, waitFor } from "@testing-library/react";

/**
 * The poll must PROBE, not reload. This single behaviour is the 2026-10-22 incident.
 *
 * `near` flips true at exactly T-15:00 for every page already open, and the safety-net poll then
 * armed a 60s interval that re-fetched the whole list: every session the tenant had ever held,
 * with attendance, materials, recordings, transcripts and AI summaries - to answer the question
 * "has the class started yet". For Agileology that payload hung 409 dated occurrences off 11
 * series rows. Read IOPS went from 0.4 to 1,183, single requests reached 125 seconds, and the
 * load balancer answered 504 at its 60s idle timeout.
 *
 * So the poll now reads `join-now/` - a few hundred bytes, one indexed range scan - and pays for
 * the full reload only when a flag it watches actually moves.
 */

const getSessions = vi.fn();
const getJoinNow = vi.fn();
const getMyStats = vi.fn();

vi.mock("@/lib/services/live-sessions", () => ({
  studentLiveSessionsService: {
    getSessions: (...a: unknown[]) => getSessions(...a),
    getJoinNow: (...a: unknown[]) => getJoinNow(...a),
    getMyStats: (...a: unknown[]) => getMyStats(...a),
    getRecording: vi.fn().mockResolvedValue({}),
  },
}));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({
  useClientInfo: () => ({ clientInfo: { features: [] }, loading: false }),
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

import { useLiveSessions } from "./useLiveSessions";

/** A class 6 minutes out, so `near` is true and the poll arms. */
function soonSession() {
  return {
    id: 7,
    occurrence_id: 70,
    topic_name: "Binary search",
    class_datetime: new Date(Date.now() + 6 * 60_000).toISOString(),
    duration_minutes: 60,
    meeting_status: "scheduled",
    is_zoom: true,
    occurrences: [],
  };
}

const joinRow = (over: Record<string, unknown> = {}) => ({
  occurrence_id: 70,
  session_id: 7,
  title: "Binary search",
  course: null,
  starts_at: new Date(Date.now() + 6 * 60_000).toISOString(),
  duration_minutes: 60,
  status: "scheduled",
  join_url: "https://zoom.test/j/1",
  started: false,
  ended: false,
  starts_in_seconds: 360,
  ...over,
});

function Harness() {
  useLiveSessions();
  return null;
}

beforeEach(() => {
  getSessions.mockReset().mockResolvedValue([soonSession()]);
  getJoinNow.mockReset().mockResolvedValue({ now: new Date().toISOString(), sessions: [joinRow()] });
  getMyStats.mockReset().mockResolvedValue(null);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/**
 * Run every armed interval/timeout `ms` forward, flushing the promises each tick creates.
 *
 * Deliberately NOT `waitFor` after this: testing-library's waitFor polls on its own timer, and
 * under fake timers that poll never advances, so every assertion written that way times out at
 * 20s instead of failing. A probe tick is one fetch and one setState, so flushing the
 * microtask queue a few times is enough and is also exact.
 */
async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
    for (let i = 0; i < 8; i++) await Promise.resolve();
  });
}

/**
 * Mount with the clock ALREADY faked, and settle the initial load by advancing it.
 *
 * Installing fake timers after mounting looks equivalent and is not: the poll's interval is armed
 * by an effect during that first render, so it is a REAL interval that `advanceTimersByTime` can
 * never fire. The test then proves nothing while appearing to pass.
 */
async function mountAndSettle() {
  vi.useFakeTimers();
  render(<Harness />);
  await advance(1);
  return getSessions.mock.calls.length;
}

describe("the live-sessions safety poll", () => {
  it("probes the cheap endpoint instead of reloading the list", async () => {
    const initial = await mountAndSettle();
    expect(initial).toBe(1);

    // Three poll ticks at the upper end of the jittered interval (~84s): a quiet quarter-hour
    // before a class, which is exactly the window that broke.
    for (let i = 0; i < 3; i++) await advance(90_000);

    expect(getJoinNow.mock.calls.length).toBeGreaterThan(0);
    // The initial load, and not one request more. Before the fix every one of those ticks was a
    // full list fetch, from every open tab, on very nearly the same second.
    expect(getSessions).toHaveBeenCalledTimes(1);
  });

  it("reloads once when the class actually starts", async () => {
    await mountAndSettle();
    await advance(90_000);            // the first probe adopts the signal without reloading
    const afterFirstProbe = getSessions.mock.calls.length;
    expect(afterFirstProbe).toBe(1);

    // The host starts the meeting: `started` flips, so the page does now need the rich list.
    getJoinNow.mockResolvedValue({
      now: new Date().toISOString(),
      sessions: [joinRow({ started: true })],
    });
    await advance(90_000);

    expect(getSessions.mock.calls.length).toBeGreaterThan(afterFirstProbe);
  });

  it("notices a class ending, not only one starting", async () => {
    await mountAndSettle();
    await advance(90_000);
    const baseline = getSessions.mock.calls.length;

    // Without `ended` in the probe signal a class finishing would go unnoticed and the LIVE hero
    // would linger after the class was over.
    getJoinNow.mockResolvedValue({
      now: new Date().toISOString(),
      sessions: [joinRow({ started: true, ended: true })],
    });
    await advance(90_000);

    expect(getSessions.mock.calls.length).toBeGreaterThan(baseline);
  });

  it("costs probes rather than reloads across a whole quarter-hour", async () => {
    await mountAndSettle();
    for (let i = 0; i < 6; i++) await advance(90_000);

    // Nine simulated minutes, so the class itself starts in here: the boundary setTimeout fires
    // once and legitimately reloads the list, which is the mechanism that flips a card to LIVE
    // on time and is NOT what was wrong. What was wrong is paying that price per TICK.
    const reloads = getSessions.mock.calls.length;
    const probes = getJoinNow.mock.calls.length;
    expect(probes).toBeGreaterThanOrEqual(3);
    expect(reloads).toBeLessThanOrEqual(2);
    expect(reloads).toBeLessThan(probes);
  });

  it("does not fall back to the heavy request when the probe fails", async () => {
    await mountAndSettle();
    getJoinNow.mockRejectedValue(new Error("504"));
    for (let i = 0; i < 3; i++) await advance(90_000);

    // Falling back to the heaviest request on the platform at the moment the cheapest one is
    // failing is how a blip becomes an outage - it is the exact shape of 2026-10-22. The
    // boundary setTimeout is what flips a card to LIVE on time; this poll is only the net.
    expect(getSessions).toHaveBeenCalledTimes(1);
  });
});
