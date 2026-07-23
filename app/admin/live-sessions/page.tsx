"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  LinearProgress,
  Pagination,
  Typography,
} from "@mui/material";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import { IconWrapper } from "@/components/common/IconWrapper";
import { KpiRail, Reveal } from "@/components/scorecard/shared";
import { AdminLiveSessionsEmptyState } from "@/components/admin/live-sessions/AdminLiveSessionsEmptyState";
import { AdminLiveSessionsFeatureBlocked } from "@/components/admin/live-sessions/AdminLiveSessionsFeatureBlocked";
import { useAdminLiveSessions } from "@/components/admin/live-sessions/useAdminLiveSessions";
import { ZoomCredentialsDialog } from "@/components/admin/live-sessions/ZoomCredentialsDialog";
import { ZoomSetupCard, ZoomSetupStatus } from "@/components/admin/live-sessions/ZoomSetupCard";
import { GoogleSetupCard } from "@/components/admin/live-sessions/GoogleSetupCard";
import { RecordingPlayerDialog } from "@/components/live-sessions/RecordingPlayerDialog";
import {
  ImportedMeetingsInbox,
  ImportedMeetingsInboxHandle,
} from "@/components/admin/live-sessions/ImportedMeetingsInbox";
import { MeetingPresetsDialog } from "@/components/admin/live-sessions/MeetingPresetsDialog";
import { VirtualBackgroundsDialog } from "@/components/admin/live-sessions/VirtualBackgroundsDialog";
import { LiveSessionCard } from "@/components/live-sessions/ui/LiveSessionCard";
import { LiveSessionsCalendar } from "@/components/live-sessions/ui/LiveSessionsCalendar";
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
  const zoomRedirectHandledRef = useRef(false);
  // Integrations strip: expanded when something needs the admin's attention (a failed Google
  // connect round-trip, or nothing configured yet), else collapsed so the SESSIONS are the
  // first thing on screen. DERIVED (null = auto) — a manual toggle overrides the automatics.
  const [integrationsToggled, setIntegrationsToggled] = useState<boolean | null>(null);
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
    oauthAvailable: false,
    oauthConnected: false,
    connectedEmail: null,
    needsReconnect: false,
  });
  const [zoomConnecting, setZoomConnecting] = useState(false);

  const {
    authLoading,
    canAccessAdmin,
    loadingClientInfo,
    hasAdminLiveSessionsFeature,
    loading,
    sessions,
    playerSession,
    setPlayerSession,
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

  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const refreshZoomStatus = useCallback(() => {
    zoomService
      .getZoomStatus()
      .then(({ credentials: data, connection, oauthAvailable }) => {
        const configured = Boolean(
          data?.account_id?.trim() && data?.zoom_client_id?.trim()
        );
        setZoomStatus({
          loading: false,
          configured,
          active: Boolean(data?.is_active),
          webhookConfigured: Boolean(data?.webhook_configured),
          webhookUrl: data?.webhook_url ?? null,
          oauthAvailable,
          oauthConnected: Boolean(connection?.mode === "oauth" && connection?.connected),
          connectedEmail: connection?.connected_email ?? null,
          needsReconnect: Boolean(connection?.needs_reconnect),
        });
      })
      .catch(() => setZoomStatus((s) => ({ ...s, loading: false })));
  }, []);

  const handleZoomConnect = useCallback(async () => {
    setZoomConnecting(true);
    try {
      // Bounce back to this page; the backend callback stores the refresh token.
      const url = await zoomService.startZoomConnect("/admin/live-sessions");
      window.location.href = url;
    } catch {
      setZoomConnecting(false);
      showToast(t("adminLiveSessions.zoomConnectFailed", "Couldn't start the Zoom connection. Try again."), "error");
    }
  }, [showToast, t]);

  const handleZoomDisconnect = useCallback(async () => {
    try {
      await zoomService.disconnectZoom();
      showToast(t("adminLiveSessions.zoomDisconnected", "Zoom disconnected."), "success");
      refreshZoomStatus();
    } catch {
      showToast(t("adminLiveSessions.zoomDisconnectFailed", "Couldn't disconnect Zoom."), "error");
    }
  }, [showToast, t, refreshZoomStatus]);

  // Fetch Zoom status once, to drive the integrations strip + setup card. We deliberately do NOT
  // auto-open the Zoom setup modal for unconfigured tenants — that popped up on every visit and
  // was intrusive (and pointless for Google-Meet-only tenants). The "Integrations & tools" strip
  // already auto-expands when Zoom is unconfigured, so the modal opens only on an explicit Configure.
  useEffect(() => {
    if (credsCheckedRef.current || !hasAdminLiveSessionsFeature) return;
    credsCheckedRef.current = true;
    refreshZoomStatus();
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

  // Toast the result of the Zoom "Connect" OAuth round-trip (?zoom_connected=1|0), then strip it.
  useEffect(() => {
    if (zoomRedirectHandledRef.current) return;
    const flag = searchParams.get("zoom_connected");
    if (flag == null) return;
    zoomRedirectHandledRef.current = true;
    if (flag === "1") {
      showToast(t("adminLiveSessions.zoomConnectedToast", "Zoom account connected."), "success");
      refreshZoomStatus();
    } else {
      const code = searchParams.get("error");
      showToast(
        code === "access_denied"
          ? t("adminLiveSessions.zoomConnectDenied", "Zoom connection was cancelled.")
          : t("adminLiveSessions.zoomConnectError", "Zoom connection failed — please try again."),
        "error"
      );
    }
    router.replace(window.location.pathname);
  }, [searchParams, showToast, t, router, refreshZoomStatus]);

  const integrationsOpen =
    integrationsToggled ?? (Boolean(googleConnectError) || (zoomStatus != null && !zoomStatus.configured));

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
      <PageShell>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </PageShell>
    );
  }

  if (canAccessAdmin && !hasAdminLiveSessionsFeature) {
    return (
      <PageShell>
        <AdminLiveSessionsFeatureBlocked />
      </PageShell>
    );
  }

  if (loading && sessions.length === 0) {
    return (
      <PageShell>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
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
      <Box sx={{ position: "relative" }}>
        {loading && sessions.length > 0 && (
          <LinearProgress sx={{ position: "absolute", insetInlineStart: 0, insetInlineEnd: 0, top: 0, zIndex: 1 }} />
        )}

        <ModulePageHeader
          eyebrow="Engagement"
          title="Live Sessions"
          description="Schedule and run live classes and webinars."
          accent="indigo"
          icon="mdi:video-box"
          action={
            <HeaderActionButton
              icon="mdi:plus"
              onClick={() => router.push("/admin/live-sessions/create")}
            >
              {t("adminLiveSessions.createLiveSession", "Create Live Session")}
            </HeaderActionButton>
          }
        />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Integrations & tools — one slim strip instead of three stacked panels. The full
                setup cards live inside a Collapse and only demand attention when something
                actually needs it (nothing configured yet, or a failed Google connect). */}
            <Box
              sx={{
                borderRadius: 2,
                border: "1px solid var(--border-default)",
                bgcolor: "var(--card-bg)",
                overflow: "hidden",
              }}
            >
              <Box
                role="button"
                tabIndex={0}
                onClick={() => setIntegrationsToggled(!integrationsOpen)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setIntegrationsToggled(!integrationsOpen); }}
                sx={{
                  px: 2, py: 1.25, display: "flex", alignItems: "center", gap: 1.25, cursor: "pointer",
                  flexWrap: "wrap",
                  "&:hover": { bgcolor: "color-mix(in srgb, var(--accent-indigo) 4%, transparent)" },
                }}
              >
                <IconWrapper icon="mdi:connection" size={18} color="var(--accent-indigo)" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
                  {t("adminLiveSessions.integrationsTitle", "Integrations & tools")}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <StatusDot ok={Boolean(zoomStatus?.configured && zoomStatus?.active)} label="Zoom" />
                  <StatusDot ok={googleConnectError == null} warn={Boolean(googleConnectError)} label="Google Meet" />
                </Box>
                <Box sx={{ flex: 1 }} />
                <Button size="small" onClick={(e) => { e.stopPropagation(); setPresetsDialogOpen(true); }}
                  startIcon={<IconWrapper icon="mdi:tune-variant" size={16} />}
                  sx={{ textTransform: "none", color: "var(--font-secondary)" }}>
                  {t("adminLiveSessions.presets", "Presets")}
                </Button>
                <Button size="small" onClick={(e) => { e.stopPropagation(); setBackgroundsDialogOpen(true); }}
                  startIcon={<IconWrapper icon="mdi:image-outline" size={16} />}
                  sx={{ textTransform: "none", color: "var(--font-secondary)" }}>
                  {t("adminLiveSessions.backgrounds", "Backgrounds")}
                </Button>
                <IconWrapper
                  icon={integrationsOpen ? "mdi:chevron-up" : "mdi:chevron-down"}
                  size={20}
                  color="var(--font-secondary)"
                />
              </Box>
              <Collapse in={integrationsOpen} unmountOnExit={false}>
                <Box sx={{ px: 2, pb: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                  <ZoomSetupCard
                    status={zoomStatus}
                    onConfigure={() => setCredentialsDialogOpen(true)}
                    onConnect={handleZoomConnect}
                    onDisconnect={handleZoomDisconnect}
                    connecting={zoomConnecting}
                  />
                  <GoogleSetupCard connectError={googleConnectError} onDismissError={() => setGoogleConnectError(null)} />
                  <ImportedMeetingsInbox
                    ref={inboxRef}
                    formatDateTime={formatDateTime}
                    onAssigned={loadSessions}
                  />
                </Box>
              </Collapse>
            </Box>

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

                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap" }}>
                  <SessionFilterChips options={filterOptions} value={filter} onChange={setFilter} />
                  <Box sx={{ display: "inline-flex", p: 0.375, borderRadius: 999, border: "1px solid var(--border-default)", bgcolor: "var(--card-bg)" }}>
                    {([
                      { key: "list", icon: "mdi:view-grid-outline", label: t("adminLiveSessions.viewList", "List") },
                      { key: "calendar", icon: "mdi:calendar-month-outline", label: t("adminLiveSessions.viewCalendar", "Calendar") },
                    ] as const).map((v) => {
                      const active = viewMode === v.key;
                      return (
                        <Box key={v.key} component="button" onClick={() => setViewMode(v.key)}
                          sx={{
                            display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.75, py: 0.75, borderRadius: 999,
                            border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, fontFamily: "inherit",
                            bgcolor: active ? "var(--accent-indigo)" : "transparent",
                            color: active ? "#fff" : "var(--font-secondary)",
                          }}>
                          <IconWrapper icon={v.icon} size={16} />
                          {v.label}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>

                {viewMode === "calendar" ? (
                  <LiveSessionsCalendar sessions={filteredSessions} onOpen={openDetail} />
                ) : filteredSessions.length === 0 ? (
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
                        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
                        gap: 2,
                        alignItems: "stretch",
                      }}
                    >
                      {pagedSessions.map((s, idx) => (
                        <Reveal key={s.id} delay={Math.min(idx, 8) * 0.05}>
                          <LiveSessionCard
                            session={s}
                            variant="admin"
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
      </Box>

      <ZoomCredentialsDialog
          open={credentialsDialogOpen}
          onClose={() => {
            setCredentialsDialogOpen(false);
            refreshZoomStatus();
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

        {/* In-app recording playback (provider-neutral: Zoom cloud MP4s + Meet Drive files) */}
        <RecordingPlayerDialog
          open={Boolean(playerSession)}
          liveClassId={playerSession?.id ?? null}
          title={playerSession?.topic_name}
          onClose={() => setPlayerSession(null)}
        />
    </PageShell>
  );
}

/** Tiny status dot + label for the integrations strip. */
function StatusDot({ ok, warn = false, label }: { ok: boolean; warn?: boolean; label: string }) {
  const color = warn ? "var(--error-500, #ef4444)" : ok ? "var(--success-500)" : "var(--warning-500)";
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color, boxShadow: `0 0 6px ${color}` }} />
      <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontWeight: 600 }}>
        {label}
      </Typography>
    </Box>
  );
}
