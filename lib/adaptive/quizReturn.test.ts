import { describe, expect, it } from "vitest";
import { QUIZ_LIBRARY_HREF, quizReturnLabel, resolveQuizReturn, safeFrom } from "./quizReturn";
import { withFrom } from "@/lib/utils/return-to";

const TOPIC = { course_id: 13, course_title: "Python Basics", submodule_id: 1443, submodule_title: "Introduction to Python and Installation" };

describe("resolveQuizReturn", () => {
  it("sends a quiz with no ?from= to the course topic it belongs to", () => {
    // The reported case: the re-quiz hop dropped ?from=, and Back fell to the library.
    expect(resolveQuizReturn(null, TOPIC)).toEqual({
      kind: "topic", href: "/adaptive-courses/13/submodule/1443", title: TOPIC.submodule_title, courseId: 13, submoduleId: 1443,
    });
  });

  it("prefers the launch point, and names the topic when it is this attempt's own", () => {
    const from = "/adaptive-courses/13/submodule/1443?from=%2Froadmaps%2Finfosys%2Fstep%2F5";
    expect(resolveQuizReturn(from, TOPIC)).toEqual({
      kind: "topic", href: from, title: TOPIC.submodule_title, courseId: 13, submoduleId: 1443,
    });
    // A topic page other than the attempt's own: still honoured, just not named.
    expect(resolveQuizReturn("/adaptive-courses/13/submodule/99", TOPIC)).toMatchObject({ kind: "topic", title: null });
  });

  it("returns to a roadmap or the library when that is where the quiz was opened", () => {
    expect(resolveQuizReturn("/roadmaps/infosys/step/5", TOPIC)).toEqual({ kind: "roadmap", href: "/roadmaps/infosys/step/5" });
    expect(resolveQuizReturn("/adaptive-quizzes", TOPIC)).toEqual({ kind: "library", href: "/adaptive-quizzes" });
    expect(resolveQuizReturn("/adaptive-quizzes?filter=personal", TOPIC).kind).toBe("library");
    // A quiz runtime page is not the library.
    expect(resolveQuizReturn("/adaptive-quizzes/session/abc/results", TOPIC).kind).toBe("other");
  });

  it("falls back to the library only for a quiz in no course", () => {
    expect(resolveQuizReturn(null, null)).toEqual({ kind: "library", href: QUIZ_LIBRARY_HREF });
    expect(resolveQuizReturn(undefined, undefined)).toEqual({ kind: "library", href: QUIZ_LIBRARY_HREF });
  });

  it("never follows a from that leaves the site", () => {
    for (const bad of [
      "https://evil.example",
      "//evil.example/x",
      "javascript:alert(1)",
      "",
      // Browsers read "\" as "/" and drop tabs/newlines while parsing a URL, so these two both
      // resolve to https://evil.example and the router would navigate off-site (review of #1689).
      "/\\evil.example/phish",
      "/\t/evil.example",
      "/\n/evil.example",
      "/\u0000/evil.example",
    ]) {
      expect(safeFrom(bad), JSON.stringify(bad)).toBeNull();
      expect(resolveQuizReturn(bad, TOPIC).href).toBe("/adaptive-courses/13/submodule/1443");
      expect(withFrom("/adaptive-quizzes/session/s1", bad)).toBe("/adaptive-quizzes/session/s1");
    }
  });

  it("still carries an ordinary path, query and all", () => {
    const from = "/adaptive-courses/13/submodule/1443?from=/roadmaps/x/step/5";
    expect(safeFrom(from)).toBe(from);
    expect(withFrom("/adaptive-quizzes/start?configId=7", from)).toBe(
      `/adaptive-quizzes/start?configId=7&from=${encodeURIComponent(from)}`,
    );
  });
});

describe("quizReturnLabel", () => {
  it("says where Back goes", () => {
    expect(quizReturnLabel(resolveQuizReturn(null, TOPIC))).toEqual({
      key: "adaptiveQuizRuntime.backToTopic", values: { title: "Introduction to Python and Installation" },
    });
    expect(quizReturnLabel(resolveQuizReturn("/adaptive-courses/1/submodule/2", null))).toEqual({ key: "adaptiveQuizRuntime.backToTopicUnnamed" });
    expect(quizReturnLabel(resolveQuizReturn("/roadmaps/x", null))).toEqual({ key: "adaptiveQuizRuntime.backToRoadmap" });
    expect(quizReturnLabel(resolveQuizReturn(null, null))).toEqual({ key: "adaptiveQuizRuntime.backToLibrary" });
    expect(quizReturnLabel(resolveQuizReturn("/dashboard", null))).toEqual({ key: "adaptiveQuizRuntime.back" });
  });
});
