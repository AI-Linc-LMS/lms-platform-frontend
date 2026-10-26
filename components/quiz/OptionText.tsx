"use client";

import { Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import RichHtml from "@/components/common/RichHtml";

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

/** Does this string carry markup at all? */
function hasHtml(value: unknown): value is string {
  return typeof value === "string" && /<[a-zA-Z][^>]*\/?>|<[a-zA-Z][\s\S]*>/i.test(value);
}

/**
 * Would rendering it as HTML show anything?
 *
 * A value that is only tags — `<p></p>`, a stray `<br/>` — renders as an empty option, which is
 * worse than showing the author their own stray tag. Those fall through to the text branch, which
 * is the behaviour `AnswerOption` already had and which must not be lost in the move.
 */
function hasVisibleHtmlContent(value: string): boolean {
  return value.replace(/<[^>]+>/g, "").trim().length > 0;
}

export interface OptionTextProps {
  /** The option as the server sent it: plain text, or platform-authored HTML. */
  text?: string | null;
  /** Typography for this surface. Colour is inherited where the caller does not set one. */
  sx?: SxProps<Theme>;
  "data-testid"?: string;
}

export function OptionText({ text, sx, ...rest }: OptionTextProps) {
  const value = text ?? "";

  if (hasHtml(value) && hasVisibleHtmlContent(value)) {
    // `inline`, because an option is a run of text inside a row, not a block of its own. It also
    // keeps `<pre>` on one wrapped line rather than opening a code block inside a radio button.
    return <RichHtml inline html={value} sx={sx} {...rest} />;
  }

  return (
    <Typography component="span" sx={sx} {...rest}>
      {value}
    </Typography>
  );
}

export default OptionText;
