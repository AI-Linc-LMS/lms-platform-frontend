import { describe, expect, it } from "vitest";

import {
  PROJECT_LIMITS,
  commonRoot,
  isProbablyBinary,
  normaliseProjectPath,
  planUpload,
} from "./project-upload";

/**
 * A learner who built their project in VS Code has to be able to get it in.
 *
 * Reported by an Agileology learner on the Week 8 React brief: "I have completed the assignment in
 * VS Code and the project is working correctly... I cannot find the option to submit". Her
 * workspace held exactly the one starter file it was created with, because the learner's editor
 * was rendered without file management at all. Uploading a project folder is the answer, and the
 * whole difficulty is what must NOT come with it.
 */

describe("workspace paths", () => {
  it("accepts a nested path and tidies the ways browsers spell it", () => {
    expect(normaliseProjectPath("src/App.jsx")).toBe("src/App.jsx");
    expect(normaliseProjectPath("./src/App.jsx")).toBe("src/App.jsx");
    expect(normaliseProjectPath("/src/App.jsx")).toBe("src/App.jsx");
    expect(normaliseProjectPath("src\\components\\Quiz.jsx")).toBe("src/components/Quiz.jsx");
    expect(normaliseProjectPath("src//App.jsx")).toBe("src/App.jsx");
  });

  it("refuses a path that climbs, is empty, or names no file", () => {
    expect(normaliseProjectPath("../../etc/passwd")).toBeNull();
    expect(normaliseProjectPath("src/../../x")).toBeNull();
    expect(normaliseProjectPath("   ")).toBeNull();
    expect(normaliseProjectPath("src/")).toBeNull();
  });
});

describe("the wrapping folder of a directory pick", () => {
  it("is found when every file shares it", () => {
    expect(commonRoot(["quiz-app/src/App.jsx", "quiz-app/package.json"])).toBe("quiz-app");
  });

  it("is not invented when the files disagree or sit at the top", () => {
    expect(commonRoot(["src/App.jsx", "public/index.html"])).toBeNull();
    expect(commonRoot(["App.jsx"])).toBeNull();
    expect(commonRoot([])).toBeNull();
  });
});

describe("binary detection", () => {
  it("catches a NUL byte and a run of control characters", () => {
    expect(isProbablyBinary("PK\u0003\u0004\u0000stuff")).toBe(true);
    expect(isProbablyBinary("\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0010ab")).toBe(true);
  });

  it("leaves real source alone, tabs and newlines included", () => {
    expect(isProbablyBinary("export default function App() {\n\treturn null;\n}\n")).toBe(false);
    expect(isProbablyBinary("")).toBe(false);
  });
});

describe("planning an upload of a React project folder", () => {
  const folder = [
    { path: "quiz-app/package.json", content: '{"name":"quiz-app"}' },
    { path: "quiz-app/src/App.jsx", content: "export default () => <h1>Quiz</h1>;" },
    { path: "quiz-app/src/components/Question.jsx", content: "export const Q = () => null;" },
    { path: "quiz-app/node_modules/react/index.js", content: "module.exports = {};" },
    { path: "quiz-app/.git/config", content: "[core]" },
    { path: "quiz-app/package-lock.json", content: '{"lockfileVersion":3}' },
    { path: "quiz-app/.env", content: "OPENAI_API_KEY=sk-secret" },
    { path: "quiz-app/public/logo.png", content: "\u0000\u0000binary" },
  ];

  it("keeps the source, strips the wrapping folder, and refuses the rest by name", () => {
    const plan = planUpload({ "App.jsx": "" }, folder, { fromDirectory: true });

    expect(Object.keys(plan.files).sort()).toEqual([
      "App.jsx",
      "package.json",
      "src/App.jsx",
      "src/components/Question.jsx",
    ]);
    const refused = Object.fromEntries(plan.skipped.map((s) => [s.path, s.reason]));
    expect(Object.keys(refused).sort()).toEqual([
      ".env",
      ".git/config",
      "node_modules/react/index.js",
      "package-lock.json",
      "public/logo.png",
    ]);
    expect(refused["node_modules/react/index.js"]).toContain("node_modules/");
    expect(refused[".env"]).toContain("keys");
    expect(refused["public/logo.png"]).toContain("binary");
  });

  it("does not strip a directory the learner typed when they picked files, not a folder", () => {
    const plan = planUpload({}, [{ path: "src/App.jsx", content: "x" }], {});
    expect(Object.keys(plan.files)).toEqual(["src/App.jsx"]);
  });

  it("reports what it replaced separately from what it added", () => {
    const plan = planUpload(
      { "src/App.jsx": "old" },
      [
        { path: "src/App.jsx", content: "new" },
        { path: "src/index.css", content: "body{}" },
      ],
      {}
    );
    expect(plan.replaced).toEqual(["src/App.jsx"]);
    expect(plan.added).toEqual(["src/index.css"]);
    expect(plan.files["src/App.jsx"]).toBe("new");
  });

  it("leaves the existing workspace untouched - it is a merge, never a replace", () => {
    const existing = { "App.jsx": "keep me" };
    const plan = planUpload(existing, [{ path: "src/New.jsx", content: "x" }], {});
    expect(plan.files["App.jsx"]).toBe("keep me");
    expect(existing).toEqual({ "App.jsx": "keep me" });
  });

  it("honours a brief that only opens certain paths", () => {
    const plan = planUpload({}, [
      { path: "src/App.jsx", content: "mine" },
      { path: "grader/secret.py", content: "cheat" },
    ], { editablePaths: ["src/**"] });
    expect(Object.keys(plan.files)).toEqual(["src/App.jsx"]);
    expect(plan.skipped[0].path).toBe("grader/secret.py");
    expect(plan.skipped[0].reason).toContain("does not allow");
  });
});

describe("the caps, mirrored from the server so the learner is told first", () => {
  it("refuses one oversized file and keeps the rest", () => {
    const big = "x".repeat(PROJECT_LIMITS.maxFileBytes + 1);
    const plan = planUpload({}, [
      { path: "huge.txt", content: big },
      { path: "small.js", content: "ok" },
    ], {});
    expect(Object.keys(plan.files)).toEqual(["small.js"]);
    expect(plan.skipped[0].path).toBe("huge.txt");
    expect(plan.skipped[0].reason).toContain("KB");
  });

  it("stops at the file count and says so, in a predictable order", () => {
    const existing: Record<string, string> = {};
    for (let i = 0; i < PROJECT_LIMITS.maxFiles - 1; i += 1) existing[`f${i}.js`] = "";
    const plan = planUpload(existing, [
      { path: "a-first.js", content: "1" },
      { path: "b-second.js", content: "2" },
    ], {});
    expect(plan.added).toEqual(["a-first.js"]);
    expect(plan.skipped.map((s) => s.path)).toEqual(["b-second.js"]);
    expect(plan.skipped[0].reason).toContain(String(PROJECT_LIMITS.maxFiles));
  });

  it("stops at the total size, counting what is already in the workspace", () => {
    const half = "y".repeat(PROJECT_LIMITS.maxFileBytes);
    const existing: Record<string, string> = {};
    for (let i = 0; i < 7; i += 1) existing[`big${i}.txt`] = half;
    const plan = planUpload(existing, Array.from({ length: 4 }, (_, i) => ({
      path: `more${i}.txt`,
      content: half,
    })), {});
    expect(plan.added.length).toBeGreaterThan(0);
    expect(plan.skipped.length).toBeGreaterThan(0);
    expect(plan.skipped.at(-1)?.reason).toContain("MB");
  });
});
