"use client";

import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { createRoot, type Root } from "react-dom/client";
import { sanitizeHtml } from "./sanitizeHtml";
import { CodeBlock } from "./CodeBlock";
import { RunnableCodeBlock } from "./RunnableCodeBlock";

export type ArticleHeading = { id: string; text: string; level: number };

interface AdaptiveArticleBodyProps {
  html: string;
  /** Terms the AI marked as worth an inline "Explain this". First occurrence of
   *  each gets a dashed-underline span; clicking it calls onExplain. */
  explainTerms: string[];
  onExplain: (term: string, anchor: HTMLElement, context: string) => void;
  /** When true, the body reveals word-by-word (the "magic" reveal) each time the
   *  html changes - e.g. when a new reading tier is generated. */
  reveal?: boolean;
  /** Reports the article's headings (with assigned ids) so the page can build a
   *  table-of-contents + scroll-spy. Called whenever the html changes. */
  onHeadings?: (headings: ArticleHeading[]) => void;
}

// Target wall-clock for a full reveal; per-frame step scales so long articles
// still finish in a few seconds rather than minute-long crawls.
const REVEAL_SECONDS = 3;

function slugify(text: string, i: number): string {
  const base = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
  return `acb-${base || "section"}-${i}`;
}

/**
 * Renders sanitized adaptive-article HTML and progressively enhances it:
 *  - hydrates <pre> blocks into read-only (CodeBlock) or runnable (RunnableCodeBlock) islands,
 *  - assigns heading ids and reports them for the table-of-contents,
 *  - decorates AI-tagged terms with an inline tap-to-explain affordance,
 *  - optionally reveals the prose word-by-word.
 * All DOM-walked so it never corrupts the HTML.
 */
export function AdaptiveArticleBody({ html, explainTerms, onExplain, reveal = false, onHeadings }: AdaptiveArticleBodyProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const onExplainRef = useRef(onExplain);
  const onHeadingsRef = useRef(onHeadings);
  useEffect(() => {
    onExplainRef.current = onExplain;
    onHeadingsRef.current = onHeadings;
  });

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.innerHTML = sanitizeHtml(html);

    // Ensure a single .article-content wrapper so the prose can be capped to a
    // readable measure while figures/code editors break out to the full column.
    let content = root.firstElementChild as HTMLElement | null;
    if (!(root.children.length === 1 && content && content.tagName === "DIV")) {
      const wrap = document.createElement("div");
      while (root.firstChild) wrap.appendChild(root.firstChild);
      root.appendChild(wrap);
      content = wrap;
    }
    content.classList.add("article-content");

    // Assign heading ids + report the outline for the table-of-contents.
    const headings: ArticleHeading[] = [];
    root.querySelectorAll<HTMLElement>("h2, h3").forEach((h, i) => {
      const text = (h.textContent || "").trim();
      if (!text) return;
      const id = slugify(text, i);
      h.id = id;
      h.style.scrollMarginTop = "90px";
      headings.push({ id, text, level: h.tagName === "H2" ? 2 : 3 });
    });
    onHeadingsRef.current?.(headings);

    // Hydrate code blocks FIRST (before term-wrap / reveal) so the walkers never
    // touch code text. Each <pre> becomes a React island (read-only or runnable).
    const codeRoots: Root[] = [];
    root.querySelectorAll("pre").forEach((pre) => {
      const codeEl = pre.querySelector("code") || pre;
      const codeText = (codeEl.textContent || "").replace(/\n$/, "");
      if (!codeText.trim()) return;
      const lang = (pre.getAttribute("data-lang") || codeEl.getAttribute("data-lang") || "").toLowerCase();
      const runnable = (pre.getAttribute("data-runnable") || "").toLowerCase() === "true";
      const mount = document.createElement("div");
      mount.className = "article-code-mount";
      pre.replaceWith(mount);
      const r = createRoot(mount);
      r.render(
        runnable
          ? <RunnableCodeBlock initialCode={codeText} language={lang} />
          : <CodeBlock code={codeText} language={lang} />,
      );
      codeRoots.push(r);
    });

    // Wrap the first occurrence of each explain term (longest first to avoid nesting).
    const terms = [...explainTerms].filter(Boolean).sort((a, b) => b.length - a.length);
    for (const term of terms) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = node.nodeValue ?? "";
        if ((node.parentElement as HTMLElement | null)?.closest(".explain-term")) continue;
        const idx = text.toLowerCase().indexOf(term.toLowerCase());
        if (idx === -1) continue;
        const span = document.createElement("span");
        span.className = "explain-term reveal-unit";
        span.dataset.term = term;
        span.textContent = text.slice(idx, idx + term.length);
        const frag = document.createDocumentFragment();
        if (idx > 0) frag.appendChild(document.createTextNode(text.slice(0, idx)));
        frag.appendChild(span);
        const rest = text.slice(idx + term.length);
        if (rest) frag.appendChild(document.createTextNode(rest));
        node.parentNode?.replaceChild(frag, node);
        break;
      }
    }

    let raf = 0;
    if (reveal) {
      // Wrap every remaining word (skip code blocks + already-wrapped terms) so
      // each becomes a reveal unit, then fade them in left-to-right.
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const v = node.nodeValue;
          if (!v || !v.trim()) return NodeFilter.FILTER_REJECT;
          const p = node.parentElement;
          if (!p || p.closest("pre, code, .reveal-unit, .article-code-mount")) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      const textNodes: Node[] = [];
      let tn: Node | null;
      while ((tn = walker.nextNode())) textNodes.push(tn);
      for (const node of textNodes) {
        const frag = document.createDocumentFragment();
        for (const part of (node.nodeValue ?? "").split(/(\s+)/)) {
          if (part === "") continue;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else {
            const w = document.createElement("span");
            w.className = "reveal-unit";
            w.textContent = part;
            frag.appendChild(w);
          }
        }
        node.parentNode?.replaceChild(frag, node);
      }

      const units = Array.from(root.querySelectorAll<HTMLElement>(".reveal-unit"));
      units.forEach((u) => (u.style.opacity = "0"));
      const step = Math.max(1, Math.ceil(units.length / (REVEAL_SECONDS * 60)));
      let i = 0;
      const tick = () => {
        for (let k = 0; k < step && i < units.length; k += 1, i += 1) units[i].style.opacity = "1";
        if (i < units.length) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    function handleClick(e: Event) {
      const target = (e.target as HTMLElement)?.closest(".explain-term") as HTMLElement | null;
      if (!target) return;
      const term = target.dataset.term || target.textContent || "";
      const context = (target.closest("p, li, td, h1, h2, h3, div") as HTMLElement | null)?.textContent || "";
      onExplainRef.current(term, target, context.slice(0, 1500));
    }
    root.addEventListener("click", handleClick);
    return () => {
      root.removeEventListener("click", handleClick);
      if (raf) cancelAnimationFrame(raf);
      // Defer unmount so it doesn't run during this commit's cleanup phase.
      setTimeout(() => codeRoots.forEach((r) => r.unmount()), 0);
    };
  }, [html, explainTerms, reveal]);

  return (
    <Box
      ref={ref}
      sx={{
        color: "var(--font-secondary)",
        lineHeight: 1.85,
        fontSize: "1.02rem",
        // Cap prose to a comfortable measure; let media/code break out to full width.
        "& .article-content > *": { maxWidth: { xs: "100%", md: 824 }, mx: "auto" },
        "& .article-content > figure, & .article-content > .article-code-mount, & .article-content > pre, & .article-content > table":
          { maxWidth: "100%" },
        "& h1, & h2, & h3, & h4": { color: "var(--font-primary)", fontWeight: 800, lineHeight: 1.3 },
        "& h2": { mt: 4, mb: 1.5, fontSize: "1.5rem" },
        "& h3": { mt: 3, mb: 1, fontSize: "1.2rem" },
        "& p": { mb: 1.6 },
        "& ul, & ol": { pl: 3, mb: 1.6 },
        "& li": { mb: 0.5 },
        "& a": { color: "var(--accent-indigo, #6366f1)" },
        "& code": {
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: "0.88em",
          bgcolor: "color-mix(in srgb, #6366f1 12%, transparent)",
          px: 0.5,
          py: "1px",
          borderRadius: 0.75,
        },
        "& pre": { borderRadius: 2, overflowX: "auto" },
        "& pre code": { bgcolor: "transparent", px: 0, py: 0 },
        "& table": { width: "100%", borderCollapse: "collapse" },
        "& figure": { my: 3 },
        "& img": { maxWidth: "100%", height: "auto", borderRadius: 3 },
        "& .reveal-unit": { transition: "opacity 0.32s ease" },
        "& .explain-term": {
          cursor: "pointer",
          textDecoration: "underline dotted",
          textUnderlineOffset: "3px",
          textDecorationColor: "color-mix(in srgb, #a855f7 70%, transparent)",
          bgcolor: "color-mix(in srgb, #a855f7 8%, transparent)",
          borderRadius: 0.5,
          px: 0.25,
          "&:hover": { bgcolor: "color-mix(in srgb, #a855f7 18%, transparent)" },
        },
      }}
    />
  );
}
