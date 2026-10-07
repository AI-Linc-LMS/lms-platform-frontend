"use client";

/**
 * A single step on the spine: its marker, and the card beside it.
 *
 * Moved out of `JourneyBoard.tsx` when the board became a spine. The card is unchanged from
 * what learners see today apart from two additions: the AI Tutor can now teach the module the
 * step is about (`TutorAction`), and an interview step starts the interview instead of
 * linking at a list that knows nothing about this course (`InterviewAction`).
 */

import type React from "react";
import { useState } from "react";
import { Box, ButtonBase, Chip, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { PHONE } from "@/components/common/mobile/phone";
import type { JourneyNodeView } from "@/lib/types/adaptive-journey";
import { nodeHref } from "../nodeHref";
import { journeyScoreDisplay, journeyAvailabilityLine } from "../journeyScoreDisplay";
import { contentSummary, isAssessmentNode, nodeLabel, NODE_STYLE } from "./nodeVisuals";
import { TutorAction } from "./TutorAction";
import { InterviewAction } from "./InterviewAction";
import { SpineRow, type RailTone } from "./SpineRow";
import { ModuleLessons } from "./ModuleLessons";
import { TriadTile } from "./TriadTile";
import { moduleTriad } from "./triad";
import { useIsAiVoiceTutorEnabled } from "@/lib/contexts/ClientInfoContext";
import { tutorHrefForModule } from "../tutorHref";
import { fmtDate } from "./dates";

/** The rail is behind a finished step, handing over at the current one, ahead of the rest. */
export function nodeTone(node: JourneyNodeView): RailTone {
  if (node.status === "done") return "done";
  if (node.status === "current") return "active";
  return "ahead";
}

function NodeMarker({ node, stepNo }: { node: JourneyNodeView; stepNo: number }) {
  const base = {
    width: 28,
    height: 28,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    zIndex: 1,
  } as const;
  if (node.status === "done") {
    return (
      <Box sx={{ ...base, bgcolor: "#22c55e", color: "white" }}>
        <Icon icon="mdi:check" width={16} />
      </Box>
    );
  }
  if (node.status === "current") {
    return (
      <Box sx={{ ...base, bgcolor: "#6366f1", color: "white", fontWeight: 800, fontSize: "0.8rem", boxShadow: "0 0 0 4px rgba(99,102,241,0.18)" }}>
        {stepNo}
      </Box>
    );
  }
  if (node.status === "available") {
    // Unlocked-but-not-started: open and actionable - a step number, never a padlock.
    return (
      <Box sx={{ ...base, bgcolor: "#eef2ff", color: "#6366f1", fontWeight: 800, fontSize: "0.8rem", border: "1.5px solid #c7d2fe" }}>
        {stepNo}
      </Box>
    );
  }
  return (
    <Box sx={{ ...base, bgcolor: "#e2e8f0", color: "#64748b" }}>
      <Icon icon="mdi:lock" width={14} />
    </Box>
  );
}

export function NodeRow({
  node,
  courseId,
  stepNo,
  dueAt,
  fieldTier,
  first,
  last,
  checkpoint = null,
  moduleNo,
}: {
  node: JourneyNodeView;
  courseId: number;
  stepNo: number;
  dueAt?: string | null;
  /** The paper that closes this module, so the triad's third leg can report its real state. */
  checkpoint?: JourneyNodeView | null;
  /** Its position in the course, for the numbered tile. Modules only. */
  moduleNo?: number;
  /** The learner's calibrated level, so a tutor lesson opens at the right difficulty. */
  fieldTier?: string | null;
  first?: boolean;
  last?: boolean;
}) {
  const { push, prefetch } = useInstantNavigation();
  const tutorEnabled = useIsAiVoiceTutorEnabled();
  // Opens on demand. The board carries only item COUNTS, so the titles are fetched when a
  // module is expanded - a 53-module course would otherwise ship every lesson of every module
  // to show the one or two a learner opens.
  const [open, setOpen] = useState(false);
  const l = nodeLabel(node);
  const ns = NODE_STYLE[node.type] ?? NODE_STYLE.topic;
  const done = node.status === "done";
  const current = node.status === "current";
  const locked = node.status === "locked";
  const navHref = nodeHref(node, courseId);
  const navigable = !locked && !!navHref;
  const summary = contentSummary(node);
  // A module states its three legs - lessons, tutor, assessment - in place of a content line.
  // Everything else on the board (a checkpoint, an interview) is one thing and keeps the line.
  const triad = node.type === "topic" ? moduleTriad(node, checkpoint, tutorEnabled) : [];
  const tutorHref = tutorHrefForModule(node, fieldTier ?? undefined);
  const checkpointHref = checkpoint ? nodeHref(checkpoint, courseId) : null;
  // Keyed on what a leg IS, not on what it is called. The assessment leg's label is now the
  // paper's own name ("WEEK 2 CHECK"), and a lookup by display string would have stopped
  // matching it - leaving a tile that silently no longer navigates.
  const legHandlers: Record<string, (() => void) | undefined> = {
    lessons: navigable && navHref ? () => push(navHref) : undefined,
    assessment: checkpointHref ? () => push(checkpointHref) : undefined,
  };

  const go = () => { if (navigable && navHref) push(navHref); };
  // For a button INSIDE the card: the card navigates too, and its handler runs second. Even
  // where both go to the same place, two pushes for one click is a bug waiting to matter.
  const goOnly = (e: React.MouseEvent) => { e.stopPropagation(); go(); };
  const warm = () => { if (navigable && navHref) prefetch(navHref); };

  // An interview step is reachable but has no href at all - it has to be minted. So it gets a
  // launch button wherever Continue would have gone, in every state but locked.
  const interviewable = node.type === "interview" && !locked;
  // Only a module has lessons to show, and only an unlocked one has lessons the learner may
  // open. A locked module's chevron would promise a list it then refuses to act on.
  const expandable = node.type === "topic" && !!node.ref.submoduleId && !locked;

  return (
    <SpineRow marker={<NodeMarker node={node} stepNo={stepNo} />} tone={nodeTone(node)} first={first} last={last}>
      <Box
        data-testid="journey-node"
        onClick={go}
        onMouseEnter={warm}
        sx={{
          mb: 1.5, p: 1.75, borderRadius: 3, border: "1px solid",
          borderLeft: "4px solid", borderLeftColor: ns.color,
          borderColor: current ? "#c7d2fe" : "#eef2f7",
          bgcolor: current ? "#fbfbff" : "#fff",
          boxShadow: current ? `0 4px 14px -14px ${ns.color}` : "0 1px 2px rgba(16,24,40,0.04)",
          opacity: locked ? 0.72 : 1,
          cursor: navigable ? "pointer" : "default",
          transition: "border-color .15s",
          "&:hover": navigable ? { borderColor: "#cbd5e1" } : {},
          // Phone: the row is a thumb target, so it is never shorter than 56px, and it gives up
          // the type tile (the rail marker and the coloured edge already say what it is) so the
          // title keeps the width instead of wrapping every other word.
          [PHONE]: { minWidth: 0, minHeight: 56, p: 1.5 },
        }}
      >
        <Stack direction="row" alignItems="flex-start" gap={1.25}>
          {/* A module gets its number on a gradient tile; everything else keeps its type icon.
              The number is what a learner says out loud ("I'm on module three"), and the board
              never showed it anywhere. */}
          <Box
            data-testid="journey-node-type-tile"
            sx={{
              width: 34, height: 34, borderRadius: 2, flexShrink: 0,
              display: "grid", placeItems: "center",
              fontWeight: 800, fontSize: "0.85rem",
              ...(moduleNo != null && node.type === "topic"
                ? locked
                  ? { color: "#94a3b8", bgcolor: "#f1f5f9" }
                  : { color: "white", background: "linear-gradient(135deg, var(--module-tile-from, #6366f1) 0%, var(--module-tile-to, #a855f7) 100%)" }
                : { color: ns.color, bgcolor: ns.bg }),
              [PHONE]: { display: "none" },
            }}
          >
            {moduleNo != null && node.type === "topic"
              ? String(moduleNo).padStart(2, "0")
              : <Icon icon={ns.icon} width={18} />}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
              <Typography sx={{ fontSize: "0.64rem", fontWeight: 800, letterSpacing: 0.6, color: ns.color, [PHONE]: { fontSize: "0.75rem", letterSpacing: 0.4 } }}>{l.main}</Typography>
              {l.sub && <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: 0.5, color: "#a855f7", [PHONE]: { fontSize: "0.75rem", letterSpacing: 0.3 } }}>· {l.sub}</Typography>}
              {l.ai && <Chip label="+AI" size="small" sx={{ height: 16, fontSize: "0.56rem", fontWeight: 800, color: "#7c3aed", bgcolor: "#ede9fe", [PHONE]: { height: 20, fontSize: "0.75rem" } }} />}
            </Stack>
            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a", mt: 0.25, [PHONE]: { fontSize: "1rem", lineHeight: 1.35, overflowWrap: "anywhere" } }}>{node.title}</Typography>
            {summary && triad.length === 0 && (
              <Typography sx={{ fontSize: "0.76rem", color: "#64748b", mt: 0.25, [PHONE]: { fontSize: "0.8rem" } }}>{summary}</Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, flexShrink: 0 }}>
          <Box sx={{ textAlign: "right" }}>
            {(() => {
              // One tested rule, imported rather than re-typed here. The comment in
              // lms_api/services.py about "mirroring rather than importing" is the reason
              // this whole class of bug keeps recurring.
              const sd = journeyScoreDisplay(node.score, done);
              return sd.mode === "earned" ? (
                <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", color: done ? "#15803d" : "#7c3aed" }}>
                  {sd.earned}<span style={{ color: "#64748b", fontWeight: 600 }}>/{sd.total}</span>
                  <Typography component="span" sx={{ fontSize: "0.66rem", color: "#64748b", display: "block", fontWeight: 600, [PHONE]: { fontSize: "0.75rem" } }}>{sd.label}</Typography>
                </Typography>
              ) : (
                <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", color: "#475569" }}>
                  {sd.total}<Box component="span" sx={{ fontSize: "0.66rem", color: "#64748b", fontWeight: 600, [PHONE]: { fontSize: "0.75rem" } }}> pts</Box>
                  <Typography component="span" sx={{ fontSize: "0.66rem", color: "#64748b", display: "block", fontWeight: 600, [PHONE]: { fontSize: "0.75rem" } }}>{sd.label}</Typography>
                </Typography>
              );
            })()}
          </Box>
          {expandable && (
            <ButtonBase
              onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
              aria-expanded={open}
              aria-label={open ? `Hide the lessons in ${node.title}` : `Show the lessons in ${node.title}`}
              sx={{
                width: 30, height: 30, borderRadius: 2, flexShrink: 0, color: "#94a3b8",
                "&:hover": { bgcolor: "#f1f5f9", color: "#475569" },
                "&:focus-visible": { outline: "2px solid #6366f1", outlineOffset: 1 },
                [PHONE]: { width: 44, height: 44 },
              }}
            >
              <Icon
                icon="mdi:chevron-down"
                width={20}
                style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }}
              />
            </ButtonBase>
          )}
          </Box>
        </Stack>

        {triad.length > 0 && (
          <Stack
            data-testid="module-triad"
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ mt: 1.5 }}
          >
            {triad.map((leg) => (
              <TriadTile
                key={leg.kind}
                step={leg.step}
                label={leg.label}
                value={leg.value}
                state={leg.state}
                icon={leg.icon}
                tag={leg.tag}
                onClick={legHandlers[leg.kind]}
              />
            ))}
          </Stack>
        )}

        {expandable && open && node.ref.submoduleId && (
          <ModuleLessons courseId={courseId} submoduleId={node.ref.submoduleId} />
        )}

        {current && (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ sm: "center" }} sx={{ mt: 1.5 }}>
            <Stack direction="row" spacing={0.6} alignItems="center" sx={{ minWidth: 0 }}>
              <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#15803d", flexShrink: 0 }} />
              <Typography sx={{ fontSize: "0.74rem", color: "#15803d", fontWeight: 600, [PHONE]: { fontSize: "0.8rem" } }}>
                {journeyAvailabilityLine(node.score)}{dueAt ? ` before ${fmtDate(dueAt)}` : ""}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
              <TutorAction node={node} level={fieldTier ?? undefined} />
              {interviewable ? (
                <InterviewAction node={node} courseId={courseId} done={false} />
              ) : navigable ? (
                <ButtonBase onClick={goOnly} sx={{ flexShrink: 0, px: 2, py: 0.85, borderRadius: 2, fontWeight: 800, fontSize: "0.8rem", color: "white", background: "linear-gradient(135deg, var(--module-tile-from, #6366f1) 0%, var(--module-tile-to, #a855f7) 100%)", [PHONE]: { minHeight: 44, fontSize: "0.9rem", borderRadius: 2.5 } }}>
                  Continue →
                </ButtonBase>
              ) : null}
            </Stack>
          </Stack>
        )}

        {/* An interview that is open but not the current step still needs its button: the board
            marks only one step current, and an interview sitting at `available` had no way in. */}
        {!current && interviewable && (
          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1.5 }}>
            <InterviewAction node={node} courseId={courseId} done={done} />
          </Stack>
        )}

        {/* No separate tutor button on a module that is not the current step: its triad
            already carries the tutor, and a second control for the same thing reads as two
            different things. The current step keeps its explicit button below, because that
            is where the learner is looking. */}

        {/* A finished assessment keeps an explicit way back to its result.
            The card has always been clickable, but only the CURRENT step rendered a button, so a
            learner who had submitted saw a completed row with no affordance at all - and the
            assessment's own page answers an already-submitted paper with "Already submitted" and a
            disabled button. `nodeHref` routes a done assessment straight to its result. */}
        {done && isAssessmentNode(node) && navigable && (
          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1.5 }}>
            <ButtonBase
              onClick={goOnly}
              sx={{
                flexShrink: 0, px: 2, py: 0.85, borderRadius: 2, fontWeight: 800,
                fontSize: "0.8rem", color: "#15803d", border: "1px solid #86efac",
                bgcolor: "#f0fdf4", gap: 0.5,
                [PHONE]: { minHeight: 44, fontSize: "0.9rem", borderRadius: 2.5 },
              }}
            >
              <Icon icon="mdi:clipboard-text-search-outline" width={16} />
              View result
            </ButtonBase>
          </Stack>
        )}
        {locked && node.lockReason && (
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 1 }}>
            <Icon icon="mdi:lock-outline" width={12} color="#64748b" style={{ flexShrink: 0 }} />
            <Typography sx={{ fontSize: "0.72rem", color: "#64748b", [PHONE]: { fontSize: "0.78rem" } }}>{node.lockReason}</Typography>
          </Stack>
        )}
      </Box>
    </SpineRow>
  );
}
