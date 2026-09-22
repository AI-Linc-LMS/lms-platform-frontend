/**
 * The skill mastery card after a perfect attempt.
 *
 * A learner scored 5/5 and the card read "Sql 92% Mastered · First attempt · confidence early".
 * Mastery is an estimate that firms up per answer, so 92% after five correct answers is intended,
 * but the card never said so and looked like it contradicted the score. It now shows this
 * attempt's raw result next to the estimate and says how many questions the estimate rests on.
 * Checked at phone and desktop widths: the new lines' phone sizes sit inside the phone block only.
 */
import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { AdaptiveAINarration } from "@/lib/types/adaptive-quiz";

vi.mock("@/components/scorecard/shared/CountUp", () => ({
  CountUp: ({ value, suffix }: { value: number; suffix?: string }) => <>{`${value}${suffix ?? ""}`}</>,
}));
vi.mock("framer-motion", () => ({
  motion: { div: ({ children }: { children?: ReactNode }) => <div>{children}</div> },
}));

import { SkillMasteryHeatmap, attemptLine, evidenceLine } from "./SkillMasteryHeatmap";

type Row = AdaptiveAINarration["skill_mastery"][number];
const row = (over: Partial<Row>): Row => ({
  skill: "sql", theta: 1.848, se: 0.92, mastery_pct: 92, delta_pct: null, previous_mastery_pct: null,
  band: "mastered", attempt_correct: 5, attempt_total: 5, evidence_count: 5, ...over,
});

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

function setWidth(px: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: px });
  window.dispatchEvent(new Event("resize"));
}

describe("skill mastery card text", () => {
  it("states this attempt's result and the evidence behind the estimate", () => {
    expect(attemptLine(row({}))).toBe("This attempt: 100% (5/5)");
    expect(attemptLine(row({ attempt_correct: 2, attempt_total: 3 }))).toBe("This attempt: 67% (2/3)");
    expect(evidenceLine(row({}))).toBe("Mastery grows with more questions: 5 so far");
    expect(evidenceLine(row({ se: 0.4, evidence_count: 14 }))).toBe("Based on 14 questions");
    expect(evidenceLine(row({ se: 0.4, evidence_count: 1 }))).toBe("Based on 1 question");
  });

  it("keeps the old wording for a narration cached before the counts existed", () => {
    const legacy = row({ attempt_correct: undefined, attempt_total: undefined, evidence_count: undefined, se: 1.2 });
    expect(attemptLine(legacy)).toBeNull();
    expect(evidenceLine(legacy)).toBe("confidence early");
  });
});

describe.each([
  ["phone", 390],
  ["desktop", 1280],
])("skill mastery card on %s", (_label, width) => {
  it("shows 'This attempt' and the evidence next to a below-100 estimate after a perfect attempt", () => {
    setWidth(width);
    render(
      <SkillMasteryHeatmap
        skills={[
          row({}),
          row({ skill: "join operations" }),
          row({ skill: "the on clause", theta: 0.782, se: 1.238, mastery_pct: 73, band: "proficient",
                attempt_correct: 1, attempt_total: 1, evidence_count: 1 }),
        ]}
      />,
    );
    const attempts = screen.getAllByTestId("skill-attempt").map((n) => n.textContent);
    expect(attempts).toEqual(["This attempt: 100% (5/5)", "This attempt: 100% (5/5)", "This attempt: 100% (1/1)"]);
    const evidence = screen.getAllByTestId("skill-evidence").map((n) => n.textContent);
    expect(evidence).toEqual([
      " · Mastery grows with more questions: 5 so far",
      " · Mastery grows with more questions: 5 so far",
      " · Mastery grows with more questions: 1 so far",
    ]);
    expect(screen.queryByText(/confidence early/)).toBeNull();
    const explainer = screen.getByTestId("skill-mastery-explainer");
    expect(explainer).toHaveTextContent(/perfect attempt can still read below 100%/);

    // Phone sizes live in the phone block only; the desktop card keeps its own sizes.
    const line = screen.getAllByTestId("skill-attempt")[0];
    expect(cssOf(line).phone).toMatch(/font-size:0\.8rem/);
    expect(cssOf(line).unscoped).toMatch(/font-size:0\.72rem/);
    expect(cssOf(line).unscoped).not.toMatch(/font-size:0\.8rem/);
    expect(cssOf(explainer).phone).toMatch(/font-size:0\.8rem/);
    expect(cssOf(explainer).unscoped).not.toMatch(/font-size:0\.8rem/);

    // The score and the estimate sit on the same card.
    const card = line.parentElement as HTMLElement;
    expect(within(card).getByText("92%")).toBeInTheDocument();
  });

  it("renders a legacy row without the new lines", () => {
    setWidth(width);
    render(<SkillMasteryHeatmap skills={[row({ attempt_correct: undefined, attempt_total: undefined, evidence_count: undefined })]} />);
    expect(screen.queryByTestId("skill-attempt")).toBeNull();
    expect(screen.queryByTestId("skill-mastery-explainer")).toBeNull();
    expect(screen.getByTestId("skill-evidence")).toHaveTextContent("confidence early");
  });
});
