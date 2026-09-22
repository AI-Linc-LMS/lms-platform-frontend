"use client";

import { useEffect, useState } from "react";
import { Box, Button, CircularProgress, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { ScrollRow } from "@/components/common/mobile/ScrollRow";
import { SessionMaterialsDisclosure } from "@/components/live-sessions/SessionMaterialsDisclosure";
import type { StudentLiveSession } from "@/lib/services/live-sessions";
import { formatSessionClock, formatSessionTime } from "@/lib/utils/session-time";
import { PHONE } from "@/components/common/mobile/phone";

/* ==========================================================================
 * The three cards a learner's Live Sessions list is made of.
 *
 * Lifted out of app/live-sessions/page.tsx so the layout they render can be asserted directly:
 * the page itself pulls in the whole session service, the client-feature hooks and MainLayout,
 * which is a lot of machinery to stand up just to ask whether a card puts its actions under the
 * title on a phone.
 *
 * Each card is ONE DOM tree that reflows with `order` and breakpoint-scoped `display`, not two
 * trees behind a media query - so the phone reading and the desktop reading cannot drift apart,
 * and there is no hydration flash while a media query resolves.
 * ======================================================================== */

export const AI_GRAD =
  "linear-gradient(135deg, var(--module-cta-from, #7c3aed) 0%, var(--module-cta-to, #ec4899) 100%)";

export function providerOf(s: StudentLiveSession): { label: string; icon: string; color: string } {
  if (s.is_google_meet) return { label: "Meet", icon: "mdi:google", color: "#16a34a" };
  if (s.zoom_meeting_type === "webinar") return { label: "Webinar", icon: "mdi:presentation", color: "#7c3aed" };
  if (s.is_zoom) return { label: "Zoom", icon: "mdi:video-outline", color: "#2563eb" };
  return { label: "Online", icon: "mdi:web", color: "#6b7280" };
}
export function courseOf(s: StudentLiveSession): string {
  return s.cohort_detail?.name || s.adaptive_course_detail?.title || s.course_detail?.title || "";
}
/** Course title only - for cards that already show the batch as its own chip, so the batch name
 *  isn't printed twice. */
function courseTextOf(s: StudentLiveSession): string {
  return s.adaptive_course_detail?.title || s.course_detail?.title || s.course_detail?.name || "";
}
/** Stable per-batch accent so the same cohort always wears the same color across cards. */
const COHORT_CHIP_COLORS = ["#6366f1", "#0ea5e9", "#f59e0b", "#10b981", "#ec4899", "#8b5cf6", "#14b8a6", "#f43f5e"];
function cohortColorOf(id: number): string {
  return COHORT_CHIP_COLORS[Math.abs(id) % COHORT_CHIP_COLORS.length];
}
/** Courses are a facet too, but a muted one - batches keep the loud colors. */
const COURSE_FACET_COLOR = "#64748b";

/** Card text next to the chip: never repeat what the chip already says. */
function cardCourseText(s: StudentLiveSession): string {
  if (s.cohort_detail?.id != null && s.cohort_detail?.name) return courseTextOf(s); // chip = batch
  if (courseTextOf(s)) return ""; // chip = the course itself
  return courseOf(s); // no chip at all - keep the old text
}

/** Notes exist when the date/series has an AI summary OR a synced transcript - a transcript with
 *  no summary must still open the dialog (it renders whatever exists for the clicked date). */
export function hasNotesOf(s: StudentLiveSession): boolean {
  return Boolean(
    s.zoom_ai_summary || s.google_ai_summary || s.zoom_transcript_synced_at || s.google_transcript_synced_at
  );
}

export function fmtDay(dt?: string | null, tz?: string | null) {
  if (!dt) return { d: "", mon: "", wd: "" };
  const x = new Date(dt);
  const z = tz || undefined;
  return {
    d: x.toLocaleDateString(undefined, { day: "2-digit", timeZone: z }),
    mon: x.toLocaleDateString(undefined, { month: "short", timeZone: z }).toUpperCase(),
    wd: x.toLocaleDateString(undefined, { weekday: "short", timeZone: z }).toUpperCase(),
  };
}

/** What this session belongs to, as a prominent colored chip: the batch when there is one, else
 *  the course (muted color). Renders nothing for a fully untargeted session. */
export function CohortChip({ s, small }: { s: StudentLiveSession; small?: boolean }) {
  const cohortId = s.cohort_detail?.id;
  const cohortName = s.cohort_detail?.name;
  const courseTitle = courseTextOf(s);
  const isCohort = cohortId != null && Boolean(cohortName);
  if (!isCohort && !courseTitle) return null;
  const label = isCohort ? cohortName! : courseTitle;
  const c = isCohort ? cohortColorOf(cohortId!) : COURSE_FACET_COLOR;
  return (
    <Box
      title={label}
      sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, px: small ? 0.8 : 1,
        py: { xs: 0.4, sm: 0.2 }, borderRadius: 999,
        // 0.64rem is 10.2px. Nothing a learner has to read drops below 12px on a phone.
        fontSize: { xs: "0.75rem", sm: small ? "0.64rem" : "0.68rem" }, fontWeight: 800, color: c, flexShrink: 0,
        bgcolor: `color-mix(in srgb, ${c} 13%, transparent)`,
        border: `1px solid color-mix(in srgb, ${c} 30%, transparent)`, maxWidth: { xs: 190, sm: 170 } }}
    >
      <Icon icon={isCohort ? "mdi:account-group" : "mdi:bookmark-outline"} width={small ? 11 : 12} style={{ flexShrink: 0 }} />
      <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</Box>
    </Box>
  );
}

/** A sitting kept for its recording even though it is marked cancelled. Says so plainly rather
 *  than passing it off as a class that ran normally. */
export function CancelledSittingChip({ s }: { s: StudentLiveSession }) {
  if (!s.occurrence_cancelled) return null;
  return (
    <Box sx={{ px: 0.8, py: { xs: 0.4, sm: 0.2 }, borderRadius: 999, flexShrink: 0, whiteSpace: "nowrap",
      fontSize: { xs: "0.75rem", sm: "0.64rem" }, fontWeight: 800,
      color: "#64748b", bgcolor: "color-mix(in srgb,#64748b 12%,transparent)" }}>
      Cancelled sitting
    </Box>
  );
}

/** The day/date/month block at the left of a desktop card. Hidden on a phone, where each card
 *  states the date in words on its own line instead of spending 58px of 390 on a badge. */
function DateBadge({ dt, tz }: { dt?: string | null; tz?: string | null }) {
  const b = fmtDay(dt, tz);
  return (
    <Box sx={{ width: 58, flexShrink: 0, borderRadius: 2.5, border: "1px solid var(--border-default)", textAlign: "center", overflow: "hidden" }}>
      <Box sx={{ py: 0.3, bgcolor: "color-mix(in srgb,var(--border-default) 35%,transparent)", fontSize: "0.58rem", fontWeight: 800, color: "text.secondary" }}>{b.wd}</Box>
      <Typography sx={{ fontWeight: 900, fontSize: "1.35rem", lineHeight: 1.3 }}>{b.d}</Typography>
      <Typography sx={{ fontSize: "0.58rem", fontWeight: 800, color: "text.secondary", pb: 0.4 }}>{b.mon}</Typography>
    </Box>
  );
}

function useCountdown(target?: string | null): string | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const h = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(h);
  }, []);
  if (!target) return null;
  const diff = new Date(target).getTime() - now;
  if (diff <= 0 || diff > 24 * 3600 * 1000) return null;
  const s = Math.floor(diff / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

/**
 * Cancellation / reschedule notice from an admin or the assigned instructor.
 *
 * Rendered above everything else on the card: the student has to read WHY before they reach for a
 * join link or plan around the old time.
 */
export function SessionNotice({ s }: { s: StudentLiveSession }) {
  const kind = s.notice_type;
  if (kind !== "cancelled" && kind !== "rescheduled") return null;
  const cancelled = kind === "cancelled";
  const tone = cancelled ? "#ef4444" : "#f59e0b";
  return (
    <Box sx={{ display: "flex", gap: 1, px: { xs: 1.75, sm: 2.25 }, py: 1.25,
      bgcolor: `color-mix(in srgb, ${tone} 10%, transparent)`,
      borderBottom: `1px solid color-mix(in srgb, ${tone} 30%, transparent)` }}>
      <Icon icon={cancelled ? "mdi:calendar-remove" : "mdi:calendar-clock"} width={18} style={{ color: tone, flexShrink: 0, marginTop: 2 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", color: tone }}>
          {cancelled ? "Session cancelled" : "Session rescheduled"}
        </Typography>
        {s.notice_reason && (
          <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", wordBreak: "break-word" }}>
            {s.notice_reason}
          </Typography>
        )}
        {!cancelled && s.previous_class_datetime && (
          <Typography sx={{ fontSize: { xs: "0.78rem", sm: "0.75rem" }, color: "text.secondary", opacity: 0.8, textDecoration: "line-through" }}>
            {formatSessionTime(s.previous_class_datetime, s.timezone)}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export function UpcomingCard({ s, isNext, reminderOn, onAddCalendar, onRemind }: {
  s: StudentLiveSession; isNext: boolean; reminderOn: boolean;
  onAddCalendar: () => void; onRemind: () => void;
}) {
  const p = providerOf(s);
  // A cancelled session keeps its card - the banner is the only place a student learns WHY it is
  // off - but it must not also behave like a class that is happening. Before this, a series
  // cancelled on the 13th still showed "STARTS NEXT 05:47:30" over a "Scheduled" chip, with
  // Add to calendar and Remind me live, because those read the DATE while the banner read the
  // SERIES. Nothing to join, nothing to be reminded of, nothing to put in a calendar.
  const cancelled = s.notice_type === "cancelled";
  const countdown = useCountdown(isNext && !cancelled ? s.class_datetime : null);
  const recurring = Boolean(s.zoom_is_recurring && (s.occurrences?.length ?? 0) > 0);
  const courseText = cardCourseText(s);
  const clock = `${formatSessionClock(s.class_datetime, s.timezone)} · ${s.duration_minutes || 0}m`;
  const day = fmtDay(s.class_datetime, s.timezone);

  /*
   * One DOM tree, two readings. On a phone the card leads with the TITLE, then when it is, then
   * one scrollable chip row, then the two actions as full-width buttons; `order` on the flex
   * children does the reflow, so the desktop column (chips, title, meta, with the date badge at
   * the left and the buttons at the right) is untouched and the two cannot drift apart.
   */
  return (
    <Box data-testid="upcoming-card" sx={{ borderRadius: 3.5, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)", overflow: "hidden" }}>
      <SessionNotice s={s} />
      {isNext && countdown && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: { xs: 1.75, sm: 2.25 }, py: 0.75, background: "color-mix(in srgb,#7c3aed 8%,transparent)" }}>
          <Typography sx={{ fontSize: { xs: "0.75rem", sm: "0.66rem" }, fontWeight: 800, letterSpacing: 0.6, color: "#7c3aed" }}>✦ STARTS NEXT</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", fontVariantNumeric: "tabular-nums", color: "#7c3aed" }}>{countdown}</Typography>
        </Stack>
      )}
      <Box sx={{ p: { xs: 1.75, sm: 2.25 }, display: "flex", gap: { xs: 0, sm: 2 }, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* The date badge becomes the phone card's "when" line instead, so it does not spend 58px
            of a 390px row repeating what that line already says. */}
        <Box sx={{ display: { xs: "none", sm: "block" }, flexShrink: 0 }}>
          <DateBadge dt={s.class_datetime} tz={s.timezone} />
        </Box>
        <Box data-testid="upcoming-info" sx={{ flex: 1, width: { xs: "100%", sm: "auto" }, minWidth: { xs: 0, sm: 200 }, display: "flex", flexDirection: "column", [PHONE]: { flexBasis: "100%" } }}>
          <ScrollRow
            ariaLabel="Session details"
            gutter={1.75}
            gap={0.5}
            sx={{ order: { xs: 3, sm: 1 }, mt: { xs: 1, sm: 0 }, mb: { xs: 0, sm: 0.5 }, pb: { xs: 0.5, sm: 0 }, alignItems: "center",
              // From sm up this is the wrapping row it always was: same 10px spacing, no scroller.
              gap: { xs: 0.5, sm: "4px 10px" },
              flexWrap: { xs: "nowrap", sm: "wrap" }, overflowX: { xs: "auto", sm: "visible" }, overflowY: { xs: "hidden", sm: "visible" },
              "& > *": { scrollSnapAlign: "start", flexShrink: 0 } }}
          >
            <Box sx={{ px: 0.9, py: { xs: 0.4, sm: 0.2 }, borderRadius: 999, whiteSpace: "nowrap",
              bgcolor: cancelled ? "color-mix(in srgb,#ef4444 12%,transparent)" : "color-mix(in srgb,#8b5cf6 14%,transparent)",
              color: cancelled ? "#b91c1c" : "#6d28d9", fontSize: { xs: "0.75rem", sm: "0.66rem" }, fontWeight: 800 }}>{cancelled ? "Cancelled" : "Scheduled"}</Box>
            <Stack direction="row" spacing={0.35} alignItems="center" sx={{ color: p.color }}><Icon icon={p.icon} width={14} /><Typography sx={{ fontSize: { xs: "0.75rem", sm: "0.72rem" }, fontWeight: 700, whiteSpace: "nowrap" }}>{p.label}</Typography></Stack>
            <CohortChip s={s} />
            {/* The clock rides in this row on a desktop and gets its own line on a phone, below. */}
            <Typography sx={{ display: { xs: "none", sm: "block" }, fontSize: "0.72rem", color: "text.secondary", whiteSpace: "nowrap" }}>{clock}</Typography>
            {recurring && <Box sx={{ px: 0.8, py: { xs: 0.4, sm: 0.2 }, borderRadius: 999, whiteSpace: "nowrap", bgcolor: "color-mix(in srgb,#6366f1 12%,transparent)", color: "#4f46e5", fontSize: { xs: "0.75rem", sm: "0.64rem" }, fontWeight: 800 }}>Recurring</Box>}
          </ScrollRow>
          <Typography sx={{ order: { xs: 1, sm: 2 }, fontWeight: 800, fontSize: { xs: "1.02rem", sm: "1.05rem" }, lineHeight: { xs: 1.25, sm: 1.2 }, wordBreak: "break-word" }}>{s.topic_name}</Typography>
          <Typography data-testid="session-when" sx={{ order: 2, display: { xs: "block", sm: "none" }, mt: 0.5, fontSize: "0.85rem", fontWeight: 700, color: "var(--font-secondary)" }}>
            {day.d ? `${day.wd} ${day.d} ${day.mon} · ` : ""}{clock}
          </Typography>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ order: { xs: 4, sm: 3 }, mt: { xs: 0.75, sm: 0.4 }, color: "text.secondary", flexWrap: "wrap", gap: 0.5, minWidth: 0 }}>
            {s.instructor && <Stack direction="row" spacing={0.4} alignItems="center" sx={{ minWidth: 0 }}><Icon icon="mdi:account-outline" width={13} /><Typography sx={{ fontSize: "0.8rem" }}>{s.instructor}</Typography></Stack>}
            {/* The batch already has its chip above, so this line is course-only when one exists. */}
            {courseText && <Stack direction="row" spacing={0.4} alignItems="center" sx={{ minWidth: 0 }}><Icon icon="mdi:bookmark-outline" width={13} /><Typography sx={{ fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{courseText}</Typography></Stack>}
          </Stack>
          {recurring && s.recurrence_summary && (
            <Typography sx={{ order: { xs: 5, sm: 4 }, mt: 1, fontSize: "0.78rem", fontWeight: 700, color: "#6366f1" }}>
              {s.recurrence_summary}
            </Typography>
          )}
        </Box>
        {!cancelled && (
        <Stack data-testid="upcoming-actions" spacing={1} sx={{ order: { xs: 6, sm: 0 }, width: { xs: "100%", sm: "auto" }, minWidth: { sm: 168 }, mt: { xs: 1.5, sm: 0 },
          "& > *": { minHeight: { xs: 48, sm: "auto" } } }}>
          <Button onClick={onAddCalendar}
            startIcon={<Icon icon="mdi:calendar-plus" width={16} />}
            sx={{ textTransform: "none", fontWeight: 800, color: "#fff", py: 1, borderRadius: 2, background: AI_GRAD, "&:hover": { filter: "brightness(1.06)" } }}>
            Add to calendar
          </Button>
          <Button onClick={onRemind}
            startIcon={<Icon icon={reminderOn ? "mdi:bell-check" : "mdi:bell-outline"} width={16} />}
            sx={{ textTransform: "none", fontWeight: 700, py: 1, borderRadius: 2, border: "1px solid var(--border-default)",
              color: reminderOn ? "#059669" : "var(--font-primary)", bgcolor: reminderOn ? "color-mix(in srgb,#10b981 8%,transparent)" : "transparent" }}>
            {reminderOn ? "Reminder on" : "Remind me"}
          </Button>
        </Stack>
        )}
      </Box>

      {/* Anything the trainer has already shared for this upcoming session — so a learner can
          prepare before it starts, not only afterwards. */}
      <Box sx={{ px: { xs: 1.25, sm: 2.25 }, pb: { xs: 1.25, sm: 1.75 } }}>
        <SessionMaterialsDisclosure liveClassId={s.id} occurrenceId={s.occurrence_id} />
      </Box>
    </Box>
  );
}

export function RecordingCard({ s, watching, onWatch, onSummary }: { s: StudentLiveSession; watching: boolean; onWatch: () => void; onSummary: () => void }) {
  // Not gated on the AI summary: a date with a transcript but no summary still has notes to show,
  // and the dialog renders whatever exists for the clicked date.
  const hasNotes = hasNotesOf(s);
  const day = fmtDay(s.class_datetime, s.timezone);
  return (
    <Box data-testid="recording-card" sx={{ borderRadius: 3, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)", p: { xs: 1.75, sm: 2 } }}>
      <Box sx={{ display: "flex", gap: { xs: 0, sm: 1.75 }, alignItems: { xs: "flex-start", sm: "center" }, flexWrap: "wrap" }}>
      <Box sx={{ display: { xs: "none", sm: "block" }, flexShrink: 0 }}>
        <DateBadge dt={s.class_datetime} tz={s.timezone} />
      </Box>
      <Box data-testid="recording-info" sx={{ flex: 1, width: { xs: "100%", sm: "auto" }, minWidth: { xs: 0, sm: 180 }, [PHONE]: { flexBasis: "100%" } }}>
        {/* Title on its own line on a phone, with the chips under it — on one line they squeezed
            the title to three ellipsed words. */}
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0, flexWrap: { xs: "wrap", sm: "nowrap" }, rowGap: 0.5 }}>
          <Typography sx={{ fontWeight: 800, fontSize: "1rem", minWidth: 0, lineHeight: { xs: 1.3, sm: 1.5 },
            width: { xs: "100%", sm: "auto" },
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: { xs: "normal", sm: "nowrap" } }}>{s.topic_name}</Typography>
          <CohortChip s={s} small />
          <CancelledSittingChip s={s} />
        </Stack>
        {/* The date badge is desktop-only now, so the phone card states the date in words. */}
        {day.d && (
          <Typography data-testid="session-when" sx={{ display: { xs: "block", sm: "none" }, mt: 0.5, fontSize: "0.85rem", fontWeight: 700, color: "var(--font-secondary)" }}>
            {day.wd} {day.d} {day.mon}
          </Typography>
        )}
        <Typography sx={{ fontSize: { xs: "0.82rem", sm: "0.8rem" }, color: "text.secondary", mt: { xs: 0.25, sm: 0 } }}>
          {cardCourseText(s) || (s.has_recording ? "Recording available" : "Transcript available")}
        </Typography>
      </Box>
      {/* Watch is the point of this card, so on a phone it spans the width instead of sitting as
          a 90px pill at the right edge. */}
      <Stack data-testid="recording-actions" direction="row" spacing={1} sx={{ width: { xs: "100%", sm: "auto" }, mt: { xs: 1.5, sm: 0 }, flexShrink: 0,
        "& > *": { flex: { xs: 1, sm: "0 0 auto" }, minHeight: { xs: 44, sm: "auto" } } }}>
        {hasNotes && (
          <Button onClick={onSummary} startIcon={<Icon icon="mdi:text-box-outline" width={16} />}
            sx={{ textTransform: "none", fontWeight: 700, color: "#6366f1", px: 1.5, py: 0.8, borderRadius: 2, border: "1px solid var(--border-default)" }}>
            Notes
          </Button>
        )}
        {s.has_recording && (
          <Button onClick={onWatch} disabled={watching}
            startIcon={watching ? <CircularProgress size={14} color="inherit" /> : <Icon icon="mdi:play" width={16} />}
            sx={{ textTransform: "none", fontWeight: 800, color: "#fff", px: 2, py: 0.8, borderRadius: 2, background: AI_GRAD }}>
            Watch
          </Button>
        )}
      </Stack>
      </Box>
      {/* The trainer's files for this date. This tab is the ONLY one that keeps dates from
          before a student joined the batch -- History drops them so nobody is stamped "Missed"
          for a class that ran before they arrived. Without this the material for those dates
          was reachable from nowhere, though the API served it to them perfectly well. */}
      {/* Fails OPEN: only an explicit `false` hides it. A payload without the field -- an older
          cached response, a deploy skew -- keeps the toggle, because a wrong flag here would
          re-hide the very files this card exists to surface. */}
      {s.has_materials !== false && (
        <SessionMaterialsDisclosure liveClassId={s.id} occurrenceId={s.occurrence_id} dense />
      )}
    </Box>
  );
}

export function HistoryRow({ s, watching, onWatch, onGiveFeedback }: {
  s: StudentLiveSession; watching?: boolean; onWatch?: () => void; onGiveFeedback?: () => void;
}) {
  const attended = Boolean(s.my_attendance?.attended);
  // Strictly === false: undefined means an older payload or a non-expanded single session, and
  // those keep the two-state behaviour. A cancelled sitting keeps its own story too.
  const neverRan = !attended && s.occurrence_ran === false && !s.occurrence_cancelled
    && s.notice_type !== "cancelled";
  // The chip says what this session belongs to, so the text line never repeats it.
  const courseText = cardCourseText(s);
  return (
    <Box data-testid="history-row" sx={{ borderRadius: 3, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)", p: { xs: 1.5, sm: 1.75 } }}>
    <Box sx={{ display: "flex", gap: { xs: 1.25, sm: 1.5 }, alignItems: { xs: "flex-start", sm: "center" }, flexWrap: "wrap" }}>
      <Icon
        icon={attended ? "mdi:check-circle" : neverRan ? "mdi:calendar-remove-outline" : "mdi:close-circle-outline"}
        width={22}
        style={{ color: attended ? "#10b981" : "#94a3b8", flexShrink: 0 }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Six things on one 390px line put the title into two ellipsed words. The title wraps on
            a phone and everything else drops to a second row below it. */}
        <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", lineHeight: { xs: 1.3, sm: 1.5 }, minWidth: 0,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: { xs: "normal", sm: "nowrap" } }}>{s.topic_name}</Typography>
        <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
          {s.class_datetime ? formatSessionTime(s.class_datetime, s.timezone, { format: { month: "short", day: "numeric" }, dual: false, showZone: false }) : ""}
          {courseText ? ` · ${courseText}` : ""}
        </Typography>
      </Box>
      {/* On a phone the row starts under the title, not under the 22px status icon (icon + 10px gap). */}
      <Box data-testid="history-meta" sx={{ order: { xs: 3, sm: 0 }, width: { xs: "100%", sm: "auto" }, mt: { xs: 1, sm: 0 },
        pl: { xs: "32px", sm: 0 }, boxSizing: "border-box",
        display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 }, flexWrap: "wrap", minWidth: 0 }}>
        <CohortChip s={s} small />
        <CancelledSittingChip s={s} />
        {/* Three states, not two. "Missed" blames the student; a sitting the host never opened
            (no start, no attendance report, no recording — it simply expired) is nobody's miss,
            and it is already out of the attendance denominator server-side. */}
        <Box sx={{ px: 1, py: { xs: 0.5, sm: 0.3 }, borderRadius: 999, whiteSpace: "nowrap",
          fontSize: { xs: "0.75rem", sm: "0.68rem" }, fontWeight: 800,
          color: attended ? "#059669" : "#64748b", bgcolor: attended ? "color-mix(in srgb,#10b981 12%,transparent)" : "color-mix(in srgb,#64748b 12%,transparent)" }}>
          {attended ? "Attended" : neverRan ? "Didn't run" : "Missed"}
        </Box>
        {/* Pushes the two actions to the far edge of the phone row, clear of the status pill. */}
        <Box sx={{ flexGrow: 1, display: { xs: "block", sm: "none" } }} />
        {/* This glyph always looked like a play button; now it is one, opening the same in-app
            player the Recordings tab uses for this date. */}
        {s.has_recording && onWatch && (
          <Tooltip title="Watch recording">
            <IconButton size="small" aria-label="Watch recording" disabled={watching} onClick={onWatch}
              sx={{ width: { xs: 44, sm: "auto" }, height: { xs: 44, sm: "auto" }, flexShrink: 0 }}>
              {watching
                ? <CircularProgress size={16} sx={{ color: "#7c3aed" }} />
                : <Icon icon="mdi:play-circle-outline" width={18} style={{ color: "#7c3aed" }} />}
            </IconButton>
          </Tooltip>
        )}
        {/* Nothing to rate on a session that was called off — or one that never took place. */}
        {onGiveFeedback && s.notice_type !== "cancelled" && !neverRan && (
          <Button onClick={onGiveFeedback} size="small" startIcon={<Icon icon="mdi:star-outline" width={16} />}
            sx={{ textTransform: "none", fontWeight: 700, color: "#7c3aed", minWidth: 0, flexShrink: 0,
              px: { xs: 1.5, sm: "5px" }, minHeight: { xs: 44, sm: "auto" } }}>
            Rate
          </Button>
        )}
      </Box>
    </Box>
    {/* What the trainer shared for this session. Collapsed so a long history stays scannable, and
        only fetched when opened. */}
    <SessionMaterialsDisclosure liveClassId={s.id} occurrenceId={s.occurrence_id} dense />
    </Box>
  );
}
