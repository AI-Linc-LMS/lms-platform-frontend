"use client";

import ReactMarkdown from "react-markdown";
import { Box } from "@mui/material";

/** The AI session summary, rendered as the markdown it actually is.
 *
 *  The backend composes summaries as markdown — `**Key points:**` headings and `- ` bullet
 *  lists — and every surface printed the raw string, asterisks and all. One renderer, styled to
 *  sit inside the existing indigo summary card at either the student or the admin font size.
 */
export function SummaryMarkdown({ text, fontSize = "0.875rem" }: { text: string; fontSize?: string }) {
  return (
    <Box
      sx={{
        color: "var(--font-primary)",
        fontSize,
        lineHeight: 1.6,
        "& p": { m: 0, mb: 1 },
        "& p:last-child": { mb: 0 },
        "& strong": { fontWeight: 700 },
        "& ul, & ol": { m: 0, mb: 1, pl: 2.5 },
        "& li": { mb: 0.25 },
        "& li:last-child": { mb: 0 },
      }}
    >
      <ReactMarkdown>{text}</ReactMarkdown>
    </Box>
  );
}
