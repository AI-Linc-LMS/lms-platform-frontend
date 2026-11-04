/**
 * Adding a week by hand was one POST, one toast and one full tree refetch PER TOPIC.
 * The paste path is what makes it one of each, so the parsing has to be right: a line dropped
 * here is a topic the admin thinks they created, and a marker left on is a topic called
 * "1. Functions".
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { parseTitles } from "./parseTitles";

describe("parseTitles", () => {
  it("still handles the single title the row was built for", () => {
    expect(parseTitles("Functions and scope")).toEqual(["Functions and scope"]);
  });

  it("splits a pasted list into one row per line, in order", () => {
    expect(parseTitles("Variables\nLoops\nFunctions")).toEqual(["Variables", "Loops", "Functions"]);
  });

  it("copes with CRLF, because the list came from a spreadsheet", () => {
    expect(parseTitles("Variables\r\nLoops")).toEqual(["Variables", "Loops"]);
  });

  it("drops blank and whitespace-only lines rather than creating empty rows", () => {
    expect(parseTitles("Variables\n\n   \nLoops\n")).toEqual(["Variables", "Loops"]);
  });

  it("trims each line", () => {
    expect(parseTitles("  Variables  \n\tLoops\t")).toEqual(["Variables", "Loops"]);
  });

  it("strips the list markers a pasted syllabus carries", () => {
    expect(parseTitles("1. Variables\n2) Loops\n- Functions\n* Scope\n• Closures\n– Recursion"))
      .toEqual(["Variables", "Loops", "Functions", "Scope", "Closures", "Recursion"]);
  });

  it("does NOT strip a number that is part of the title", () => {
    // "1.5 Scaling laws" is not a marker: after "1." comes "5", not a space. Getting this
    // wrong renames the topic.
    expect(parseTitles("1.5 Scaling laws")).toEqual(["1.5 Scaling laws"]);
    expect(parseTitles("2024 in review")).toEqual(["2024 in review"]);
  });

  it("keeps a repeated line instead of silently dropping it", () => {
    // Sometimes a paste slip, sometimes two real sections with the same name. The UI shows the
    // count so the admin can see it; guessing for them is the thing that cannot be undone.
    expect(parseTitles("Recap\nRecap")).toEqual(["Recap", "Recap"]);
  });

  it("returns nothing for empty input, so Add stays disabled", () => {
    for (const v of ["", "   ", "\n\n", null, undefined]) {
      expect(parseTitles(v)).toEqual([]);
    }
  });
});

const src = () =>
  readFileSync(join(process.cwd(), "components/admin/adaptive-course/ManualTreeControls.tsx"), "utf8");

describe("the builder's add row", () => {
  it("creates sequentially, because the backend appends each row at the END", () => {
    // Promise.all here would file a pasted syllabus in response order, which is the one
    // ordering that must not happen.
    expect(src()).toMatch(/for \(const title of titles\)/);
    expect(src()).not.toMatch(/Promise\.all[\s\S]{0,120}onCreate/);
  });

  it("refetches the tree ONCE for the batch, not once per row", () => {
    const s = src();
    const loop = s.slice(s.indexOf("for (const title of titles)"), s.indexOf("const remaining ="));
    expect(loop, "the create loop").toBeTruthy();
    expect(loop, "a refetch per row is the slowness this change exists to remove").not.toMatch(
      /onAdded\(\)/,
    );
    expect(s.slice(s.indexOf("const remaining ="))).toMatch(/onAdded\(\)/);
  });

  it("keeps whatever was not created, so a failure half way does not lose the list", () => {
    expect(src()).toMatch(/setValue\(remaining\.join/);
  });

  it("still submits on Enter, and makes a new line on Shift+Enter", () => {
    expect(src()).toMatch(/e\.key === "Enter" && !e\.shiftKey/);
  });
});
