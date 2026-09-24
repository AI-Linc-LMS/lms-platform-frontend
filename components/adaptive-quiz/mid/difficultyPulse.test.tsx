import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@/lib/i18n";
import { DifficultyPulse } from "./DifficultyPulse";

/**
 * The live quiz's difficulty banner says what the next answer will actually do.
 *
 * It used to read "Answer correctly -> steps up toward Hard · miss one -> eases toward Easy" on
 * every question: including the one the learner screenshotted, a Medium question at a 79% chance,
 * served because the quiz had no Hard question left - no right answer could have stepped it up.
 */

const base = { predictedPCorrect: 0.79, targetSkill: "installation procedures", avgSe: 0.6, theta: 1.3 };
const line = () => screen.queryByTestId("difficulty-ladder-line")?.textContent ?? null;

describe("DifficultyPulse ladder line", () => {
  it("says the quiz has run out of Hard questions instead of promising a step up", () => {
    render(<DifficultyPulse {...base} difficultyLabel="Medium" wantedLevel="Hard" streak={1} streakToMove={2} />);
    expect(line()).toBe("This quiz has no Hard questions left, so this one is Medium.");
    expect(line()).not.toMatch(/steps up/);
  });

  it("states the two-in-a-row rule from the current level", () => {
    render(<DifficultyPulse {...base} difficultyLabel="Medium" wantedLevel="Medium" streak={0} streakToMove={2} />);
    expect(line()).toBe("2 right in a row → steps up to Hard · 2 misses in a row → eases to Easy");
  });

  it("says when this answer is the one that moves the level", () => {
    render(<DifficultyPulse {...base} difficultyLabel="Easy" wantedLevel="Easy" streak={1} streakToMove={2} />);
    expect(line()).toBe("Get this one right → the next question steps up to Medium");
  });

  it("does not promise a step up to a level the quiz has used up", () => {
    render(
      <DifficultyPulse
        {...base} difficultyLabel="Medium" wantedLevel="Medium" streak={1} streakToMove={2} levelsLeft={["Easy", "Medium"]}
      />,
    );
    expect(line()).toBe("2 misses in a row → eases to Easy · No Hard questions left in this quiz");
  });

  it("promises nothing about a next question on the last one", () => {
    render(<DifficultyPulse {...base} difficultyLabel="Medium" wantedLevel="Medium" streak={1} streakToMove={2} isLast />);
    expect(line()).toBeNull();
  });

  it("still explains the last question when the quiz ran out of its level", () => {
    render(<DifficultyPulse {...base} difficultyLabel="Medium" wantedLevel="Hard" streak={1} streakToMove={2} isLast />);
    expect(line()).toBe("This quiz has no Hard questions left, so this one is Medium.");
  });

  it("offers no step up from the top level", () => {
    render(<DifficultyPulse {...base} difficultyLabel="Hard" wantedLevel="Hard" streak={0} streakToMove={2} />);
    expect(line()).toBe("2 misses in a row → eases to Medium");
  });

  it("states no rule for a question the older engine served", () => {
    render(<DifficultyPulse {...base} difficultyLabel="Medium" />);
    expect(line()).toBeNull();
  });
});
