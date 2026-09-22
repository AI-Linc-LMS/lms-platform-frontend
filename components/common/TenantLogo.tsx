"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { Typography, type SxProps, type Theme } from "@mui/material";

/* ==========================================================================
 * A tenant's logo that can never render as a broken image.
 *
 * Branding assets are served from the backend (`/branding/asset/<n>/`), which 302s to a signed S3
 * URL. When that request fails - a DNS outage, a stale DNS cache on the device, an expired
 * signature - a plain <img> draws the browser's broken-image glyph with the raw alt text beside it
 * ("Code…" in a 40px box). That is the one piece of branding the tenant has on a phone.
 *
 * `useLogoFallback` takes one url or a list in order of preference, and serves the first that has
 * not failed. Failures are remembered per url, so a new url (a tenant switch, a re-upload) gets a
 * fresh attempt. It also catches an image that failed BEFORE hydration, when React had not yet
 * attached onError: a complete image with no natural width is a failed one.
 * ======================================================================== */

export function useLogoFallback(src: string | null | undefined | ReadonlyArray<string | null | undefined>) {
  const candidates = (Array.isArray(src) ? src : [src]).map((s) => (s ?? "").trim()).filter(Boolean);
  const [failedUrls, setFailedUrls] = useState<ReadonlySet<string>>(() => new Set());
  const url = candidates.find((c) => !failedUrls.has(c)) ?? "";

  const markFailed = (u: string) =>
    setFailedUrls((prev) => (prev.has(u) ? prev : new Set(prev).add(u)));
  const onError = () => {
    if (url) markFailed(url);
  };
  // Runs when the <img> attaches: an image the server-rendered HTML already failed to load
  // (before React could listen for `error`) is complete with no natural width. Idempotent: a url
  // already marked returns the same set, so a re-run causes no render.
  const ref = (img: HTMLImageElement | null) => {
    if (img && url && img.complete && img.naturalWidth === 0) markFailed(url);
  };

  const failed = !url;
  return { url, failed, imgProps: { ref, onError } };
}

export interface TenantLogoProps {
  src: string | null | undefined;
  /** The tenant's name: the img alt and the wordmark shown when there is no usable image. */
  name: string;
  imgStyle?: CSSProperties;
  /** Style for the default wordmark. */
  wordmarkSx?: SxProps<Theme>;
  /** Replace the default wordmark (e.g. a surface that already had its own no-logo design). */
  fallback?: ReactNode;
}

/** The logo image, or the tenant name as a text wordmark when the image is missing or fails. */
export function TenantLogo({ src, name, imgStyle, wordmarkSx, fallback }: TenantLogoProps) {
  const { url, failed, imgProps } = useLogoFallback(src);
  if (failed) {
    if (fallback !== undefined) return <>{fallback}</>;
    return (
      <Typography
        component="span"
        data-testid="tenant-wordmark"
        title={name}
        sx={[
          {
            display: "block",
            minWidth: 0,
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: 800,
            lineHeight: 1.2,
            color: "var(--font-primary)",
          },
          ...(Array.isArray(wordmarkSx) ? wordmarkSx : [wordmarkSx]),
        ]}
      >
        {name}
      </Typography>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={name} style={imgStyle} {...imgProps} />;
}
