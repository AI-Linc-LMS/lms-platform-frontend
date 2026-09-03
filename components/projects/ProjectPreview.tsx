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

/** Inline every local <link rel=stylesheet> and <script src> so the frame needs no origin. */
function assembleDocument(files: Record<string, string>, entry: string): string {
  const html = files[entry];
  if (html === undefined) {
    return `<!doctype html><meta charset="utf-8"><body style="font:14px system-ui;padding:24px;color:#555">
      <p>No <code>${escapeHtml(entry)}</code> in this project yet.</p></body>`;
  }

  let out = html;

  // <link rel="stylesheet" href="styles.css">  ->  <style>...</style>
  out = out.replace(
    /<link[^>]*rel=["']?stylesheet["']?[^>]*href=["']([^"']+)["'][^>]*>/gi,
    (match, href: string) => {
      const css = files[stripLeading(href)];
      return css === undefined ? match : `<style>\n${css}\n</style>`;
    }
  );
  // href before rel, which is just as common in hand-written HTML
  out = out.replace(
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']?stylesheet["']?[^>]*>/gi,
    (match, href: string) => {
      const css = files[stripLeading(href)];
      return css === undefined ? match : `<style>\n${css}\n</style>`;
    }
  );
  // <script src="app.js"></script>  ->  <script>...</script>
  out = out.replace(
    /<script[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi,
    (match, src: string) => {
      const js = files[stripLeading(src)];
      return js === undefined ? match : `<script>\n${js}\n</script>`;
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

  return out.includes("</body>")
    ? out.replace("</body>", `${errorReporter}</body>`)
    : out + errorReporter;
}

function stripLeading(p: string): string {
  return p.replace(/^\.?\//, "");
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string)
  );
}

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

  const srcDoc = useMemo(() => assembleDocument(debounced, entry), [debounced, entry]);

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <Typography
        variant="caption"
        sx={{ px: 1.5, py: 0.75, color: "text.secondary", borderBottom: 1, borderColor: "divider" }}
      >
        Preview &middot; updates as you type
      </Typography>
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
