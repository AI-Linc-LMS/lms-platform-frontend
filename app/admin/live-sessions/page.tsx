"use client";

import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { AdminLiveSessionsEmptyState } from "@/components/admin/live-sessions/AdminLiveSessionsEmptyState";
import { AdminLiveSessionsFeatureBlocked } from "@/components/admin/live-sessions/AdminLiveSessionsFeatureBlocked";
import { AdminLiveSessionsTable } from "@/components/admin/live-sessions/AdminLiveSessionsTable";
import { useAdminLiveSessions } from "@/components/admin/live-sessions/useAdminLiveSessions";
import { CreateLiveSessionDialog } from "@/components/admin/live-sessions/CreateLiveSessionDialog";
import { LiveSessionDetailDrawer } from "@/components/admin/live-sessions/LiveSessionDetailDrawer";

export default function AdminLiveSessionsPage() {
  const {
    authLoading,
    canAccessAdmin,
    loadingClientInfo,
    hasAdminLiveSessionsFeature,
    loading,
    sessions,
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

  if (!authLoading && !canAccessAdmin) {
    return null;
  }

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

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 4, position: "relative" }}>
        {loading && sessions.length > 0 && (
          <LinearProgress
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              zIndex: 1,
            }}
          />
        )}
        <Box
          sx={{
            mb: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: "#111827", mb: 1 }}
            >
              Live Sessions
            </Typography>
            <Typography variant="body1" sx={{ color: "#6b7280" }}>
              View and verify live sessions. Start meeting (host), open join
              link, sync attendance and recording.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<IconWrapper icon="mdi:plus" size={20} />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{
              bgcolor: "#6366f1",
              "&:hover": { bgcolor: "#4f46e5" },
            }}
          >
            Create Live Session
          </Button>
        </Box>

        {sessions.length === 0 ? (
          <AdminLiveSessionsEmptyState />
        ) : (
          <AdminLiveSessionsTable
            sessions={sessions}
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
        />
      </Container>
    </MainLayout>
  );
}
