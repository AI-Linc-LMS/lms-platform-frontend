"use client";

import { useCallback, useState, useSyncExternalStore, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { Box, ButtonBase, Chip, CircularProgress, Collapse, Stack, Typography, useMediaQuery } from "@mui/material";
import { Icon } from "@iconify/react";
import { PHONE } from "@/components/common/mobile/phone";
import { useToast } from "@/components/common/Toast";
import mockInterviewService from "@/lib/services/mock-interview.service";
import { prefetchInterviewerClip } from "@/lib/hooks/useInterviewerVoice";
import type { JourneyBoard } from "@/lib/types/adaptive-journey";
import {
  calibrationNeedsAction,
  interviewNeedsAction,
  readTopCardExpanded,
  serverTopCardExpanded,
  subscribeTopCardExpanded,
  topCardPanelId,
  writeTopCardExpanded,
  type TopCardKind,
} from "./topCardCollapse";

// Subtle diagonal "lining" texture for the dark calibration card.
const STRIPES =
  "repeating-linear-gradient(135deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 12px)";

/**
 * Phone layout for a card's action row: the button takes the full width and 48px, and the note
 * that sat beside it (squeezing a 4-word label onto two lines) moves underneath, centred.
 */
const CTA_ROW_PHONE = {
  [PHONE]: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 1,
    "& > :not(style) ~ :not(style)": { ml: 0 },
    "& > .MuiButtonBase-root": { minHeight: 48, fontSize: "0.95rem" },
    "& > .MuiTypography-root": { maxWidth: "none", textAlign: "center", fontSize: "0.78rem" },
  },
} as const;

function Pill({ icon, label, dark, iconColor }: { icon: string; label: string; dark?: boolean; iconColor?: string }) {
  return (
    <Stack
      direction="row"
      spacing={0.6}
      alignItems="center"
      sx={{
        px: 1.1, py: 0.5, borderRadius: 999, fontSize: "0.74rem", fontWeight: 700, [PHONE]: { fontSize: "0.78rem" },
        bgcolor: dark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
        color: dark ? "#e2e8f0" : "#334155",
        border: dark ? "1px solid rgba(255,255,255,0.16)" : "1px solid #e2e8f0",
      }}
    >
      <Icon icon={icon} width={14} color={iconColor} />
      {label}
    </Stack>
  );
}

/* ---------------------------------------------------------------------------------------------
 * The collapsible shell both cards share.
 *
 * One implementation so the accessibility wiring cannot differ between them: the expander is a
 * real button carrying `aria-expanded` and an `aria-controls` that names the panel it opens, the
 * collapsed row's own action is a sibling button rather than a button inside a button, and the
 * body is a `Collapse` whose animation is dropped to zero under `prefers-reduced-motion`.
 * ------------------------------------------------------------------------------------------- */

/** A compact action rendered inside a collapsed row - the card's primary CTA, still reachable. */
interface RowAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
}

function TopCardShell({
  kind,
  courseId,
  needsAction,
  dark,
  surfaceSx,
  iconSlot,
  title,
  titleChips,
  subtitle,
  summary,
  rowAction,
  expandedHeaderRight,
  children,
}: {
  kind: TopCardKind;
  courseId: number;
  /** Data-derived default: expanded only while this card still asks the learner for something. */
  needsAction: boolean;
  dark?: boolean;
  surfaceSx: Record<string, unknown>;
  iconSlot: ReactNode;
  title: string;
  /** Chips that belong beside the title in both states (the interview's LIVE / DONE pair). */
  titleChips?: ReactNode;
  /** The line under the title while the card is open. */
  subtitle: string;
  /** The one-line replacement for the whole body while the card is closed. */
  summary: string;
  rowAction?: RowAction;
  expandedHeaderRight?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  // The default comes from the data; anything the learner remembered this session wins over it.
  // `override` is not redundant with storage: where storage is unavailable (a private window,
  // site data blocked) the write is a no-op and this is the only thing that makes the card open.
  const remembered = useSyncExternalStore(
    subscribeTopCardExpanded,
    useCallback(() => readTopCardExpanded(kind, courseId), [kind, courseId]),
    serverTopCardExpanded,
  );
  const [override, setOverride] = useState<boolean | null>(null);
  const expanded = override ?? remembered ?? needsAction;

  const panelId = topCardPanelId(kind, courseId);
  const toggle = () => {
    const next = !expanded;
    setOverride(next);
    writeTopCardExpanded(kind, courseId, next);
  };

  const muted = dark ? "rgba(255,255,255,0.62)" : "#64748b";

  return (
    <Box
      sx={{
        ...surfaceSx,
        p: expanded ? 2.5 : 1.25,
        // The flex column is load-bearing: the pills and chips at the bottom of an expanded card
        // sit on `mt: "auto"`, which needs a column with height to spare to push against. Two
        // expanded cards therefore stretch to a common height and their CTAs line up, exactly as
        // they did before this card could collapse.
        display: "flex",
        flexDirection: "column",
        // Refusing to stretch belongs to the COLLAPSED card, not to the row: putting it on the
        // row's `alignItems` also stopped two expanded cards matching heights (measured: the
        // calibration CTA sat 24px above the interview's). Only at md+, where the row is a row -
        // in the xs column `flex-start` is the CROSS axis and would shrink the card's width.
        alignSelf: { xs: "stretch", md: expanded ? "stretch" : "flex-start" },
        [PHONE]: { minWidth: 0, p: expanded ? 2 : 1.25 },
      }}
    >
      <Stack
        direction="row"
        spacing={1.25}
        alignItems={expanded ? "flex-start" : "center"}
        sx={{
          // On a phone the row becomes three: identity, then the one-line summary, then a
          // full-width action. `order` puts the action last even though the chevron follows it
          // in the DOM, so the chevron stays on the identity line where it belongs.
          //
          // DOM order stays identity -> summary -> action -> expander, which is the reading
          // order a screen reader and the tab sequence both follow, and it is the painted order
          // at md and up. On a phone `order` paints the expander (line 1) before the action
          // (line 3) while tab still reaches the action first: one reordered pair, and the
          // alternative - reordering the DOM - only moves the same mismatch to the desktop,
          // where far more people use a keyboard.
          [PHONE]: {
            flexWrap: "wrap",
            rowGap: 1,
            "& > .journey-top-card-action": { flexBasis: "100%", order: 1, ml: 0, mt: 0.5 },
          },
        }}
      >
        {iconSlot}

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" sx={{ rowGap: 0.5 }}>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: expanded ? "1.05rem" : "0.95rem",
                color: dark ? "#fff" : "#0f172a",
                [PHONE]: { fontSize: expanded ? "1.05rem" : "0.95rem" },
              }}
            >
              {title}
            </Typography>
            {titleChips}
          </Stack>
          <Typography
            noWrap={!expanded}
            sx={{
              fontSize: "0.76rem",
              color: muted,
              [PHONE]: { fontSize: "0.78rem", whiteSpace: "normal" },
            }}
          >
            {expanded ? subtitle : summary}
          </Typography>
        </Box>

        {expanded && expandedHeaderRight}

        {!expanded && rowAction && (
          <ButtonBase
            className="journey-top-card-action"
            disabled={rowAction.disabled || rowAction.busy}
            onClick={rowAction.onClick}
            sx={{
              flexShrink: 0, px: 1.5, py: 0.75, borderRadius: 2, fontWeight: 800, fontSize: "0.78rem", gap: 0.5,
              color: dark ? "#0f172a" : "#6d28d9",
              bgcolor: dark ? "#fff" : "#f5f3ff",
              border: dark ? "1px solid transparent" : "1px solid #ddd6fe",
              "&:hover": { bgcolor: dark ? "#f1f5f9" : "#ede9fe" },
              "&.Mui-disabled": {
                color: dark ? "rgba(255,255,255,0.5)" : "#94a3b8",
                bgcolor: dark ? "rgba(255,255,255,0.1)" : "#f1f5f9",
                border: dark ? "1px solid transparent" : "1px solid #e2e8f0",
              },
              [PHONE]: { minHeight: 44, fontSize: "0.82rem" },
            }}
          >
            {rowAction.busy ? <CircularProgress size={14} sx={{ color: "inherit" }} /> : null}
            {rowAction.label}
          </ButtonBase>
        )}

        <ButtonBase
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={t(expanded ? "adaptiveTopCards.collapseAria" : "adaptiveTopCards.expandAria", { title })}
          onClick={toggle}
          sx={{
            flexShrink: 0, width: 32, height: 32, borderRadius: "50%",
            color: dark ? "rgba(255,255,255,0.75)" : "#64748b",
            border: dark ? "1px solid rgba(255,255,255,0.16)" : "1px solid #e2e8f0",
            "&:hover": { bgcolor: dark ? "rgba(255,255,255,0.08)" : "#f1f5f9" },
            "&:focus-visible": { outline: `2px solid ${dark ? "#fbbf24" : "#7c3aed"}`, outlineOffset: 2 },
            [PHONE]: { width: 44, height: 44 },
          }}
        >
          <Icon icon={expanded ? "mdi:chevron-up" : "mdi:chevron-down"} width={20} />
        </ButtonBase>
      </Stack>

      {/* The panel wrapper is always in the DOM so the expander's `aria-controls` always names
          something real; the body inside it is unmounted while closed, which is what makes a
          collapsed card a row rather than a card with its contents hidden. */}
      <Box id={panelId} sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Collapse
          in={expanded}
          timeout={reduceMotion ? 0 : 260}
          unmountOnExit
          // Collapse animates its own height and its two internal wrappers are plain blocks, so
          // without this the column stops here and `mt: "auto"` inside has nothing to push
          // against. `flex: 1` only once the card is open, so it never fights the animation.
          sx={{
            flex: expanded ? 1 : "0 0 auto",
            "& .MuiCollapse-wrapper, & .MuiCollapse-wrapperInner": { height: "100%", display: "flex", flexDirection: "column" },
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>{children}</Box>
        </Collapse>
      </Box>
    </Box>
  );
}

const CALIB_STATUS_CHIP: Record<string, { label: string; color: string; bg: string }> = {
  done: { label: "DONE", color: "#14532d", bg: "#4ade80" },
  not_started: { label: "NOT STARTED", color: "#1e293b", bg: "#fbbf24" },
  not_configured: { label: "SETUP PENDING", color: "#1e293b", bg: "#cbd5e1" },
  generating: { label: "PREPARING", color: "#3730a3", bg: "#c7d2fe" },
};

function CalibrationCard({ calibration, courseId }: { calibration: JourneyBoard["calibration"]; courseId: number }) {
  const { t } = useTranslation();
  const { push, prefetch } = useInstantNavigation();
  const card = calibration.card;
  if (!card) return null;
  const status = card.generating ? "generating" : card.status;
  const slug = card.assessmentSlug;
  const canStart = status === "not_started" && !!slug;
  // Once done, the same route shows the "what we learned about you" result instead of the test.
  const canView = status === "done" && !!slug;
  const clickable = canStart || canView;
  const calibrationHref = `/assessments/${slug}/calibration?courseId=${courseId}`;
  const chip = CALIB_STATUS_CHIP[status] ?? CALIB_STATUS_CHIP.not_configured;

  let ctaLabel = "Start self-proctored assessment →";
  if (status === "done") ctaLabel = "View calibration results →";
  else if (status === "generating") ctaLabel = "Calibration is being prepared…";
  else if (status === "not_configured") ctaLabel = "Calibration not set up yet";

  // What the one-line row says instead of the paragraph. A finished test does not need its own
  // rules explained again - it needs to say that it is finished and what it bought the learner.
  let summary = t("adaptiveTopCards.calibrationNotConfigured");
  if (status === "done") summary = t("adaptiveTopCards.calibrationDone", { points: card.points });
  else if (status === "generating") summary = t("adaptiveTopCards.calibrationGenerating");
  else if (status === "not_started") summary = t("adaptiveTopCards.calibrationPending");

  const statusChip = (
    <Chip
      label={chip.label}
      size="small"
      sx={{ height: 24, fontSize: "0.66rem", fontWeight: 800, color: chip.color, bgcolor: chip.bg, flexShrink: 0, [PHONE]: { fontSize: "0.75rem" } }}
    />
  );

  return (
    <TopCardShell
      kind="calibration"
      courseId={courseId}
      needsAction={calibrationNeedsAction(calibration)}
      dark
      surfaceSx={{
        flex: 1, minWidth: 280, borderRadius: 4, color: "white", position: "relative", overflow: "hidden",
        backgroundColor: "#0f172a",
        backgroundImage: `${STRIPES}, linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`,
        boxShadow: "0 18px 40px -22px rgba(15,23,42,0.7)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
      iconSlot={
        <Box sx={{ width: 38, height: 38, flexShrink: 0, borderRadius: 2.5, display: "grid", placeItems: "center", bgcolor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <Icon icon="mdi:shield-half-full" width={20} color="#fb923c" />
        </Box>
      }
      title={t("adaptiveTopCards.calibrationTitle")}
      titleChips={statusChip}
      subtitle={t("adaptiveTopCards.calibrationPending")}
      summary={summary}
      rowAction={
        clickable
          ? { label: status === "done" ? t("adaptiveTopCards.viewResults") : t("adaptiveTopCards.startNow"), onClick: () => push(calibrationHref) }
          : undefined
      }
    >
      <Typography sx={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.85)", mt: 1.5, lineHeight: 1.55 }}>
        A standardized, <b style={{ color: "#fff" }}>non-adaptive</b> test - the same fixed question set for every learner -
        so we can fairly measure where everyone starts. Your baseline feeds the AI Student Model that powers the rest of the course.
      </Typography>

      <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: "auto", pt: 1.75 }}>
        {card.durationMinutes != null && <Pill dark icon="mdi:clock-outline" iconColor="#cbd5e1" label={`${card.durationMinutes} min`} />}
        {card.questionCount > 0 && <Pill dark icon="mdi:help-circle" iconColor="#f87171" label={`${card.questionCount} fixed Qs`} />}
        <Pill dark icon="mdi:trophy" iconColor="#fbbf24" label={`${card.points} pts`} />
        {card.proctored && <Pill dark icon="mdi:shield-account" iconColor="#93c5fd" label="Self-proctored" />}
        {card.proctored && <Pill dark icon="mdi:fullscreen" iconColor="#fbbf24" label="Go full screen" />}
      </Stack>

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2, ...CTA_ROW_PHONE }}>
        <ButtonBase
          disabled={!clickable}
          onMouseEnter={() => clickable && prefetch(calibrationHref)}
          onClick={() => clickable && push(calibrationHref)}
          sx={{
            flex: 1, py: 1.15, borderRadius: 2.5, fontWeight: 800, fontSize: "0.88rem",
            bgcolor: clickable ? "#fff" : "rgba(255,255,255,0.12)",
            color: clickable ? "#0f172a" : "rgba(255,255,255,0.6)",
            boxShadow: clickable ? "0 10px 24px -14px rgba(255,255,255,0.5)" : "none",
            "&:hover": { bgcolor: clickable ? "#f1f5f9" : "rgba(255,255,255,0.12)" },
          }}
        >
          {ctaLabel}
        </ButtonBase>
        <Typography sx={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)", maxWidth: 130 }}>
          {status === "generating"
            ? "Being prepared by AI - check back shortly"
            : status === "not_configured"
              ? "Your instructor will enable this soon"
              : status === "done"
                ? "See what we learned about you"
                : "Same for everyone · not graded on a curve"}
        </Typography>
      </Stack>
    </TopCardShell>
  );
}

function InterviewerCard({ interview, courseId }: { interview: JourneyBoard["interview"]; courseId: number }) {
  const { t } = useTranslation();
  const { push } = useInstantNavigation();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const card = interview.card;
  // No card means this course will never have one (a roadmap-built course has no admin to
  // configure an interview), so render nothing rather than a stub that promises setup.
  if (!card) return null;
  const status = card.status;
  const configured = card.configured && card.templateId != null;

  // Chips reflect the REAL configured interview (template topic + difficulty from the board
  // API) plus what this interview genuinely is - a spoken, adaptive level-gauge conversation.
  // They used to be a hardcoded decorative list ("Technical / Behavioral / SQL drill / Case
  // study") shown identically for every course, promising formats the level-gauge interview
  // doesn't contain (its template has zero coding/MCQ questions).
  const chips: { t: string; hot?: boolean }[] = [
    ...(card.topic ? [{ t: card.topic, hot: true }] : []),
    ...(card.difficulty ? [{ t: `${card.difficulty} level` }] : []),
    { t: "Voice conversation" },
    { t: "Adaptive follow-ups" },
  ];

  const launch = async () => {
    if (!configured || card.templateId == null || busy) return;
    setBusy(true);
    try {
      const created = await mockInterviewService.startTemplateInterview(card.templateId);
      // Warm the interviewer's opening TTS clip while the candidate reads the Begin screen,
      // and stash the text so the interview page can re-warm after a reload (its detail API
      // only serves completed interviews). Kills the first-question dead air.
      if (created.opening_question_text) {
        prefetchInterviewerClip(created.opening_question_text);
        try {
          sessionStorage.setItem(`adaptiveInterviewOpening_${created.id}`, created.opening_question_text);
        } catch {
          /* best-effort */
        }
      }
      const q = new URLSearchParams();
      if (card.topic) q.set("topic", card.topic);
      if (card.difficulty) q.set("difficulty", card.difficulty);
      if (card.durationMinutes) q.set("mins", String(card.durationMinutes));
      push(`/adaptive-courses/${courseId}/interview/${created.id}?${q.toString()}`);
    } catch {
      showToast("Couldn't start the interview. Please try again.", "error");
      setBusy(false);
    }
  };

  // An admin can deactivate a template AFTER a learner has sat the interview - the board then
  // sends `configured: false` with `status: "done"` - so `done` is tested FIRST. Asking
  // `configured` first made a finished interview read "your instructor is still setting this up"
  // directly beside its own DONE chip.
  let ctaLabel = t("adaptiveTopCards.launchCta");
  let summary = t("adaptiveTopCards.interviewNotConfigured");
  if (status === "done") {
    ctaLabel = configured ? t("adaptiveTopCards.takeAgain") : t("adaptiveTopCards.interviewClosedCta");
    summary = configured
      ? t("adaptiveTopCards.interviewDone", { minutes: card.durationMinutes ?? 10 })
      : t("adaptiveTopCards.interviewDoneClosed");
  } else if (!configured) {
    ctaLabel = t("adaptiveTopCards.interviewSetupCta");
  } else {
    summary = t("adaptiveTopCards.interviewReady", { minutes: card.durationMinutes ?? 10 });
  }

  return (
    <TopCardShell
      kind="interview"
      courseId={courseId}
      needsAction={interviewNeedsAction(interview)}
      surfaceSx={{
        flex: 1, minWidth: 280, borderRadius: 4, border: "1px solid #ece9fb",
        backgroundImage: "radial-gradient(120% 120% at 100% 0%, #faf5ff 0%, #ffffff 45%)",
      }}
      iconSlot={
        <Box sx={{ flexShrink: 0, p: "2px", borderRadius: "50%", background: "linear-gradient(135deg, var(--module-cta-from, #7c3aed) 0%, var(--module-cta-to, #db2777) 100%)" }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: "#fff", display: "grid", placeItems: "center" }}>
            <Icon icon="mdi:star-four-points" width={18} color="#a855f7" />
          </Box>
        </Box>
      }
      title={t("adaptiveTopCards.interviewTitle")}
      titleChips={
        <>
          <Chip
            icon={<Icon icon="mdi:star-four-points" width={11} color="#fff" />}
            label="LIVE"
            size="small"
            sx={{ height: 20, fontSize: "0.6rem", fontWeight: 800, color: "#fff", background: "linear-gradient(135deg, #7c3aed, #db2777)", "& .MuiChip-icon": { color: "#fff", ml: 0.5 }, [PHONE]: { height: 22, fontSize: "0.75rem" } }}
          />
          {status === "done" && <Chip label="DONE" size="small" sx={{ height: 20, fontSize: "0.6rem", fontWeight: 800, color: "#14532d", bgcolor: "#bbf7d0", [PHONE]: { height: 22, fontSize: "0.75rem" } }} />}
        </>
      }
      subtitle={t("adaptiveTopCards.interviewReadySubtitle")}
      summary={summary}
      rowAction={configured ? { label: status === "done" ? t("adaptiveTopCards.takeAgain") : t("adaptiveTopCards.launch"), onClick: launch, busy } : undefined}
      expandedHeaderRight={
        <ButtonBase
          aria-label={t("adaptiveTopCards.launchCta")}
          disabled={!configured}
          onClick={launch}
          sx={{ flexShrink: 0, p: 0.5, borderRadius: "50%", color: "#a855f7", "&.Mui-disabled": { color: "#cbd5e1" }, [PHONE]: { display: "none" } }}
        >
          <Icon icon="mdi:arrow-right" width={22} />
        </ButtonBase>
      }
    >
      <Typography sx={{ fontSize: "0.84rem", color: "#334155", mt: 1.5, lineHeight: 1.55 }}>
        Rehearse with a voice-and-text AI interviewer that asks domain questions, follows up on your answers, and
        scores communication, depth, and correctness. <b style={{ color: "#0f172a" }}>Adapts</b> to how you respond - and feeds your AI Student Model, just like the calibration test.
      </Typography>

      <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: "auto", pt: 1.75 }}>
        {chips.map(({ t: label, hot }) => (
          <Box
            key={label}
            sx={{
              px: 1.4, py: 0.5, borderRadius: 999, fontSize: "0.76rem", fontWeight: 700, [PHONE]: { fontSize: "0.78rem" },
              bgcolor: hot ? "#ede9fe" : "#f1f5f9",
              color: hot ? "#6d28d9" : "#334155",
              border: hot ? "1px solid #ddd6fe" : "1px solid #e2e8f0",
            }}
          >
            {label}
          </Box>
        ))}
      </Stack>

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2, ...CTA_ROW_PHONE }}>
        <ButtonBase
          disabled={!configured || busy}
          onClick={launch}
          sx={{
            flex: 1, py: 1.15, borderRadius: 2.5, fontWeight: 800, fontSize: "0.88rem", color: "white",
            gap: 0.75, background: configured ? "linear-gradient(135deg, var(--module-cta-from, #7c3aed) 0%, var(--module-cta-to, #db2777) 100%)" : "#cbd5e1",
            boxShadow: configured ? "0 12px 26px -12px var(--module-cta-shadow, rgba(124,58,237,0.6))" : "none",
          }}
        >
          {busy ? <CircularProgress size={16} sx={{ color: "white" }} /> : <Icon icon="mdi:star-four-points" width={16} />}
          {ctaLabel}
        </ButtonBase>
        <Typography sx={{ fontSize: "0.7rem", color: "#64748b", maxWidth: 120 }}>
          {`Level gauge · ~${card.durationMinutes ?? 10} min`}
        </Typography>
      </Stack>
    </TopCardShell>
  );
}

export function JourneyTopCards({
  courseId,
  calibration,
  interview,
}: {
  courseId: number;
  calibration: JourneyBoard["calibration"];
  interview: JourneyBoard["interview"];
}) {
  // Neither card: render nothing at all. An empty Stack still contributes its bottom margin,
  // which would leave a band of dead space between the hero and the course overview.
  if (!calibration.card && !interview.card) return null;

  // The row stretches, as it always did, so two expanded cards match heights. A card that is
  // COLLAPSED opts out for itself with `alignSelf` - see TopCardShell.
  // `key={courseId}`: the open/closed override is per course, so a course change resets it
  // rather than carrying one course's choice into the next.
  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2.5 }}>
      {calibration.card && <CalibrationCard key={`calibration-${courseId}`} calibration={calibration} courseId={courseId} />}
      {interview.card && <InterviewerCard key={`interview-${courseId}`} interview={interview} courseId={courseId} />}
    </Stack>
  );
}
