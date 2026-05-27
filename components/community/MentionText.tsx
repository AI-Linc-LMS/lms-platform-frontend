"use client";

import React from "react";
import Link from "next/link";
import { Box, SxProps, Theme } from "@mui/material";

// Combined matcher: @mention OR #hashtag. Hashtags start with letter to avoid
// matching '#123' which is most often a comment-number reference. Both are
// allowed inline with optional leading whitespace boundary.
const TOKEN_RE = /(^|\s)([@#][a-zA-Z][a-zA-Z0-9_.-]{1,40})/g;

interface MentionTextProps {
  text: string;
  sx?: SxProps<Theme>;
  // Render inside another inline container — provided for use within parents
  // that already wrap in <p>/<span>.
  inline?: boolean;
}

/**
 * Renders text with @username and #hashtag tokens turned into navigation links.
 * Safe to use anywhere a plain string is rendered.
 */
export function MentionText({ text, sx, inline = false }: MentionTextProps) {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(TOKEN_RE.source, "g");

  while ((match = re.exec(text)) !== null) {
    const [, prefix, token] = match;
    const start = match.index;
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }
    parts.push(prefix);
    const isHashtag = token.startsWith("#");
    const value = token.slice(1);
    const href = isHashtag
      ? `/community?tag=${encodeURIComponent(value.toLowerCase())}`
      : `/community/u/${value}`;
    parts.push(
      <Link
        key={`${start}-${token}`}
        href={href}
        style={{ textDecoration: "none" }}
      >
        <Box
          component="span"
          sx={{
            color: isHashtag ? "var(--accent-purple)" : "var(--accent-indigo)",
            fontWeight: 600,
            cursor: "pointer",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          {token}
        </Box>
      </Link>
    );
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  if (inline) return <>{parts}</>;
  return <Box component="span" sx={sx}>{parts}</Box>;
}
