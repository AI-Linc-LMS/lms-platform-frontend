"use client";

import { Box, ButtonBase, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { gridStagger, fadeRise } from "@/components/scorecard/shared/motion";
import { AIPill } from "../shared/AIPill";
import type { AdaptiveAINarration } from "@/lib/types/adaptive-quiz";

type RemediationStep = AdaptiveAINarration["remediation_path"][number];

interface RemediationPathCardProps {
  steps: AdaptiveAINarration["remediation_path"];
  onStartPath?: () => void;
}

const ACTION_ICON: Record<string, string> = {
  read: "mdi:book-open-page-variant-outline",
  watch: "mdi:play-circle-outline",
  practice: "mdi:dumbbell",
};

const ACTION_VERB: Record<string, string> = {
  read: "Read",
  watch: "Watch",
  practice: "Practice",
};

function prettySkill(s: string): string {
  if (!s) return "General";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Deep-link to the real course item a step maps to, or null when the step is a
 *  re-quiz (handled by onStartPath) or carries no link metadata. */
function stepHref(step: RemediationStep): string | null {
  if (step.content_type === "article" && step.course_id && step.submodule_id && step.article_id) {
    return `/adaptive-courses/${step.course_id}/submodule/${step.submodule_id}/article/${step.article_id}`;
  }
  if ((step.content_type === "video" || step.content_type === "coding") && step.course_id && step.submodule_id) {
    return `/adaptive-courses/${step.course_id}/submodule/${step.submodule_id}`;
  }
  return null;
}

export function RemediationPathCard({ steps, onStartPath }: RemediationPathCardProps) {
  const router = useRouter();
  if (!steps.length) {
    return null;
  }
  const totalMinutes = steps.reduce((acc, s) => acc + (s.est_minutes ?? 5), 0);
  const openStep = (step: RemediationStep) => {
    const href = stepHref(step);
    if (href) router.push(href);
    else onStartPath?.(); // re-quiz / no link → spawn the targeted re-quiz
  };
  return (
    <Box
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: 4,
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(135deg, color-mix(in srgb, #6366f1 14%, transparent) 0%, color-mix(in srgb, #a855f7 14%, transparent) 100%)",
        border: "1px solid color-mix(in srgb, #a855f7 32%, transparent)",
        backdropFilter: "blur(18px) saturate(140%)",
        boxShadow: "0 24px 60px -32px rgba(168, 85, 247, 0.4)",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "radial-gradient(circle, #ec4899 0%, transparent 70%)",
          opacity: 0.35,
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
      />
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <AIPill variant="solid" icon={<Icon icon="mdi:road" width={12} color="white" />}>
            Your next {totalMinutes} minutes
          </AIPill>
          <Typography sx={{ fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.015em", mt: 0.75 }}>
            A path picked for your weak spots.
          </Typography>
        </Box>
      </Box>

      <Box
        component={motion.div}
        variants={gridStagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}
      >
        {steps.map((step) => (
          <Box
            key={step.step}
            component={motion.div}
            variants={fadeRise}
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
              p: 1.5,
              borderRadius: 3,
              bgcolor: "color-mix(in srgb, white 60%, transparent)",
              border: "1px solid color-mix(in srgb, #a855f7 18%, transparent)",
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                color: "white",
                flexShrink: 0,
              }}
            >
              <Icon icon={ACTION_ICON[step.action_kind] ?? "mdi:book-open-page-variant-outline"} width={18} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: "0.95rem", fontWeight: 800, color: "text.primary", lineHeight: 1.3 }}>
                Step {step.step} · {step.title}
              </Typography>
              <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", lineHeight: 1.5, mt: 0.5 }}>
                {step.why}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 0.75, flexWrap: "wrap" }}>
                <Chip label={`${step.est_minutes} min`} />
                <Chip label={prettySkill(step.target_skill)} />
                <Chip label={step.action_kind.toUpperCase()} accent />
              </Box>
            </Box>
            <ButtonBase
              onClick={() => openStep(step)}
              sx={{
                alignSelf: "center",
                flexShrink: 0,
                px: 1.75,
                py: 0.8,
                borderRadius: 999,
                fontWeight: 800,
                fontSize: "0.8rem",
                gap: 0.5,
                color: "#7c3aed",
                bgcolor: "color-mix(in srgb, #a855f7 14%, white)",
                border: "1px solid color-mix(in srgb, #a855f7 35%, transparent)",
                "&:hover": { bgcolor: "color-mix(in srgb, #a855f7 22%, white)" },
              }}
            >
              <Icon icon={ACTION_ICON[step.action_kind] ?? "mdi:arrow-right"} width={15} />
              {ACTION_VERB[step.action_kind] ?? "Open"}
            </ButtonBase>
          </Box>
        ))}
      </Box>

      <ButtonBase
        onClick={() => openStep(steps[0])}
        disabled={!onStartPath}
        sx={{
          alignSelf: "flex-end",
          mt: 0.5,
          px: 3,
          py: 1.4,
          borderRadius: 999,
          fontWeight: 800,
          color: "white",
          background: "linear-gradient(135deg, #6366f1 0%, #a855f7 60%, #ec4899 100%)",
          boxShadow: "0 14px 30px -14px rgba(168, 85, 247, 0.55)",
          fontSize: "0.92rem",
          "&:hover": { transform: "translateY(-1px)" },
          transition: "transform 120ms ease",
          "&:disabled": { opacity: 0.7 },
        }}
      >
        Start your remediation path →
      </ButtonBase>
    </Box>
  );
}

function Chip({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <Box
      sx={{
        px: 1,
        py: 0.3,
        borderRadius: 999,
        fontSize: "0.66rem",
        fontWeight: 800,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        bgcolor: accent ? "color-mix(in srgb, #a855f7 18%, transparent)" : "color-mix(in srgb, currentColor 10%, transparent)",
        color: accent ? "#a855f7" : "text.secondary",
        border: "1px solid color-mix(in srgb, currentColor 18%, transparent)",
      }}
    >
      {label}
    </Box>
  );
}
