"use client";

import React from "react";
import { Box, BoxProps } from "@mui/material";

/**
 * Renders platform-authored HTML content (question stems, options, explanations) as real HTML —
 * so `<pre><code>` code blocks, tables, `<sup>/<sub>` math, and `<img>` graphs render instead of
 * showing raw tags with collapsed whitespace.
 *
 * Content is platform/verified-generated, but we still strip the obvious injection vectors
 * (script/style tags, inline on* handlers, javascript: URLs) as defense-in-depth for imported banks.
 * `inline` renders in a span (for option labels); default renders a block with code/table/img styling.
 */
function sanitizeHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<\s*(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed)\b[^>]*\/?\s*>/gi, "")
    // Attribute scrubbing happens INSIDE a tag, never across the whole string. Run over prose it
    // ate the content it was meant to protect: an option reading
    // "<code>img onerror = retry</code> fires when the file is missing" came out as
    // "img> fires when the file is missing", and the reported bug is itself a DOM-events question
    // about `onclick`, so that is the exact content family this renders.
    .replace(/<[^>]+>/g, (tag) =>
      tag
        .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
        .replace(/(href|src)\s*=\s*("\s*javascript:[^"]*"|'\s*javascript:[^']*'|javascript:[^\s>]*)/gi, '$1="#"')
    );
}

const BLOCK_SX = {
  // Code blocks — the main fix: preserve newlines + monospace + horizontal scroll instead of a
  // collapsed one-liner of raw <pre><code>.
  "& pre": {
    my: 1,
    p: 1.5,
    borderRadius: 2,
    bgcolor: "rgba(99,102,241,0.06)",
    border: "1px solid",
    borderColor: "rgba(99,102,241,0.15)",
    overflowX: "auto",
    fontSize: "0.9em",
    lineHeight: 1.55,
    whiteSpace: "pre",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  },
  "& code": {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: "0.9em",
    px: 0.5,
    py: 0.1,
    borderRadius: 1,
    bgcolor: "rgba(99,102,241,0.08)",
  },
  "& pre code": { p: 0, bgcolor: "transparent", fontSize: "1em" },
  "& table": {
    borderCollapse: "collapse",
    my: 1,
    "& td, & th": { border: "1px solid", borderColor: "divider", px: 1, py: 0.5, textAlign: "left" },
    "& th": { bgcolor: "rgba(0,0,0,0.03)", fontWeight: 700 },
  },
  "& img": { maxWidth: "100%", height: "auto", borderRadius: 1, my: 1 },
  "& p": { my: 0.5 },
  "& ul, & ol": { pl: 3, my: 0.5 },
} as const;

const INLINE_SX = {
  display: "inline",
  "& code": {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: "0.92em",
    px: 0.5,
    borderRadius: 1,
    bgcolor: "rgba(99,102,241,0.08)",
  },
  "& pre": { display: "inline", whiteSpace: "pre-wrap", fontFamily: "ui-monospace, monospace" },
} as const;

export interface RichHtmlProps extends Omit<BoxProps, "children" | "dangerouslySetInnerHTML"> {
  html?: string | null;
  inline?: boolean;
}

export default function RichHtml({ html, inline = false, sx, ...rest }: RichHtmlProps) {
  return (
    <Box
      component={inline ? "span" : "div"}
      {...rest}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html || "") }}
      // The ARRAY form, which MUI deep-merges by emitting each entry in order. A spread is
      // shallow, so a caller passing `{"& code": {bgcolor}}` replaced the base `& code` rule
      // WHOLESALE and silently took the monospace font, padding and radius with it -- the dark
      // calibration card ended up with a code chip in the body font, disagreeing with the stem
      // on the same screen. The array also preserves an `sx` that is itself an array or a
      // callback, both of which `{...sx}` quietly discarded.
      sx={[inline ? INLINE_SX : BLOCK_SX, ...(Array.isArray(sx) ? sx : [sx])]}
    />
  );
}
