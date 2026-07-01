"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { gridStagger, fadeRise } from "@/components/scorecard/shared/motion";
import { AIPill } from "../shared/AIPill";
import { adaptiveQuizService } from "@/lib/services/adaptive-quiz.service";
import type { AdaptiveAINarration, RemediationProgress } from "@/lib/types/adaptive-quiz";

type RemediationStep = AdaptiveAINarration["remediation_path"][number];

interface RemediationPathCardProps {
  steps: AdaptiveAINarration["remediation_path"];
  /** The source session — used to read live step-completion + spawn the re-quiz. */
  sessionId?: string;
  onStartPath?: () => void;
}

const ACTION_ICON: Record<string, string> = {
  read: "mdi:book-open-page-variant-outline",
  watch: "mdi:play-circle-outline",
  practice: "mdi:dumbbell",
  requiz: "mdi:tune-vertical",
};

const ACTION_VERB: Record<string, string> = {
  read: "Read",
  watch: "Watch",
  practice: "Practice",
  requiz: "Take quiz",
};

function prettySkill(s: string): string {
  if (!s) return "General";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const isRequiz = (step: RemediationStep) =>
  step.content_type === "requiz" || step.action_kind === "requiz";

/** Deep-link to the EXACT course item a step maps to, or null when it's the follow-up
 *  re-quiz (spawned via onStartPath). Video/article link straight to the item; only when the
 *  specific id is missing do we fall back to the submodule page. */
function stepHref(step: RemediationStep): string | null {
  if (isRequiz(step)) return null;
  if (step.content_type === "article" && step.course_id && step.submodule_id && step.article_id) {
    return `/adaptive-courses/${step.course_id}/submodule/${step.submodule_id}/article/${step.article_id}`;
  }
  if (step.content_type === "video" && step.course_id && step.submodule_id && step.content_id) {
    return `/adaptive-courses/${step.course_id}/submodule/${step.submodule_id}/video/${step.content_id}`;
  }
  if ((step.content_type === "video" || step.content_type === "article") && step.course_id && step.submodule_id) {
    return `/adaptive-courses/${step.course_id}/submodule/${step.submodule_id}`;
  }
  return null;
}

export function RemediationPathCard({ steps, sessionId, onStartPath }: RemediationPathCardProps) {
  const router = useRouter();
  const [progress, setProgress] = useState<RemediationProgress | null>(null);

  // Pull live completion + re-fetch when the tab regains focus, so finishing a step in another
  // tab (or returning from the article/video) ticks it done without a manual refresh.
  const refresh = useCallback(() => {
    if (!sessionId) return;
    adaptiveQuizService.getRemediationProgress(sessionId).then(setProgress).catch(() => {});
  }, [sessionId]);

  useEffect(() => {
    refresh();
    const onVis = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  if (!steps.length) return null;

  const doneByStep: Record<number, boolean> = {};
  for (const s of progress?.steps ?? []) doneByStep[s.step] = s.done;
  const contentDone = progress?.content_done ?? false;
  const requizSessionId = progress?.requiz.session_id ?? null;
  const requizActive = progress?.requiz.status === "active";
  // Lock the re-quiz only once we KNOW content isn't done (avoids a flicker before load).
  const requizLocked = progress !== null && !contentDone;

  const totalMinutes = steps.reduce((acc, s) => acc + (s.est_minutes ?? 5), 0);
  const allDone = !!progress && steps.every((s) => doneByStep[s.step]);
  const firstActionable = steps.find((s) => !doneByStep[s.step] && (!isRequiz(s) || contentDone));

  const openRequiz = () => {
    if (requizActive && requizSessionId) router.push(`/adaptive-quizzes/session/${requizSessionId}`);
    else onStartPath?.();
  };
  const openStep = (step: RemediationStep) => {
    if (isRequiz(step)) { openRequiz(); return; }
    const href = stepHref(step);
    // A hrefless content step is an informational note (standalone-quiz fallback) — there's
    // nothing to open, and it must NOT fall through to spawning a re-quiz (that mis-fired a
    // "re-quizzes can't be re-quizzed" error when the source was itself a re-quiz).
    if (href) router.push(href);
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
          position: "absolute", top: -80, right: -80, width: 220, height: 220, borderRadius: "50%",
          background: "radial-gradient(circle, #ec4899 0%, transparent 70%)",
          opacity: 0.35, filter: "blur(20px)", pointerEvents: "none",
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
        {progress && (
          <Box sx={{ textAlign: "right", flexShrink: 0 }}>
            <Typography sx={{ fontSize: "1.4rem", fontWeight: 900, lineHeight: 1, color: "#7c3aed" }}>
              {steps.filter((s) => doneByStep[s.step]).length}/{steps.length}
            </Typography>
            <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "text.secondary" }}>
              done
            </Typography>
          </Box>
        )}
      </Box>

      <Box
        component={motion.div}
        variants={gridStagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}
      >
        {steps.map((step) => {
          const done = !!doneByStep[step.step];
          const reqStep = isRequiz(step);
          const locked = reqStep && !done && requizLocked;
          return (
            <Box
              key={step.step}
              component={motion.div}
              variants={fadeRise}
              sx={{
                display: "flex", alignItems: "flex-start", gap: 1.5, p: 1.5, borderRadius: 3,
                bgcolor: done ? "color-mix(in srgb, #10b981 9%, white)" : "color-mix(in srgb, white 60%, transparent)",
                border: `1px solid ${done ? "color-mix(in srgb, #10b981 32%, transparent)" : "color-mix(in srgb, #a855f7 18%, transparent)"}`,
                opacity: locked ? 0.65 : 1,
                transition: "background-color .25s, border-color .25s, opacity .25s",
              }}
            >
              <Box
                sx={{
                  width: 36, height: 36, borderRadius: 999, display: "flex", alignItems: "center",
                  justifyContent: "center", color: "white", flexShrink: 0,
                  background: done
                    ? "linear-gradient(135deg, #10b981 0%, #22c55e 100%)"
                    : locked
                      ? "color-mix(in srgb, #64748b 55%, white)"
                      : "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                }}
              >
                <Icon icon={done ? "mdi:check" : locked ? "mdi:lock-outline" : (ACTION_ICON[step.action_kind] ?? "mdi:book-open-page-variant-outline")} width={18} />
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
                  <Chip label={reqStep ? "RE-QUIZ" : step.action_kind.toUpperCase()} accent />
                </Box>
                {locked && (
                  <Typography sx={{ fontSize: "0.72rem", color: "#b45309", fontWeight: 700, mt: 0.75 }}>
                    Finish the steps above to unlock your follow-up quiz.
                  </Typography>
                )}
              </Box>
              <StepButton
                done={done}
                locked={locked}
                reqStep={reqStep}
                requizActive={requizActive}
                actionKind={step.action_kind}
                onClick={() => {
                  if (locked) return;
                  if (done && reqStep && requizSessionId) {
                    router.push(`/adaptive-quizzes/session/${requizSessionId}/results`);
                    return;
                  }
                  openStep(step);
                }}
              />
            </Box>
          );
        })}
      </Box>

      {allDone ? (
        <Box sx={{ alignSelf: "flex-end", mt: 0.5, display: "inline-flex", alignItems: "center", gap: 0.75, px: 3, py: 1.4, borderRadius: 999, fontWeight: 800, color: "white", fontSize: "0.92rem", background: "linear-gradient(135deg, #10b981 0%, #22c55e 100%)", boxShadow: "0 14px 30px -14px rgba(16,185,129,0.5)" }}>
          <Icon icon="mdi:check-circle" width={18} /> Remediation complete
        </Box>
      ) : (
        <ButtonBase
          onClick={() => { if (firstActionable) openStep(firstActionable); }}
          disabled={!firstActionable}
          sx={{
            alignSelf: "flex-end", mt: 0.5, px: 3, py: 1.4, borderRadius: 999, fontWeight: 800,
            color: "white", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 60%, #ec4899 100%)",
            boxShadow: "0 14px 30px -14px rgba(168, 85, 247, 0.55)", fontSize: "0.92rem",
            "&:hover": { transform: "translateY(-1px)" }, transition: "transform 120ms ease",
            "&:disabled": { opacity: 0.5 },
          }}
        >
          {progress && steps.some((s) => doneByStep[s.step]) ? "Continue your path →" : "Start your remediation path →"}
        </ButtonBase>
      )}
    </Box>
  );
}

function StepButton({
  done, locked, reqStep, requizActive, actionKind, onClick,
}: {
  done: boolean; locked: boolean; reqStep: boolean; requizActive: boolean; actionKind: string; onClick: () => void;
}) {
  let icon: string;
  let label: string;
  if (locked) { icon = "mdi:lock-outline"; label = "Locked"; }
  else if (done && reqStep) { icon = "mdi:chart-box-outline"; label = "View result"; }
  else if (done) { icon = "mdi:refresh"; label = "Review"; }
  else if (reqStep) { icon = "mdi:tune-vertical"; label = requizActive ? "Resume quiz" : "Take quiz"; }
  else { icon = ACTION_ICON[actionKind] ?? "mdi:arrow-right"; label = ACTION_VERB[actionKind] ?? "Open"; }

  const success = done;
  return (
    <ButtonBase
      onClick={onClick}
      disabled={locked}
      sx={{
        alignSelf: "center", flexShrink: 0, px: 1.75, py: 0.8, borderRadius: 999, fontWeight: 800,
        fontSize: "0.8rem", gap: 0.5,
        color: success ? "#15803d" : "#7c3aed",
        bgcolor: success ? "color-mix(in srgb, #10b981 14%, white)" : "color-mix(in srgb, #a855f7 14%, white)",
        border: `1px solid ${success ? "color-mix(in srgb, #10b981 35%, transparent)" : "color-mix(in srgb, #a855f7 35%, transparent)"}`,
        "&:hover": { bgcolor: success ? "color-mix(in srgb, #10b981 22%, white)" : "color-mix(in srgb, #a855f7 22%, white)" },
        "&:disabled": { opacity: 0.55, color: "text.secondary", bgcolor: "color-mix(in srgb, #64748b 10%, transparent)" },
      }}
    >
      <Icon icon={icon} width={15} />
      {label}
    </ButtonBase>
  );
}

function Chip({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <Box
      sx={{
        px: 1, py: 0.3, borderRadius: 999, fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.1em",
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
