import React from "react";

import { sanitizeResumeHtml } from "./richText";

/**
 * One resume line, with its bold/italic/underline intact.
 *
 * A resume line is an HTML fragment (see the contract in richText.ts), so it is always READ as
 * one. A line with no `<` and no `&` is the same string as text and as HTML, and is returned as
 * plain text with no wrapper, so the overwhelming majority of lines render on exactly the path
 * they always did. Anything else is sanitised and set as HTML.
 *
 * This used to take the text path for any line without a b/i/u tag, which is what printed
 * "health &amp; wellness" on the resume: the editor had stored the `&` as `&amp;`, correctly, and
 * this printed the entity instead of reading it.
 *
 * The span is `display: inline` and carries no styling of its own, so it inherits the Typography it
 * sits inside and the page measurements the paginator takes are unchanged.
 */
export default function ResumeRichText({ value }: { value: string | null | undefined }) {
  const text = value ?? "";
  if (!/[<&]/.test(text)) return <>{text}</>;
  return <span dangerouslySetInnerHTML={{ __html: sanitizeResumeHtml(text) }} />;
}
