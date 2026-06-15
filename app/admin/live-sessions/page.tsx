"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Container,
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Typography,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { AdminLiveSessionsEmptyState } from "@/components/admin/live-sessions/AdminLiveSessionsEmptyState";
import { AdminLiveSessionsFeatureBlocked } from "@/components/admin/live-sessions/AdminLiveSessionsFeatureBlocked";
import { AdminLiveSessionsTable } from "@/components/admin/live-sessions/AdminLiveSessionsTable";
import { useAdminLiveSessions } from "@/components/admin/live-sessions/useAdminLiveSessions";
import { CreateLiveSessionDialog } from "@/components/admin/live-sessions/CreateLiveSessionDialog";
import { LiveSessionDetailDrawer } from "@/components/admin/live-sessions/LiveSessionDetailDrawer";
import { ZoomCredentialsDialog } from "@/components/admin/live-sessions/ZoomCredentialsDialog";
import { ZoomSetupCard, ZoomSetupStatus } from "@/components/admin/live-sessions/ZoomSetupCard";
import {
  ImportedMeetingsInbox,
  ImportedMeetingsInboxHandle,
} from "@/components/admin/live-sessions/ImportedMeetingsInbox";
import { MeetingPresetsDialog } from "@/components/admin/live-sessions/MeetingPresetsDialog";
import { VirtualBackgroundsDialog } from "@/components/admin/live-sessions/VirtualBackgroundsDialog";
import {
  SessionsPageHeader,
  SessionStatCard,
  SessionFilterChips,
} from "@/components/live-sessions/ui/LiveSessionUI";
import { zoomService } from "@/lib/services/zoom.service";

const PAST = new Set(["ended", "expired"]);

export default function AdminLiveSessionsPage() {
  const { t } = useTranslation("common");
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [presetsDialogOpen, setPresetsDialogOpen] = useState(false);
  const [backgroundsDialogOpen, setBackgroundsDialogOpen] = useState(false);
  const [hasCheckedCredentials, setHasCheckedCredentials] = useState(false);
  const [webhookConfigured, setWebhookConfigured] = useState(false);
  const [filter, setFilter] = useState("all");
  const inboxRef = useRef<ImportedMeetingsInboxHandle>(null);
  const [zoomStatus, setZoomStatus] = useState<ZoomSetupStatus>({
    loading: true,
    configured: false,
    active: false,
    webhookConfigured: false,
    webhookUrl: null,
  });

  const {
    authLoading,
    canAccessAdmin,
    loadingClientInfo,
    hasAdminLiveSessionsFeature,
    loading,
    sessions,
    uniqueAttendanceCounts,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    watchingRecordingId,
    creatingZoomId,
    createDialogOpen,
    setCreateDialogOpen,
    detailDrawerOpen,
    setDetailDrawerOpen,
    selectedLiveClassId,
    setSelectedLiveClassId,
    loadSessions,
    handleCopyPassword,
    handleCreateZoom,
    handleWatchRecording,
    formatDateTime,
    openViewSession,
  } = useAdminLiveSessions();

  const refreshZoomStatus = useCallback((autoOpenIfEmpty = false) => {
    zoomService
      .getZoomCredentials()
      .then((data) => {
        const configured = Boolean(
          data?.account_id?.trim() && data?.zoom_client_id?.trim()
        );
        setWebhookConfigured(data?.webhook_configured ?? false);
        setZoomStatus({
          loading: false,
          configured,
          active: Boolean(data?.is_active),
          webhookConfigured: Boolean(data?.webhook_configured),
          webhookUrl: data?.webhook_url ?? null,
        });
        if (autoOpenIfEmpty && !configured) setCredentialsDialogOpen(true);
      })
      .catch(() => setZoomStatus((s) => ({ ...s, loading: false })));
  }, []);

  // Fetch Zoom status once; auto-open setup only for brand-new (unconfigured) tenants.
  useEffect(() => {
    if (hasCheckedCredentials || !hasAdminLiveSessionsFeature) return;
    setHasCheckedCredentials(true);
    refreshZoomStatus(true);
  }, [hasAdminLiveSessionsFeature, hasCheckedCredentials, refreshZoomStatus]);

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
    if (filter === "all") return sessions;
    if (filter === "upcoming") return sessions.filter((s) => s.meeting_status === "scheduled");
    if (filter === "live") return sessions.filter((s) => s.meeting_status === "live");
    if (filter === "past") return sessions.filter((s) => PAST.has(s.meeting_status ?? ""));
    return sessions;
  }, [sessions, filter]);

  // Reset to first page when the filter changes.
  useEffect(() => {
    setPage(0);
  }, [filter, setPage]);

  if (!authLoading && !canAccessAdmin) return null;

  if (loadingClientInfo) {
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

  if (canAccessAdmin && !hasAdminLiveSessionsFeature) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <AdminLiveSessionsFeatureBlocked />
        </Container>
      </MainLayout>
    );
  }

  if (loading && sessions.length === 0) {
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

  const filterOptions = [
    { key: "all", label: t("adminLiveSessions.filterAll", "All"), count: counts.total, color: "var(--accent-indigo)" },
    { key: "upcoming", label: t("adminLiveSessions.filterUpcoming", "Upcoming"), count: counts.upcoming, color: "var(--accent-indigo)" },
    { key: "live", label: t("adminLiveSessions.filterLive", "Live"), count: counts.live, color: "var(--success-500)" },
    { key: "past", label: t("adminLiveSessions.filterPast", "Past"), count: counts.past, color: "var(--font-tertiary)" },
  ];

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 4, position: "relative" }}>
        {loading && sessions.length > 0 && (
          <LinearProgress sx={{ position: "absolute", insetInlineStart: 0, insetInlineEnd: 0, top: 0, zIndex: 1 }} />
        )}

        <SessionsPageHeader
          title={t("adminLiveSessions.title")}
          subtitle={t("adminLiveSessions.subtitle")}
          actions={
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <Button
                variant="outlined"
                startIcon={<IconWrapper icon="mdi:tune-variant" size={18} />}
                onClick={() => setPresetsDialogOpen(true)}
                sx={{ color: "var(--font-secondary)", borderColor: "var(--border-default)" }}
              >
                {t("adminLiveSessions.presets", "Presets")}
              </Button>
              <Button
                variant="outlined"
                startIcon={<IconWrapper icon="mdi:image-outline" size={18} />}
                onClick={() => setBackgroundsDialogOpen(true)}
                sx={{ color: "var(--font-secondary)", borderColor: "var(--border-default)" }}
              >
                {t("adminLiveSessions.backgrounds", "Backgrounds")}
              </Button>
              <Button
                variant="contained"
                startIcon={<IconWrapper icon="mdi:plus" size={20} />}
                onClick={() => setCreateDialogOpen(true)}
                sx={{ bgcolor: "var(--accent-indigo)", color: "var(--font-light)", "&:hover": { bgcolor: "var(--accent-indigo-dark)" } }}
              >
                {t("adminLiveSessions.createLiveSession")}
              </Button>
            </Box>
          }
        />

        <ZoomSetupCard status={zoomStatus} onConfigure={() => setCredentialsDialogOpen(true)} />

        <ImportedMeetingsInbox
          ref={inboxRef}
          formatDateTime={formatDateTime}
          onAssigned={loadSessions}
        />

        {sessions.length === 0 ? (
          <AdminLiveSessionsEmptyState onCreate={() => setCreateDialogOpen(true)} />
        ) : (
          <>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 3 }}>
              <SessionStatCard icon="mdi:calendar-clock" label={t("adminLiveSessions.filterUpcoming", "Upcoming")} value={counts.upcoming} color="var(--accent-indigo)" />
              <SessionStatCard icon="mdi:broadcast" label={t("adminLiveSessions.filterLive", "Live now")} value={counts.live} color="var(--success-500)" />
              <SessionStatCard icon="mdi:history" label={t("adminLiveSessions.filterPast", "Completed")} value={counts.past} color="var(--font-tertiary)" />
            </Box>

            <SessionFilterChips options={filterOptions} value={filter} onChange={setFilter} />

            {filteredSessions.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                  {t("adminLiveSessions.noSessionsForFilter", "No sessions match this filter.")}
                </Typography>
              </Box>
            ) : (
              <AdminLiveSessionsTable
                sessions={filteredSessions}
                uniqueAttendanceCounts={uniqueAttendanceCounts}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                creatingZoomId={creatingZoomId}
                watchingRecordingId={watchingRecordingId}
                onCreateZoom={handleCreateZoom}
                onWatchRecording={handleWatchRecording}
                onCopyPassword={handleCopyPassword}
                onViewSession={openViewSession}
                formatDateTime={formatDateTime}
              />
            )}
          </>
        )}

        <CreateLiveSessionDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSuccess={() => {
            setCreateDialogOpen(false);
            loadSessions();
          }}
        />

        <LiveSessionDetailDrawer
          liveClassId={selectedLiveClassId}
          open={detailDrawerOpen}
          onClose={() => {
            setDetailDrawerOpen(false);
            setSelectedLiveClassId(null);
          }}
          onUpdated={loadSessions}
          webhookConfigured={webhookConfigured}
        />

        <ZoomCredentialsDialog
          open={credentialsDialogOpen}
          onClose={() => {
            setCredentialsDialogOpen(false);
            refreshZoomStatus(false);
          }}
        />

        <MeetingPresetsDialog
          open={presetsDialogOpen}
          onClose={() => setPresetsDialogOpen(false)}
        />

        <VirtualBackgroundsDialog
          open={backgroundsDialogOpen}
          onClose={() => setBackgroundsDialogOpen(false)}
        />
      </Container>
    </MainLayout>
  );
}
