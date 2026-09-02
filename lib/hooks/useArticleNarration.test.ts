// @vitest-environment jsdom
/**
 * Read Aloud: what the learner actually hears, and how many voices they get.
 *
 * Two reports:
 *   "The Read Aloud feature skips text inside code blocks or inline code elements,
 *    such as range() and for."
 *   "Read Aloud is laggy, and starting it again before the first playback begins can
 *    trigger multiple voices that cannot all be stopped without refreshing the page."
 */

import { describe, expect, it } from "vitest";
import { chunkText, htmlToText } from "./useArticleNarration";

describe("what the narrator says about code", () => {
  it("reads inline code instead of deleting the words around it", () => {
    // The reported sentence. It used to narrate as "the loop uses to iterate".
    const heard = htmlToText("<p>the <code>for</code> loop uses <code>range()</code> to iterate</p>");
    expect(heard).toBe("the for loop uses range to iterate");
  });

  it("keeps a sentence whole when the code IS the object of the verb", () => {
    // From a real article body: "For example: <code>192.168.1.1</code>." narrated as "For example: ."
    expect(htmlToText("<p>For example: <code>192.168.1.1</code>.</p>")).toContain("192");
    expect(htmlToText("<p>a time complexity of <code>O(n)</code>, where</p>"))
      .toBe("a time complexity of O(n), where");
  });

  it("announces a block of code rather than reading it out character by character", () => {
    const heard = htmlToText(
      '<p>Try this.</p><pre data-lang="python"><code>def f():\n    return 1\n</code></pre><p>Done.</p>',
    );
    expect(heard).toBe("Try this. Here is a python code example, 2 lines, shown on screen. Done.");
    // The body of the block is never spoken - that is the point of announcing it.
    expect(heard).not.toContain("return 1");
  });

  it("still announces a block with no language attribute", () => {
    expect(htmlToText("<pre><code>SELECT 1;</code></pre>"))
      .toBe("Here is a code example, 1 line, shown on screen.");
  });

  it("does not treat the <code> inside a <pre> as inline", () => {
    // Order matters: the block pass has to run first, or the inline pass reaches into it.
    const heard = htmlToText('<pre data-lang="js"><code>const camelCase = 1;</code></pre>');
    expect(heard).not.toContain("camel Case");
    expect(heard).toContain("code example");
  });

  it("makes identifiers speakable rather than spelling out punctuation", () => {
    expect(htmlToText("<p>use <code>snake_case</code> here</p>")).toBe("use snake case here");
    expect(htmlToText("<p>call <code>arr.length</code></p>")).toBe("call arr dot length");
    expect(htmlToText("<p>the <code>a -> b</code> form</p>")).toContain("arrow");
    // The generic dot rule must not eat the arrow/equals rules by running first.
    expect(htmlToText("<p><code>self.x == y</code></p>")).toBe("self dot x equals y");
  });

  it("announces a long snippet that was authored as inline code", () => {
    const long = "x".repeat(80);
    expect(htmlToText(`<p>see <code>${long}</code> here</p>`))
      .toBe("see a code snippet shown on screen here");
  });

  it("keeps a figure's caption, which is prose, while dropping the image", () => {
    expect(htmlToText("<figure><img src='a.png'><figcaption>Figure 2: the lifecycle</figcaption></figure>"))
      .toBe("Figure 2: the lifecycle");
  });

  it("is unchanged on an article with no code at all", () => {
    expect(htmlToText("<h2>Loops</h2><p>A loop repeats work.</p>")).toBe("Loops A loop repeats work.");
  });
});

describe("how long the learner waits before the first sound", () => {
  it("makes the FIRST chunk short and the rest long", () => {
    // The learner waits for chunk 1 in silence. It used to be up to 3500 characters of
    // synthesis, which is the wait that got the button pressed a second time.
    const text = Array.from({ length: 400 }, (_, i) => `Sentence number ${i}.`).join(" ");
    const chunks = chunkText(text);

    expect(chunks[0].length).toBeLessThanOrEqual(400);
    expect(chunks.length).toBeGreaterThan(1);
    expect(Math.max(...chunks.slice(1).map((c) => c.length))).toBeGreaterThan(400);
  });

  it("loses no text while splitting", () => {
    const text = "One. Two. Three. Four.";
    expect(chunkText(text, 8, 8).join(" ").replace(/\s+/g, " ")).toBe(text);
  });

  it("returns a single chunk for a short article", () => {
    expect(chunkText("Short article.")).toEqual(["Short article."]);
  });
});
