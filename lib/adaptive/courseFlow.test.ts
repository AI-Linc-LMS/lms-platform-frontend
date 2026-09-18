import { describe, expect, it } from "vitest";

import type { AdaptiveCourseDetail, AdaptiveCourseSubModule } from "@/lib/services/adaptive-course.service";
import { courseTopics, flowSteps, nextStep, topicFromReturnHref } from "./courseFlow";

/**
 * Where the Next button goes.
 *
 * Requested as "a next button inside every submodule, whether it's article, quiz or coding, at the
 * end of each, and on the last one onto the next module". These pin the walk: the next step in the
 * topic, then the next topic, then the end of the course - in the same order the topic page lists.
 */

// Fixtures carry only the fields the walk reads; the rest of each summary is irrelevant here.
function topic(id: number, order: number, parts: Record<string, unknown> = {}): AdaptiveCourseSubModule {
  return {
    id, order, title: `Topic ${id}`, description: "",
    articles: [], quizzes: [], coding_sets: [], video_companions: [], ...parts,
  } as AdaptiveCourseSubModule;
}

const video = (id: number) => ({ id, title: `Video ${id}`, video_title: "", thumbnail_url: "", duration_seconds: 60, check_in_count: 0 });
const article = (id: number) => ({ article_id: id, title: `Article ${id}`, reading_time_minutes: 3, default_tier: "standard" });
const quiz = (id: number) => ({ config_id: id, quiz_title: `Quiz ${id}`, mcq_count: 5, min_questions: 3, max_questions: 5, target_skills: [] });
const coding = (configId: number, ...problemIds: number[]) => ({
  config_id: configId, title: "Set", hint_layers: 3,
  problems: problemIds.map((p) => ({ problem_id: p, title: `Problem ${p}`, difficulty_level: "Easy", target_skills: [] })),
});

// Week 1: topic 10 (every kind), topic 11 (empty), topic 12 (one article). Week 2: topic 20.
const COURSE = {
  id: 13,
  modules: [
    {
      id: 2, weekno: 2, title: "Week 2",
      submodules: [topic(20, 1, { articles: [article(200)] })],
    },
    {
      id: 1, weekno: 1, title: "Week 1",
      submodules: [
        topic(12, 3, { articles: [article(120)] }),
        topic(11, 2),
        topic(10, 1, {
          articles: [article(100)],
          quizzes: [quiz(101)],
          coding_sets: [coding(102, 103, 104)],
          video_companions: [video(105)],
        }),
      ],
    },
  ],
} as unknown as AdaptiveCourseDetail;

describe("the order of steps in a topic", () => {
  it("is videos, then articles, then quizzes, then coding", () => {
    const topic10 = courseTopics(COURSE)[0].submodule;
    expect(flowSteps(topic10, 13).map((s) => s.key)).toEqual([
      "video:105", "article:100", "quiz:101", "coding:103", "coding:104",
    ]);
  });

  it("sends a quiz back to the topic it was started from", () => {
    const topic10 = courseTopics(COURSE)[0].submodule;
    const q = flowSteps(topic10, 13).find((s) => s.kind === "quiz")!;
    expect(q.href).toBe(
      `/adaptive-quizzes/start?configId=101&from=${encodeURIComponent("/adaptive-courses/13/submodule/10")}`,
    );
  });

  it("carries the coding set on a coding step's link", () => {
    const topic10 = courseTopics(COURSE)[0].submodule;
    expect(flowSteps(topic10, 13).find((s) => s.key === "coding:103")!.href)
      .toBe("/adaptive-courses/13/submodule/10/coding/103?configId=102");
  });
});

describe("the order of topics in a course", () => {
  it("is by week, then by topic order - whatever order the API sent them in", () => {
    expect(courseTopics(COURSE).map((t) => t.submodule.id)).toEqual([10, 11, 12, 20]);
  });
});

describe("what Next does", () => {
  it("goes to the next step in the same topic", () => {
    expect(nextStep(COURSE, 10, "video:105")).toEqual({
      kind: "step", step: "article", title: "Article 100", href: "/adaptive-courses/13/submodule/10/article/100",
    });
  });

  it("walks every kind in turn - video, article, quiz, coding", () => {
    const walk: string[] = [];
    let key = "video:105";
    for (;;) {
      const n = nextStep(COURSE, 10, key);
      if (!n || n.kind !== "step") break;
      walk.push(n.title);
      const steps = flowSteps(courseTopics(COURSE)[0].submodule, 13);
      key = steps.find((s) => s.title === n.title)!.key;
    }
    expect(walk).toEqual(["Article 100", "Quiz 101", "Problem 103", "Problem 104"]);
  });

  it("goes to the next topic after a topic's last step", () => {
    const n = nextStep(COURSE, 10, "coding:104");
    expect(n).toMatchObject({ kind: "topic", href: "/adaptive-courses/13/submodule/12", newModule: false });
  });

  it("skips a topic with nothing in it", () => {
    // Topic 11 is empty; sending the learner there would give them a blank page and another Next.
    expect(nextStep(COURSE, 10, "coding:104")).toMatchObject({ title: "Topic 12" });
  });

  it("says when the next topic starts a new module", () => {
    expect(nextStep(COURSE, 12, "article:120")).toEqual({
      kind: "topic", title: "Topic 20", href: "/adaptive-courses/13/submodule/20",
      moduleTitle: "Week 2", newModule: true,
    });
  });

  it("ends the course after the last step of the last topic", () => {
    expect(nextStep(COURSE, 20, "article:200")).toEqual({ kind: "end", href: "/adaptive-courses/13" });
  });

  it("shows nothing rather than guessing when the step is not in the course", () => {
    expect(nextStep(COURSE, 10, "article:999")).toBeNull();
    expect(nextStep(COURSE, 999, "article:100")).toBeNull();
  });
});

describe("reading which topic a quiz came from", () => {
  it("reads it from the quiz's return link", () => {
    expect(topicFromReturnHref("/adaptive-courses/13/submodule/478")).toEqual({ courseId: 13, submoduleId: 478 });
    expect(topicFromReturnHref("/adaptive-courses/13/submodule/478?from=%2Froadmaps%2F4"))
      .toEqual({ courseId: 13, submoduleId: 478 });
  });

  it("finds no topic for a quiz started from the quiz library", () => {
    expect(topicFromReturnHref("/adaptive-quizzes")).toBeNull();
    expect(topicFromReturnHref(null)).toBeNull();
  });

  it("does not mistake a longer path for a topic", () => {
    expect(topicFromReturnHref("/adaptive-courses/13/submodule/478x")).toBeNull();
  });
});
