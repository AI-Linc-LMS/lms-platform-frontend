"use client";

import { Box, ButtonBase, CircularProgress, IconButton, Tooltip, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { StatusChip, type ChipTone } from "@/components/admin/assessment/shared";

/**
 * Minimal session shape the card renders. Both the admin `LiveActivity` and the
 * student `StudentLiveSession` structurally satisfy this, so the card is shared.
 */
export interface LiveSessionCardData {
  id: number;
  topic_name?: string;
  class_datetime?: string | null;
  duration_minutes?: number;
  is_zoom?: boolean;
  is_google_meet?: boolean;
  zoom_meeting_type?: "meeting" | "webinar" | null;
  zoom_meeting_id?: string | null;
  join_link?: string | null;
  zoom_join_url?: string | null;
  zoom_start_url?: string | null;
  zoom_password?: string | null;
  zoom_recording_url?: string | null;
  zoom_status?: "scheduled" | "cancelled" | null;
  google_status?: "scheduled" | "cancelled" | null;
  meeting_status?: "scheduled" | "live" | "ended" | "expired" | null;
  course_detail?: { title?: string } | null;
  attendance_count?: number;
  /** Recurring series (admin LiveActivity only; student sessions omit these). */
  zoom_is_recurring?: boolean;
  recurrence_summary?: string | null;
  /** Provider-neutral artifacts (serializer-computed / Google poller-populated). */
  has_recording?: boolean;
  recording_link?: string | null;
  google_artifacts_status?: string | null;
  zoom_ai_summary?: string | null;
  google_ai_summary?: string | null;
}

/**
 * Live-session card shared by the admin and student lists. Matches the assessment-catalog card
 * grammar (status pill + attribute chips row, title, a mono mini-stats strip, a meta line, and a
 * bottom-pinned CTA) for a consistent, roomy, uncluttered look. Its action set is fully prop-driven
 * so the same card serves both audiences:
 *   - admin: contextual primary action (Create Zoom / Start / Join / Watch) + a Manage affordance;
 *     the whole card is clickable.
 *   - student: just Join / Watch recording (+ copy passcode).
 * Only actions whose handlers are supplied are rendered.
 */

export interface LiveSessionCardProps<T extends LiveSessionCardData = LiveSessionCardData> {
  session: T;
  variant?: "admin" | "student";
  /** Overrides session.attendance_count (e.g. de-duplicated unique attendee count). */
  attendanceCount?: number;
  creatingZoom?: boolean;
  creatingGoogleMeet?: boolean;
  watchingRecording?: boolean;
  /** Admin: open the detail page. When set, the card body is clickable. */
  onOpen?: (session: T) => void;
  onCreateZoom?: (session: T) => void;
  /** Admin: provision the Google Meet for a session flagged as Meet but not yet created. */
  onCreateGoogleMeet?: (session: T) => void;
  onStart?: (session: T) => void;
  onJoin?: (session: T) => void;
  onCopyPasscode?: (password: string) => void;
  onWatchRecording?: (session: T) => void;
  /** Ended sessions with an AI summary/transcript: open the session summary dialog. */
  onViewSummary?: (session: T) => void;
  formatDateTime?: (dateString: string) => string;
}

// Meeting status → chip tone + label.
const STATUS_CHIP: Record<string, { tone: ChipTone; label: string }> = {
  live: { tone: "success", label: "Live now" },
  scheduled: { tone: "info", label: "Scheduled" },
  ended: { tone: "neutral", label: "Ended" },
  expired: { tone: "warning", label: "Expired" },
  cancelled: { tone: "error", label: "Cancelled" },
};

// Primary-action button gradient by intent.
const CTA_GRADIENT = {
  green: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  indigo: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
} as const;

function platformChip(session: LiveSessionCardData): { label: string; icon: string; tone: ChipTone } {
  if (session.is_google_meet) return { label: "Google Meet", icon: "mdi:google", tone: "success" };
  if (session.zoom_meeting_type === "webinar") return { label: "Webinar", icon: "mdi:presentation", tone: "info" };
  if (session.is_zoom || session.zoom_meeting_id) return { label: "Zoom", icon: "mdi:video-outline", tone: "info" };
  return { label: "Session", icon: "mdi:calendar-clock", tone: "neutral" };
}

interface PrimaryAction {
  label: string;
  icon: string;
  onClick: () => void;
  tone: keyof typeof CTA_GRADIENT;
  loading?: boolean;
}

export function LiveSessionCard<T extends LiveSessionCardData>({
  session,
  variant = "admin",
  attendanceCount,
  creatingZoom = false,
  creatingGoogleMeet = false,
  watchingRecording = false,
  onOpen,
  onCreateZoom,
  onCreateGoogleMeet,
  onStart,
  onJoin,
  onCopyPasscode,
  onWatchRecording,
  onViewSummary,
  formatDateTime,
}: LiveSessionCardProps<T>) {
  const { t } = useTranslation("common");
  const isAdmin = variant === "admin";

  // Cancelled is provider-agnostic: a cancelled Google session keeps a dead Meet link.
  const isCancelled = session.zoom_status === "cancelled" || session.google_status === "cancelled";
  const status = isCancelled ? "cancelled" : session.meeting_status ?? "scheduled";
  const statusChip = STATUS_CHIP[status] ?? STATUS_CHIP.scheduled;
  const isUpcomingOrLive = status === "scheduled" || status === "live";
  const isDone = status === "ended" || status === "expired";

  const joinUrl = session.is_google_meet ? session.join_link?.trim() : session.zoom_join_url?.trim();
  const hasMeeting = Boolean(session.is_google_meet || session.zoom_meeting_id || session.zoom_join_url);
  const hasRecording = Boolean(
    session.has_recording || session.zoom_recording_url?.trim() || session.recording_link?.trim()
  );
  const hasSummary = Boolean(session.zoom_ai_summary || session.google_ai_summary);
  const artifactsStatus = (session.google_artifacts_status || "").toLowerCase();
  const recordingHint =
    isDone && !hasRecording && session.is_google_meet
      ? artifactsStatus === "pending" || artifactsStatus === "processing"
        ? t("liveSessions.recordingProcessing", "Recording is processing - check back soon.")
        : artifactsStatus === "needs_reconnect"
          ? t("liveSessions.recordingNeedsReconnect", "Recording pending a Google reconnect by your admin.")
          : t("liveSessions.noRecordingAvailable", "No recording was made for this session.")
      : null;

  // Compute the single most relevant primary action for the current state.
  function primaryAction(): PrimaryAction | null {
    if (isCancelled) return null;
    if (isDone) {
      if (hasRecording && onWatchRecording) {
        return {
          label: t("liveSessions.watchRecording", "Watch recording"),
          icon: "mdi:play-circle-outline",
          onClick: () => onWatchRecording(session),
          tone: "green",
          loading: watchingRecording,
        };
      }
      return null;
    }
    if (isUpcomingOrLive) {
      if (isAdmin && session.zoom_start_url && onStart) {
        return { label: t("adminLiveSessions.startMeeting", "Start session"), icon: "mdi:video", onClick: () => onStart(session), tone: "green" };
      }
      if (joinUrl && onJoin) {
        return { label: t("liveSessions.join", "Join"), icon: "mdi:video", onClick: () => onJoin(session), tone: "green" };
      }
      if (isAdmin && session.is_google_meet && !joinUrl && onCreateGoogleMeet) {
        return {
          label: t("adminLiveSessions.createGoogleMeet", "Create Google Meet"),
          icon: "mdi:google",
          onClick: () => onCreateGoogleMeet(session),
          tone: "indigo",
          loading: creatingGoogleMeet,
        };
      }
      if (isAdmin && !hasMeeting && onCreateZoom) {
        return {
          label: t("adminLiveSessions.createZoom", "Create Zoom session"),
          icon: "mdi:video-plus",
          onClick: () => onCreateZoom(session),
          tone: "indigo",
          loading: creatingZoom,
        };
      }
    }
    return null;
  }

  const primary = primaryAction();
  const showCopyPasscode = isUpcomingOrLive && Boolean(session.zoom_password) && Boolean(onCopyPasscode);
  const clickable = isAdmin && Boolean(onOpen);
  const platform = platformChip(session);
  const attendees = attendanceCount ?? session.attendance_count ?? 0;

  // Compact strip values.
  const dt = session.class_datetime ? new Date(session.class_datetime) : null;
  const validDt = dt && !isNaN(dt.getTime()) ? dt : null;
  const dateStr = validDt ? validDt.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "-";
  const timeStr = validDt ? validDt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "-";
  const durStr = session.duration_minutes ? `${session.duration_minutes}m` : "-";

  // Meta line (like the assessment "deadline" line): recurrence > course > one-time.
  const metaText = session.recurrence_summary
    ? session.recurrence_summary
    : session.course_detail?.title
      ? session.course_detail.title
      : t("liveSessions.oneTimeSession", "One-time session");
  const metaIcon = session.recurrence_summary ? "mdi:calendar-refresh" : session.course_detail?.title ? "mdi:book-open-variant" : "mdi:calendar-blank-outline";

  const iconBtnSx = {
    color: "var(--accent-indigo)",
    border: "1px solid color-mix(in srgb, var(--accent-indigo) 30%, transparent)",
    borderRadius: "12px",
    "&:hover": { background: "color-mix(in srgb, var(--accent-indigo) 8%, transparent)" },
  } as const;

  return (
    <Box
      onClick={clickable ? () => onOpen!(session) : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        p: 2.5,
        bgcolor: "var(--card-bg)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-card)",
        boxShadow: "none",
        overflow: "hidden",
        cursor: clickable ? "pointer" : "default",
        opacity: isCancelled ? 0.75 : 1,
        transition: "border-color .2s",
        ...(clickable && {
          "&:hover": { borderColor: "color-mix(in srgb, var(--ai-violet) 30%, var(--border-default))" },
        }),
      }}
    >
      {/* Row 1 - status pill (left) + platform / recurring chips (right) */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, flexWrap: "wrap" }}>
        <StatusChip label={statusChip.label} tone={statusChip.tone} />
        <Box sx={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {session.zoom_is_recurring && <StatusChip label={t("adminLiveSessions.recurring", "Recurring")} tone="ai" icon="mdi:calendar-refresh" />}
          <StatusChip label={platform.label} tone={platform.tone} icon={platform.icon} />
        </Box>
      </Box>

      {/* Title */}
      <Typography
        component="h3"
        sx={{
          fontWeight: 700,
          fontSize: "1.0625rem",
          lineHeight: 1.35,
          color: "var(--font-primary)",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          wordBreak: "break-word",
        }}
      >
        {session.topic_name || t("adminLiveSessions.untitledSession", "Untitled session")}
      </Typography>

      {/* Mini-stats strip: date · time · duration */}
      <Box
        sx={{
          display: "flex",
          alignItems: "stretch",
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "12px",
          p: 1.25,
        }}
      >
        {[
          { value: dateStr, label: t("liveSessions.date", "Date") },
          { value: timeStr, label: t("liveSessions.time", "Time") },
          { value: durStr, label: t("liveSessions.duration", "Duration") },
        ].map((cell, i) => (
          <Box
            key={cell.label}
            sx={{ flex: 1, minWidth: 0, textAlign: "center", px: 0.75, ...(i > 0 && { borderInlineStart: "1px solid var(--border-default)" }) }}
          >
            <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.98rem", lineHeight: 1.2, color: "var(--font-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {cell.value}
            </Typography>
            <Typography sx={{ mt: 0.25, fontSize: "0.68rem", letterSpacing: "0.02em", color: "var(--font-tertiary)" }}>
              {cell.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Meta line: recurrence / course / one-time, plus attendance for admins */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap", minWidth: 0 }}>
        <IconWrapper icon={metaIcon} size={16} color="var(--font-secondary)" />
        <Typography sx={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--font-secondary)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {metaText}
        </Typography>
        {isAdmin && attendees > 0 && (
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, ml: 0.25 }}>
            <Box aria-hidden sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: "var(--font-tertiary)" }} />
            <IconWrapper icon="mdi:account-group-outline" size={15} color="var(--font-secondary)" />
            <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--font-secondary)" }}>
              {attendees}
            </Typography>
          </Box>
        )}
      </Box>

      {recordingHint && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <IconWrapper icon="mdi:movie-open-off-outline" size={15} color="var(--font-tertiary)" />
          <Typography sx={{ fontSize: "0.76rem", color: "var(--font-tertiary)" }}>{recordingHint}</Typography>
        </Box>
      )}

      {/* Spacer pins the CTA row to the bottom */}
      <Box sx={{ flexGrow: 1 }} />

      {/* Actions */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "stretch" }} onClick={(e) => e.stopPropagation()}>
        {primary ? (
          <ButtonBase
            onClick={primary.onClick}
            disabled={primary.loading}
            sx={{
              flex: 1, py: 1.1, borderRadius: "12px", fontWeight: 700, fontSize: "0.9rem",
              color: "white", background: CTA_GRADIENT[primary.tone],
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 0.75,
              opacity: primary.loading ? 0.7 : 1,
            }}
          >
            {primary.loading ? <CircularProgress size={16} sx={{ color: "white" }} /> : <IconWrapper icon={primary.icon} size={18} color="white" />}
            {primary.label}
          </ButtonBase>
        ) : isAdmin && onOpen ? (
          <ButtonBase
            onClick={() => onOpen(session)}
            sx={{
              flex: 1, py: 1.1, borderRadius: "12px", fontWeight: 700, fontSize: "0.9rem",
              color: "var(--font-secondary)", border: "1px solid var(--border-default)",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 0.75,
              "&:hover": { borderColor: "color-mix(in srgb, var(--ai-violet) 30%, var(--border-default))" },
            }}
          >
            <IconWrapper icon="mdi:cog-outline" size={18} color="var(--font-secondary)" />
            {t("adminLiveSessions.manage", "Manage")}
          </ButtonBase>
        ) : null}

        {showCopyPasscode && (
          <Tooltip title={t("adminLiveSessions.copyPasscode", "Copy passcode")} placement="top">
            <IconButton onClick={() => onCopyPasscode!(session.zoom_password!)} aria-label={t("adminLiveSessions.copyPasscode", "Copy passcode")} sx={iconBtnSx}>
              <IconWrapper icon="mdi:key-variant" size={18} />
            </IconButton>
          </Tooltip>
        )}

        {isDone && hasSummary && onViewSummary && (
          <Tooltip title={t("liveSessions.viewSummary", "View session summary")} placement="top">
            <IconButton onClick={() => onViewSummary(session)} aria-label={t("liveSessions.viewSummary", "View session summary")} sx={iconBtnSx}>
              <IconWrapper icon="mdi:text-box-outline" size={18} />
            </IconButton>
          </Tooltip>
        )}

        {/* Admin: dedicated Manage affordance when a contextual primary already occupies the CTA */}
        {isAdmin && primary && onOpen && (
          <Tooltip title={t("adminLiveSessions.manage", "Manage")} placement="top">
            <IconButton
              onClick={() => onOpen(session)}
              aria-label={t("adminLiveSessions.manage", "Manage")}
              sx={{ color: "var(--font-secondary)", border: "1px solid var(--border-default)", borderRadius: "12px", "&:hover": { background: "color-mix(in srgb, var(--accent-indigo) 8%, transparent)" } }}
            >
              <IconWrapper icon="mdi:cog-outline" size={18} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}
