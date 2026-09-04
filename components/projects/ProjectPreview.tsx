"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

/**
 * Live preview of a static web project, assembled entirely in the browser.
 *
 * Deliberately an `iframe` with `srcDoc` and no bundler: the learner's HTML, CSS and JS are
 * stitched together in memory and handed to a sandboxed frame. That has three properties worth
 * keeping - it updates as they type with no network round trip, it costs nothing to run, and the
 * untrusted code executes on the learner's own machine rather than ours.
 *
 * It is also the free option. Running a real Node server in the browser (WebContainers, Nodebox)
 * needs a commercial licence; this does not, because it is just a sandboxed iframe.
 */

const PREVIEW_SANDBOX = "allow-scripts";

/**
 * Widths the preview can render at.
 *
 * The frame is laid out at the CHOSEN width and then scaled down to fit the pane, rather than
 * simply being squeezed into whatever space is available. That distinction is the whole point: a
 * media query fires on the frame's own CSS width, so a pane-width preview only ever shows the
 * narrowest layout, and a brief whose entire subject is a breakpoint could not be checked in it
 * at all. Scaling is visual only — the document still believes it is `width` pixels wide.
 */
const DEVICES = [
  { key: "phone", label: "Phone", width: 390, icon: "mdi:cellphone" },
  { key: "tablet", label: "Tablet", width: 768, icon: "mdi:tablet" },
  { key: "desktop", label: "Desktop", width: 1280, icon: "mdi:monitor" },
  { key: "fit", label: "Fit to pane", width: 0, icon: "mdi:arrow-expand-horizontal" },
] as const;

type DeviceKey = (typeof DEVICES)[number]["key"];

/**
 * The breakpoints the project's own CSS actually declares.
 *
 * Without this the author has to guess which preset lands on which side of their rule. The
 * pricing brief is the case in point: its breakpoint is 600px and the pane happens to be ~591px,
 * so "fit" silently sits on the narrow side and the design looks like it never responds. Offering
 * the real numbers turns checking a breakpoint into two clicks instead of a guess.
 */
function breakpointsIn(files: Record<string, string>): number[] {
  const found = new Set<number>();
  for (const [path, body] of Object.entries(files)) {
    if (!path.endsWith(".css") && !path.endsWith(".html")) continue;
    if (typeof body !== "string") continue;
    for (const m of body.matchAll(/\(\s*(?:max|min)-width\s*:\s*(\d+(?:\.\d+)?)px/gi)) {
      const px = Math.round(Number(m[1]));
      if (px > 0 && px <= 4000) found.add(px);
    }
  }
  return [...found].sort((a, b) => a - b).slice(0, 6);
}

interface ProjectPreviewProps {
  files: Record<string, string>;
  /** Entry document. Defaults to index.html, which every static brief ships. */
  entry?: string;
}

export interface UnresolvedRef {
  /** The path as written in the HTML, e.g. "style.css". */
  ref: string;
  kind: "stylesheet" | "script";
  /** The closest filename that DOES exist, when there is an obvious one. */
  suggestion?: string;
}

interface Assembled {
  html: string;
  unresolved: UnresolvedRef[];
}

/** Edit distance, capped — only used to suggest a near-miss filename. */
function distance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 4) return 99;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i += 1) {
    const cur = [i];
    for (let j = 1; j <= n; j += 1) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[n];
}

/** The file the author most likely meant, if one is close enough to be worth naming. */
function nearest(ref: string, files: Record<string, string>): string | undefined {
  const ext = ref.split(".").pop()?.toLowerCase();
  let best: string | undefined;
  let bestD = 4; // beyond this it is a guess, not a suggestion
  for (const path of Object.keys(files)) {
    if (path === ref) continue;
    if (ext && path.split(".").pop()?.toLowerCase() !== ext) continue;
    const d = distance(ref.toLowerCase(), path.toLowerCase());
    if (d < bestD) {
      bestD = d;
      best = path;
    }
  }
  return best;
}

/**
 * Inline every local <link rel=stylesheet> and <script src> so the frame needs no origin, and
 * report any that could not be resolved.
 *
 * Reporting is the point. A reference that does not match a file used to be left in the document
 * untouched — and inside a sandboxed srcDoc frame with no origin, that request goes nowhere. So a
 * one-character filename slip (`style.css` against a file named `styles.css`) rendered a
 * completely unstyled page with nothing anywhere saying why, on a pane whose whole promise is
 * that it shows what the learner will see.
 */
function assembleDocument(files: Record<string, string>, entry: string): Assembled {
  const html = files[entry];
  if (html === undefined) {
    return {
      html: `<!doctype html><meta charset="utf-8"><body style="font:14px system-ui;padding:24px;color:#555">
      <p>No <code>${escapeHtml(entry)}</code> in this project yet.</p></body>`,
      unresolved: [],
    };
  }

  const unresolved: UnresolvedRef[] = [];
  const miss = (ref: string, kind: UnresolvedRef["kind"]) => {
    if (/^(https?:)?\/\//i.test(ref) || ref.startsWith("data:")) return; // a real remote URL
    if (unresolved.some((u) => u.ref === ref)) return;
    unresolved.push({ ref, kind, suggestion: nearest(ref, files) });
  };

  let out = html;

  // <link rel="stylesheet" href="styles.css">  ->  <style>...</style>
  out = out.replace(
    /<link[^>]*rel=["']?stylesheet["']?[^>]*href=["']([^"']+)["'][^>]*>/gi,
    (match, href: string) => {
      const css = files[stripLeading(href)];
      if (css !== undefined) return `<style>\n${css}\n</style>`;
      miss(stripLeading(href), "stylesheet");
      return "";
    }
  );
  // href before rel, which is just as common in hand-written HTML
  out = out.replace(
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']?stylesheet["']?[^>]*>/gi,
    (match, href: string) => {
      const css = files[stripLeading(href)];
      if (css !== undefined) return `<style>\n${css}\n</style>`;
      miss(stripLeading(href), "stylesheet");
      return "";
    }
  );
  // <script src="app.js"></script>  ->  <script>...</script>
  out = out.replace(
    /<script[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi,
    (match, src: string) => {
      const js = files[stripLeading(src)];
      if (js !== undefined) return `<script>\n${js}\n</script>`;
      miss(stripLeading(src), "script");
      return "";
    }
  );

  // Surface runtime errors inside the frame; otherwise a thrown exception is invisible and the
  // learner sees a blank page with no idea why.
  const errorReporter = `<script>
    window.addEventListener('error', function (e) {
      var el = document.createElement('pre');
      el.style.cssText = 'position:fixed;left:0;right:0;bottom:0;margin:0;padding:8px 12px;' +
        'font:12px ui-monospace,Menlo,monospace;background:#7f1d1d;color:#fff;white-space:pre-wrap;z-index:2147483647';
      el.textContent = e.message + (e.lineno ? ' (line ' + e.lineno + ')' : '');
      document.body && document.body.appendChild(el);
    });
  </script>`;

  return {
    html: out.includes("</body>")
      ? out.replace("</body>", `${errorReporter}</body>`)
      : out + errorReporter,
    unresolved,
  };
}

function stripLeading(p: string): string {
  return p.replace(/^\.?\//, "");
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string)
  );
}

/** Test seam: the resolver is the part with the failure modes worth asserting. */
export const assembleDocumentForTest = assembleDocument;

export default function ProjectPreview({ files, entry = "index.html" }: ProjectPreviewProps) {
  const [debounced, setDebounced] = useState(files);
  const [device, setDevice] = useState<DeviceKey>("fit");
  const [customWidth, setCustomWidth] = useState<number | null>(null);
  const [paneWidth, setPaneWidth] = useState(0);
  const paneRef = useRef<HTMLDivElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Measure the pane so the frame can be scaled to fit it. ResizeObserver rather than a window
  // listener: the pane changes size when the editor's columns reflow, not only when the window
  // does.
  useEffect(() => {
    const node = paneRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w) setPaneWidth(w);
    });
    observer.observe(node);
    setPaneWidth(node.clientWidth);
    return () => observer.disconnect();
  }, []);

  // Rebuild on a short debounce rather than every keystroke: reassigning srcDoc tears down and
  // recreates the document, so doing it per character makes the preview strobe.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(files), 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [files]);

  const { html: srcDoc, unresolved } = useMemo(
    () => assembleDocument(debounced, entry),
    [debounced, entry]
  );

  const breakpoints = useMemo(() => breakpointsIn(debounced), [debounced]);
  const basePreset = DEVICES.find((d) => d.key === device) ?? DEVICES[3];
  // A breakpoint chip wins over the preset until a preset is clicked again.
  const preset = customWidth
    ? { ...basePreset, key: "custom" as DeviceKey, width: customWidth }
    : basePreset;
  const frameWidth = preset.width || paneWidth || 0;
  // Only ever scale DOWN. Blowing a 390px phone layout up to fill a wide pane would misrepresent
  // both the size of the text and the amount of space the design actually has.
  const scale = preset.width && paneWidth ? Math.min(1, paneWidth / preset.width) : 1;

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <Box
        sx={{
          px: 1.5,
          py: 0.75,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          borderBottom: "1px solid var(--border-subtle, var(--neutral-200))",
        }}
      >
        <Typography sx={{ fontSize: 12, color: "var(--font-secondary)", whiteSpace: "nowrap" }}>
          Preview &middot; updates as you type
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
          {DEVICES.map((d) => {
            const active = !customWidth && d.key === device;
            return (
              <Tooltip
                key={d.key}
                title={d.width ? `${d.label} — ${d.width}px` : d.label}
              >
                <Box
                  component="button"
                  type="button"
                  aria-label={d.label}
                  aria-pressed={active}
                  onClick={() => {
                    setCustomWidth(null);
                    setDevice(d.key);
                  }}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 26,
                    height: 26,
                    p: 0,
                    border: 0,
                    borderRadius: 1,
                    cursor: "pointer",
                    color: active ? "var(--accent-indigo)" : "var(--font-secondary)",
                    backgroundColor: active
                      ? "color-mix(in srgb, var(--accent-indigo) 12%, transparent)"
                      : "transparent",
                    "&:hover": {
                      backgroundColor: "color-mix(in srgb, var(--accent-indigo) 8%, transparent)",
                    },
                  }}
                >
                  <IconWrapper icon={d.icon} size={15} />
                </Box>
              </Tooltip>
            );
          })}
          {/* The project's own breakpoints, either side. Clicking lands the frame one pixel
              below or above the rule, which is the only way to see both branches with
              certainty — a max-width rule matches AT its own value, so "600" is the narrow
              side, not the boundary between them. */}
          {breakpoints.map((bp) => (
            <Box key={bp} sx={{ display: "inline-flex", alignItems: "center", ml: 0.5 }}>
              {[
                { w: bp, label: `◂${bp}`, hint: `${bp}px — the narrow side of this rule` },
                { w: bp + 1, label: `${bp}▸`, hint: `${bp + 1}px — the wide side of this rule` },
              ].map((side) => (
                <Tooltip key={side.label} title={side.hint}>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => setCustomWidth(side.w)}
                    sx={{
                      px: 0.6,
                      height: 22,
                      border: 0,
                      borderRadius: 1,
                      cursor: "pointer",
                      fontSize: 10.5,
                      fontFamily: "var(--font-mono)",
                      color:
                        customWidth === side.w
                          ? "var(--accent-indigo)"
                          : "var(--font-secondary)",
                      backgroundColor:
                        customWidth === side.w
                          ? "color-mix(in srgb, var(--accent-indigo) 14%, transparent)"
                          : "transparent",
                      "&:hover": {
                        backgroundColor:
                          "color-mix(in srgb, var(--accent-indigo) 8%, transparent)",
                      },
                    }}
                  >
                    {side.label}
                  </Box>
                </Tooltip>
              ))}
            </Box>
          ))}

          {/* The number the author actually needs: what width the media queries are seeing. */}
          <Typography
            sx={{
              ml: 0.5,
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "var(--font-secondary)",
              minWidth: 62,
              textAlign: "right",
            }}
          >
            {frameWidth ? `${Math.round(frameWidth)}px` : "—"}
            {scale < 1 ? ` · ${Math.round(scale * 100)}%` : ""}
          </Typography>
        </Box>
      </Box>

      {unresolved.length > 0 && (
        <Box
          sx={{
            px: 1.5,
            py: 1,
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            borderBottom: "1px solid color-mix(in srgb, var(--warning-500) 30%, transparent)",
            backgroundColor: "color-mix(in srgb, var(--warning-500) 10%, var(--surface) 90%)",
          }}
        >
          {unresolved.map((u) => (
            <Typography key={u.ref} sx={{ fontSize: 12.5, color: "var(--font-primary)" }}>
              <strong>{entry}</strong> links{" "}
              <Box component="code" sx={{ fontFamily: "var(--font-mono)" }}>
                {u.ref}
              </Box>
              , which this project has no file for, so it is not applied.
              {u.suggestion ? (
                <>
                  {" "}Did you mean{" "}
                  <Box component="code" sx={{ fontFamily: "var(--font-mono)" }}>
                    {u.suggestion}
                  </Box>
                  ?
                </>
              ) : null}
            </Typography>
          ))}
        </Box>
      )}
      <Box
        ref={paneRef}
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          // A checkerboard ground so the page's own edges are visible when it is narrower than
          // the pane — otherwise a white design on a white pane looks like it is full width.
          backgroundColor: "var(--surface-muted, #f1f2f4)",
          backgroundImage:
            "linear-gradient(45deg, rgba(0,0,0,0.035) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.035) 75%)," +
            "linear-gradient(45deg, rgba(0,0,0,0.035) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.035) 75%)",
          backgroundSize: "16px 16px",
          backgroundPosition: "0 0, 8px 8px",
          display: "flex",
          justifyContent: "center",
          p: preset.width ? 1.5 : 0,
        }}
      >
        <Box
          sx={{
            // The wrapper occupies the SCALED footprint, so the layout and any scrollbars
            // reflect what is actually on screen. The frame inside is laid out at the full
            // device width and shrunk visually, which is what keeps the media queries honest.
            width: preset.width ? preset.width * scale : "100%",
            height: "100%",
            flex: preset.width ? "0 0 auto" : 1,
            overflow: "hidden",
          }}
        >
          <iframe
            title="Project preview"
            srcDoc={srcDoc}
            sandbox={PREVIEW_SANDBOX}
            style={{
              width: preset.width ? `${preset.width}px` : "100%",
              height: preset.width ? `${100 / scale}%` : "100%",
              border: 0,
              display: "block",
              background: "#fff",
              borderRadius: preset.width ? 8 : 0,
              boxShadow: preset.width ? "0 2px 14px rgba(0,0,0,0.12)" : "none",
              transform: scale < 1 ? `scale(${scale})` : undefined,
              transformOrigin: "top left",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
