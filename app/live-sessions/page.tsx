"use client";

import { useTranslation } from "react-i18next";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { LiveSessionsEmptyState } from "@/components/live-sessions/LiveSessionsEmptyState";
import { LiveSessionsFeatureBlocked } from "@/components/live-sessions/LiveSessionsFeatureBlocked";
import { LiveSessionsTable } from "@/components/live-sessions/LiveSessionsTable";
import { useLiveSessions } from "@/components/live-sessions/useLiveSessions";

export default function LiveSessionsPage() {
  const { t } = useTranslation("common");
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
    formatTimeRemaining,
  } = useLiveSessions();

  if (
    loadingClientInfo ||
    (hasLiveSessionsFeature && loading && sessions.length === 0)
  ) {
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

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: "#111827", mb: 1 }}
          >
            {t("liveSessions.title")}
          </Typography>
          <Typography variant="body1" sx={{ color: "#6b7280" }}>
            {t("liveSessions.subtitle")}
          </Typography>
        </Box>

        {sessions.length === 0 ? (
          <LiveSessionsEmptyState />
        ) : (
          <LiveSessionsTable
            sessions={sessions}
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
            formatTimeRemaining={formatTimeRemaining}
          />
        )}
      </Container>
    </MainLayout>
  );
}
