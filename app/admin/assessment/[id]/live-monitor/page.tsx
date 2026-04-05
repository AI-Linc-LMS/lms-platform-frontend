"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  LiveKitRoom,
  useConnectionState,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { Box, Button, Alert, CircularProgress, Typography } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { config } from "@/lib/config";
import { livekitService } from "@/lib/services/livekit.service";
import { adminAssessmentService } from "@/lib/services/admin/admin-assessment.service";
import {
  LiveMonitorRoomInner,
  LiveMonitorConnecting,
} from "@/components/admin/assessment/live-monitor/LiveMonitorRoomInner";

function ConnectionGate({
  assessmentId,
  assessmentTitle,
  roomName,
}: {
  assessmentId: number;
  assessmentTitle: string;
  roomName?: string;
}) {
  const state = useConnectionState();

  if (state === ConnectionState.Disconnected) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Disconnected from live room. Close this page and open Live monitor again.
      </Alert>
    );
  }

  if (state !== ConnectionState.Connected) {
    return <LiveMonitorConnecting />;
  }

  return (
    <LiveMonitorRoomInner
      assessmentId={assessmentId}
      assessmentTitle={assessmentTitle}
      roomName={roomName}
    />
  );
}

export default function AssessmentLiveMonitorPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id;
  const assessmentId = Number(
    Array.isArray(idParam) ? idParam[0] : idParam
  );

  const [token, setToken] = useState<string | undefined>();
  const [serverUrl, setServerUrl] = useState<string | undefined>();
  const [roomName, setRoomName] = useState<string | undefined>();
  const [title, setTitle] = useState<string>("Assessment");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!assessmentId || Number.isNaN(assessmentId)) {
      setLoadError("Invalid assessment");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [detail, creds] = await Promise.all([
        adminAssessmentService.getAssessmentById(config.clientId, assessmentId),
        livekitService.getToken({
          assessment_id: assessmentId,
          role: "subscriber",
        }),
      ]);
      setTitle(detail.title || "Assessment");
      setToken(creds.token);
      setRoomName(creds.room);
      const url =
        (creds.livekit_url && creds.livekit_url.trim()) ||
        livekitService.getLivekitUrl();
      if (!url) {
        setLoadError(
          "LiveKit URL missing. Set NEXT_PUBLIC_LIVEKIT_URL or return livekit_url from the token API."
        );
        setToken(undefined);
        setServerUrl(undefined);
        return;
      }
      setServerUrl(url);
    } catch (e) {
      setLoadError(
        e instanceof Error ? e.message : "Failed to load live monitor"
      );
      setToken(undefined);
      setServerUrl(undefined);
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1600, mx: "auto" }}>
        <Button
          startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
          onClick={() => router.push("/admin/assessment")}
          sx={{ mb: 2, color: "#64748b" }}
        >
          Back to assessments
        </Button>

        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 0.5,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Live monitor
        </Typography>

        {loading && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 6 }}>
            <CircularProgress size={32} />
            <Typography color="text.secondary">Loading…</Typography>
          </Box>
        )}

        {!loading && loadError && (
          <Alert severity="error" sx={{ mt: 2 }} action={
            <Button color="inherit" size="small" onClick={() => void load()}>
              Retry
            </Button>
          }>
            {loadError}
          </Alert>
        )}

        {!loading && !loadError && token && serverUrl && (
          <LiveKitRoom
            token={token}
            serverUrl={serverUrl}
            connect
            audio={false}
            video={false}
            onError={(err) => {
              console.error("[live-monitor] LiveKitRoom", err);
            }}
          >
            <ConnectionGate
              assessmentId={assessmentId}
              assessmentTitle={title}
              roomName={roomName}
            />
          </LiveKitRoom>
        )}
      </Box>
    </MainLayout>
  );
}
