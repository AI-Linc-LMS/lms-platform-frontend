import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * The count on a quiz card is the count the quiz opens with.
 *
 * A targeted re-quiz is drawn from whatever questions the course can still offer, and the backend
 * now records that number as the quiz's length (min === max) instead of the old 4-8 target it was
 * never going to serve. A fixed-length quiz should say its length once - "3 Qs" - rather than
 * "3-3 Qs".
 */

import { AdaptiveQuizCard, type AdaptiveQuizCardData } from "./AdaptiveQuizCard";

const card = (over: Partial<AdaptiveQuizCardData> = {}): AdaptiveQuizCardData => ({
  config_id: 1,
  quiz_title: "Re-quiz: Functions (targeted)",
  target_skills: ["functions"],
  min_questions: 3,
  max_questions: 3,
  mcq_count: 3,
  hint_tokens: 1,
  is_personal: true,
  ...over,
});

describe("AdaptiveQuizCard question count", () => {
  it("states a fixed-length quiz's length once", () => {
    render(<AdaptiveQuizCard data={card()} onStart={() => {}} />);
    expect(screen.getByText("3 Qs")).toBeTruthy();
    expect(screen.queryByText("3–3 Qs")).toBeNull();
  });

  it("still shows a range when the quiz really is adaptive in length", () => {
    render(<AdaptiveQuizCard data={card({ min_questions: 4, max_questions: 8 })} onStart={() => {}} />);
    expect(screen.getByText("4–8 Qs")).toBeTruthy();
  });
});
