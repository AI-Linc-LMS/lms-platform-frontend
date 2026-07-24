"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Box, CircularProgress, Pagination, Stack, Typography } from "@mui/material";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { KpiRail, Reveal } from "@/components/scorecard/shared";
import { IconWrapper } from "@/components/common/IconWrapper";
import { StatusChip, type ChipTone } from "@/components/admin/assessment/shared";
import { ViewToggle, type ListView } from "@/components/common/list";
import { LiveSessionsEmptyState } from "@/components/live-sessions/LiveSessionsEmptyState";
import { LiveSessionsFeatureBlocked } from "@/components/live-sessions/LiveSessionsFeatureBlocked";
import { useLiveSessions } from "@/components/live-sessions/useLiveSessions";
import { SessionFilterChips } from "@/components/live-sessions/ui/LiveSessionUI";
import { LiveSessionCard } from "@/components/live-sessions/ui/LiveSessionCard";
import { RecordingPlayerDialog } from "@/components/live-sessions/RecordingPlayerDialog";
import { StudentSessionSummaryDialog } from "@/components/live-sessions/StudentSessionSummaryDialog";
import type { StudentLiveSession } from "@/lib/services/live-sessions";

const PAST = new Set(["ended", "expired"]);

// Compact list-row status pill mapping (mirrors the card's STATUS_CHIP grammar).
const ROW_STATUS: Record<string, { tone: ChipTone; label: string }> = {
  live: { tone: "success", label: "Live now" },
  scheduled: { tone: "info", label: "Upcoming" },
  ended: { tone: "neutral", label: "Ended" },
  expired: { tone: "warning", label: "Expired" },
};

/** Compact list-row rendering of a session - same open/join handler as the card. */
function SessionRow({
  session,
  onOpen,
  formatDateTime,
}: {
  session: StudentLiveSession;
  onOpen: (s: StudentLiveSession) => void;
  formatDateTime: (dateString: string) => string;
}) {
  const status = session.meeting_status ?? "scheduled";
  const chip = ROW_STATUS[status] ?? ROW_STATUS.scheduled;
  const subtitle = session.class_datetime
    ? formatDateTime(session.class_datetime)
    : session.course_detail?.title || "One-time session";
  const durStr = session.duration_minutes ? `${session.duration_minutes}m` : "-";

  return (
    <Box
      onClick={() => onOpen(session)}
      role="button"
      tabIndex={0}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 2,
        borderRadius: 2,
        cursor: "pointer",
        bgcolor: "var(--card-bg)",
        border: "1px solid var(--border-default)",
        transition: "all .15s",
        "&:hover": {
          borderColor: "var(--accent-indigo)",
          boxShadow: "0 6px 16px -8px rgba(124,58,237,0.35)",
        },
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          flexShrink: 0,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
        }}
      >
        <IconWrapper icon="mdi:video" size={22} color="#fff" />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: "0.98rem",
            color: "var(--font-primary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {session.topic_name || "Untitled session"}
        </Typography>
        <Typography
          sx={{
            color: "var(--font-secondary)",
            fontSize: "0.82rem",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {subtitle}
        </Typography>
      </Box>

      <Stack
        direction="row"
        spacing={2.5}
        sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}
      >
        <StatusChip label={chip.label} tone={chip.tone} />
        <Stack alignItems="center" spacing={0}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--font-primary)" }}>
            {durStr}
          </Typography>
          <Typography sx={{ fontSize: "0.68rem", color: "var(--font-tertiary)" }}>Duration</Typography>
        </Stack>
      </Stack>

      <IconWrapper icon="mdi:chevron-right" size={20} color="var(--font-tertiary)" />
    </Box>
  );
}

export default function LiveSessionsPage() {
  const { t } = useTranslation("common");
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ListView>("cards");
  const {
    loadingClientInfo,
    hasLiveSessionsFeature,
    loading,
    sessions,
    page,
    setPage,
    rowsPerPage,
    watchingRecordingId,
    playerSession,
    setPlayerSession,
    summarySession,
    setSummarySession,
    handleCopyPassword,
    handleWatchRecording,
    formatDateTime,
  } = useLiveSessions();

  const counts = useMemo(() => {
    let upcoming = 0;
    let live = 0;
    let past = 0;
    for (const s of sessions) {
      if (s.meeting_status === "scheduled") upcoming++;
      else if (s.meeting_status === "live") live++;
      else if (PAST.has(s.meeting_status ?? "")) past++;
    }
    return { upcoming, live, past, total: sessions.length };
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    if (filter === "upcoming") return sessions.filter((s) => s.meeting_status === "scheduled");
    if (filter === "live") return sessions.filter((s) => s.meeting_status === "live");
    if (filter === "past") return sessions.filter((s) => PAST.has(s.meeting_status ?? ""));
    return sessions;
  }, [sessions, filter]);

  const pageCount = Math.max(1, Math.ceil(filteredSessions.length / rowsPerPage));
  const pagedSessions = filteredSessions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  useEffect(() => {
    setPage(0);
  }, [filter, setPage]);

  // Same open/join behaviour the card's CTA uses: join if live/upcoming, else
  // fall back to the recording player, else the AI summary dialog.
  const openSession = (sess: StudentLiveSession) => {
    const url = sess.is_google_meet ? sess.join_link?.trim() : sess.zoom_join_url?.trim();
    if (url) {
      window.open(url, "_blank");
      return;
    }
    if (sess.has_recording || sess.zoom_recording_url?.trim() || sess.recording_link?.trim()) {
      handleWatchRecording(sess);
      return;
    }
    if (sess.zoom_ai_summary || sess.google_ai_summary) setSummarySession(sess);
  };

  if (loadingClientInfo || (hasLiveSessionsFeature && loading && sessions.length === 0)) {
    return (
      <PageShell>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </PageShell>
    );
  }

  if (!hasLiveSessionsFeature) {
    return (
      <PageShell>
        <LiveSessionsFeatureBlocked />
      </PageShell>
    );
  }

  const filterOptions = [
    { key: "all", label: t("adminLiveSessions.filterAll", "All"), count: counts.total, color: "var(--accent-indigo)" },
    { key: "upcoming", label: t("adminLiveSessions.filterUpcoming", "Upcoming"), count: counts.upcoming, color: "var(--accent-indigo)" },
    { key: "live", label: t("adminLiveSessions.filterLive", "Live"), count: counts.live, color: "var(--success-500)" },
    { key: "past", label: t("adminLiveSessions.filterPast", "Past"), count: counts.past, color: "var(--font-tertiary)" },
  ];

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Engage"
        title="Live Sessions"
        description="Join upcoming live classes and webinars, and catch up on past recordings any time."
        accent="indigo"
        icon="mdi:video-box"
      />

      {sessions.length === 0 ? (
            <LiveSessionsEmptyState />
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <KpiRail
                items={[
                  { value: counts.upcoming, label: t("adminLiveSessions.filterUpcoming", "Upcoming"), accent: "#6366f1" },
                  { value: counts.live, label: t("adminLiveSessions.filterLive", "Live now"), accent: "#10b981" },
                  { value: counts.past, label: t("adminLiveSessions.completed", "Completed"), accent: "#94a3b8" },
                ]}
              />

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <SessionFilterChips options={filterOptions} value={filter} onChange={setFilter} />
                </Box>
                <ViewToggle value={viewMode} onChange={setViewMode} />
              </Box>

              {filteredSessions.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 6 }}>
                  <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                    {t("liveSessions.noSessionsForFilter", "No sessions match this filter.")}
                  </Typography>
                </Box>
              ) : (
                <>
                  {viewMode === "cards" ? (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
                        gap: 2,
                        alignItems: "stretch",
                      }}
                    >
                      {pagedSessions.map((s, idx) => (
                        <Reveal key={s.id} delay={Math.min(idx, 8) * 0.05}>
                          <LiveSessionCard<StudentLiveSession>
                            session={s}
                            variant="student"
                            watchingRecording={watchingRecordingId === s.id}
                            onJoin={(sess) => {
                              const url = sess.is_google_meet ? sess.join_link?.trim() : sess.zoom_join_url?.trim();
                              if (url) window.open(url, "_blank");
                            }}
                            onCopyPasscode={handleCopyPassword}
                            onWatchRecording={handleWatchRecording}
                            onViewSummary={(sess) => setSummarySession(sess)}
                            formatDateTime={formatDateTime}
                          />
                        </Reveal>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                      {pagedSessions.map((s) => (
                        <SessionRow
                          key={s.id}
                          session={s}
                          onOpen={openSession}
                          formatDateTime={formatDateTime}
                        />
                      ))}
                    </Box>
                  )}

                  {pageCount > 1 && (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                      <Pagination
                        count={pageCount}
                        page={page + 1}
                        onChange={(_, value) => setPage(value - 1)}
                        shape="rounded"
                        color="primary"
                      />
                    </Box>
                  )}
                </>
              )}
            </Box>
          )}

      {/* Watch ON platform: Zoom cloud MP4s and Google Meet Drive recordings both stream
            through the backend proxy - no external tabs, gated by course enrollment. */}
        <RecordingPlayerDialog
          open={Boolean(playerSession)}
          liveClassId={playerSession?.id ?? null}
          title={playerSession?.topic_name}
          onClose={() => setPlayerSession(null)}
        />
        {summarySession && (
          <StudentSessionSummaryDialog
            activityId={summarySession.id}
            topicName={summarySession.topic_name || ""}
            open
            onClose={() => setSummarySession(null)}
          />
        )}
    </PageShell>
  );
}
