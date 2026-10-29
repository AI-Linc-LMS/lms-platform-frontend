"use client";

import { Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import RichHtml from "@/components/common/RichHtml";
import { hasVisibleMarkupContent, looksLikeMarkup } from "@/lib/utils/markup";

/**
 * One MCQ option, rendered the one way.
 *
 * **An option legitimately contains HTML.** The backend says so in the one place that transforms
 * it: `lms_core/management/commands/convert_legacy_course_to_adaptive.py` declares
 * `HTML_RENDERED_FIELDS = ("question_text", *OPTION_FIELDS)` — "the fields a learner sees rendered
 * as HTML" — and deliberately skips escaping any question carrying `<pre>`/`<code>` "so a real code
 * block is never turned into text". Every generator and importer then stores the author's bytes
 * verbatim. `explanation` is excluded from that list on purpose, because it reaches the learner as
 * a plain React text node.
 *
 * So a surface that prints an option as text shows the markup instead of the formatting. That is
 * what a learner reported on the calibration assessment, where the question stem above the options
 * formatted correctly (it goes through `QuestionTitle` → `RichHtml`) and the options beneath it did
 * not, on the same screen.
 *
 * Why this component rather than a fourth hand-rolled branch: there were three different answers to
 * "how do you draw an option" already, and the one surface that DID render HTML did it with a raw
 * `dangerouslySetInnerHTML`, so option markup was injected unsanitized on the busiest learner
 * screen while `RichHtml` sanitized it everywhere else. `RichHtml` strips script/style/iframe,
 * inline `on*` handlers and `javascript:` URLs; a second injection path meant that protection was
 * only as good as which component a page happened to pick.
 */

/**
 * What counts as markup, and why it is not "`<` followed by a letter".
 *
 * That looser test reads `List<String>`, `Vector<int>`, `x<y implies f(x)<f(y) when y>0` and
 * `<Tab> then <Enter>` as markup. The browser then parses `<String>` as an unknown element and
 * SWALLOWS everything up to the next `>`, so the learner is shown `x0`, or `List is a generic`,
 * with nothing on the page saying it is broken. Spelled-out tags are ugly and readable; that is
 * silent and unanswerable, and a bank about generics, comparisons and keystrokes is full of such
 * options.
 *
 * An allowlist of element names alone does not settle it either, because the single-letter tags
 * ARE real: `a<b and b>c` contains `<b and b>`, and `T<U> where U>T` contains `<U>`.
 *
 * So the test is STRUCTURAL: real option markup always closes. Either a closing tag is present
 * (`</code>`, `</p>`, `</strong>`) or a void element is (`<br>`, `<img …>`, `<hr/>`). Algebra and
 * generics never close, and a lone unclosed `<p>` is shown as text -- which displays the author's
 * stray tag rather than eating the option, the right way round to fail.
 *
 * The names mirror the vocabulary the backend's own converter escapes against (`TAG_TOKEN_RE` in
 * lms_core/management/commands/convert_legacy_course_to_adaptive.py): where the two lists
 * disagree, a string one side treats as prose is markup to the other.
 */
export interface OptionTextProps {
  /** The option as the server sent it: plain text, or platform-authored HTML. */
  text?: string | null;
  /** Typography for this surface. Colour is inherited where the caller does not set one. */
  sx?: SxProps<Theme>;
  "data-testid"?: string;
}

export function OptionText({ text, sx, ...rest }: OptionTextProps) {
  const value = text ?? "";

  if (looksLikeMarkup(value) && hasVisibleMarkupContent(value)) {
    // `inline`, because an option is a run of text inside a row, not a block of its own. It also
    // keeps `<pre>` on one wrapped line rather than opening a code block inside a radio button.
    return <RichHtml inline html={value} sx={[{ font: "inherit" }, ...(Array.isArray(sx) ? sx : [sx])]} {...rest} />;
  }

  // `font: "inherit"` FIRST, so a caller that passes no typography keeps whatever the surface
  // already established. Without it MUI's body1 is imposed, and the in-video check-in's options
  // jumped 14px -> 16px and lost their weight, leaving the letter badge beside them a different
  // size on a card whose height is capped to the video box.
  return (
    <Typography component="span" sx={[{ font: "inherit" }, ...(Array.isArray(sx) ? sx : [sx])]} {...rest}>
      {value}
    </Typography>
  );
}

export default OptionText;
