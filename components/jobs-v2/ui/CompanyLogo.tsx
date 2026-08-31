"use client";

import { useState } from "react";
import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { J, R } from "./jobsTokens";

function initial(name: string | undefined | null): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "?";
  return Array.from(trimmed)[0]?.toUpperCase() ?? "?";
}

export interface CompanyLogoProps {
  src?: string | null;
  /** Always rendered as adjacent text by the caller, so the image itself is decorative. */
  name: string;
  size?: number;
  radius?: string;
  sx?: SxProps<Theme>;
}

/**
 * A plain `<img>`, never `next/image`: these are arbitrary tenant- and employer-supplied URLs
 * and the optimizer cannot be pointed at an unknown host (the same rule the branding fix
 * established).
 *
 * On `onError` **or** a missing `src` it falls back to the initial letter on the brand badge
 * gradient — never a broken-image glyph, never a `display: none` box that collapses the row.
 */
export function CompanyLogo({ src, name, size = 40, radius, sx }: CompanyLogoProps) {
  // The failure is remembered against the URL that failed, not as a bare boolean, so a
  // recycled row with a NEW src gets a fresh attempt without an effect resetting state.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const borderRadius = radius ?? (size > 40 ? R.inner : R.ctl);
  const showFallback = !src || failedSrc === src;

  return (
    <Box
      sx={[
        {
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius,
          overflow: "hidden",
          display: "grid",
          placeItems: "center",
          border: `1px solid ${J.hairline}`,
          bgcolor: showFallback ? "transparent" : J.surface,
          background: showFallback ? J.gradBadge : undefined,
          color: showFallback ? J.onDark : undefined,
          fontWeight: 800,
          fontSize: Math.max(12, Math.round(size * 0.42)),
          lineHeight: 1,
          letterSpacing: "-0.02em",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {showFallback ? (
        <Box component="span" aria-hidden>
          {initial(name)}
        </Box>
      ) : (
        <Box
          component="img"
          src={src ?? undefined}
          alt=""
          loading="lazy"
          onError={() => setFailedSrc(src ?? null)}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            p: size >= 48 ? 1 : 0.5,
            display: "block",
          }}
        />
      )}
    </Box>
  );
}

export interface JAvatarProps {
  src?: string | null;
  name: string;
  size?: 28 | 32 | 40 | 56;
  sx?: SxProps<Theme>;
}

/** The same shape for people: circular, initials on the inert surface rung. */
export function JAvatar({ src, name, size = 40, sx }: JAvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showFallback = !src || failedSrc === src;

  return (
    <Box
      sx={[
        {
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: "50%",
          overflow: "hidden",
          display: "grid",
          placeItems: "center",
          border: `1px solid ${J.hairline}`,
          bgcolor: J.surface3,
          color: J.ink2,
          fontWeight: 700,
          fontSize: Math.max(11, Math.round(size * 0.4)),
          lineHeight: 1,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {showFallback ? (
        <Box component="span" aria-hidden>
          {initial(name)}
        </Box>
      ) : (
        <Box
          component="img"
          src={src ?? undefined}
          alt=""
          loading="lazy"
          onError={() => setFailedSrc(src ?? null)}
          sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      )}
    </Box>
  );
}
