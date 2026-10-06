"use client";

/**
 * The top of a course page: what it is, who is on it, and the one button that resumes it.
 *
 * Moved out of `JourneyBoard.tsx` when the board became a spine. Unchanged otherwise.
 */

import { useTranslation } from "react-i18next";
import { Box, ButtonBase, Chip, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { courseCta } from "@/lib/adaptive/courseCta";
import { PHONE } from "@/components/common/mobile/phone";
import type { JourneyBoard as JourneyBoardData } from "@/lib/types/adaptive-journey";
import { fmtLongDate } from "./spine/dates";

export function JourneyHero({ board, courseId }: { board: JourneyBoardData; courseId: number }) {
  const { push, prefetch } = useInstantNavigation();
  const { t } = useTranslation();
  const c = board.course;
  const subject = c.title.split(/[—-]/)[0].trim() || "Course";

  // The one button on this page. What it promises, and where it goes, is decided by
  // lib/adaptive/courseCta.ts - the SAME resolver the dashboard's course card uses, fed the
  // same server-derived `calibration` state. It used to be worked out here alone, and only
  // routed to the calibration when there happened to be no unlocked topic at all; a learner
  // whose entry topic was open still read "Resume learning" on a course they had not begun,
  // and the dashboard - which had no calibration data of its own - could not even try.
  const nodes = board.weeks.flatMap((w) => w.nodes);
  const current = nodes.find((n) => n.status === "current" && n.ref.submoduleId);
  const firstTopic = nodes.find((n) => n.type === "topic" && n.ref.submoduleId && n.status !== "locked");
  const resumeSub = current?.ref.submoduleId ?? firstTopic?.ref.submoduleId ?? null;
  const cta = courseCta({
    courseId,
    calibration: board.calibration,
    resumeSubmoduleId: resumeSub,
    completionPct: c.completionPct,
  });
  const resumeLabel = `${t(cta.labelKey)} →`;
  // Dead only when there is neither a calibration to sit nor a step to open.
  const resumeDisabled = !cta.toCalibration && !resumeSub;
  const resumeHref = resumeDisabled ? null : cta.href;
  const meta: { icon: string; label: string }[] = [];
  if (c.startedAt) meta.push({ icon: "mdi:calendar-check", label: `Started ${fmtLongDate(c.startedAt)}` });
  meta.push({ icon: "mdi:account-group", label: `${c.enrolledCount} enrolled` });
  meta.push({ icon: "mdi:certificate-outline", label: `Certificate on ${c.certificateThreshold}%` });
  if (c.estHours) meta.push({ icon: "mdi:clock-outline", label: `~${c.estHours} hrs` });

  return (
    <Box sx={{ borderRadius: 5, p: { xs: 2.5, md: 3.5 }, mb: 2.5, color: "white", position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #1b0f38 0%, #2d1659 48%, #46146b 100%)", boxShadow: "0 24px 60px -28px var(--module-hero-shadow, rgba(124,58,237,0.6))" }}>
      {/* A soft brand bloom in the corner, so the dark panel reads as the product's rather
          than as a generic dark card. */}
      <Box aria-hidden sx={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(70% 90% at 100% 0%, rgba(192,38,211,0.35) 0%, transparent 60%), radial-gradient(60% 80% at 0% 100%, rgba(99,102,241,0.3) 0%, transparent 55%)" }} />
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ position: "relative" }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          {/* The course title is the heading right below; on a phone the breadcrumb only repeated it. */}
          <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.7)", mb: 1, [PHONE]: { display: "none" } }}>‹ My Courses / {c.title}</Typography>
          <Stack direction="row" spacing={0.75} sx={{ mb: 1, [PHONE]: { flexWrap: "wrap", rowGap: 0.75 } }}>
            <Chip label={subject} size="small" sx={{ fontWeight: 700, color: "white", bgcolor: "rgba(255,255,255,0.18)" }} />
            <Chip icon={<Icon icon="mdi:certificate" width={14} color="white" />} label="Certified track" size="small" sx={{ fontWeight: 700, color: "white", bgcolor: "rgba(255,255,255,0.18)", "& .MuiChip-icon": { color: "white" } }} />
          </Stack>
          <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.7rem", md: "2.2rem" }, lineHeight: 1.1, [PHONE]: { fontSize: "1.5rem", lineHeight: 1.15, overflowWrap: "anywhere" } }}>{c.title}</Typography>
          {c.description && (
            /* Full width. The 980px cap left the description ending mid-header on a wide screen
               while the hero it sits in ran the whole container, which read as a layout bug rather
               than a reading-width choice. The flex parent already bounds it. */
            <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.82)", mt: 1, maxWidth: "100%", lineHeight: 1.5 }}>{c.description}</Typography>
          )}
          <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mt: 1.75 }}>
            {meta.map((m) => (
              <Stack key={m.label} direction="row" spacing={0.5} alignItems="center" sx={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.85)" }}>
                <Icon icon={m.icon} width={15} />
                {m.label}
              </Stack>
            ))}
          </Stack>
        </Box>
        {/* No progress panel here. A ring and three counters were tried in the hero and taken
            out: at hero scale the "N% COMPLETE" label sat dark-on-dark and was barely legible,
            and the numbers already have a home in the side rail's "Your Progress" card, where
            they are readable and not competing with the course title. */}
      </Stack>

      {/* AI-tuned banner */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }} justifyContent="space-between" sx={{ mt: 2.5, p: 2, borderRadius: 3, bgcolor: "rgba(0,0,0,0.18)", border: "1px solid rgba(255,255,255,0.15)" }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "rgba(255,255,255,0.15)", flexShrink: 0 }}>
            <Icon icon="mdi:auto-fix" width={20} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              {/* "AI has tuned this" is false on a roadmap-built course: it is assembled from
                  verified bank rows by a deterministic resolver, with no model in the loop. */}
              <Typography sx={{ fontWeight: 800, fontSize: "0.92rem" }}>
                {board.calibration.card
                  ? "AI has tuned this course to you"
                  : "Built for you from the verified library"}
              </Typography>
              {c.fieldTier && <Chip label={`LEVEL · ${c.fieldTier.toUpperCase()}`} size="small" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 800, color: "#7c3aed", bgcolor: "white", [PHONE]: { height: 22, fontSize: "0.75rem" } }} />}
            </Stack>
            <Typography sx={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.8)", mt: 0.25, lineHeight: 1.45, [PHONE]: { fontSize: "0.8rem" } }}>
              {/* A course with no calibration card will never have one (roadmap-built courses
                  have no admin to configure it), so neither "retake it" nor "complete it" is a
                  thing the learner can do. The banner keeps its Resume button and drops the
                  instruction. */}
              {!board.calibration.card
                ? "Assembled for you from the verified library, so every question here was written and reviewed before it reached you."
                : c.fieldTier
                  ? "Based on your calibration baseline, quizzes start at the right difficulty and articles open at your reading tier. Retake the calibration anytime to recalibrate."
                  : "Complete the calibration assessment and the course retunes itself - quizzes start at the right difficulty and articles open at your reading tier."}
            </Typography>
          </Box>
        </Stack>
        <ButtonBase
          disabled={resumeDisabled}
          onMouseEnter={() => resumeHref && prefetch(resumeHref)}
          onClick={() => resumeHref && push(resumeHref)}
          sx={{
            flexShrink: 0, px: 2.25, py: 1, borderRadius: 2, fontWeight: 800, fontSize: "0.82rem", color: "#7c3aed", bgcolor: "white", "&.Mui-disabled": { opacity: 0.5 },
            // The page's primary action: full width and 48px on a phone, not a 34px chip.
            [PHONE]: { width: "100%", minHeight: 48, fontSize: "0.95rem", borderRadius: 2.5 },
          }}
        >
          {resumeLabel}
        </ButtonBase>
      </Stack>
    </Box>
  );
}
