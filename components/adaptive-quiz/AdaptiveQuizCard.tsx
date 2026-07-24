"use client";

import { Box, ButtonBase, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { AdaptiveCardBackdrop } from "./shared/AdaptiveCardBackdrop";

export interface AdaptiveQuizCardData {
  config_id: number;
  quiz_title: string;
  target_skills: string[];
  min_questions: number;
  max_questions: number;
  mcq_count: number;
  hint_tokens: number;
  is_personal?: boolean;
  /** True when a personal re-quiz has been completed at least once. */
  is_archived?: boolean;
  /** Latest session on the config - drives the Resume / View results CTA route. */
  latest_session_id?: string | null;
  latest_session_status?: "active" | "completed" | "abandoned" | null;
  updated_at?: string;
}

interface AdaptiveQuizCardProps {
  data: AdaptiveQuizCardData;
  onStart: () => void;
}

function prettySkill(s: string): string {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Adaptive quiz card for the learner library.
 *
 * Layout philosophy: **one focal element, breathing room, decorative backdrop**.
 * The card establishes its identity through:
 *   1. A gradient icon badge top-left.
 *   2. A dot-mesh pattern + watermark icon backdrop.
 *   3. The title as the dominant text element.
 *   4. A single meta line + one chip row - no busy stat-tile grid.
 *   5. One full-width gradient CTA.
 *
 * Two visual variants share this skeleton:
 *   - **Public adaptive**: indigo→purple accent, tune-vertical icon, "Adaptive".
 *   - **Personal re-quiz**: pink→purple accent, account-star icon, "Personal · targeted".
 */
export function AdaptiveQuizCard({ data, onStart }: AdaptiveQuizCardProps) {
  const isPersonal = Boolean(data.is_personal);
  const isArchived = Boolean(data.is_archived);
  const isActiveResume = isPersonal && !isArchived && data.latest_session_status === "active";

  // Three palettes: public adaptive (indigo), active personal re-quiz (amber -
  // signals "in flight, finish this"), archived (pink/purple - celebratory).
  const accentStart = isArchived ? "#ec4899" : isPersonal ? "#f59e0b" : "#6366f1";
  const accentEnd = isArchived ? "#a855f7" : isPersonal ? "#ec4899" : "#4338ca";
  const badgeIcon = isArchived
    ? "mdi:trophy"
    : isPersonal
      ? "mdi:account-star"
      : "mdi:tune-vertical";
  const watermarkIcon = isArchived
    ? "mdi:check-decagram"
    : isPersonal
      ? "mdi:fire"
      : "mdi:robot-happy-outline";
  const variantLabel = isArchived
    ? "Archived · completed"
    : isPersonal
      ? "Personal · in progress"
      : "Adaptive";
  const ctaLabel = isArchived
    ? "View results"
    : isActiveResume
      ? "Resume re-quiz"
      : "Start adaptive quiz";
  const ctaIcon = isArchived
    ? "mdi:eye-outline"
    : isActiveResume
      ? "mdi:play-circle-outline"
      : "mdi:flash-outline";

  return (
    <Box
      component={motion.div}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 4,
        height: "100%",
        bgcolor: "var(--card-bg)",
        // Accent-tinted border instead of the neutral one - matches the
        // BentoCard pattern where the card colour-codes itself by its content.
        border: `1px solid color-mix(in srgb, ${accentStart} 22%, transparent)`,
        boxShadow:
          "0 1px 0 0 color-mix(in srgb, white 16%, transparent) inset, 0 24px 50px -32px rgba(15, 23, 42, 0.18)",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 200ms ease, border-color 200ms ease",
        "&:hover": {
          borderColor: `color-mix(in srgb, ${accentStart} 38%, transparent)`,
          boxShadow: `0 1px 0 0 color-mix(in srgb, white 16%, transparent) inset, 0 36px 70px -32px color-mix(in srgb, ${accentStart} 30%, transparent)`,
        },
      }}
    >
      {/* Top hairline gradient strip */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${accentStart} 0%, ${accentEnd} 100%)`,
          zIndex: 2,
        }}
      />

      <AdaptiveCardBackdrop
        accent={accentStart}
        accentEnd={accentEnd}
        watermarkIcon={watermarkIcon}
      />

      {/* Content layer */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          p: { xs: 2.5, md: 2.75 },
          pt: 3,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          flex: 1,
        }}
      >
        {/* Header: gradient icon badge + variant eyebrow + quiz title.
            Title sits in the header so the card's name is unmistakable -
            the small "ADAPTIVE / PERSONAL" label above it just identifies
            the variant. */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2.25,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, ${accentStart} 0%, ${accentEnd} 100%)`,
              color: "white",
              boxShadow: `0 12px 28px -10px color-mix(in srgb, ${accentEnd} 60%, transparent)`,
              flexShrink: 0,
            }}
          >
            <Icon icon={badgeIcon} width={24} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "0.62rem",
                fontWeight: 800,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: accentStart,
                lineHeight: 1,
              }}
            >
              {variantLabel}
            </Typography>
            <Typography
              component="h3"
              sx={{
                mt: 0.6,
                fontSize: { xs: "1.25rem", md: "1.35rem" },
                fontWeight: 800,
                lineHeight: 1.22,
                letterSpacing: "-0.02em",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {data.quiz_title}
            </Typography>
          </Box>
        </Box>

        {/* Sub-skill chips - restrained, max 3 + overflow */}
        {data.target_skills.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
            {data.target_skills.slice(0, 3).map((skill) => (
              <Box
                key={skill}
                sx={{
                  px: 0.9,
                  py: 0.3,
                  borderRadius: 999,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  color: accentEnd,
                  bgcolor: `color-mix(in srgb, ${accentEnd} 9%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${accentEnd} 20%, transparent)`,
                }}
              >
                {prettySkill(skill)}
              </Box>
            ))}
            {data.target_skills.length > 3 && (
              <Box
                sx={{
                  px: 0.9,
                  py: 0.3,
                  borderRadius: 999,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  color: "text.secondary",
                  bgcolor: "color-mix(in srgb, currentColor 6%, transparent)",
                  border: "1px solid color-mix(in srgb, currentColor 18%, transparent)",
                }}
              >
                +{data.target_skills.length - 3}
              </Box>
            )}
          </Box>
        )}

        {/* Hairline separator */}
        <Box
          aria-hidden
          sx={{
            mt: "auto",
            height: 1,
            bgcolor: "color-mix(in srgb, var(--border-default) 60%, transparent)",
            mb: 0.5,
          }}
        />

        {/* Meta line - single row, all inline */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
            <Icon
              icon="mdi:format-list-numbered"
              width={14}
              style={{ color: accentStart, flexShrink: 0 }}
            />
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.primary" }}>
              {data.min_questions}–{data.max_questions} Qs
            </Typography>
          </Box>
          <Box
            aria-hidden
            sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "color-mix(in srgb, currentColor 30%, transparent)" }}
          />
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
            <Icon
              icon="mdi:lightbulb-on-outline"
              width={14}
              style={{ color: accentEnd, flexShrink: 0 }}
            />
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.primary" }}>
              {data.hint_tokens} hint{data.hint_tokens === 1 ? "" : "s"}
            </Typography>
          </Box>
        </Box>

        {/* CTA - full width gradient. Copy varies: Start / Resume / View results */}
        <ButtonBase
          onClick={onStart}
          aria-label={`${ctaLabel}: ${data.quiz_title}`}
          sx={{
            mt: 1,
            width: "100%",
            py: 1.35,
            borderRadius: 999,
            fontWeight: 800,
            color: "white",
            background: `linear-gradient(135deg, ${accentStart} 0%, ${accentEnd} 100%)`,
            boxShadow: `0 14px 30px -14px color-mix(in srgb, ${accentEnd} 70%, transparent)`,
            fontSize: "0.92rem",
            letterSpacing: "0.01em",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.75,
            "&:hover .cta-arrow": { transform: "translateX(3px)" },
            ".cta-arrow": { transition: "transform 180ms ease" },
          }}
        >
          <Icon icon={ctaIcon} width={16} />
          {ctaLabel}
          <Icon icon="mdi:arrow-right" width={18} className="cta-arrow" />
        </ButtonBase>
      </Box>
    </Box>
  );
}
