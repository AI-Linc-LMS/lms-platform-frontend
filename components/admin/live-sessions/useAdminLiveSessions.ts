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
import { getUniqueAttendanceCount } from "@/lib/utils/attendance-utils";
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
  const [uniqueAttendanceCounts, setUniqueAttendanceCounts] = useState<Record<number, number>>({});

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

  // Fetch unique attendee count per session (one person = one count, no re-joins)
  useEffect(() => {
    const withAttendance = sessions.filter((s) => (s.attendance_count ?? 0) > 0);
    if (withAttendance.length === 0) {
      setUniqueAttendanceCounts({});
      return;
    }
    let cancelled = false;
    Promise.all(
      withAttendance.map(async (a) => {
        try {
          const res = await adminLiveActivitiesService.getZoomAttendance(a.id);
          return { id: a.id, count: getUniqueAttendanceCount(res.participants ?? []) };
        } catch {
          return { id: a.id, count: 0 };
        }
      })
    ).then((results) => {
      if (cancelled) return;
      const map: Record<number, number> = {};
      results.forEach((r) => {
        map[r.id] = r.count;
      });
      setUniqueAttendanceCounts(map);
    });
    return () => {
      cancelled = true;
    };
  }, [sessions]);

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

  const handleWatchRecording = async (activity: LiveActivity) => {
    if (activity.zoom_recording_url?.trim()) {
      window.open(activity.zoom_recording_url, "_blank");
      return;
    }
    try {
      setWatchingRecordingId(activity.id);
      const data = await studentLiveSessionsService.getRecording(activity.id);
      if (data.recording_url) {
        window.open(data.recording_url, "_blank");
      }
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
    openViewSession: (activity: LiveActivity) => {
      setSelectedLiveClassId(activity.id);
      setDetailDrawerOpen(true);
    },
  };
}
