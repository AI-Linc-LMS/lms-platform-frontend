// @vitest-environment jsdom
/**
 * "If I submit the wrong answer once and submit the correct answer again then it is not calculating
 *  the points."
 *
 * It calculates them now - the learner holds their best attempt. Which leaves a second problem the
 * UI has to solve: a passing submit can legitimately add 0, because a stronger attempt already paid
 * for the problem. Watching every test go green beside a total that does not move is exactly what
 * made this look broken, so the HUD has to SAY so, and it has to state the rule before the learner
 * submits rather than after they have come to distrust it.
 *
 * The ladder is rendered from the server's own numbers (decay.retry), so the rule a learner reads
 * cannot drift from the rule that pays them.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CodingTimerPoints } from "./CodingTimerPoints";

const ISO = new Date(1_700_000_000_000).toISOString();
const DECAY = {
  base: 150, floor: 40, grace: 600, dec: 5, iv: 30, hint_penalty: 0.05,
  retry: { full_through: 2, steps: [0.8, 0.6], floor: 0.5 },
};

function renderHud(props: Record<string, unknown> = {}) {
  return render(
    <CodingTimerPoints
      decay={DECAY as never}
      startedAt={ISO}
      serverNow={ISO}
      running={false}
      {...props}
    />,
  );
}

describe("what the coding HUD tells a learner about retrying", () => {
  it("states the rule from the server's ladder, not from hardcoded copy", () => {
    renderHud({ running: true, earned: null });
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/Attempts 1-2 pay in full/);
    expect(text).toMatch(/80% → 60% → 50%/);
    expect(text).toMatch(/best attempt always stands/i);
  });

  it("follows a server that changes the ladder", () => {
    renderHud({
      running: true,
      earned: null,
      decay: { ...DECAY, retry: { full_through: 1, steps: [0.9], floor: 0.25 } },
    });
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/Your first attempt pay[s]? in full, then 90% → 25%/);
  });

  it("says nothing about retries when the server has not sent a ladder", () => {
    renderHud({ running: true, earned: null, decay: { ...DECAY, retry: undefined } });
    expect(document.body.textContent ?? "").not.toMatch(/best attempt/i);
  });

  it("explains a passing submit that added no points", () => {
    renderHud({ earned: 0, held: 120 });
    expect(screen.getByText(/No new points - you already hold 120\/150 here/)).toBeTruthy();
  });

  it("does not claim a standing it was not given", () => {
    renderHud({ earned: 0, held: 0 });
    expect(screen.getByText(/No points left on this one/)).toBeTruthy();
  });

  it("names the attempt that earned, so a retry is visibly credited", () => {
    renderHud({ earned: 90, held: 90, attemptNo: 2 });
    expect(screen.getByText("Locked in on submit · attempt 2")).toBeTruthy();
    expect(document.body.textContent).toMatch(/90/);
  });

  it("names what the ladder charged once it starts biting", () => {
    renderHud({ earned: 60, held: 60, attemptNo: 3 });
    expect(screen.getByText("Locked in on submit · attempt 3 at 80%")).toBeTruthy();
  });

  it("charges the floor beyond the last named step", () => {
    renderHud({ earned: 40, held: 40, attemptNo: 9 });
    expect(screen.getByText("Locked in on submit · attempt 9 at 50%")).toBeTruthy();
  });

  it("keeps the first-attempt line plain", () => {
    renderHud({ earned: 150, held: 150, attemptNo: 1 });
    expect(screen.getByText("Locked in on submit")).toBeTruthy();
  });
});
