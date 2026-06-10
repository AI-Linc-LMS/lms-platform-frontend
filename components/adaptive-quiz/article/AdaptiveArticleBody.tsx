"use client";

import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { sanitizeHtml } from "./sanitizeHtml";

interface AdaptiveArticleBodyProps {
  html: string;
  /** Terms the AI marked as worth an inline "Explain this". First occurrence of
   *  each gets a dashed-underline span; clicking it calls onExplain. */
  explainTerms: string[];
  onExplain: (term: string, anchor: HTMLElement, context: string) => void;
  /** When true, the body reveals word-by-word (the "magic" reveal) each time the
   *  html changes — e.g. when a new reading tier is generated. */
  reveal?: boolean;
}

// Target wall-clock for a full reveal; per-frame step scales so long articles
// still finish in a few seconds rather than minute-long crawls.
const REVEAL_SECONDS = 3;

/**
 * Renders sanitized adaptive-article HTML, decorates AI-tagged terms with an
 * inline tap-to-explain affordance, and optionally reveals the prose
 * word-by-word (DOM-walked, so it never corrupts the HTML).
 */
export function AdaptiveArticleBody({ html, explainTerms, onExplain, reveal = false }: AdaptiveArticleBodyProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const onExplainRef = useRef(onExplain);
  useEffect(() => {
    onExplainRef.current = onExplain;
  });

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.innerHTML = sanitizeHtml(html);

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
          if (!p || p.closest("pre, code, .reveal-unit")) return NodeFilter.FILTER_REJECT;
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
    };
  }, [html, explainTerms, reveal]);

  return (
    <Box
      ref={ref}
      sx={{
        color: "var(--font-secondary)",
        lineHeight: 1.8,
        fontSize: "1rem",
        "& h1, & h2, & h3, & h4": { color: "var(--font-primary)", fontWeight: 800, lineHeight: 1.3 },
        "& p": { mb: 1.5 },
        "& ul, & ol": { pl: 3, mb: 1.5 },
        "& li": { mb: 0.5 },
        "& a": { color: "var(--accent-indigo, #6366f1)" },
        "& code": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "0.9em" },
        "& pre": { borderRadius: 2, overflowX: "auto" },
        "& table": { width: "100%", borderCollapse: "collapse" },
        "& img": { maxWidth: "100%" },
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
