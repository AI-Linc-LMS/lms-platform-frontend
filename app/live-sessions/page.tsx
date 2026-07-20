"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Container, Box, CircularProgress, Pagination, Typography } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { AdaptiveSectionHero } from "@/components/adaptive-quiz/shared/AdaptiveSectionHero";
import { KpiRail, Reveal } from "@/components/scorecard/shared";
import { LiveSessionsEmptyState } from "@/components/live-sessions/LiveSessionsEmptyState";
import { LiveSessionsFeatureBlocked } from "@/components/live-sessions/LiveSessionsFeatureBlocked";
import { useLiveSessions } from "@/components/live-sessions/useLiveSessions";
import { SessionFilterChips } from "@/components/live-sessions/ui/LiveSessionUI";
import { LiveSessionCard } from "@/components/live-sessions/ui/LiveSessionCard";
import { RecordingPlayerDialog } from "@/components/live-sessions/RecordingPlayerDialog";
import { StudentSessionSummaryDialog } from "@/components/live-sessions/StudentSessionSummaryDialog";
import type { StudentLiveSession } from "@/lib/services/live-sessions";

const PAST = new Set(["ended", "expired"]);

export default function LiveSessionsPage() {
  const { t } = useTranslation("common");
  const [filter, setFilter] = useState("all");
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

  if (loadingClientInfo || (hasLiveSessionsFeature && loading && sessions.length === 0)) {
    return (
      <MainLayout fullWidthContent>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        </Container>
      </MainLayout>
    );
  }

  if (!hasLiveSessionsFeature) {
    return (
      <MainLayout fullWidthContent>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <LiveSessionsFeatureBlocked />
        </Container>
      </MainLayout>
    );
  }

  const filterOptions = [
    { key: "all", label: t("adminLiveSessions.filterAll", "All"), count: counts.total, color: "var(--accent-indigo)" },
    { key: "upcoming", label: t("adminLiveSessions.filterUpcoming", "Upcoming"), count: counts.upcoming, color: "var(--accent-indigo)" },
    { key: "live", label: t("adminLiveSessions.filterLive", "Live"), count: counts.live, color: "var(--success-500)" },
    { key: "past", label: t("adminLiveSessions.filterPast", "Past"), count: counts.past, color: "var(--font-tertiary)" },
  ];

  return (
    <MainLayout fullWidthContent>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <AdaptiveSectionShell meshOpacity={0.3}>
          <AdaptiveSectionHero
            chapter={t("liveSessions.chapter", "Learn · Live Sessions")}
            title={t("liveSessions.title", "Live Sessions")}
            subtitle={t("liveSessions.subtitle", "Join your upcoming live classes and rewatch past recordings.")}
            accent="indigo"
            icon="mdi:broadcast"
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

              <SessionFilterChips options={filterOptions} value={filter} onChange={setFilter} />

              {filteredSessions.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 6 }}>
                  <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                    {t("liveSessions.noSessionsForFilter", "No sessions match this filter.")}
                  </Typography>
                </Box>
              ) : (
                <>
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
        </AdaptiveSectionShell>

        {/* Watch ON platform: Zoom cloud MP4s and Google Meet Drive recordings both stream
            through the backend proxy — no external tabs, gated by course enrollment. */}
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
      </Container>
    </MainLayout>
  );
}
