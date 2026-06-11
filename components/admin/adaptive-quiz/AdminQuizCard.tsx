"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, ButtonBase, IconButton, Switch, Tooltip, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import {
  adminAdaptiveQuizService,
  type AdminAdaptiveQuiz,
} from "@/lib/services/admin/admin-adaptive-quiz.service";
import { AdaptiveCardBackdrop } from "@/components/adaptive-quiz/shared/AdaptiveCardBackdrop";
import { AdaptiveInfoTip } from "@/components/adaptive-quiz/shared/AdaptiveInfoTip";
import { confidenceTier } from "@/lib/utils/adaptive-confidence";

interface AdminQuizCardProps {
  quiz: AdminAdaptiveQuiz;
  onAfterToggle?: (next: AdminAdaptiveQuiz) => void;
  onRequestDelete: (quiz: AdminAdaptiveQuiz) => void;
}

function prettySkill(s: string): string {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Admin-side quiz card. Mirrors the learner `AdaptiveQuizCard` layout so the
 * module reads as one product across audiences. The differences are:
 *
 *   - Inactive cards fade to 70% opacity so the admin can scan active content
 *     at a glance.
 *   - An always-visible **Active** toggle sits in the header next to the
 *     status pill.
 *   - The CTA is **Edit adaptive quiz →** (not Start) and a Delete icon
 *     button sits beside it.
 */
export function AdminQuizCard({ quiz, onAfterToggle, onRequestDelete }: AdminQuizCardProps) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(quiz.is_active);
  const [toggling, setToggling] = useState(false);

  async function handleToggle() {
    if (toggling) return;
    const previous = isActive;
    setIsActive(!previous);
    setToggling(true);
    try {
      const res = await adminAdaptiveQuizService.toggleActive(quiz.config_id);
      setIsActive(res.is_active);
      onAfterToggle?.({ ...quiz, is_active: res.is_active });
    } catch {
      setIsActive(previous);
    } finally {
      setToggling(false);
    }
  }

  const accentStart = isActive ? "#6366f1" : "#94a3b8";
  const accentEnd = isActive ? "#7c3aed" : "#475569";

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
        // Accent-tinted border matches the BentoCard chapter-2 look.
        border: `1px solid color-mix(in srgb, ${accentStart} 22%, transparent)`,
        boxShadow:
          "0 1px 0 0 color-mix(in srgb, white 16%, transparent) inset, 0 24px 50px -32px rgba(15, 23, 42, 0.18)",
        display: "flex",
        flexDirection: "column",
        opacity: isActive ? 1 : 0.7,
        transition: "opacity 220ms ease, box-shadow 220ms ease, border-color 220ms ease",
        "&:hover": {
          borderColor: `color-mix(in srgb, ${accentStart} 38%, transparent)`,
          boxShadow: isActive
            ? `0 1px 0 0 color-mix(in srgb, white 16%, transparent) inset, 0 36px 70px -32px color-mix(in srgb, ${accentStart} 30%, transparent)`
            : "0 1px 0 0 color-mix(in srgb, white 16%, transparent) inset, 0 24px 50px -32px rgba(15, 23, 42, 0.3)",
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
        watermarkIcon="mdi:atom-variant"
      />

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
        {/* Header: gradient icon badge + status eyebrow + quiz title + Active toggle.
            Title sits in the header so the card's name is unmistakable — the small
            "Adaptive · Live / Off" label above it identifies state. */}
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
            <Icon icon="mdi:brain" width={24} />
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
              {isActive ? "Adaptive · Live" : "Adaptive · Off"}
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
              {quiz.title}
            </Typography>
          </Box>
          <Tooltip title={isActive ? "Disable for learners" : "Enable for learners"} placement="top">
            <Box sx={{ flexShrink: 0, mt: -0.5 }}>
              <Switch
                checked={isActive}
                disabled={toggling}
                onChange={handleToggle}
                size="small"
                color="success"
              />
            </Box>
          </Tooltip>
        </Box>

        {/* Sub-skill chips */}
        {quiz.target_skills.length === 0 ? (
          <Typography sx={{ fontSize: "0.74rem", color: "text.secondary", fontStyle: "italic" }}>
            Skills auto-derive from the MCQ bank.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.25 }}>
            {quiz.target_skills.slice(0, 3).map((s) => (
              <Box
                key={s}
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
                {prettySkill(s)}
              </Box>
            ))}
            {quiz.target_skills.length > 3 && (
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
                +{quiz.target_skills.length - 3}
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

        {/* Meta line: bank count + session length + SE threshold */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
            <Icon icon="mdi:database-outline" width={14} style={{ color: accentStart, flexShrink: 0 }} />
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.primary" }}>
              {quiz.mcq_count} in bank
            </Typography>
          </Box>
          <Box
            aria-hidden
            sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "color-mix(in srgb, currentColor 30%, transparent)" }}
          />
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
            <Icon icon="mdi:format-list-numbered" width={14} style={{ color: accentStart, flexShrink: 0 }} />
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.primary" }}>
              {quiz.min_questions}–{quiz.max_questions} Qs
            </Typography>
          </Box>
          <Box
            aria-hidden
            sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "color-mix(in srgb, currentColor 30%, transparent)" }}
          />
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
            {(() => {
              const tier = confidenceTier(quiz.se_threshold);
              return (
                <>
                  <Icon icon={tier.icon} width={14} style={{ color: tier.accent, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.primary" }}>
                    {tier.name}
                  </Typography>
                  <AdaptiveInfoTip title="Confidence target" placement="top">
                    <p>
                      <strong>{tier.name}</strong> — {tier.blurb} {tier.typicalLength.toLowerCase()}.
                    </p>
                    <p>
                      This controls how sure the AI needs to be about a
                      student's level before ending the quiz. Tighter = longer
                      quiz, more accurate. Quicker = shorter quiz, approximate.
                    </p>
                    <p style={{ opacity: 0.7, fontSize: "0.74rem" }}>
                      The quiz still respects the min/max question limits set
                      on this assessment as safety rails.
                    </p>
                  </AdaptiveInfoTip>
                </>
              );
            })()}
          </Box>
        </Box>

        {/* Actions: Edit CTA + Delete icon */}
        <Box sx={{ mt: 1, display: "flex", gap: 1, alignItems: "stretch" }}>
          <ButtonBase
            onClick={() => router.push(`/admin/adaptive-quizzes/${quiz.config_id}/edit`)}
            sx={{
              flex: 1,
              py: 1.35,
              borderRadius: 999,
              fontWeight: 800,
              color: "white",
              background: `linear-gradient(135deg, ${accentStart} 0%, ${accentEnd} 100%)`,
              boxShadow: `0 14px 30px -14px color-mix(in srgb, ${accentEnd} 70%, transparent)`,
              fontSize: "0.9rem",
              letterSpacing: "0.01em",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.75,
              "&:hover .edit-arrow": { transform: "translateX(3px)" },
              ".edit-arrow": { transition: "transform 180ms ease" },
            }}
          >
            <Icon icon="mdi:pencil-outline" width={16} />
            Edit adaptive quiz
            <Icon icon="mdi:arrow-right" width={18} className="edit-arrow" />
          </ButtonBase>
          <Tooltip title="Delete" placement="top">
            <IconButton
              onClick={() => onRequestDelete(quiz)}
              aria-label="Delete adaptive quiz"
              sx={{
                color: "#ef4444",
                border: "1px solid color-mix(in srgb, #ef4444 30%, transparent)",
                borderRadius: 2.5,
                "&:hover": { background: "color-mix(in srgb, #ef4444 8%, transparent)" },
              }}
            >
              <Icon icon="mdi:trash-can-outline" width={18} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}
