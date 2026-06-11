"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Container, Box, CircularProgress, Typography } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { LiveSessionsEmptyState } from "@/components/live-sessions/LiveSessionsEmptyState";
import { LiveSessionsFeatureBlocked } from "@/components/live-sessions/LiveSessionsFeatureBlocked";
import { LiveSessionsTable } from "@/components/live-sessions/LiveSessionsTable";
import { useLiveSessions } from "@/components/live-sessions/useLiveSessions";
import { SessionsPageHeader, SessionFilterChips } from "@/components/live-sessions/ui/LiveSessionUI";

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
    setRowsPerPage,
    watchingRecordingId,
    handleCopyPassword,
    handleWatchRecording,
    formatDateTime,
    formatSessionDuration,
    formatSessionStatusCaption,
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

  useEffect(() => {
    setPage(0);
  }, [filter, setPage]);

  if (loadingClientInfo || (hasLiveSessionsFeature && loading && sessions.length === 0)) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        </Container>
      </MainLayout>
    );
  }

  if (!hasLiveSessionsFeature) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
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
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <SessionsPageHeader title={t("liveSessions.title")} subtitle={t("liveSessions.subtitle")} />

        {sessions.length === 0 ? (
          <LiveSessionsEmptyState />
        ) : (
          <>
            <SessionFilterChips options={filterOptions} value={filter} onChange={setFilter} />
            {filteredSessions.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                  {t("liveSessions.noSessionsForFilter", "No sessions match this filter.")}
                </Typography>
              </Box>
            ) : (
              <LiveSessionsTable
                sessions={filteredSessions}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                onCopyPassword={handleCopyPassword}
                onWatchRecording={handleWatchRecording}
                watchingRecordingId={watchingRecordingId}
                formatDateTime={formatDateTime}
                formatSessionDuration={formatSessionDuration}
                formatSessionStatusCaption={formatSessionStatusCaption}
              />
            )}
          </>
        )}
      </Container>
    </MainLayout>
  );
}
