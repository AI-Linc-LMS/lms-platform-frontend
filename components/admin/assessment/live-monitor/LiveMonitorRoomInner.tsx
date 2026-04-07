"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { Box, Alert, CircularProgress } from "@mui/material";
import { useRemoteParticipants } from "@livekit/components-react";
import type { RemoteParticipant } from "livekit-client";
import { LiveMonitorToolbar } from "./LiveMonitorToolbar";
import { LiveMonitorGrid } from "./LiveMonitorGrid";
import { StudentFocusView } from "./StudentFocusView";
import { livekitService } from "@/lib/services/livekit.service";
import { useToast } from "@/components/common/Toast";

function participantDisplayName(p: RemoteParticipant): string {
  try {
    if (p.metadata) {
      const m = JSON.parse(p.metadata) as { name?: string };
      if (m.name) return String(m.name);
    }
  } catch {
    /* ignore */
  }
  return p.name || p.identity || "";
}

interface LiveMonitorRoomInnerProps {
  assessmentId: number;
  assessmentTitle: string;
  roomName?: string;
}

export function LiveMonitorRoomInner({
  assessmentId,
  assessmentTitle,
  roomName,
}: LiveMonitorRoomInnerProps) {
  const AUTO_REFRESH_SECONDS = 120;
  const { showToast } = useToast();
  const remote = useRemoteParticipants();
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(12);
  const [page, setPage] = useState(1);
  const [focusIdentity, setFocusIdentity] = useState<string | null>(null);
  const [focusAudioOn, setFocusAudioOn] = useState(false);
  const [audioMuted, setAudioMuted] = useState(true);
  const [apiRefreshing, setApiRefreshing] = useState(false);
  const [secondsToRefresh, setSecondsToRefresh] = useState(AUTO_REFRESH_SECONDS);

  const students = useMemo(
    () => remote.filter((p) => p.identity?.startsWith("student-")),
    [remote]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((p) => {
      const n = participantDisplayName(p).toLowerCase();
      const id = (p.identity || "").toLowerCase();
      return n.includes(q) || id.includes(q);
    });
  }, [students, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  const handlePageSizeChange = useCallback((n: number) => {
    setPageSize(n);
    setPage(1);
  }, []);

  const handleSelect = useCallback((identity: string) => {
    setFocusIdentity(identity);
    setFocusAudioOn(false);
    setAudioMuted(true);
  }, []);

  const handleBack = useCallback(() => {
    setFocusIdentity(null);
    setFocusAudioOn(false);
    setAudioMuted(true);
  }, []);

  const handleMuteAll = useCallback(() => {
    setAudioMuted((prev) => {
      const next = !prev;
      setFocusAudioOn(!next);
      showToast(next ? "Audio muted for focus view" : "Audio enabled", "info");
      return next;
    });
  }, [showToast]);

  const handleRefreshApi = useCallback(async () => {
    try {
      setApiRefreshing(true);
      setSecondsToRefresh(AUTO_REFRESH_SECONDS);
      const data = await livekitService.getLiveParticipants(assessmentId);
      showToast(
        `API: ${data.participant_count} participant(s) in room`,
        "success"
      );
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Could not load live participants",
        "error"
      );
    } finally {
      setApiRefreshing(false);
    }
  }, [assessmentId, showToast]);

  useEffect(() => {
    const countdown = window.setInterval(() => {
      setSecondsToRefresh((prev) => (prev <= 1 ? AUTO_REFRESH_SECONDS : prev - 1));
    }, 1000);
    return () => window.clearInterval(countdown);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void handleRefreshApi();
    }, AUTO_REFRESH_SECONDS * 1000);
    return () => window.clearInterval(timer);
  }, [handleRefreshApi]);

  if (focusIdentity) {
    return (
      <Box>
        <LiveMonitorToolbar
          title={assessmentTitle}
          roomName={roomName}
          search={search}
          onSearchChange={handleSearchChange}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          page={safePage}
          totalPages={totalPages}
          filteredCount={filtered.length}
          totalCount={students.length}
          onPageChange={setPage}
          onMuteAllAudio={handleMuteAll}
          audioMuted={audioMuted}
          onRefreshParticipants={handleRefreshApi}
          refreshing={apiRefreshing}
          autoRefreshInSeconds={secondsToRefresh}
        />
        <StudentFocusView
          identity={focusIdentity}
          audioEnabled={focusAudioOn}
          onToggleAudio={() =>
            setFocusAudioOn((o) => {
              const next = !o;
              setAudioMuted(!next);
              return next;
            })
          }
          onBack={handleBack}
        />
      </Box>
    );
  }

  return (
    <Box>
      <LiveMonitorToolbar
        title={assessmentTitle}
        roomName={roomName}
        search={search}
        onSearchChange={handleSearchChange}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        page={safePage}
        totalPages={totalPages}
        filteredCount={filtered.length}
        totalCount={students.length}
        onPageChange={setPage}
        onMuteAllAudio={handleMuteAll}
        audioMuted={audioMuted}
        onRefreshParticipants={handleRefreshApi}
        refreshing={apiRefreshing}
        autoRefreshInSeconds={secondsToRefresh}
      />
      <LiveMonitorGrid
        participants={paginated}
        selectedIdentity={null}
        onSelect={handleSelect}
      />
    </Box>
  );
}

/** Connection hint while LiveKitRoom connects */
export function LiveMonitorConnecting() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        py: 10,
      }}
    >
      <CircularProgress size={32} />
      <Alert severity="info" sx={{ py: 0 }}>
        Connecting to live room…
      </Alert>
    </Box>
  );
}
