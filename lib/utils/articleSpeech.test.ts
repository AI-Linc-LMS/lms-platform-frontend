// @vitest-environment jsdom
/**
 * Read aloud, and whether the page can possibly follow it.
 *
 * Report: "[Adaptive Course] Inside the course, the read aloud feature is not
 * synchronised with the scrolling. We need to scroll it manually."
 *
 * The narration used to be one flat string cut into 3500-character chunks, which is the
 * root cause: a chunk was minutes of speech with nothing to point at, so no amount of
 * scrolling code could have known where to scroll TO. These tests pin down the two
 * properties the fix depends on - that the article is addressable as blocks, and that a
 * chunk of audio never straddles a block boundary.
 */

import { describe, expect, it } from "vitest";
import {
  buildNarrationSegments,
  chunkBlockAt,
  chunkSegments,
  htmlToText,
  CHUNK_CAP,
  CHUNK_STANDALONE,
  NARRATE_ATTR,
} from "./article-speech";

function render(html: string): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = html;
  document.body.appendChild(root);
  return root;
}

const ARTICLE = `
  <div>
    <h2>Introduction to Python</h2>
    <p>${"Python is a high-level language that reads almost like English. ".repeat(6)}</p>
    <h3>Installing it</h3>
    <ul>
      <li>Go to the official Python website.</li>
      <li>Download the latest version.</li>
      <li>Run the installer.</li>
    </ul>
    <pre data-lang="python"><code>print("Hello, World!")</code></pre>
    <p>${"Save that in hello.py and run it from a terminal. ".repeat(5)}</p>
  </div>
`;

describe("the article as blocks the page can be scrolled to", () => {
  it("gives every block an id on the element itself, in reading order", () => {
    const root = render(ARTICLE);
    const segments = buildNarrationSegments(root);

    expect(segments.length).toBeGreaterThan(5);
    const ids = segments.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);

    // Every id resolves to an element that is actually on the page. This is the whole
    // point: an id that names nothing cannot be scrolled to.
    const inDom = Array.from(root.querySelectorAll<HTMLElement>(`[${NARRATE_ATTR}]`))
      .map((el) => el.getAttribute(NARRATE_ATTR));
    for (const id of ids) expect(inDom).toContain(id);
    // ...and in the order they are spoken.
    expect(inDom.filter((id) => ids.includes(id!))).toEqual(ids);
  });

  it("splits at blocks, not inside them", () => {
    const root = render(ARTICLE);
    const segments = buildNarrationSegments(root);
    const headingSegment = segments.find((s) => s.text.startsWith("Introduction to Python"));
    expect(headingSegment?.text).toBe("Introduction to Python");
    // The three list rows are three blocks, not one run-on sentence.
    expect(segments.filter((s) => s.text.startsWith("Go to the official"))).toHaveLength(1);
    expect(segments.some((s) => s.text === "Download the latest version.")).toBe(true);
  });

  it("says everything the flat narration said - no block loses its words", () => {
    // The dangerous shape of this change is quietly narrating LESS of the article than
    // before, which nobody would notice until a learner did.
    const root = render(ARTICLE);
    const spokenByBlock = buildNarrationSegments(root).map((s) => s.text).join(" ");
    expect(spokenByBlock).toBe(htmlToText(ARTICLE));
  });

  it("keeps text that sits in a container but in no block", () => {
    const root = render("<div><p>First.</p>Loose words here.<p>Second.</p></div>");
    const segments = buildNarrationSegments(root);
    expect(segments.map((s) => s.text).join(" ")).toContain("Loose words here.");
  });

  it("announces a code block as its own block rather than dropping it", () => {
    const root = render(ARTICLE);
    const segments = buildNarrationSegments(root);
    const code = segments.find((s) => s.text.includes("code example"));
    expect(code).toBeTruthy();
    expect(code!.text).toContain("python");
    expect(code!.text).not.toContain("Hello, World!");
    expect(root.querySelector(`pre[${NARRATE_ATTR}="${code!.id}"]`)).toBeTruthy();
  });
});

describe("a chunk of audio never straddles a block", () => {
  it("gives a paragraph its own audio file, so its position needs no estimate", () => {
    // This is the property the whole fix rests on: where the learner spends most of the
    // time, the block IS the audio file and nothing is apportioned.
    const root = render(ARTICLE);
    const segments = buildNarrationSegments(root);
    const chunks = chunkSegments(segments);

    const substantial = segments.filter((s) => s.text.length >= CHUNK_STANDALONE);
    expect(substantial.length).toBeGreaterThan(0);
    for (const seg of substantial) {
      const owner = chunks.find((c) => c.parts.some((p) => p.id === seg.id));
      expect(owner?.parts).toHaveLength(1);
    }
    // ...and a chunk that DOES group blocks only ever groups short ones.
    for (const chunk of chunks.filter((c) => c.parts.length > 1)) {
      for (const part of chunk.parts) expect(part.text.length).toBeLessThan(CHUNK_STANDALONE);
    }
  });

  it("never puts the same block in two chunks", () => {
    const root = render(ARTICLE);
    const chunks = chunkSegments(buildNarrationSegments(root));
    const seen = new Set<string>();
    for (const chunk of chunks) {
      for (const part of chunk.parts) {
        expect(seen.has(part.id)).toBe(false);
        seen.add(part.id);
      }
    }
  });

  it("loses no words while chunking", () => {
    const segments = buildNarrationSegments(render(ARTICLE));
    const chunks = chunkSegments(segments);
    expect(chunks.map((c) => c.text).join(" ")).toBe(segments.map((s) => s.text).join(" "));
  });

  it("keeps every chunk under the cap so following stays close", () => {
    // The old chunking allowed 3500 characters - about three and a half minutes of
    // speech in one file. Nothing can follow that.
    const chunks = chunkSegments(buildNarrationSegments(render(ARTICLE)));
    for (const chunk of chunks) {
      // A single block over the cap is allowed (it cannot be split without losing the
      // exact mapping); a GROUP is not.
      if (chunk.parts.length > 1) expect(chunk.text.length).toBeLessThanOrEqual(CHUNK_CAP);
    }
  });

  it("keeps the first chunk short, so the learner waits less before any sound", () => {
    const chunks = chunkSegments(buildNarrationSegments(render(ARTICLE)));
    expect(chunks[0].text.length).toBeLessThanOrEqual(CHUNK_CAP);
  });
});

describe("where inside a chunk the voice is", () => {
  it("is exact for a chunk of one block, at any point in the audio", () => {
    const chunk = { text: "one long paragraph", parts: [{ id: "ns-4", text: "x", weight: 400 }] };
    for (const p of [0, 0.01, 0.5, 0.99, 1]) expect(chunkBlockAt(chunk, p)).toBe("ns-4");
  });

  it("walks the blocks of a grouped chunk in order", () => {
    const chunk = {
      text: "a b c",
      parts: [
        { id: "ns-0", text: "a", weight: 100 },
        { id: "ns-1", text: "b", weight: 100 },
        { id: "ns-2", text: "c", weight: 100 },
      ],
    };
    expect(chunkBlockAt(chunk, 0)).toBe("ns-0");
    expect(chunkBlockAt(chunk, 0.5)).toBe("ns-1");
    expect(chunkBlockAt(chunk, 0.95)).toBe("ns-2");
    // Out-of-range time (a seek past the end) must not fall off either edge.
    expect(chunkBlockAt(chunk, -1)).toBe("ns-0");
    expect(chunkBlockAt(chunk, 2)).toBe("ns-2");
  });

  it("does not starve a two-word heading grouped with a long row", () => {
    // Characters alone would give the heading 3% of the audio and move the highlight off
    // it almost immediately; a block boundary is a beat of silence the count cannot see.
    const chunk = {
      text: "Summary " + "x".repeat(300),
      parts: [
        { id: "ns-0", text: "Summary", weight: 7 + 14 },
        { id: "ns-1", text: "x".repeat(300), weight: 300 + 14 },
      ],
    };
    expect(chunkBlockAt(chunk, 0.05)).toBe("ns-0");
  });
});
