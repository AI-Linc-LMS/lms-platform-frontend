"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type {
  PresentationDocument,
  PresentationSlide,
} from "@/lib/services/adaptive-course.service";

/**
 * Self-contained slide-deck viewer (no slide library needed). Renders the
 * canonical slide-JSON one slide at a time on a dark stage, keyed off each
 * slide's `layout`. Keyboard ← / → / Home / End navigate; a transcript toggle
 * shows the per-slide narration. This is the in-app deck; the same document
 * drives the rendered video in Phase 2.
 */
export function PresentationViewer({ document: deck }: { document: PresentationDocument }) {
  const slides = deck.slides ?? [];
  const accent = deck.theme?.accent_hex || "#3B82F6";
  const [index, setIndex] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const count = slides.length;

  const go = useCallback(
    (next: number) => setIndex((i) => Math.max(0, Math.min(count - 1, next ?? i))),
    [count],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") go(index + 1);
      else if (e.key === "ArrowLeft") go(index - 1);
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(count - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, count, go]);

  if (count === 0) {
    return (
      <Box sx={{ p: 5, textAlign: "center", color: "text.secondary" }}>
        This presentation has no slides yet.
      </Box>
    );
  }

  const slide = slides[index];

  return (
    <Box sx={{ width: "100%" }}>
      {/* Stage */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          maxHeight: "calc(100vh - 240px)",
          borderRadius: 4,
          overflow: "hidden",
          color: "#f8fafc",
          background:
            "radial-gradient(1200px 600px at 15% -10%, #1e293b 0%, #0f172a 55%, #020617 100%)",
          boxShadow: "0 30px 80px -40px rgba(2,6,23,0.8)",
          border: "1px solid rgba(148,163,184,0.18)",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id ?? index}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            style={{ position: "absolute", inset: 0 }}
          >
            <SlideStage slide={slide} accent={accent} />
          </motion.div>
        </AnimatePresence>

        {/* Accent rail */}
        <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, background: accent }} />

        {/* Prev / Next */}
        {index > 0 && <NavButton side="left" onClick={() => go(index - 1)} />}
        {index < count - 1 && <NavButton side="right" onClick={() => go(index + 1)} />}

        {/* Slide counter */}
        <Box
          sx={{
            position: "absolute", bottom: 12, right: 16, px: 1.25, py: 0.4, borderRadius: 999,
            fontSize: "0.75rem", fontWeight: 700, color: "#e2e8f0", bgcolor: "rgba(15,23,42,0.6)",
            border: "1px solid rgba(148,163,184,0.25)",
          }}
        >
          {index + 1} / {count}
        </Box>
      </Box>

      {/* Progress dots */}
      <Stack direction="row" justifyContent="center" flexWrap="wrap" sx={{ gap: 0.75, mt: 1.75 }}>
        {slides.map((s, i) => (
          <ButtonBase
            key={s.id ?? i}
            onClick={() => go(i)}
            aria-label={`Go to slide ${i + 1}`}
            sx={{
              width: i === index ? 26 : 9, height: 9, borderRadius: 999,
              transition: "width .2s, background .2s",
              bgcolor: i === index ? accent : "color-mix(in srgb, var(--border-default, #cbd5e1) 90%, transparent)",
            }}
          />
        ))}
      </Stack>

      {/* Transcript (per-slide narration) */}
      {(slide.narration_script || "").trim() && (
        <Box sx={{ mt: 2 }}>
          <ButtonBase
            onClick={() => setShowTranscript((v) => !v)}
            sx={{ gap: 0.5, fontWeight: 700, fontSize: "0.82rem", color: "text.secondary" }}
          >
            <Icon icon={showTranscript ? "mdi:chevron-down" : "mdi:chevron-right"} width={18} />
            <Icon icon="mdi:text-to-speech" width={16} />
            {showTranscript ? "Hide narration" : "Show narration"}
          </ButtonBase>
          {showTranscript && (
            <Typography
              sx={{
                mt: 0.75, p: 1.75, borderRadius: 2, fontSize: "0.9rem", lineHeight: 1.6,
                color: "text.primary", bgcolor: "color-mix(in srgb, var(--card-bg, #f8fafc) 70%, transparent)",
                border: "1px solid color-mix(in srgb, var(--border-default, #e2e8f0) 70%, transparent)",
              }}
            >
              {slide.narration_script}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

function NavButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <ButtonBase
      onClick={onClick}
      aria-label={side === "left" ? "Previous slide" : "Next slide"}
      sx={{
        position: "absolute", top: "50%", transform: "translateY(-50%)",
        [side]: 12, width: 40, height: 40, borderRadius: "50%",
        color: "#e2e8f0", bgcolor: "rgba(15,23,42,0.55)",
        border: "1px solid rgba(148,163,184,0.3)",
        "&:hover": { bgcolor: "rgba(15,23,42,0.8)" },
      }}
    >
      <Icon icon={side === "left" ? "mdi:chevron-left" : "mdi:chevron-right"} width={26} />
    </ButtonBase>
  );
}

const CENTERED_LAYOUTS = new Set(["title", "section", "closing", "quote"]);

function SlideStage({ slide, accent }: { slide: PresentationSlide; accent: string }) {
  const centered = CENTERED_LAYOUTS.has(slide.layout);
  const mediaUrl = slide.media?.url || null;
  const mediaSide = slide.media?.position === "left" ? "left" : "right";
  const hasMedia = !!mediaUrl || slide.media?.kind === "chart" || slide.media?.kind === "diagram";
  const showMediaColumn = hasMedia && !centered && slide.media?.position !== "background";

  if (centered) {
    return (
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", p: { xs: 4, md: 8 } }}>
        {slide.layout === "section" && (
          <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, letterSpacing: 2, color: accent, mb: 1.5 }}>
            SECTION
          </Typography>
        )}
        <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.8rem", md: "2.8rem" }, lineHeight: 1.1, fontStyle: slide.layout === "quote" ? "italic" : "normal" }}>
          {slide.title}
        </Typography>
        {slide.subtitle && (
          <Typography sx={{ mt: 2, fontSize: { xs: "1rem", md: "1.25rem" }, color: "#cbd5e1", maxWidth: 800 }}>
            {slide.subtitle}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", p: { xs: 3, md: 6 } }}>
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.4rem", md: "2rem" }, lineHeight: 1.15 }}>
          {slide.title}
        </Typography>
        {slide.subtitle && (
          <Typography sx={{ mt: 0.5, fontSize: { xs: "0.95rem", md: "1.1rem" }, color: "#94a3b8" }}>
            {slide.subtitle}
          </Typography>
        )}
        <Box sx={{ width: 56, height: 4, borderRadius: 999, background: accent, mt: 1.5 }} />
      </Box>

      <Box
        sx={{
          flex: 1, minHeight: 0, display: "grid", gap: { xs: 2, md: 4 }, alignItems: "center",
          gridTemplateColumns: showMediaColumn ? { xs: "1fr", md: mediaSide === "left" ? "1fr 1.2fr" : "1.2fr 1fr" } : "1fr",
          overflow: "hidden",
        }}
      >
        {showMediaColumn && mediaSide === "left" && <MediaArea slide={slide} accent={accent} url={mediaUrl} />}

        <Box sx={{ minWidth: 0, overflow: "auto", maxHeight: "100%" }}>
          {slide.bullets?.length > 0 && (
            <Stack spacing={1.25}>
              {slide.bullets.map((b, i) => (
                <Stack key={i} direction="row" spacing={1.25} alignItems="flex-start" sx={{ pl: (b.level || 0) * 2.5 }}>
                  <Box sx={{ mt: "9px", flexShrink: 0, width: b.level ? 6 : 8, height: b.level ? 6 : 8, borderRadius: "50%", background: accent, opacity: b.level ? 0.6 : 1 }} />
                  <Typography sx={{ fontSize: { xs: "0.95rem", md: b.level ? "1rem" : "1.15rem" }, lineHeight: 1.45, color: b.level ? "#cbd5e1" : "#f1f5f9" }}>
                    {b.text}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}

          {slide.body_markdown && (
            <Box sx={{ mt: slide.bullets?.length ? 2 : 0, fontSize: "1rem", lineHeight: 1.6, color: "#e2e8f0", "& a": { color: accent }, "& code": { background: "rgba(148,163,184,0.18)", px: 0.5, borderRadius: 1 } }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{slide.body_markdown}</ReactMarkdown>
            </Box>
          )}

          {slide.code?.source && <CodeBlock language={slide.code.language} source={slide.code.source} accent={accent} />}
        </Box>

        {showMediaColumn && mediaSide !== "left" && <MediaArea slide={slide} accent={accent} url={mediaUrl} />}
      </Box>
    </Box>
  );
}

function MediaArea({ slide, accent, url }: { slide: PresentationSlide; accent: string; url: string | null }) {
  if (url) {
    return (
      <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={slide.media?.alt || ""}
          style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 12, objectFit: "contain", boxShadow: "0 18px 40px -20px rgba(0,0,0,0.6)" }}
        />
      </Box>
    );
  }
  // Phase 1: chart/diagram media has no raster yet — show a tasteful placeholder
  // from the brief (real, accurate charts arrive with the Phase 2 renderer).
  return (
    <Box
      sx={{
        height: "100%", minHeight: 140, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 1, p: 3, textAlign: "center", borderRadius: 3,
        border: `1px dashed color-mix(in srgb, ${accent} 50%, transparent)`,
        bgcolor: "rgba(148,163,184,0.08)",
      }}
    >
      <Icon icon={slide.media?.kind === "diagram" ? "mdi:sitemap-outline" : "mdi:chart-line"} width={34} style={{ color: accent }} />
      <Typography sx={{ fontSize: "0.85rem", color: "#cbd5e1", maxWidth: 320 }}>
        {slide.media?.alt || slide.media?.image_brief || "Visual"}
      </Typography>
    </Box>
  );
}

function CodeBlock({ language, source, accent }: { language: string; source: string; accent: string }) {
  return (
    <Box sx={{ mt: 2, borderRadius: 2, overflow: "hidden", border: "1px solid rgba(148,163,184,0.25)" }}>
      <Box sx={{ px: 1.5, py: 0.5, fontSize: "0.7rem", fontWeight: 700, letterSpacing: 1, color: accent, bgcolor: "rgba(2,6,23,0.6)", textTransform: "uppercase" }}>
        {language || "code"}
      </Box>
      <Box
        component="pre"
        sx={{
          m: 0, p: 1.75, overflow: "auto", maxHeight: 280, fontSize: "0.85rem", lineHeight: 1.5,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", color: "#e2e8f0", bgcolor: "rgba(2,6,23,0.75)",
        }}
      >
        <code>{source}</code>
      </Box>
    </Box>
  );
}
