import React from "react";

import { hasResumeMarkup, sanitizeResumeHtml } from "./richText";

/**
 * One resume line, with its bold/italic/underline intact.
 *
 * Plain text is returned as plain text, not as HTML: only a line that actually carries markup goes
 * through `dangerouslySetInnerHTML`, so the overwhelming majority of existing resumes render on
 * exactly the path they did before this component existed.
 *
 * The span is `display: inline` and carries no styling of its own, so it inherits the Typography it
 * sits inside and the page measurements the paginator takes are unchanged.
 */
export default function ResumeRichText({ value }: { value: string | null | undefined }) {
  const text = value ?? "";
  if (!hasResumeMarkup(text)) return <>{text}</>;
  return <span dangerouslySetInnerHTML={{ __html: sanitizeResumeHtml(text) }} />;
}
