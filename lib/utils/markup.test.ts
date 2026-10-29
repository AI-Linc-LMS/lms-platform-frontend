import { describe, expect, it } from "vitest";

import { hasVisibleMarkupContent, looksLikeMarkup } from "./markup";

/**
 * A C question must not lose its `#include`.
 *
 * Six surfaces decided "is this HTML?" with `/<[a-z][\s\S]*>/i`, which says yes to
 * `#include <stdio.h>`. The browser then parses `<stdio.h>` as an unknown element and swallows it,
 * so the learner is asked to predict the output of a program whose first line reads `#include`.
 * Seven of twenty questions on one live paper rendered that way.
 */

describe("code and prose that merely contain a left angle bracket", () => {
  it("keeps a C include directive as text", () => {
    expect(looksLikeMarkup("#include <stdio.h>\nint main() { return 0; }")).toBe(false);
    expect(looksLikeMarkup("#include <iostream>\nusing namespace std;")).toBe(false);
    expect(looksLikeMarkup('#include <vector>\n#include "local.h"')).toBe(false);
  });

  it("keeps generics as text", () => {
    expect(looksLikeMarkup("List<String> names = new ArrayList<>();")).toBe(false);
    expect(looksLikeMarkup("Vector<int> v;")).toBe(false);
    expect(looksLikeMarkup("std::map<std::string, int> counts;")).toBe(false);
    expect(looksLikeMarkup("T<U> where U>T")).toBe(false);
  });

  it("keeps comparisons and keystrokes as text", () => {
    expect(looksLikeMarkup("a<b and b>c")).toBe(false);
    expect(looksLikeMarkup("x<y implies f(x)<f(y) when y>0")).toBe(false);
    expect(looksLikeMarkup("<Tab> then <Enter>")).toBe(false);
    expect(looksLikeMarkup("for (i = 0; i < 5; i++);")).toBe(false);
  });

  it("keeps a stream insertion as text", () => {
    expect(looksLikeMarkup("std::cout << x;")).toBe(false);
    expect(looksLikeMarkup("cin >> n;")).toBe(false);
  });
});

describe("authored markup", () => {
  it("is recognised by its closing tag", () => {
    expect(looksLikeMarkup("<p>What does this print?</p>")).toBe(true);
    expect(looksLikeMarkup("Consider <code>x = 1</code>")).toBe(true);
    expect(looksLikeMarkup("<strong>Note</strong> the order")).toBe(true);
    expect(looksLikeMarkup("<pre><code>int x;</code></pre>")).toBe(true);
  });

  it("is recognised by a void element", () => {
    expect(looksLikeMarkup("line one<br>line two")).toBe(true);
    expect(looksLikeMarkup("line one<br/>line two")).toBe(true);
    expect(looksLikeMarkup('see <img src="d.png" alt="d">')).toBe(true);
  });

  it("an unclosed tag is treated as text, so the stray tag shows instead of eating the stem", () => {
    expect(looksLikeMarkup("<p>no closing tag here")).toBe(false);
  });
});

describe("markup that would render as nothing", () => {
  it("is reported as having no visible content", () => {
    expect(hasVisibleMarkupContent("<p></p>")).toBe(false);
    expect(hasVisibleMarkupContent("<br/>")).toBe(false);
    expect(hasVisibleMarkupContent("  <span> </span> ")).toBe(false);
  });

  it("real content is visible", () => {
    expect(hasVisibleMarkupContent("<p>42</p>")).toBe(true);
  });
});

describe("the non-string cases", () => {
  it("are never markup", () => {
    expect(looksLikeMarkup(null)).toBe(false);
    expect(looksLikeMarkup(undefined)).toBe(false);
    expect(looksLikeMarkup(42)).toBe(false);
    expect(looksLikeMarkup("")).toBe(false);
  });
});
