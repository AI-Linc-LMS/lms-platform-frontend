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

  const formatTimeRemaining = (minutes: number) => {
    if (minutes <= 0) return "Expired";
    if (minutes < 60) return `${minutes} min left`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m left` : `${hours}h left`;
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
    formatTimeRemaining,
  };
}
