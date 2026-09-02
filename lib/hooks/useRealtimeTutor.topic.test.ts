// @vitest-environment jsdom
/**
 * Matching a `show_quiz` topic against the question pool.
 *
 * Two live defects met here, and the second was about to get much worse.
 *
 * 1. THE TUTOR WENT SILENT ON A C++ TOPIC. The token was interpolated into a RegExp unescaped,
 *    and the tokeniser deliberately keeps `+` inside a word, so "c++11 move semantics" built
 *    /(?<![a-z0-9])c++11(?![a-z0-9])/ - "Nothing to repeat". That threw inside the tool handler,
 *    which is invoked as `void handleToolCall(...)`, so the rejection was discarded and the tool
 *    result was never sent. The model waited forever for a reply that could not arrive.
 *
 * 2. NON-LATIN TOPICS TOKENISED TO NOTHING. The split class was `[^a-z0-9+#]+`, which treats
 *    every Devanagari character as a separator. Harmless while an unmatched topic fell back to
 *    the first pooled question - but this branch replaces that fallback with a decline, and the
 *    backend now writes question stems in the tenant's own language. Together those would have
 *    stopped the quiz appearing at all for exactly the tenants `tutor_language` exists for.
 */

import { describe, expect, it } from "vitest";
import { topicTokens, wholeWord } from "./useRealtimeTutor";

describe("splitting a topic into matchable words", () => {
  it("keeps c++ and c# as single tokens", () => {
    expect(topicTokens("c++ pointers")).toContain("c++");
    expect(topicTokens("c# generics")).toContain("c#");
  });

  it("splits on hyphens, so tail-recursion matches a stem saying tail recursion", () => {
    expect(topicTokens("tail-recursion")).toEqual(["tail", "recursion"]);
  });

  it("keeps three-letter programming terms the tutor actually asks about", () => {
    expect(topicTokens("sql joins")).toContain("sql");
    expect(topicTokens("dom events")).toContain("dom");
  });

  it("tokenises a Hindi topic instead of throwing it all away", () => {
    // The old ASCII-only class returned [] here, which scored nothing and - with the decline
    // this branch introduces - meant a Hindi tenant never saw a quiz.
    const tokens = topicTokens("पुनरावर्तन का आधार");
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens).toContain("पुनरावर्तन");
  });

  it("tokenises Tamil and Spanish too", () => {
    expect(topicTokens("சுழல்நிலை அடிப்படை").length).toBeGreaterThan(0);
    expect(topicTokens("recursión básica")).toContain("recursión");
  });
});

describe("matching one word against a question stem", () => {
  it("does not throw on a token containing regex metacharacters", () => {
    // The live crash: this construction threw SyntaxError and killed the tool reply.
    expect(() => wholeWord("c++11")).not.toThrow();
    expect(() => wholeWord("notepad++")).not.toThrow();
    expect(() => wholeWord("a.b*c")).not.toThrow();
  });

  it("still matches the literal text it came from", () => {
    expect(wholeWord("c++11").test("what does c++11 change about move semantics?")).toBe(true);
    expect(wholeWord("c++").test("explain c++ pointers")).toBe(true);
  });

  it("treats a metacharacter as a literal, not a pattern", () => {
    // "a.b" must not match "axb" - the dot has to be escaped, not act as "any character".
    expect(wholeWord("a.b").test("axb")).toBe(false);
    expect(wholeWord("a.b").test("a.b")).toBe(true);
  });

  it("matches whole words only", () => {
    expect(wholeWord("for").test("for loops")).toBe(true);
    expect(wholeWord("for").test("formatting strings")).toBe(false);
  });

  it("bounds a non-Latin word correctly", () => {
    // An [a-z0-9] boundary does not bound a Devanagari word, so this had to move to \p{L}\p{N}.
    expect(wholeWord("आधार").test("पुनरावर्तन में आधार स्थिति क्या है?")).toBe(true);
    expect(wholeWord("आधार").test("यह पुनरावर्तन के बारे में है")).toBe(false);
  });

  it("scores an English topic against a Hindi stem as a miss, not a crash", () => {
    // Genuinely no overlap - the point is that it returns false rather than throwing.
    expect(wholeWord("recursion").test("पुनरावर्तन में आधार स्थिति क्या है?")).toBe(false);
  });
});
