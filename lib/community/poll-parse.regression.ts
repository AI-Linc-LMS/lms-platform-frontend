/**
 * Poll parser regressions. Run: npx --yes tsx lib/community/poll-parse.regression.ts
 */
import { parsePollFromBody } from "./poll-parse";

function assert(name: string, cond: boolean, detail?: string) {
  if (!cond) {
    throw new Error(`FAIL: ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function run() {
  const plain = parsePollFromBody("[POLL]\n- C++\n- Python");
  assert("plain C++/Python", plain !== null && plain.options.join("|") === "C++|Python");

  const html =
    "<p>[POLL]</p><p>- C++</p><p>- Python</p>";
  const htmlParsed = parsePollFromBody(html);
  assert(
    "html-wrapped paragraphs",
    htmlParsed !== null && htmlParsed.options.length === 2 && htmlParsed.options[0] === "C++",
    htmlParsed?.options.join(" / ")
  );

  const encoded = "[POLL]\n- C&#43;&#43;\n- Python";
  const enc = parsePollFromBody(encoded);
  assert("encoded plus", enc !== null && enc.options[0] === "C++", enc?.options.join("|"));

  // Blank line between bullets (must not stop after first option)
  const blanks = "[POLL]\n- A\n\n- B\n\nContext after";
  const b = parsePollFromBody(blanks);
  assert("blank between bullets", b !== null && b.options.join("|") === "A|B" && b.preamble.includes("Context"));

  console.log("poll-parse.regression: OK");
}

run();
