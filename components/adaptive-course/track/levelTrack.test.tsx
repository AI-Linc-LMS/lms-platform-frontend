// @vitest-environment jsdom
/**
 * The level ladder, derived from the course the server already sends.
 *
 * The point of these is that the tree is a VIEW of the course and never a second copy of it:
 * every count comes from the same payload the course page counts, so the two cannot drift.
 */

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { buildLevels, topicProgress } from "./levels";
import { LevelTrack } from "./LevelTrack";

vi.mock("@iconify/react", () => ({ Icon: () => null }));

const problem = (id: number, completed = false) => ({
  problem_id: id, title: `p${id}`, difficulty_level: "Easy" as const,
  target_skills: [], completed,
});

const course = (over: Record<string, unknown> = {}) =>
  ({
    modules: [
      {
        id: 1, weekno: 1, title: "Module 1",
        submodules: [{
          id: 11, order: 0, title: "Time Complexity", description: "",
          articles: [{ id: 1 }, { id: 2 }], quizzes: [],
          coding_sets: [{
            config_id: 1, title: "s", target_skills: [], default_language: "python",
            hint_layers: 3,
            problems: [problem(1, true), problem(2)],
            buckets: [
              { id: 1, name: "Basic primer", slug: "b", description: "", order: 0,
                total: 1, solved: 1, satisfied: true },
              { id: 2, name: "Math", slug: "m", description: "", order: 1,
                total: 1, solved: 0, satisfied: false },
            ],
            bonus_unlocked: false,
          }],
        }],
      },
      {
        id: 2, weekno: 2, title: "Module 2",
        submodules: [
          { id: 21, order: 0, title: "Arrays", description: "", articles: [], quizzes: [],
            coding_sets: [{ config_id: 2, title: "s", target_skills: [],
              default_language: "python", hint_layers: 3, problems: [problem(3)] }] },
          { id: 22, order: 1, title: "Strings", description: "", articles: [], quizzes: [],
            coding_sets: [{ config_id: 3, title: "s", target_skills: [],
              default_language: "python", hint_layers: 3, problems: [problem(4)] }] },
        ],
      },
    ],
    ...over,
  }) as never;

describe("building the ladder", () => {
  it("makes one level per module and one card per topic", () => {
    const levels = buildLevels(course());
    expect(levels.map((l) => l.level)).toEqual([1, 2]);
    expect(levels[0].topics.map((t) => t.title)).toEqual(["Time Complexity"]);
    expect(levels[1].topics.map((t) => t.title)).toEqual(["Arrays", "Strings"]);
  });

  it("counts problems from the course payload, not a stored total", () => {
    const [first] = buildLevels(course());
    expect(first.topics[0].problems).toBe(2);
    expect(first.topics[0].solved).toBe(1);
  });

  it("admits ONLY topics that carry coding problems", () => {
    // This ladder is the practice surface. Admitting any submodule with articles made it a
    // second rendering of the journey tab - the same modules, drawn as a tree - which gave a
    // learner two maps of one course and no reason to prefer either.
    const c = course() as never as { modules: { submodules: unknown[] }[] };
    c.modules[1].submodules.push({
      id: 23, order: 2, title: "Reading only", description: "",
      articles: [{ id: 9 }, { id: 10 }], quizzes: [], coding_sets: [],
    });
    const levels = buildLevels(c as never);
    expect(levels[1].topics.map((t) => t.title)).toEqual(["Arrays", "Strings"]);
    expect(levels[1].topics.map((t) => t.title)).not.toContain("Reading only");
  });

  it("drops a module whose topics are all reading", () => {
    const c = course() as never as { modules: unknown[] };
    c.modules = [{
      id: 3, weekno: 1, title: "All reading",
      submodules: [{ id: 31, order: 0, title: "Theory", description: "",
                     articles: [{ id: 1 }], quizzes: [], coding_sets: [] }],
    }];
    expect(buildLevels(c as never)).toEqual([]);
  });

  it("carries the buckets themselves, not just how many there are", () => {
    // The card names the techniques; a count only said how many groups existed.
    const [first] = buildLevels(course());
    expect(first.topics[0].bucketRows.map((b) => b.name)).toEqual(["Basic primer", "Math"]);
    expect(first.topics[0].bucketRows.map((b) => b.satisfied)).toEqual([true, false]);
  });

  it("carries bucket coverage and takes the bonus from the server", () => {
    const [first] = buildLevels(course());
    expect(first.topics[0].buckets).toBe(2);
    expect(first.topics[0].bucketsCovered).toBe(1);
    // Server said locked; nothing here may overrule it.
    expect(first.topics[0].bonusUnlocked).toBe(false);
  });

  it("reports no buckets for a topic that has not been bucketed", () => {
    const [, second] = buildLevels(course());
    expect(second.topics[0].buckets).toBe(0);
    expect(second.topics[0].bonusUnlocked).toBe(false);
  });

  it("drops a module that teaches nothing rather than drawing a gap in the ladder", () => {
    const withEmpty = course({
      modules: [
        { id: 9, weekno: 1, title: "Empty", submodules: [
          { id: 91, order: 0, title: "Nothing", description: "", articles: [], quizzes: [],
            coding_sets: [] }] },
        ...(course() as unknown as { modules: unknown[] }).modules,
      ],
    });
    const levels = buildLevels(withEmpty);
    expect(levels.map((l) => l.title)).toEqual(["Module 1", "Module 2"]);
    // And the numbering closes up rather than skipping 1.
    expect(levels.map((l) => l.level)).toEqual([1, 2]);
  });

  it("survives a course that has not loaded yet", () => {
    expect(buildLevels(undefined)).toEqual([]);
    expect(buildLevels(null)).toEqual([]);
  });

  it("never reports progress above 100%", () => {
    expect(topicProgress({ problems: 2, solved: 5 } as never)).toBe(1);
    expect(topicProgress({ problems: 0, solved: 0 } as never)).toBe(0);
  });
});

describe("drawing the ladder", () => {
  it("renders a level band and a card per topic", () => {
    render(
      <LevelTrack levels={buildLevels(course())} onOpenTopic={() => {}} />,
    );
    expect(screen.getAllByTestId("track-level")).toHaveLength(2);
    expect(screen.getAllByTestId("track-topic")).toHaveLength(3);
    expect(screen.getByText("Level 1")).toBeTruthy();
    expect(screen.getByText("Level 2")).toBeTruthy();
  });

  it("opens the submodule the card names", async () => {
    const onOpen = vi.fn();
    render(<LevelTrack levels={buildLevels(course())} onOpenTopic={onOpen} />);
    screen.getAllByTestId("track-topic")[0].click();
    expect(onOpen).toHaveBeenCalledWith(11);
  });

  it("shows bucket coverage only where the topic has buckets", () => {
    render(<LevelTrack levels={buildLevels(course())} onOpenTopic={() => {}} />);
    const badges = screen.getAllByTestId("track-topic-bonus");
    expect(badges).toHaveLength(1);
    expect(badges[0].dataset.unlocked).toBe("false");
    expect(screen.getByText("1/2")).toBeTruthy();
  });

  it("says so rather than drawing an empty ladder", () => {
    render(<LevelTrack levels={[]} onOpenTopic={() => {}} />);
    expect(screen.getByText(/no practice topics yet/i)).toBeTruthy();
  });
});

describe("the ladder's own chrome", () => {
  it("offers a jump between levels, and none after the last one", () => {
    // Eight levels is a long scroll; the jump is the one honest thing a reader wants. It must
    // not appear after the final level, where it would point at nothing.
    render(
      <LevelTrack levels={buildLevels(course())} onOpenTopic={() => {}} />,
    );
    const levels = screen.getAllByTestId("track-level");
    const jumps = screen.getAllByTestId("jump-to-level");
    expect(jumps).toHaveLength(levels.length - 1);
    expect(jumps[0].getAttribute("aria-label")).toBe("Scroll to Level 2");
  });

  it("renders no jump at all for a single-level course", () => {
    const one = buildLevels(course()).slice(0, 1);
    render(<LevelTrack levels={one} onOpenTopic={() => {}} />);
    expect(screen.queryByTestId("jump-to-level")).toBeNull();
  });

  it("keeps the play disc decorative - the card is the only control", () => {
    // A button inside a button is a nested-interactive a11y fault, and the disc does nothing
    // the card does not already do.
    render(<LevelTrack levels={buildLevels(course())} onOpenTopic={() => {}} />);
    const card = screen.getAllByTestId("track-topic")[0];
    expect(card.tagName).toBe("BUTTON");
    expect(within(card).queryByRole("button")).toBeNull();
  });

  it("shows the bonus badge only for a topic that HAS buckets", () => {
    // A topic with no buckets has no bonus to win, so a locked gift there promises nothing.
    render(<LevelTrack levels={buildLevels(course())} onOpenTopic={() => {}} />);
    const badges = screen.getAllByTestId("track-topic-bonus");
    const topics = buildLevels(course()).flatMap((l) => l.topics);
    expect(badges).toHaveLength(topics.filter((t) => t.buckets > 0).length);
  });
});
