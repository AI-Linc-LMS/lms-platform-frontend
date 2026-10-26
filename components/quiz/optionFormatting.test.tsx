import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * An MCQ option shows its formatting, and shows it the one way.
 *
 * Reported from the calibration assessment: an option read
 *   Not with <code>addEventListener</code>: it did in the old <code>onclick</code> style...
 * with the tags spelled out, while the question stem directly above it formatted correctly on the
 * same screen. The stem went through `QuestionTitle` → `RichHtml`; the options were printed as
 * text by a hand-rolled branch on that page.
 *
 * HTML in an option is INTENDED content, not leakage. The backend's own converter declares
 * `HTML_RENDERED_FIELDS = ("question_text", *OPTION_FIELDS)` and deliberately preserves real
 * `<pre>`/`<code>` markup rather than escaping it, so every reader has to render it.
 *
 * The second half of these is the part that is easy to lose: the surface that DID render option
 * HTML did it with a raw `dangerouslySetInnerHTML`, so markup reached the DOM unsanitized there
 * while `RichHtml` filtered it everywhere else.
 */

import { OptionText } from "./OptionText";
import { AnswerOption } from "./AnswerOption";
import type { QuizOption } from "./QuizLayout";

const REPORTED =
  "Not with <code>addEventListener</code>: it did in the old <code>onclick</code> style, " +
  "which is why the habit persists and quietly fails";

describe("an option carrying markup", () => {
  it("renders the reported option as formatting, not as tags", () => {
    render(<OptionText text={REPORTED} data-testid="opt" />);

    const el = screen.getByTestId("opt");
    expect(el.querySelectorAll("code")).toHaveLength(2);
    expect(el.querySelector("code")?.textContent).toBe("addEventListener");
    // The thing the learner actually saw must be gone.
    expect(el.textContent).not.toContain("<code>");
    expect(el.textContent).toContain("addEventListener");
  });

  it("renders a code block without spelling out the tags", () => {
    render(<OptionText text="<pre><code>x = 1</code></pre>" data-testid="opt" />);

    const el = screen.getByTestId("opt");
    expect(el.querySelector("pre code")?.textContent).toBe("x = 1");
    expect(el.textContent).not.toContain("<pre>");
  });
});

describe("an option that is plain text", () => {
  it("is still plain text, and nothing is interpreted", () => {
    render(<OptionText text="2 < 3 and 5 > 4" data-testid="opt" />);

    const el = screen.getByTestId("opt");
    expect(el.textContent).toBe("2 < 3 and 5 > 4");
    expect(el.querySelector("code")).toBeNull();
  });

  it("an option that is ONLY tags falls back to text rather than rendering blank", () => {
    // `<p></p>` or a stray `<br/>` would render as an empty option, which hides the problem from
    // the author instead of showing it. This is the behaviour AnswerOption already had.
    render(<OptionText text="<p></p>" data-testid="opt" />);

    expect(screen.getByTestId("opt").textContent).toBe("<p></p>");
  });

  it("an empty option renders nothing and does not throw", () => {
    render(<OptionText text={null} data-testid="opt" />);
    expect(screen.getByTestId("opt").textContent).toBe("");
  });
});

describe("option markup is sanitized on every path", () => {
  const option = (label: string): QuizOption =>
    ({ id: "a", label } as unknown as QuizOption);

  function renderAnswer(label: string) {
    const { container } = render(
      <AnswerOption
        option={option(label)}
        isSelected={false}
        isCorrect={false}
        isWrongSelection={false}
        isReadOnly={false}
        isSubmitting={false}
        onSelect={() => {}}
      />
    );
    return container;
  }

  it("drops a script tag from an option", () => {
    const container = renderAnswer('Pick me<script>window.__pwned = 1;</script>');

    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain("Pick me");
  });

  it("drops an inline event handler from an option", () => {
    // The shape that matters: `onerror` on a broken image fires with no interaction at all.
    const container = renderAnswer('<img src="x" onerror="window.__pwned = 1" />A');

    const img = container.querySelector("img");
    expect(img?.getAttribute("onerror")).toBeNull();
  });

  it("defuses a javascript: link in an option", () => {
    const container = renderAnswer('<a href="javascript:window.__pwned=1">click</a>');

    expect(container.querySelector("a")?.getAttribute("href")).toBe("#");
  });

  it("still renders the legitimate markup it was given", () => {
    // The control. Without this, every assertion above would pass on a component that rendered
    // nothing at all.
    const container = renderAnswer(REPORTED);

    expect(container.querySelectorAll("code")).toHaveLength(2);
    expect(container.textContent).not.toContain("<code>");
  });
});

describe("prose that merely contains an angle bracket", () => {
  // These are the strings a detector keyed on "`<` then any letter" destroys: the browser parses
  // `<String>` or `<y implies…>` as an unknown element and swallows everything to the next `>`.
  // A question bank about generics, comparisons and keystrokes is full of them, and the failure
  // is silent -- an option reading "x0" cannot be answered and nothing says it is broken.
  it.each([
    ["x<y implies f(x)<f(y) when y>0", "x<y implies f(x)<f(y) when y>0"],
    ["List<String> is a generic", "List<String> is a generic"],
    ["a<b and b>c, so a<c", "a<b and b>c, so a<c"],
    ["if (a<b) return b>c;", "if (a<b) return b>c;"],
    ["Vector<int> v; v.size()>0", "Vector<int> v; v.size()>0"],
    ["T<U> where U>T", "T<U> where U>T"],
    ["<Tab> then <Enter>", "<Tab> then <Enter>"],
    ["<Enter> key", "<Enter> key"],
  ])("keeps %j intact", (input, expected) => {
    render(<OptionText text={input} data-testid="opt" />);
    expect(screen.getByTestId("opt").textContent).toBe(expected);
  });

  it("an option about event handlers is not eaten by the attribute scrubber", () => {
    // The scrubber used to run over the whole string, so prose naming `onerror` lost everything
    // from there to the next ">". The reported bug is itself an `onclick` question.
    render(
      <OptionText
        text="<code>img onerror = retry</code> fires when the file is missing"
        data-testid="opt"
      />
    );
    const el = screen.getByTestId("opt");
    expect(el.textContent).toBe("img onerror = retry fires when the file is missing");
    expect(el.querySelector("code")?.textContent).toBe("img onerror = retry");
  });

  it("but a real onerror ATTRIBUTE is still removed", () => {
    // The control for the line above: scoping the scrubber to tags must not weaken it.
    const { container } = render(
      <OptionText text='<img src="x" onerror="window.__pwned=1" />caption' />
    );
    expect(container.querySelector("img")?.getAttribute("onerror")).toBeNull();
    expect(container.textContent).toContain("caption");
  });
});
