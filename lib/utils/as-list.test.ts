import { describe, expect, it } from "vitest";

import { asArray, asStringList } from "./as-list";

describe("asStringList", () => {
  it("passes a well-formed list through", () => {
    expect(asStringList(["python", "loops"])).toEqual(["python", "loops"]);
  });

  it("splits the comma-separated string that caused the production crash", () => {
    // target_skills is a Django JSONField fed from a CharField holding "python, loops".
    // `.slice(0, 2).join(", ")` on that string threw "join is not a function" and took the
    // whole admin course page down behind an error boundary.
    expect(asStringList("python, loops")).toEqual(["python", "loops"]);
  });

  it("does not explode a single skill into one entry per character", () => {
    expect(asStringList("python")).toEqual(["python"]);
  });

  it("handles the other delimiters the backend's split_skills accepts", () => {
    expect(asStringList("a|b;c/d")).toEqual(["a", "b", "c", "d"]);
  });

  it("returns an empty list for every shape that has no skills in it", () => {
    for (const bad of [null, undefined, {}, 42, true, "", "   ", []]) {
      expect(asStringList(bad)).toEqual([]);
    }
  });

  it("drops non-string members rather than rendering [object Object]", () => {
    expect(asStringList(["ok", null, { a: 1 }, 7, "fine"])).toEqual(["ok", "fine"]);
  });

  it("is safe to chain the array methods that crashed", () => {
    expect(() => asStringList("python, loops").slice(0, 2).join(", ")).not.toThrow();
    expect(asStringList("python, loops").slice(0, 2).join(", ")).toBe("python, loops");
  });
});

describe("asArray", () => {
  it("returns the array unchanged", () => {
    expect(asArray([1, 2])).toEqual([1, 2]);
  });

  it("returns an empty array for anything else, so .map never throws", () => {
    for (const bad of [null, undefined, "nope", {}, 0]) {
      expect(asArray(bad)).toEqual([]);
    }
  });
});
