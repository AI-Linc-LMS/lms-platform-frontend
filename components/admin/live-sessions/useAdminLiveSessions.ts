"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/common/Toast";
import { useAuth } from "@/lib/auth/auth-context";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { studentLiveSessionsService } from "@/lib/services/live-sessions";
import {
  adminLiveActivitiesService,
  LiveActivity,
} from "@/lib/services/admin/admin-live-activities.service";
import {
  getLiveSessionErrorMessage,
  getZoomApiErrorMessage,
  copyToClipboard,
} from "@/lib/utils/live-session-errors";
import { canAccessAdminArea } from "@/lib/auth/role-utils";

const ADMIN_LIVE_SESSIONS_FEATURE = "admin_live_sessions";

export function useAdminLiveSessions() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { clientInfo, loading: loadingClientInfo } = useClientInfo();
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<LiveActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [watchingRecordingId, setWatchingRecordingId] = useState<
    number | null
  >(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedLiveClassId, setSelectedLiveClassId] = useState<
    number | null
  >(null);
  const [creatingZoomId, setCreatingZoomId] = useState<number | null>(null);
  const [creatingGoogleMeetId, setCreatingGoogleMeetId] = useState<number | null>(null);
  // In-app recording playback (provider-neutral backend proxy: Zoom MP4s + Meet Drive files).
  const [playerSession, setPlayerSession] = useState<LiveActivity | null>(null);

  const canAccessAdmin = canAccessAdminArea(user?.role);

  const enabledFeatureNames = new Set(
    clientInfo?.features?.map((f) => f.name) ?? []
  );
  const hasAdminLiveSessionsFeature =
    enabledFeatureNames.size === 0 ||
    enabledFeatureNames.has(ADMIN_LIVE_SESSIONS_FEATURE);

  useEffect(() => {
    if (!authLoading && !canAccessAdmin) {
      router.replace("/dashboard");
      return;
    }
    if (canAccessAdmin && hasAdminLiveSessionsFeature && !loadingClientInfo) {
      loadSessions();
    }
  }, [
    authLoading,
    canAccessAdmin,
    hasAdminLiveSessionsFeature,
    loadingClientInfo,
    router,
  ]);

  const loadSessions = async () => {
    if (!canAccessAdmin) return;
    try {
      setLoading(true);
      const data = await adminLiveActivitiesService.getLiveActivities();
      setSessions(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      showToast(getLiveSessionErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = (password: string) => {
    copyToClipboard(password, showToast, "Password copied");
  };

  const handleCreateZoom = async (liveClassId: number) => {
    try {
      setCreatingZoomId(liveClassId);
      const result = await adminLiveActivitiesService.createZoom(liveClassId);
      if (result.status === "error") {
        showToast(
          getZoomApiErrorMessage(result.message, "zoom_create"),
          "error"
        );
        return;
      }
      showToast("Zoom meeting created", "success");
      loadSessions();
    } catch (error: unknown) {
      showToast(
        getLiveSessionErrorMessage(error, "zoom_create"),
        "error"
      );
    } finally {
      setCreatingZoomId(null);
    }
  };

  const handleCreateGoogleMeet = async (liveClassId: number) => {
    try {
      setCreatingGoogleMeetId(liveClassId);
      const result = await adminLiveActivitiesService.createGoogleMeet(liveClassId);
      if (result.status === "error") {
        showToast(result.message || "Failed to create Google Meet", "error");
        return;
      }
      showToast("Google Meet created", "success");
      loadSessions();
    } catch (error: unknown) {
      showToast(getLiveSessionErrorMessage(error), "error");
    } finally {
      setCreatingGoogleMeetId(null);
    }
  };

  const handleWatchRecording = async (activity: LiveActivity) => {
    try {
      setWatchingRecordingId(activity.id);
      const info = await studentLiveSessionsService.getRecording(activity.id);
      if (info.playable_in_app) {
        // Watch ON platform - the backend proxy streams Zoom MP4s and Meet Drive recordings.
        setPlayerSession(activity);
        return;
      }
      const external = info.recording_link || activity.zoom_recording_url;
      if (external?.trim()) {
        window.open(external, "_blank");
        return;
      }
      showToast(getLiveSessionErrorMessage(null, "recording"), "error");
    } catch (error: unknown) {
      showToast(getLiveSessionErrorMessage(error, "recording"), "error");
    } finally {
      setWatchingRecordingId(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return {
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
    setRowsPerPage,
    watchingRecordingId,
    creatingZoomId,
    creatingGoogleMeetId,
    createDialogOpen,
    setCreateDialogOpen,
    detailDrawerOpen,
    setDetailDrawerOpen,
    selectedLiveClassId,
    setSelectedLiveClassId,
    loadSessions,
    handleCopyPassword,
    handleCreateZoom,
    handleCreateGoogleMeet,
    handleWatchRecording,
    formatDateTime,
    openViewSession: (activity: LiveActivity) => {
      setSelectedLiveClassId(activity.id);
      setDetailDrawerOpen(true);
    },
  };
}
