"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { TutorDiagram } from "@/components/ai-tutor/room/TutorDiagram";
import type { DiagramSpec } from "@/components/ai-tutor/room/TutorDiagram";
import { PHONE } from "@/components/common/mobile/phone";
import { Stage, StreamLabel } from "./atmosphere";

type Artifact = { kind: string; payload: Record<string, unknown>; sequence: number };

const KIND: Record<string, { icon: string; label: string }> = {
  slide: { icon: "solar:list-check-bold", label: "Key points" },
  diagram: { icon: "solar:graph-new-bold", label: "Diagram" },
  code: { icon: "solar:code-bold", label: "Code" },
  image: { icon: "solar:gallery-bold", label: "Picture" },
  video: { icon: "solar:videocamera-record-bold", label: "Video" },
  gif: { icon: "solar:gallery-bold", label: "Clip" },
};

/** A diagram renders its own title; a slide or a snippet does not. */
function drawsItsOwnTitle(artifact: Artifact): boolean {
  return artifact.kind === "diagram" && Boolean(artifact.payload?.kind && artifact.payload?.title);
}

function titleOf(artifact: Artifact): string {
  const p = artifact.payload || {};
  const title = p.title ?? p.caption ?? p.alt ?? p.language;
  return String(title || KIND[artifact.kind]?.label || artifact.kind);
}

/**
 * Everything that went on screen, in the order it went there.
 *
 * The lesson had a shape: a slide, then a diagram, then another slide. A grid of thumbnails
 * throws that away and makes nine cards look like nine unrelated things. A rail keeps it, and
 * the connectors say what the grid could not - that these followed one another.
 *
 * One is open at a time, on the stage below, because that is how they were seen: one at a time,
 * full width, while somebody talked over them.
 */
export function ConceptStream({
  artifacts,
  aside,
}: {
  artifacts: Artifact[];
  /** Rendered beside the stage on a wide screen, below it on a narrow one. */
  aside?: ReactNode;
}) {
  const ordered = useMemo(
    () => [...artifacts].sort((a, b) => a.sequence - b.sequence),
    [artifacts]
  );
  const [openIndex, setOpenIndex] = useState(0);

  // A recap that is still being written can gain artifacts under us; never point past the end.
  useEffect(() => {
    setOpenIndex((i) => (i < ordered.length ? i : 0));
  }, [ordered.length]);

  if (!ordered.length) return null;
  const open = ordered[openIndex] ?? ordered[0];

  return (
    <Box>
      <StreamLabel
        icon="solar:structure-bold-duotone"
        text="Concept stream"
        meta={`${ordered.length} ${ordered.length === 1 ? "moment" : "moments"}`}
      />

      {/* The rail. Horizontally scrollable rather than wrapped: wrapping a sequence onto a
          second line breaks the one thing the rail is for. */}
      <Box
        role="tablist"
        aria-label="What was on screen"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          overflowX: "auto",
          pb: 1.5,
          pt: 0.5,
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": { height: 6 },
          "&::-webkit-scrollbar-thumb": {
            borderRadius: 999,
            background: "color-mix(in srgb, var(--ai-violet) 28%, transparent)",
          },
        }}
      >
        {ordered.map((artifact, i) => {
          const isOpen = i === openIndex;
          const kind = KIND[artifact.kind] ?? { icon: "solar:document-bold", label: artifact.kind };
          return (
            <Box key={`${artifact.sequence}-${i}`} sx={{ display: "flex", alignItems: "center" }}>
              {i > 0 ? <Connector lit={i <= openIndex} /> : null}
              <Box
                component="button"
                type="button"
                role="tab"
                aria-selected={isOpen}
                onClick={() => setOpenIndex(i)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  flexShrink: 0,
                  cursor: "pointer",
                  border: "1px solid",
                  borderColor: isOpen
                    ? "var(--ai-violet)"
                    : "color-mix(in srgb, var(--ai-violet) 22%, transparent)",
                  borderRadius: 999,
                  pl: 1,
                  pr: 1.75,
                  py: 0.75,
                  [PHONE]: { minHeight: 44 },
                  bgcolor: isOpen
                    ? "color-mix(in srgb, var(--ai-violet) 12%, var(--card-bg, #fff))"
                    : "var(--card-bg, #fff)",
                  boxShadow: isOpen
                    ? "0 10px 26px -16px color-mix(in srgb, var(--ai-violet) 90%, transparent)"
                    : "none",
                  transition: "border-color .2s, box-shadow .2s, background-color .2s",
                  "&:hover": { borderColor: "var(--ai-violet)" },
                  "&:focus-visible": {
                    outline: "none",
                    boxShadow: "0 0 0 2px var(--card-bg, #fff), 0 0 0 4px var(--ai-violet)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: "9px",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    color: isOpen ? "#fff" : "var(--ai-violet)",
                    background: isOpen
                      ? "linear-gradient(140deg, var(--ai-violet), var(--ai-pink, #ec4899))"
                      : "color-mix(in srgb, var(--ai-violet) 12%, transparent)",
                  }}
                >
                  <Icon icon={kind.icon} width={16} />
                </Box>
                <Box sx={{ textAlign: "start", minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: "0.6rem",
                      [PHONE]: { fontSize: "0.68rem" },
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--font-secondary)",
                      lineHeight: 1.2,
                      '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
                    }}
                  >
                    {kind.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.86rem",
                      fontWeight: 600,
                      lineHeight: 1.3,
                      maxWidth: 190,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {titleOf(artifact)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: { xs: 2, md: 2.5 },
          gridTemplateColumns: aside ? { xs: "1fr", lg: "minmax(0, 1fr) 330px" } : "1fr",
          alignItems: "start",
        }}
      >
        <Stage>
          {/* A diagram draws its own title inside the picture, so a heading here is the same
              words twice. Everything else needs one. */}
          {drawsItsOwnTitle(open) ? null : (
            <Typography
              sx={{
                color: "rgba(255,255,255,0.95)",
                fontWeight: 700,
                fontSize: { xs: "0.98rem", md: "1.05rem" },
                mb: 1.5,
              }}
            >
              {titleOf(open)}
            </Typography>
          )}
          <StageBody artifact={open} />
        </Stage>
        {aside}
      </Box>
    </Box>
  );
}

/** The line between two moments. Lit up to the one that is open, so the rail reads as progress. */
function Connector({ lit }: { lit: boolean }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: { xs: 26, md: 40 },
        height: 2,
        flexShrink: 0,
        position: "relative",
        background: lit
          ? "linear-gradient(90deg, color-mix(in srgb, var(--ai-violet) 70%, transparent), var(--ai-violet))"
          : "color-mix(in srgb, var(--ai-violet) 18%, transparent)",
        "&::after": {
          content: '""',
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: lit ? "var(--ai-violet)" : "color-mix(in srgb, var(--ai-violet) 30%, transparent)",
        },
      }}
    />
  );
}

/** Whatever this moment actually was: a diagram, a list, some code, a picture. */
function StageBody({ artifact }: { artifact: Artifact }) {
  const p = artifact.payload || {};
  const bullets = Array.isArray(p.bullets) ? (p.bullets as string[]) : [];
  const code = p.code ? String(p.code) : "";
  const url = p.url ? String(p.url) : "";
  const isDiagram = artifact.kind === "diagram" && Boolean(p.kind);

  if (isDiagram) return <TutorDiagram spec={p as unknown as DiagramSpec} />;

  if (bullets.length) {
    return (
      <Box component="ul" sx={{ m: 0, pl: 0, listStyle: "none", display: "grid", gap: 1 }}>
        {bullets.map((bullet, i) => (
          <Box key={i} component="li" sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
            <Box
              aria-hidden
              sx={{
                mt: "9px",
                width: 6,
                height: 6,
                borderRadius: "50%",
                flexShrink: 0,
                background: "var(--ai-violet)",
                boxShadow: "0 0 10px var(--ai-violet)",
              }}
            />
            <Typography
              sx={{ color: "rgba(255,255,255,0.86)", fontSize: "0.95rem", lineHeight: 1.6 }}
            >
              {bullet}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }

  if (code) {
    return (
      <Box
        component="pre"
        sx={{
          m: 0,
          color: "rgba(255,255,255,0.92)",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "0.84rem",
          lineHeight: 1.6,
          overflowX: "auto",
        }}
      >
        {code}
      </Box>
    );
  }

  if (url) {
    return (
      <Box
        component="img"
        src={url}
        alt={String(p.alt ?? "")}
        sx={{ width: "100%", maxHeight: 420, objectFit: "contain", borderRadius: "12px" }}
      />
    );
  }

  return (
    <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>
      Nothing was captured for this one.
    </Typography>
  );
}
