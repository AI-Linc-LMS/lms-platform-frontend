"use client";

import { useState, type CSSProperties, type ReactNode, type SyntheticEvent } from "react";
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
 *
 * Inside a <picture> the browser, not React, chooses which url loads; the failure is charged to
 * the url the image actually resolved (`currentSrc`), and `pick` then gives each <source> and the
 * <img> the next url in its own order.
 * ======================================================================== */

type MaybeUrl = string | null | undefined;
const clean = (list: ReadonlyArray<MaybeUrl>) => list.map((s) => (s ?? "").trim()).filter(Boolean);

/** Resolve an absolute `currentSrc` back to the candidate it came from. */
function candidateFor(resolved: string, candidates: string[]): string | undefined {
  return candidates.find((c) => {
    if (c === resolved) return true;
    try {
      return new URL(c, window.location.href).href === resolved;
    } catch {
      return false;
    }
  });
}

export function useLogoFallback(src: MaybeUrl | ReadonlyArray<MaybeUrl>) {
  const candidates = clean(Array.isArray(src) ? src : [src as MaybeUrl]);
  const [failedUrls, setFailedUrls] = useState<ReadonlySet<string>>(() => new Set());
  const pick = (list: ReadonlyArray<MaybeUrl>) => clean(list).find((c) => !failedUrls.has(c)) ?? "";
  const url = pick(candidates);

  const markFailed = (u: string) =>
    setFailedUrls((prev) => (prev.has(u) ? prev : new Set(prev).add(u)));
  /** Charge a failure to the url this <img> actually resolved. */
  const failImage = (img: HTMLImageElement) => {
    const resolved = img.currentSrc || img.getAttribute("src") || "";
    const u = candidateFor(resolved, candidates) ?? url;
    if (u) markFailed(u);
  };
  const onError = (e: SyntheticEvent<HTMLImageElement>) => failImage(e.currentTarget);
  // Runs when the <img> attaches: an image the server-rendered HTML already failed to load
  // (before React could listen for `error`) is complete with no natural width. Idempotent: a url
  // already marked returns the same set, so a re-run causes no render.
  const ref = (img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth === 0 && (img.currentSrc || img.getAttribute("src"))) failImage(img);
  };

  const failed = !url;
  return { url, failed, pick, imgProps: { ref, onError } };
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
