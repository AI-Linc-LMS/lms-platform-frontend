"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/common/Toast";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import {
  studentLiveSessionsService,
  StudentLiveSession,
} from "@/lib/services/live-sessions";
import { getLiveSessionErrorMessage, copyToClipboard } from "@/lib/utils/live-session-errors";

const LIVE_SESSIONS_FEATURE = "live_sessions";

function formatCompactMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return "";
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function useLiveSessions() {
  const { t } = useTranslation("common");
  const { clientInfo, loading: loadingClientInfo } = useClientInfo();
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<StudentLiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [watchingRecordingId, setWatchingRecordingId] = useState<
    number | null
  >(null);

  const enabledFeatureNames = new Set(
    clientInfo?.features?.map((f) => f.name) ?? []
  );
  const hasLiveSessionsFeature =
    enabledFeatureNames.size === 0 ||
    enabledFeatureNames.has(LIVE_SESSIONS_FEATURE);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await studentLiveSessionsService.getSessions();
      setSessions(data);
    } catch (error: unknown) {
      showToast(getLiveSessionErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loadingClientInfo || !hasLiveSessionsFeature) return;
    loadSessions();
  }, [loadingClientInfo, hasLiveSessionsFeature]);

  const handleCopyPassword = (password: string) => {
    copyToClipboard(password, showToast, t("liveSessions.passwordCopied"));
  };

  const handleWatchRecording = async (activity: StudentLiveSession) => {
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

  const formatSessionDuration = (minutes: number | undefined) => {
    if (minutes == null || minutes <= 0) return "—";
    return formatCompactMinutes(minutes);
  };

  const formatSessionStatusCaption = (
    activity: StudentLiveSession
  ): string | null => {
    const m = activity.time_remaining_minutes ?? 0;
    if (m <= 0) return null;
    const compact = formatCompactMinutes(m);
    if (!compact) return null;
    if (activity.meeting_status === "scheduled") {
      return t("liveSessions.startsInCountdown", { time: compact });
    }
    if (activity.meeting_status === "live") {
      return t("liveSessions.sessionTimeLeft", { time: compact });
    }
    return null;
  };

  return {
    loadingClientInfo,
    hasLiveSessionsFeature,
    loading,
    sessions,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    watchingRecordingId,
    loadSessions,
    handleCopyPassword,
    handleWatchRecording,
    formatDateTime,
    formatSessionDuration,
    formatSessionStatusCaption,
  };
}
