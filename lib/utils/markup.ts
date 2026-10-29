/**
 * Does this string carry real markup, or is it prose that merely contains `<`?
 *
 * Every surface that renders platform-authored content has had to answer this, and six of them
 * answered it with `/<[a-z][\s\S]*>/i` — "a `<` followed by a letter, and a `>` somewhere after".
 * That reads all of these as markup:
 *
 *   #include <stdio.h>          List<String>          Vector<int>
 *   a<b and b>c                 T<U> where U>T        <Tab> then <Enter>
 *
 * The browser then parses `<stdio.h>` as an unknown element and SWALLOWS everything up to the
 * next `>`, so a C question asking for the output of a program renders as:
 *
 *   What is the output of the following C program?
 *   #include
 *   int main() { ... }
 *
 * with nothing on the page saying it is broken. Seven of twenty questions on one live paper were
 * in that state. A spelled-out tag is ugly and readable; this is silent and unanswerable.
 *
 * An allowlist of element names does not settle it either, because the single-letter tags are
 * real: `a<b and b>c` contains `<b and b>`, and `T<U> where U>T` contains `<U>`.
 *
 * So the test is STRUCTURAL: real authored markup always closes. Either a closing tag is present
 * (`</code>`, `</p>`) or a void element is (`<br>`, `<img …>`, `<hr/>`). Algebra, generics and
 * include directives never close, and a lone unclosed `<p>` is shown as text — which displays the
 * author's stray tag rather than eating the content, the right way round to fail.
 *
 * The element names mirror the vocabulary the backend's own converter escapes against
 * (`TAG_TOKEN_RE` in lms_core/management/commands/convert_legacy_course_to_adaptive.py): where the
 * two lists disagree, a string one side treats as prose is markup to the other.
 */

const CLOSING_TAG = new RegExp(
  "</\\s*(?:a|abbr|article|aside|b|blockquote|body|button|code|dd|div|dl|dt|em|figcaption|figure|" +
    "footer|form|h[1-6]|head|header|html|i|kbd|li|main|mark|nav|ol|p|pre|q|s|samp|script|section|" +
    "small|span|strong|style|sub|summary|sup|table|tbody|td|tfoot|th|thead|title|tr|u|ul|var" +
    ")\\s*>",
  "i"
);

/** Elements that never have a closing tag, so their presence alone is the signal. */
const VOID_TAG = /<\s*(?:br|hr|img|input|link|meta|col)\b[^>]*\/?>/i;

/** Does this string carry real markup, as opposed to prose that merely contains `<`? */
export function looksLikeMarkup(value: unknown): value is string {
  return typeof value === "string" && (CLOSING_TAG.test(value) || VOID_TAG.test(value));
}

/**
 * Would rendering it as HTML show anything?
 *
 * A value that is only tags — `<p></p>`, a stray `<br/>` — renders as empty, which is worse than
 * showing the author their own stray tag. Those should fall through to the text branch.
 */
export function hasVisibleMarkupContent(value: string): boolean {
  return value.replace(/<[^>]+>/g, "").trim().length > 0;
}
