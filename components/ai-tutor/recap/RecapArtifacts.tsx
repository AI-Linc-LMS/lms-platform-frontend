"use client";

import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { TutorSurface } from "../shared/surfaces";

/**
 * What went on the canvas, as a filmstrip.
 *
 * The recap endpoint has always returned these and the page threw them away, which meant the
 * slides, diagrams and images the tutor put up during the lesson existed only for as long as
 * the lesson did. They are the most concrete thing a voice session produces, so they get a
 * strip you can scan and click into rather than being re-rendered full size down the page.
 *
 * Deliberately not a re-implementation of `CanvasStage`. That component is dark-ground,
 * animated and sized for a stage; here the same payloads need a light thumbnail. Sharing it
 * would have meant a component with two visual modes and no clear owner.
 */

interface Artifact {
  kind: string;
  payload: Record<string, unknown>;
  sequence: number;
}

const KIND_META: Record<string, { icon: string; label: string }> = {
  slide: { icon: "solar:list-bold-duotone", label: "Key points" },
  code: { icon: "solar:code-bold-duotone", label: "Code" },
  diagram: { icon: "solar:sitemap-bold-duotone", label: "Diagram" },
  image: { icon: "solar:gallery-bold-duotone", label: "Image" },
  video: { icon: "solar:video-frame-play-horizontal-bold-duotone", label: "Video" },
  gif: { icon: "solar:gallery-bold-duotone", label: "Animation" },
};

function titleOf(artifact: Artifact): string {
  const p = artifact.payload || {};
  const candidate = p.title ?? p.caption ?? p.alt ?? p.language ?? p.kind;
  return String(candidate ?? KIND_META[artifact.kind]?.label ?? artifact.kind);
}

export function RecapArtifacts({ artifacts }: { artifacts: Artifact[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!artifacts.length) return null;

  const open = openIndex === null ? null : artifacts[openIndex];

  return (
    <Box>
      {/* Horizontal scroll, so a twenty-card lesson does not turn into a twenty-card grid
          that buries everything below it. */}
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          overflowX: "auto",
          pb: 1,
          // Bleed to the container edge so a partly-visible card signals more to the side.
          scrollSnapType: "x proximity",
          "&::-webkit-scrollbar": { height: 6 },
          "&::-webkit-scrollbar-thumb": {
            background: "var(--border-default)",
            borderRadius: 9999,
          },
        }}
      >
        {artifacts.map((artifact, i) => {
          const meta = KIND_META[artifact.kind] ?? {
            icon: "solar:file-bold-duotone",
            label: artifact.kind,
          };
          const url = artifact.payload?.url ? String(artifact.payload.url) : "";
          const active = openIndex === i;
          return (
            <TutorSurface
              key={`${artifact.sequence}-${i}`}
              interactive
              padded={false}
              onClick={() => setOpenIndex(active ? null : i)}
              sx={{
                width: 210,
                flexShrink: 0,
                overflow: "hidden",
                scrollSnapAlign: "start",
                borderColor: active ? "var(--ai-violet)" : "var(--border-default)",
              }}
            >
              {url ? (
                // A plain img, never next/image: these are arbitrary third-party URLs and
                // the optimizer silently drops hosts it cannot handle.
                <Box
                  component="img"
                  src={url}
                  alt={String(artifact.payload?.alt ?? "")}
                  sx={{
                    width: "100%",
                    height: 104,
                    objectFit: "cover",
                    display: "block",
                    borderBottom: "1px solid var(--border-default)",
                  }}
                />
              ) : (
                <Box
                  sx={{
                    height: 104,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "color-mix(in srgb, var(--ai-violet) 6%, transparent)",
                    borderBottom: "1px solid var(--border-default)",
                  }}
                >
                  <Icon
                    icon={meta.icon}
                    width={26}
                    style={{ color: "var(--ai-violet)", opacity: 0.75 }}
                  />
                </Box>
              )}
              <Box sx={{ p: 1.5 }}>
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--font-secondary)",
                    mb: 0.35,
                    '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
                  }}
                >
                  {meta.label}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.86rem",
                    fontWeight: 500,
                    lineHeight: 1.35,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {titleOf(artifact)}
                </Typography>
              </Box>
            </TutorSurface>
          );
        })}
      </Box>

      {open ? <ArtifactDetail artifact={open} /> : null}
    </Box>
  );
}

/** The expanded card, rendered below the strip rather than in a modal. */
function ArtifactDetail({ artifact }: { artifact: Artifact }) {
  const p = artifact.payload || {};
  const bullets = Array.isArray(p.bullets) ? (p.bullets as string[]) : [];
  const code = p.code ? String(p.code) : "";
  const url = p.url ? String(p.url) : "";

  return (
    <TutorSurface sx={{ mt: 1.5 }}>
      <Typography sx={{ fontSize: "1rem", fontWeight: 500, mb: bullets.length || code ? 1.25 : 0 }}>
        {titleOf(artifact)}
      </Typography>

      {bullets.length ? (
        <Box component="ul" sx={{ m: 0, pl: 2.5, display: "grid", gap: 0.6 }}>
          {bullets.map((bullet, i) => (
            <Typography
              key={i}
              component="li"
              sx={{ fontSize: "0.9rem", lineHeight: 1.5, color: "var(--font-secondary)" }}
            >
              {bullet}
            </Typography>
          ))}
        </Box>
      ) : null}

      {code ? (
        <Box
          component="pre"
          sx={{
            m: 0,
            p: 1.5,
            borderRadius: "8px",
            bgcolor: "#140b2b",
            color: "rgba(255,255,255,0.92)",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "0.82rem",
            lineHeight: 1.55,
            overflowX: "auto",
          }}
        >
          {code}
        </Box>
      ) : null}

      {url && !code && !bullets.length ? (
        <Box
          component="img"
          src={url}
          alt={String(p.alt ?? "")}
          sx={{ width: "100%", maxHeight: 380, objectFit: "contain", borderRadius: "8px" }}
        />
      ) : null}

      {p.caption ? (
        <Typography sx={{ fontSize: "0.85rem", color: "var(--font-secondary)", mt: 1.25 }}>
          {String(p.caption)}
        </Typography>
      ) : null}
    </TutorSurface>
  );
}
