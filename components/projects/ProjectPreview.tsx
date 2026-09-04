"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";

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
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <Typography
        sx={{
          px: 1.5,
          py: 0.75,
          fontSize: 12,
          color: "var(--font-secondary)",
          borderBottom: "1px solid var(--border-subtle, var(--neutral-200))",
        }}
      >
        Preview &middot; updates as you type
      </Typography>

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
      <Box sx={{ flex: 1, minHeight: 0, bgcolor: "#fff" }}>
        <iframe
          title="Project preview"
          srcDoc={srcDoc}
          sandbox={PREVIEW_SANDBOX}
          style={{ width: "100%", height: "100%", border: 0, display: "block" }}
        />
      </Box>
    </Box>
  );
}
