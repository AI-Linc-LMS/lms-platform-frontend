"use client";

import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { CanvasCard } from "@/lib/hooks/useRealtimeTutor";
import { TutorDiagram, type DiagramSpec } from "./TutorDiagram";

/**
 * The tutor's stage: what it puts up while it talks.
 *
 * The rule the whole design rests on is that **the canvas carries structure and the voice
 * carries meaning**. Anything the tutor would otherwise spell out, list or describe
 * structurally lands here instead, which is why the instructions tell it never to read a
 * card aloud.
 *
 * Cards are appended, and the newest is the focus. Older ones stay visible above it, so a
 * learner can glance back at the diagram from two minutes ago without asking.
 */

function CardShell({
  icon,
  label,
  children,
  active,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <Box
      sx={{
        borderRadius: "var(--radius-card)",
        border: "1px solid",
        borderColor: active ? "rgba(168,85,247,0.75)" : "rgba(255,255,255,0.14)",
        bgcolor: "rgba(255,255,255,0.045)",
        overflow: "hidden",
        opacity: active ? 1 : 0.62,
        transition: "opacity 200ms ease, border-color 200ms ease",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 1,
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <Icon
          icon={icon}
          width={15}
          height={15}
          style={{ color: "rgba(255,255,255,0.62)" }}
        />
        <Typography
          sx={{
            fontSize: "0.76rem",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.68)",
          }}
        >
          {label}
        </Typography>
      </Box>
      <Box sx={{ p: { xs: 2, md: 2.5 } }}>{children}</Box>
    </Box>
  );
}

function SlideCard({ payload }: { payload: Record<string, unknown> }) {
  const bullets = Array.isArray(payload.bullets) ? (payload.bullets as string[]) : [];
  return (
    <Box>
      <Typography sx={{ fontSize: "1.15rem", fontWeight: 600, mb: 1.5, color: "#fff" }}>
        {String(payload.title ?? "")}
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 0, listStyle: "none" }}>
        {bullets.map((bullet, i) => (
          <Box
            component="li"
            key={i}
            sx={{ display: "flex", gap: 1.25, alignItems: "flex-start", mb: 1 }}
          >
            <Box
              sx={{
                mt: "7px",
                width: 5,
                height: 5,
                borderRadius: "50%",
                bgcolor: "#a855f7",
                flexShrink: 0,
              }}
            />
            <Typography sx={{ fontSize: "0.95rem", lineHeight: 1.55, color: "rgba(255,255,255,0.9)" }}>{bullet}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function CodeCard({ payload }: { payload: Record<string, unknown> }) {
  const code = String(payload.code ?? "");
  const highlight = Array.isArray(payload.highlight_lines)
    ? (payload.highlight_lines as number[])
    : [];
  const lines = code.split("\n");
  return (
    <Box>
      {payload.caption ? (
        <Typography sx={{ fontSize: "0.86rem", color: "rgba(255,255,255,0.68)", mb: 1.25 }}>
          {String(payload.caption)}
        </Typography>
      ) : null}
      <Box
        sx={{
          borderRadius: "10px",
          bgcolor: "var(--night, #140b2b)",
          overflowX: "auto",
          py: 1.5,
        }}
      >
        {lines.map((line, i) => {
          const isHot = highlight.includes(i + 1);
          return (
            <Box
              key={i}
              sx={{
                display: "flex",
                px: 1.5,
                bgcolor: isHot ? "rgba(124,58,237,0.28)" : "transparent",
                borderLeft: "2px solid",
                borderColor: isHot ? "var(--ai-violet)" : "transparent",
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 28,
                  flexShrink: 0,
                  textAlign: "right",
                  pr: 1.5,
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.88rem",
                  lineHeight: 1.65,
                  userSelect: "none",
                }}
              >
                {i + 1}
              </Box>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  color: "rgba(255,255,255,0.92)",
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.87rem",
                  lineHeight: 1.65,
                  whiteSpace: "pre",
                }}
              >
                {line || " "}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function ImageCard({ payload }: { payload: Record<string, unknown> }) {
  return (
    <Box>
      {/* A plain img, never next/image: these are arbitrary third-party URLs and the
          optimizer silently drops hosts it cannot handle. */}
      <Box
        component="img"
        src={String(payload.url ?? "")}
        alt={String(payload.alt ?? "")}
        sx={{
          width: "100%",
          maxHeight: 340,
          objectFit: "cover",
          borderRadius: "10px",
          display: "block",
        }}
      />
      <Typography
        sx={{ fontSize: "0.87rem", color: "rgba(255,255,255,0.68)", mt: 1 }}
      >
        {String(payload.caption || payload.alt || "")}
        {payload.attribution ? ` · ${String(payload.attribution)}` : ""}
      </Typography>
    </Box>
  );
}

export function CanvasStage({ cards }: { cards: CanvasCard[] }) {
  if (!cards.length) {
    return (
      <Box
        sx={{
          height: "100%",
          minHeight: 220,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          px: 3,
        }}
      >
        <Box>
          <Icon
            icon="solar:presentation-graph-bold-duotone"
            width={40}
            height={40}
            style={{ color: "rgba(255,255,255,0.2)" }}
          />
          <Typography sx={{ mt: 1.5, fontSize: "0.9rem", color: "rgba(255,255,255,0.55)" }}>
            Diagrams, examples and code will appear here as you talk.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Newest first, matching the caption and the conversation panel.

          The tutor puts a card up mid-sentence and then talks about it, so the one it is
          describing right now is the one that just arrived. Appending it to the bottom meant the
          learner had to scroll down every time a diagram or image appeared, while the thing being
          discussed sat off-screen. Reversing it keeps the current card in the same place - the
          top - and pushes the history down instead. */}
      {[...cards].reverse().map((card, index) => {
        const active = index === 0;
        switch (card.kind) {
          case "slide":
            return (
              <CardShell key={card.id} icon="solar:list-bold-duotone" label="Key points" active={active}>
                <SlideCard payload={card.payload} />
              </CardShell>
            );
          case "code":
            return (
              <CardShell key={card.id} icon="solar:code-bold-duotone" label={String(card.payload.language ?? "Code")} active={active}>
                <CodeCard payload={card.payload} />
              </CardShell>
            );
          case "diagram":
            return (
              <CardShell key={card.id} icon="solar:sitemap-bold-duotone" label="Diagram" active={active}>
                <TutorDiagram spec={card.payload as unknown as DiagramSpec} />
              </CardShell>
            );
          case "image":
            return (
              <CardShell key={card.id} icon="solar:gallery-bold-duotone" label="Image" active={active}>
                <ImageCard payload={card.payload} />
              </CardShell>
            );
          default:
            return null;
        }
      })}
    </Box>
  );
}
