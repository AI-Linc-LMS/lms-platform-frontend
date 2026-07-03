"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Container,
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Pagination,
  Typography,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { AdaptiveSectionHero } from "@/components/adaptive-quiz/shared/AdaptiveSectionHero";
import { KpiRail, Reveal } from "@/components/scorecard/shared";
import { AdminLiveSessionsEmptyState } from "@/components/admin/live-sessions/AdminLiveSessionsEmptyState";
import { AdminLiveSessionsFeatureBlocked } from "@/components/admin/live-sessions/AdminLiveSessionsFeatureBlocked";
import { useAdminLiveSessions } from "@/components/admin/live-sessions/useAdminLiveSessions";
import { ZoomCredentialsDialog } from "@/components/admin/live-sessions/ZoomCredentialsDialog";
import { ZoomSetupCard, ZoomSetupStatus } from "@/components/admin/live-sessions/ZoomSetupCard";
import { GoogleSetupCard } from "@/components/admin/live-sessions/GoogleSetupCard";
import {
  ImportedMeetingsInbox,
  ImportedMeetingsInboxHandle,
} from "@/components/admin/live-sessions/ImportedMeetingsInbox";
import { MeetingPresetsDialog } from "@/components/admin/live-sessions/MeetingPresetsDialog";
import { VirtualBackgroundsDialog } from "@/components/admin/live-sessions/VirtualBackgroundsDialog";
import { LiveSessionCard } from "@/components/live-sessions/ui/LiveSessionCard";
import { SessionFilterChips } from "@/components/live-sessions/ui/LiveSessionUI";
import { useToast } from "@/components/common/Toast";
import type { LiveActivity } from "@/lib/services/admin/admin-live-activities.service";
import { zoomService } from "@/lib/services/zoom.service";

const PAST = new Set(["ended", "expired"]);

export default function AdminLiveSessionsPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const googleRedirectHandledRef = useRef(false);
  // Error code from a failed Google connect round-trip (?google_connected=0&error=...) —
  // rendered as actionable troubleshooting on the Google card, not just a toast. Initialized
  // lazily from the URL (same value on server + client render) because the effect below
  // strips the query params immediately after toasting.
  const [googleConnectError, setGoogleConnectError] = useState<string | null>(() =>
    searchParams.get("google_connected") === "0" ? searchParams.get("error") || "unknown" : null
  );
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [presetsDialogOpen, setPresetsDialogOpen] = useState(false);
  const [backgroundsDialogOpen, setBackgroundsDialogOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const inboxRef = useRef<ImportedMeetingsInboxHandle>(null);
  const credsCheckedRef = useRef(false);
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
    watchingRecordingId,
    creatingZoomId,
    creatingGoogleMeetId,
    loadSessions,
    handleCopyPassword,
    handleCreateZoom,
    handleCreateGoogleMeet,
    handleWatchRecording,
    formatDateTime,
  } = useAdminLiveSessions();

  const refreshZoomStatus = useCallback((autoOpenIfEmpty = false) => {
    zoomService
      .getZoomCredentials()
      .then((data) => {
        const configured = Boolean(
          data?.account_id?.trim() && data?.zoom_client_id?.trim()
        );
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
    if (credsCheckedRef.current || !hasAdminLiveSessionsFeature) return;
    credsCheckedRef.current = true;
    refreshZoomStatus(true);
  }, [hasAdminLiveSessionsFeature, refreshZoomStatus]);

  // Toast the result of the Google "Connect" OAuth round-trip (?google_connected=1|0), then
  // strip the param so a refresh doesn't re-toast. GoogleSetupCard re-reads status on this load.
  useEffect(() => {
    if (googleRedirectHandledRef.current) return;
    const flag = searchParams.get("google_connected");
    if (flag == null) return;
    googleRedirectHandledRef.current = true;
    if (flag === "1") {
      showToast(t("adminLiveSessions.googleConnected", "Google account connected."), "success");
    } else {
      // Keep the toast short — the ACTIONABLE guidance renders as a persistent panel on the
      // Google card (googleConnectErrors maps each code, incl. Google's "Access blocked");
      // googleConnectError state was initialized from the URL before this effect stripped it.
      showToast(t("adminLiveSessions.googleConnectError2", "Google connection failed — see the fix steps on the Google Meet card."), "error");
    }
    // Strip the query params without leaving the current page.
    router.replace(window.location.pathname);
  }, [searchParams, showToast, t, router]);

  const counts = useMemo(() => {
    let upcoming = 0;
    let live = 0;
    let past = 0;
    let webinars = 0;
    for (const s of sessions) {
      if (s.meeting_status === "scheduled") upcoming++;
      else if (s.meeting_status === "live") live++;
      else if (PAST.has(s.meeting_status ?? "")) past++;
      if (s.zoom_meeting_type === "webinar") webinars++;
    }
    return { upcoming, live, past, webinars, total: sessions.length };
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    if (filter === "all") return sessions;
    if (filter === "upcoming") return sessions.filter((s) => s.meeting_status === "scheduled");
    if (filter === "live") return sessions.filter((s) => s.meeting_status === "live");
    if (filter === "past") return sessions.filter((s) => PAST.has(s.meeting_status ?? ""));
    return sessions;
  }, [sessions, filter]);

  const pageCount = Math.max(1, Math.ceil(filteredSessions.length / rowsPerPage));
  const pagedSessions = filteredSessions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Reset to first page when the filter changes.
  useEffect(() => {
    setPage(0);
  }, [filter, setPage]);

  const openDetail = useCallback(
    (s: LiveActivity) => router.push(`/admin/live-sessions/${s.id}`),
    [router]
  );

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
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, position: "relative" }}>
        {loading && sessions.length > 0 && (
          <LinearProgress sx={{ position: "absolute", insetInlineStart: 0, insetInlineEnd: 0, top: 0, zIndex: 1 }} />
        )}

        <AdaptiveSectionShell meshOpacity={0.3}>
          <AdaptiveSectionHero
            chapter={t("adminLiveSessions.chapter", "Manage · Live Sessions")}
            title={t("adminLiveSessions.title", "Live Sessions")}
            subtitle={t("adminLiveSessions.subtitle", "Schedule, run, and review live classes and webinars.")}
            accent="indigo"
            icon="mdi:broadcast"
            rightSlot={
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  startIcon={<IconWrapper icon="mdi:tune-variant" size={18} />}
                  onClick={() => setPresetsDialogOpen(true)}
                  sx={{ borderRadius: 999, textTransform: "none", fontWeight: 700, color: "var(--font-secondary)", borderColor: "color-mix(in srgb, var(--border-default) 80%, transparent)" }}
                >
                  {t("adminLiveSessions.presets", "Presets")}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<IconWrapper icon="mdi:image-outline" size={18} />}
                  onClick={() => setBackgroundsDialogOpen(true)}
                  sx={{ borderRadius: 999, textTransform: "none", fontWeight: 700, color: "var(--font-secondary)", borderColor: "color-mix(in srgb, var(--border-default) 80%, transparent)" }}
                >
                  {t("adminLiveSessions.backgrounds", "Backgrounds")}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<IconWrapper icon="mdi:plus" size={20} color="#fff" />}
                  onClick={() => router.push("/admin/live-sessions/create")}
                  sx={{
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 800,
                    color: "white",
                    background: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
                    boxShadow: "0 14px 30px -14px color-mix(in srgb, #4338ca 70%, transparent)",
                    "&:hover": { background: "linear-gradient(135deg, #6366f1 0%, #3730a3 100%)" },
                  }}
                >
                  {t("adminLiveSessions.createLiveSession", "Create Live Session")}
                </Button>
              </Box>
            }
          />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <ZoomSetupCard status={zoomStatus} onConfigure={() => setCredentialsDialogOpen(true)} />

            <GoogleSetupCard connectError={googleConnectError} onDismissError={() => setGoogleConnectError(null)} />

            <ImportedMeetingsInbox
              ref={inboxRef}
              formatDateTime={formatDateTime}
              onAssigned={loadSessions}
            />

            {sessions.length === 0 ? (
              <AdminLiveSessionsEmptyState onCreate={() => router.push("/admin/live-sessions/create")} />
            ) : (
              <>
                <KpiRail
                  items={[
                    { value: counts.upcoming, label: t("adminLiveSessions.filterUpcoming", "Upcoming"), accent: "#6366f1" },
                    { value: counts.live, label: t("adminLiveSessions.filterLive", "Live now"), accent: "#10b981" },
                    { value: counts.past, label: t("adminLiveSessions.completed", "Completed"), accent: "#94a3b8" },
                    { value: counts.webinars, label: t("adminLiveSessions.webinars", "Webinars"), accent: "#ec4899" },
                  ]}
                />

                <SessionFilterChips options={filterOptions} value={filter} onChange={setFilter} />

                {filteredSessions.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 6 }}>
                    <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                      {t("adminLiveSessions.noSessionsForFilter", "No sessions match this filter.")}
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
                        gap: 2,
                        alignItems: "stretch",
                      }}
                    >
                      {pagedSessions.map((s, idx) => (
                        <Reveal key={s.id} delay={Math.min(idx, 8) * 0.05}>
                          <LiveSessionCard
                            session={s}
                            variant="admin"
                            attendanceCount={uniqueAttendanceCounts[s.id]}
                            creatingZoom={creatingZoomId === s.id}
                            creatingGoogleMeet={creatingGoogleMeetId === s.id}
                            watchingRecording={watchingRecordingId === s.id}
                            onOpen={openDetail}
                            onCreateZoom={(sess) => handleCreateZoom(sess.id)}
                            onCreateGoogleMeet={(sess) => handleCreateGoogleMeet(sess.id)}
                            onStart={(sess) => sess.zoom_start_url && window.open(sess.zoom_start_url, "_blank")}
                            onJoin={(sess) => {
                              const url = sess.is_google_meet ? sess.join_link?.trim() : sess.zoom_join_url?.trim();
                              if (url) window.open(url, "_blank");
                            }}
                            onCopyPasscode={handleCopyPassword}
                            onWatchRecording={handleWatchRecording}
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
              </>
            )}
          </Box>
        </AdaptiveSectionShell>

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
