import { readFileSync } from "node:fs";
import path from "node:path";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * The topic card on an assessment result.
 *
 * Reported as "[Assessment] There is no evaluation for the unattempted questions". The card listed
 * only Correct and Incorrect, printed their sum as "Total", and dropped a topic whose questions
 * were all skipped. A learner who ran out of time saw a red 0.0% row that read exactly like
 * getting every question wrong, and the per-topic totals did not add up to the paper the score
 * beside them was out of.
 *
 * The card now carries two numbers with two named denominators - accuracy of what was ANSWERED,
 * stars out of everything ASKED - plus an explicit count of what was left blank.
 */

const EN: Record<string, Record<string, string>> = JSON.parse(
  readFileSync(path.resolve(__dirname, "../../../locales/en/common.json"), "utf8"),
);
const AR: Record<string, Record<string, string>> = JSON.parse(
  readFileSync(path.resolve(__dirname, "../../../locales/ar/common.json"), "utf8"),
);

/** Resolve a real locale string and interpolate, so the assertions read the shipped copy. */
function translate(key: string, vars: Record<string, unknown> = {}): string {
  const [ns, leaf] = key.split(".");
  const raw = EN[ns]?.[leaf];
  if (typeof raw !== "string") return key;
  return raw.replace(/\{\{(\w+)\}\}/g, (_m, name: string) =>
    name in vars ? String(vars[name]) : `{{${name}}}`,
  );
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, second?: unknown, third?: unknown) => {
      const vars = (typeof second === "object" && second !== null
        ? second
        : typeof third === "object" && third !== null
          ? third
          : {}) as Record<string, unknown>;
      return translate(key, vars);
    },
  }),
}));

import { TopicWiseBreakdown } from "./TopicWiseBreakdown";

/** The shape the API sends, as seen in the reported screenshot plus a skipped topic. */
const STATS = {
  "Operating Systems: CPU Scheduling (Round Robin)": {
    total: 3,
    correct: 0,
    incorrect: 1,
    attempted: 1,
    unattempted: 2,
    accuracy_percent: 0,
    rating_out_of_5: 0,
  },
  OOP: {
    total: 1,
    correct: 1,
    incorrect: 0,
    attempted: 1,
    unattempted: 0,
    accuracy_percent: 100,
    rating_out_of_5: 5,
  },
  Databases: {
    total: 2,
    correct: 0,
    incorrect: 0,
    attempted: 0,
    unattempted: 2,
    accuracy_percent: 0,
    rating_out_of_5: 0,
  },
};

function rowFor(topic: string): HTMLElement {
  const row = screen
    .getAllByTestId("topic-row")
    .find((el) => el.getAttribute("data-topic") === topic);
  expect(row, `no row rendered for topic "${topic}"`).toBeTruthy();
  return row as HTMLElement;
}

describe("the topic-wise breakdown", () => {
  it("shows how many questions in a topic were left unanswered", () => {
    render(<TopicWiseBreakdown topicWiseStats={STATS} />);
    const row = rowFor("Operating Systems: CPU Scheduling (Round Robin)");

    expect(within(row).getByText("0 Correct")).toBeInTheDocument();
    expect(within(row).getByText("1 Incorrect")).toBeInTheDocument();
    // The whole point of the report: the two skipped questions are visible.
    expect(within(row).getByText("2 Not answered")).toBeInTheDocument();
  });

  it("counts the questions asked, not just the ones answered", () => {
    render(<TopicWiseBreakdown topicWiseStats={STATS} />);
    const row = rowFor("Operating Systems: CPU Scheduling (Round Robin)");

    // Before the fix this said "1" - correct + incorrect - so the card understated the paper.
    expect(within(row).getByText("3 asked")).toBeInTheDocument();
  });

  it("keeps a topic in which nothing was attempted", () => {
    render(<TopicWiseBreakdown topicWiseStats={STATS} />);

    const row = rowFor("Databases");
    expect(within(row).getByText("2 Not answered")).toBeInTheDocument();
    expect(within(row).getByText("2 asked")).toBeInTheDocument();
  });

  it("does not print 0% for a topic the learner never answered", () => {
    render(<TopicWiseBreakdown topicWiseStats={STATS} />);
    const row = rowFor("Databases");

    // "0.0% Accuracy" here reads as "you got them all wrong". It must not appear.
    expect(within(row).queryByText("0.0%")).not.toBeInTheDocument();
    expect(within(row).getByText("Nothing answered here")).toBeInTheDocument();
  });

  it("names the denominator of each of its two numbers", () => {
    render(<TopicWiseBreakdown topicWiseStats={STATS} />);
    const row = rowFor("Operating Systems: CPU Scheduling (Round Robin)");

    // Accuracy is out of what was answered...
    expect(within(row).getByText("Accuracy on 1 answered")).toBeInTheDocument();
    // ...and the stars are out of everything asked. An unlabelled "0.0/5.0" beside an
    // unlabelled "0.0%" was the ambiguity the report is about.
    expect(within(row).getByText("0.0/5.0 across all 3 questions")).toBeInTheDocument();
  });

  it("derives the split when talking to a backend that has not deployed yet", () => {
    // Rolling deploy: the page is new, the API is old and sends no attempted/unattempted.
    render(
      <TopicWiseBreakdown
        topicWiseStats={{
          Legacy: {
            total: 4,
            correct: 1,
            incorrect: 1,
            accuracy_percent: 50,
            rating_out_of_5: 1.25,
          },
        }}
      />,
    );
    const row = rowFor("Legacy");

    expect(within(row).getByText("2 Not answered")).toBeInTheDocument();
    expect(within(row).getByText("4 asked")).toBeInTheDocument();
  });

  it("says nothing about unanswered questions when there were none", () => {
    render(<TopicWiseBreakdown topicWiseStats={STATS} />);
    const row = rowFor("OOP");

    expect(within(row).queryByTestId("topic-unattempted")).not.toBeInTheDocument();
    expect(within(row).getByText("100.0%")).toBeInTheDocument();
  });

  it("ships every new string in both locales", () => {
    const keys = Object.keys(EN.assessmentTopicBreakdown ?? {});
    expect(keys.length).toBeGreaterThan(0);
    expect(Object.keys(AR.assessmentTopicBreakdown ?? {}).sort()).toEqual(keys.sort());
  });
});
