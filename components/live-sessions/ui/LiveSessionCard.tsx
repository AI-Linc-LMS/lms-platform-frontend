"use client";

import { Box, ButtonBase, CircularProgress, IconButton, Tooltip, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { MeetingStatusChip, PlatformChip } from "./LiveSessionUI";

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
  /** Provider-neutral artifacts (serializer-computed / Google poller-populated). */
  has_recording?: boolean;
  recording_link?: string | null;
  google_artifacts_status?: string | null;
  zoom_ai_summary?: string | null;
  google_ai_summary?: string | null;
}

/**
 * Glass session card shared by the admin and student live-session lists. Mirrors
 * the adaptive `AdminQuizCard` look (top gradient strip, icon badge, status
 * eyebrow, meta line, gradient CTA) but its action set is fully prop-driven so
 * the same card serves both audiences:
 *   - admin: contextual primary action (Create Zoom / Start / Join / Watch) plus a
 *     "Manage" affordance that opens the detail page; the whole card is clickable.
 *   - student: just Join / Watch recording (+ copy passcode), no manage/open.
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

const STATUS_ACCENT: Record<string, { start: string; end: string }> = {
  live: { start: "#10b981", end: "#047857" },
  scheduled: { start: "#6366f1", end: "#4338ca" },
  ended: { start: "#94a3b8", end: "#475569" },
  expired: { start: "#f59e0b", end: "#b45309" },
  cancelled: { start: "#ef4444", end: "#b91c1c" },
};

function platformIcon(session: LiveSessionCardData): string {
  if (session.is_google_meet) return "mdi:google";
  if (session.zoom_meeting_type === "webinar") return "mdi:presentation";
  if (session.is_zoom || session.zoom_meeting_id) return "mdi:video-outline";
  return "mdi:calendar-clock";
}

interface PrimaryAction {
  label: string;
  icon: string;
  onClick: () => void;
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

  // Cancelled is provider-agnostic: a cancelled Google session keeps a dead Meet link and
  // used to render as joinable because only zoom_status was consulted.
  const isCancelled = session.zoom_status === "cancelled" || session.google_status === "cancelled";
  const status = isCancelled ? "cancelled" : session.meeting_status ?? "scheduled";
  const accent = STATUS_ACCENT[status] ?? STATUS_ACCENT.scheduled;
  const isUpcomingOrLive = status === "scheduled" || status === "live";
  const isDone = status === "ended" || status === "expired";

  const joinUrl = session.is_google_meet ? session.join_link?.trim() : session.zoom_join_url?.trim();
  const hasMeeting = Boolean(session.is_google_meet || session.zoom_meeting_id || session.zoom_join_url);
  // Anything watchable, any provider: serializer flag first (covers Google Drive recordings,
  // which never surface a URL on the card), then legacy per-field fallbacks.
  const hasRecording = Boolean(
    session.has_recording || session.zoom_recording_url?.trim() || session.recording_link?.trim()
  );
  const hasSummary = Boolean(session.zoom_ai_summary || session.google_ai_summary);
  // Ended Google session with no recording yet: tell the viewer WHY the card has no CTA
  // instead of rendering a dead card ("processing" polls for up to ~48h; then unavailable).
  const artifactsStatus = (session.google_artifacts_status || "").toLowerCase();
  const recordingHint =
    isDone && !hasRecording && session.is_google_meet
      ? artifactsStatus === "pending" || artifactsStatus === "processing"
        ? t("liveSessions.recordingProcessing", "Recording is processing — check back soon.")
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
          loading: watchingRecording,
        };
      }
      return null;
    }
    if (isUpcomingOrLive) {
      if (isAdmin && session.zoom_start_url && onStart) {
        return { label: t("adminLiveSessions.startMeeting", "Start session"), icon: "mdi:video", onClick: () => onStart(session) };
      }
      if (joinUrl && onJoin) {
        return { label: t("liveSessions.join", "Join"), icon: "mdi:video", onClick: () => onJoin(session) };
      }
      // Google Meet flagged but not yet provisioned (no link) — offer to create it, mirroring
      // the Zoom "Create" affordance. Checked before the Zoom branch since such a session is
      // already is_google_meet (so hasMeeting is true and the Zoom branch wouldn't fire).
      if (isAdmin && session.is_google_meet && !joinUrl && onCreateGoogleMeet) {
        return {
          label: t("adminLiveSessions.createGoogleMeet", "Create Google Meet"),
          icon: "mdi:google",
          onClick: () => onCreateGoogleMeet(session),
          loading: creatingGoogleMeet,
        };
      }
      if (isAdmin && !hasMeeting && onCreateZoom) {
        return {
          label: t("adminLiveSessions.createZoom", "Create Zoom session"),
          icon: "mdi:video-plus",
          onClick: () => onCreateZoom(session),
          loading: creatingZoom,
        };
      }
    }
    return null;
  }

  const primary = primaryAction();
  const showCopyPasscode = isUpcomingOrLive && Boolean(session.zoom_password) && Boolean(onCopyPasscode);
  const clickable = isAdmin && Boolean(onOpen);

  const fmt = (s?: string | null) =>
    s ? (formatDateTime ? formatDateTime(s) : new Date(s).toLocaleString()) : "—";

  return (
    <Box
      component={motion.div}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      onClick={clickable ? () => onOpen!(session) : undefined}
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 4,
        height: "100%",
        cursor: clickable ? "pointer" : "default",
        bgcolor: "var(--card-bg)",
        border: `1px solid color-mix(in srgb, ${accent.start} 22%, transparent)`,
        boxShadow:
          "0 1px 0 0 color-mix(in srgb, white 16%, transparent) inset, 0 24px 50px -32px rgba(15, 23, 42, 0.18)",
        display: "flex",
        flexDirection: "column",
        opacity: isCancelled ? 0.7 : 1,
        transition: "opacity 220ms ease, box-shadow 220ms ease, border-color 220ms ease",
        "&:hover": {
          borderColor: `color-mix(in srgb, ${accent.start} 38%, transparent)`,
          boxShadow: `0 1px 0 0 color-mix(in srgb, white 16%, transparent) inset, 0 36px 70px -32px color-mix(in srgb, ${accent.start} 30%, transparent)`,
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
          background: `linear-gradient(90deg, ${accent.start} 0%, ${accent.end} 100%)`,
          zIndex: 2,
        }}
      />

      <Box sx={{ p: { xs: 2.5, md: 2.75 }, pt: 3, display: "flex", flexDirection: "column", gap: 1.5, flex: 1 }}>
        {/* Header: platform icon badge + badges + topic */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: 2.25,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, ${accent.start} 0%, ${accent.end} 100%)`,
              color: "white",
              boxShadow: `0 12px 28px -10px color-mix(in srgb, ${accent.end} 60%, transparent)`,
              flexShrink: 0,
            }}
          >
            <IconWrapper icon={platformIcon(session)} size={23} color="white" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6, mb: 0.6 }}>
              <MeetingStatusChip status={session.meeting_status} cancelled={isCancelled} />
              <PlatformChip
                isZoom={session.is_zoom}
                isGoogleMeet={session.is_google_meet}
                zoomMeetingType={session.zoom_meeting_type}
              />
            </Box>
            <Typography
              component="h3"
              sx={{
                fontSize: { xs: "1.1rem", md: "1.18rem" },
                fontWeight: 800,
                lineHeight: 1.25,
                letterSpacing: "-0.01em",
                color: "var(--font-primary)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {session.topic_name || t("adminLiveSessions.untitledSession", "Untitled session")}
            </Typography>
          </Box>
        </Box>

        {/* Hairline separator */}
        <Box aria-hidden sx={{ mt: "auto", height: 1, bgcolor: "color-mix(in srgb, var(--border-default) 60%, transparent)", mb: 0.25 }} />

        {/* Meta line: datetime · duration · course */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
          <MetaItem icon="mdi:calendar-clock" accent={accent.start} text={fmt(session.class_datetime)} />
          {session.duration_minutes ? (
            <>
              <Dot />
              <MetaItem icon="mdi:timer-outline" accent={accent.start} text={`${session.duration_minutes} ${t("liveSessions.minShort", "min")}`} />
            </>
          ) : null}
          {session.course_detail?.title ? (
            <>
              <Dot />
              <MetaItem icon="mdi:book-open-variant" accent={accent.start} text={session.course_detail.title} />
            </>
          ) : null}
          {(() => {
            const count = attendanceCount ?? session.attendance_count ?? 0;
            return isAdmin && count > 0 ? (
              <>
                <Dot />
                <MetaItem icon="mdi:account-group-outline" accent={accent.start} text={String(count)} />
              </>
            ) : null;
          })()}
        </Box>

        {recordingHint && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <IconWrapper icon="mdi:movie-open-off-outline" size={15} color="var(--font-tertiary)" />
            <Typography sx={{ fontSize: "0.76rem", color: "var(--font-tertiary)" }}>{recordingHint}</Typography>
          </Box>
        )}

        {/* Actions */}
        <Box sx={{ mt: 1, display: "flex", gap: 1, alignItems: "stretch" }} onClick={(e) => e.stopPropagation()}>
          {primary ? (
            <ButtonBase
              onClick={primary.onClick}
              disabled={primary.loading}
              sx={{
                flex: 1,
                py: 1.2,
                borderRadius: 999,
                fontWeight: 800,
                color: "white",
                background: `linear-gradient(135deg, ${accent.start} 0%, ${accent.end} 100%)`,
                boxShadow: `0 14px 30px -14px color-mix(in srgb, ${accent.end} 70%, transparent)`,
                fontSize: "0.86rem",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.75,
                opacity: primary.loading ? 0.7 : 1,
              }}
            >
              {primary.loading ? <CircularProgress size={16} sx={{ color: "white" }} /> : <IconWrapper icon={primary.icon} size={17} color="white" />}
              {primary.label}
            </ButtonBase>
          ) : isAdmin && onOpen ? (
            <ButtonBase
              onClick={() => onOpen(session)}
              sx={{
                flex: 1,
                py: 1.2,
                borderRadius: 999,
                fontWeight: 800,
                fontSize: "0.86rem",
                color: "var(--font-secondary)",
                border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.75,
              }}
            >
              <IconWrapper icon="mdi:cog-outline" size={17} color="var(--font-secondary)" />
              {t("adminLiveSessions.manage", "Manage")}
            </ButtonBase>
          ) : null}

          {showCopyPasscode && (
            <Tooltip title={t("adminLiveSessions.copyPasscode", "Copy passcode")} placement="top">
              <IconButton
                onClick={() => onCopyPasscode!(session.zoom_password!)}
                aria-label={t("adminLiveSessions.copyPasscode", "Copy passcode")}
                sx={{
                  color: "var(--accent-indigo)",
                  border: "1px solid color-mix(in srgb, var(--accent-indigo) 30%, transparent)",
                  borderRadius: 2.5,
                  "&:hover": { background: "color-mix(in srgb, var(--accent-indigo) 8%, transparent)" },
                }}
              >
                <IconWrapper icon="mdi:key-variant" size={18} />
              </IconButton>
            </Tooltip>
          )}

          {/* Ended sessions with an AI summary: quick access without opening the recording */}
          {isDone && hasSummary && onViewSummary && (
            <Tooltip title={t("liveSessions.viewSummary", "View session summary")} placement="top">
              <IconButton
                onClick={() => onViewSummary(session)}
                aria-label={t("liveSessions.viewSummary", "View session summary")}
                sx={{
                  color: "var(--accent-indigo)",
                  border: "1px solid color-mix(in srgb, var(--accent-indigo) 30%, transparent)",
                  borderRadius: 2.5,
                  "&:hover": { background: "color-mix(in srgb, var(--accent-indigo) 8%, transparent)" },
                }}
              >
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
                sx={{
                  color: "var(--font-secondary)",
                  border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                  borderRadius: 2.5,
                  "&:hover": { background: "color-mix(in srgb, var(--accent-indigo) 8%, transparent)" },
                }}
              >
                <IconWrapper icon="mdi:cog-outline" size={18} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function MetaItem({ icon, text, accent }: { icon: string; text: string; accent: string }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
      <IconWrapper icon={icon} size={14} color={accent} />
      <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--font-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {text}
      </Typography>
    </Box>
  );
}

function Dot() {
  return <Box aria-hidden sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "color-mix(in srgb, var(--font-tertiary) 50%, transparent)" }} />;
}
