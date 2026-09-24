import { describe, expect, it } from "vitest";
import { ladderLine } from "./difficultyLadder";

describe("ladderLine", () => {
  it("states the standing rule from the level the learner is on", () => {
    expect(ladderLine("Medium", "Medium", 0, 2)).toEqual({ kind: "rule", n: 2, up: "Hard", down: "Easy", gone: [] });
    // No level above Hard / below Easy: that half of the rule is not offered.
    expect(ladderLine("Hard", "Hard", 0, 2)).toEqual({ kind: "rule", n: 2, up: null, down: "Medium", gone: [] });
    expect(ladderLine("Easy", "Easy", 0, 2)).toEqual({ kind: "rule", n: 2, up: "Medium", down: null, gone: [] });
  });

  it("says when this answer decides a move", () => {
    expect(ladderLine("Medium", "Medium", 1, 2)).toEqual({ kind: "next", move: { dir: "up", level: "Hard" } });
    expect(ladderLine("Medium", "Medium", -1, 2)).toEqual({ kind: "next", move: { dir: "down", level: "Easy" } });
    // One right away from a level that does not exist is just the rule.
    expect(ladderLine("Hard", "Hard", 1, 2)).toMatchObject({ kind: "rule" });
  });

  it("says the quiz has run out instead of promising a harder question", () => {
    // The reported banner: "Answer correctly -> steps up toward Hard" on a Medium question served
    // because every Hard question had been used.
    expect(ladderLine("Medium", "Hard", 1, 2)).toEqual({ kind: "outOfLevel", wanted: "Hard", served: "Medium" });
    expect(ladderLine("Medium", "Easy", 0, 2)).toEqual({ kind: "outOfLevel", wanted: "Easy", served: "Medium" });
    // A bank with no Medium: earned Medium, served Easy.
    expect(ladderLine("Easy", "Medium", 1, 2)).toEqual({ kind: "outOfLevel", wanted: "Medium", served: "Easy" });
  });

  it("does not promise a step to a level the quiz has no questions left at", () => {
    // One right away from Hard, but the bank has no Hard left after this question.
    expect(ladderLine("Medium", "Medium", 1, 2, ["Easy", "Medium"])).toEqual({
      kind: "rule", n: 2, up: null, down: "Easy", gone: ["Hard"],
    });
    expect(ladderLine("Medium", "Medium", 0, 2, ["Medium", "Hard"])).toEqual({
      kind: "rule", n: 2, up: "Hard", down: null, gone: ["Easy"],
    });
    // Still available: the promise stands.
    expect(ladderLine("Medium", "Medium", 1, 2, ["Easy", "Medium", "Hard"])).toMatchObject({ kind: "next" });
  });

  it("promises nothing about the next question on the last one", () => {
    // Review of #1689: on the last question the banner still said "the next question steps up".
    expect(ladderLine("Medium", "Medium", 1, 2, ["Easy", "Medium", "Hard"], true)).toBeNull();
    expect(ladderLine("Medium", "Medium", 0, 2, ["Easy", "Medium", "Hard"], true)).toBeNull();
    // What is true of THIS question is still said.
    expect(ladderLine("Medium", "Hard", 1, 2, ["Easy"], true)).toEqual({ kind: "outOfLevel", wanted: "Hard", served: "Medium" });
  });

  it("says nothing for a question served before the ladder existed", () => {
    expect(ladderLine("Medium", undefined, undefined, undefined)).toBeNull();
    expect(ladderLine("Medium", "", 0, 0)).toBeNull();
  });
});
