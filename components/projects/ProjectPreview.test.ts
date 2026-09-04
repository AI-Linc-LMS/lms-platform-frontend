/**
 * The preview promises it shows what the learner will see. These cover the ways it used to
 * quietly show something else.
 */
import { describe, expect, it } from "vitest";
import { assembleDocumentForTest } from "./ProjectPreview";

describe("preview reference resolution", () => {
  it("names a stylesheet whose filename does not match, and suggests the near miss", () => {
    // The exact case reported: index.html links style.css, the file is styles.css.
    const { unresolved, html } = assembleDocumentForTest(
      {
        "index.html": `<!doctype html><link rel="stylesheet" href="style.css"><body><div class="calculator"></div></body>`,
        "styles.css": ".calculator{background:#1e1e24}",
      },
      "index.html"
    );
    expect(unresolved).toHaveLength(1);
    expect(unresolved[0].ref).toBe("style.css");
    expect(unresolved[0].suggestion).toBe("styles.css");
    // The dead tag is dropped rather than left to make a request that cannot succeed.
    expect(html).not.toContain("href=\"style.css\"");
  });

  it("stays silent when everything resolves", () => {
    const { unresolved, html } = assembleDocumentForTest(
      {
        "index.html": `<link rel="stylesheet" href="styles.css"><script src="app.js"></script>`,
        "styles.css": "body{color:red}",
        "app.js": "console.log(1)",
      },
      "index.html"
    );
    expect(unresolved).toEqual([]);
    expect(html).toContain("body{color:red}");
    expect(html).toContain("console.log(1)");
  });

  it("reports a missing script too", () => {
    const { unresolved } = assembleDocumentForTest(
      { "index.html": `<script src="main.js"></script>`, "app.js": "" },
      "index.html"
    );
    expect(unresolved[0]).toMatchObject({ ref: "main.js", kind: "script" });
  });

  it("leaves genuinely remote URLs alone", () => {
    const { unresolved } = assembleDocumentForTest(
      { "index.html": `<link rel="stylesheet" href="https://cdn.example.com/a.css">` },
      "index.html"
    );
    expect(unresolved).toEqual([]);
  });

  it("offers no suggestion when nothing is close", () => {
    const { unresolved } = assembleDocumentForTest(
      { "index.html": `<link rel="stylesheet" href="theme.css">`, "zzzzzzzz.css": "" },
      "index.html"
    );
    expect(unresolved[0].suggestion).toBeUndefined();
  });
});
