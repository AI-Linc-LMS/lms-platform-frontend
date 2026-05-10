"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Button, Typography, Alert, CircularProgress, Paper } from "@mui/material";
import { LiveKitRoom } from "@livekit/components-react";
import { VideoConference } from "@livekit/components-react/prefabs";
import "@livekit/components-styles/index.css";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { communityService } from "@/lib/services/community.service";
import { livekitService } from "@/lib/services/livekit.service";
import { config } from "@/lib/config";
import { useAuth } from "@/lib/auth/auth-context";
import type { LiveSessionDto } from "@/lib/community/widget-types";
import { LiveRoomLobby } from "@/components/community/live/LiveRoomLobby";
import { LiveRoomHostBar } from "@/components/community/live/LiveRoomHostBar";
import {
  ROOM_JOIN_EARLY_MINUTES,
  minutesUntilStart,
} from "@/lib/community/community-live";
import { isAdminRole } from "@/lib/community/permissions";
import { useToast } from "@/components/common/Toast";

export default function CommunityLiveSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { showToast } = useToast();
  const raw = params?.sessionId;
  const sessionId = Number(Array.isArray(raw) ? raw[0] : raw);

  const [session, setSession] = useState<LiveSessionDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [token, setToken] = useState<string | undefined>();
  const [serverUrl, setServerUrl] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [joinPrefs, setJoinPrefs] = useState<{ audio: boolean; video: boolean }>({
    audio: true,
    video: true,
  });
  const tokenFetchStarted = useRef(false);

  const loadSession = useCallback(async () => {
    if (!Number.isFinite(sessionId) || sessionId <= 0) {
      setLoadError("Invalid session.");
      setLoading(false);
      return;
    }
    if (!config.communityWidgetApi) {
      setLoadError(
        "Community widget API is disabled. Enable NEXT_PUBLIC_COMMUNITY_WIDGET_API and use a session created on the server."
      );
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    const res = await communityService.getLiveSession(sessionId);
    if (!res.ok || !res.data) {
      setLoadError("Could not load this live session.");
      setLoading(false);
      return;
    }
    setSession(res.data);
    setLoading(false);
  }, [sessionId]);

  const connectLiveKit = useCallback(async () => {
    if (!session?.builtin_livekit) return;
    if (tokenFetchStarted.current) return;
    tokenFetchStarted.current = true;
    setLoading(true);
    setLoadError(null);
    try {
      const tok = await communityService.postCommunityLiveKitToken(sessionId);
      if (!tok.ok || !tok.data) {
        tokenFetchStarted.current = false;
        setLoadError(
          "Could not join the in-app room. Check that LiveKit is configured on the server and you are within the session window."
        );
        setLoading(false);
        return;
      }
      const url =
        (tok.data.livekit_url && tok.data.livekit_url.trim()) ||
        livekitService.getLivekitUrl();
      if (!url) {
        tokenFetchStarted.current = false;
        setLoadError(
          "LiveKit URL is missing. Set LIVEKIT_URL on the server and NEXT_PUBLIC_LIVEKIT_URL in the app."
        );
        setLoading(false);
        return;
      }
      setToken(tok.data.token);
      setServerUrl(url);
    } catch {
      tokenFetchStarted.current = false;
      setLoadError("Failed to connect to the live room.");
    } finally {
      setLoading(false);
    }
  }, [session, sessionId]);

  useEffect(() => {
    tokenFetchStarted.current = false;
    setToken(undefined);
    setServerUrl(undefined);
    void loadSession();
  }, [loadSession, sessionId]);

  // Auto-connect only after user explicitly clicks "Join" in the lobby.
  useEffect(() => {
    if (!hasJoined) return;
    if (!session || !session.builtin_livekit) return;
    if (!isAuthenticated || authLoading) return;
    void connectLiveKit();
  }, [hasJoined, session, isAuthenticated, authLoading, connectLiveKit]);

  const openExternal = () => {
    if (session?.meet_url) {
      window.open(session.meet_url, "_blank", "noopener,noreferrer");
    }
  };

  if (authLoading) {
    return (
      <MainLayout>
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <Box sx={{ maxWidth: 560, mx: "auto", py: 6, px: 2 }}>
          <Alert severity="info">Sign in to join community live rooms.</Alert>
          <Button sx={{ mt: 2 }} onClick={() => router.push("/login")} variant="contained">
            Sign in
          </Button>
        </Box>
      </MainLayout>
    );
  }

  if (loading && !session) {
    return (
      <MainLayout>
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress sx={{ color: "var(--primary-500)" }} />
        </Box>
      </MainLayout>
    );
  }

  if (loadError && !session) {
    return (
      <MainLayout>
        <Box sx={{ maxWidth: 720, mx: "auto", py: 4, px: 2 }}>
          <Alert severity="error">{loadError}</Alert>
          <Button startIcon={<IconWrapper icon="mdi:arrow-left" />} sx={{ mt: 2 }} onClick={() => router.push("/community")}>
            Back to Community
          </Button>
        </Box>
      </MainLayout>
    );
  }

  if (session && !session.builtin_livekit) {
    return (
      <MainLayout>
        <Box sx={{ maxWidth: 720, mx: "auto", py: 4, px: 2 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            {session.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This session uses an external link (Meet, Zoom, Discord, etc.). Open it in a new tab to join voice and video there.
          </Typography>
          <Button variant="contained" onClick={openExternal} startIcon={<IconWrapper icon="mdi:open-in-new" />}>
            Open join link
          </Button>
          <Button sx={{ ml: 2 }} onClick={() => router.push("/community")}>
            Back
          </Button>
        </Box>
      </MainLayout>
    );
  }

  if (loadError && session) {
    return (
      <MainLayout>
        <Box sx={{ maxWidth: 720, mx: "auto", py: 4, px: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {loadError}
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You can join from 15 minutes before the start time until the scheduled end. External-style sessions can use the link from the community Live row instead.
          </Typography>
          <Button onClick={() => router.push("/community")}>Back to Community</Button>
        </Box>
      </MainLayout>
    );
  }

  if (session?.builtin_livekit && !loadError && !hasJoined) {
    const minsOut = minutesUntilStart(session.starts_at ?? null);
    const tooEarly = minsOut !== null && minsOut > ROOM_JOIN_EARLY_MINUTES;
    const ended = session.ends_at
      ? new Date(session.ends_at).getTime() < Date.now()
      : false;
    const joinable = !tooEarly && !ended;
    const windowMessage = ended
      ? "This room has already ended."
      : tooEarly
        ? `Room opens ${ROOM_JOIN_EARLY_MINUTES} minutes before the start time. Check back in ${minsOut! - ROOM_JOIN_EARLY_MINUTES} min.`
        : null;
    const fallbackName =
      [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
      user?.user_name ||
      "Member";

    return (
      <MainLayout>
        <LiveRoomLobby
          title={session.title}
          hostName={session.host_name ?? null}
          startsAt={session.starts_at ?? null}
          endsAt={session.ends_at ?? null}
          joinable={joinable}
          windowMessage={windowMessage}
          defaultDisplayName={fallbackName}
          onCancel={() => router.push("/community")}
          onJoin={(prefs) => {
            setJoinPrefs({ audio: prefs.audioEnabled, video: prefs.videoEnabled });
            setHasJoined(true);
          }}
        />
      </MainLayout>
    );
  }

  if (session?.builtin_livekit && hasJoined && !loadError && (!token || !serverUrl)) {
    return (
      <MainLayout>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 10,
            gap: 2,
          }}
        >
          <CircularProgress sx={{ color: "var(--primary-500)" }} />
          <Typography variant="body2" color="text.secondary">
            Connecting to room…
          </Typography>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box
        sx={{
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(180deg, var(--surface) 0%, color-mix(in srgb, var(--surface) 92%, var(--border-default) 8%) 100%)",
        }}
      >
        <LiveRoomHostBar
          title={session?.title || "Live room"}
          hostName={session?.host_name ?? null}
          endsAt={session?.ends_at ?? null}
          isHost={isAdminRole(user?.role)}
          onLeave={() => {
            setToken(undefined);
            setServerUrl(undefined);
            setHasJoined(false);
            router.push("/community");
          }}
          onCopyInvite={() => {
            const url = typeof window !== "undefined" ? window.location.href : "";
            if (!url) return;
            navigator.clipboard
              .writeText(url)
              .then(() => showToast("Invite link copied", "success"))
              .catch(() => showToast("Could not copy link", "error"));
          }}
        />

        <Paper
          elevation={0}
          sx={{
            flex: 1,
            m: { xs: 1, sm: 2 },
            borderRadius: 2,
            border: "1px solid var(--border-default)",
            overflow: "hidden",
            minHeight: { xs: "70vh", md: "calc(100vh - 140px)" },
            bgcolor: "var(--card-bg)",
            "& [data-lk-theme]": { height: "100%" },
          }}
        >
          <LiveKitRoom
            data-lk-theme="default"
            token={token}
            serverUrl={serverUrl}
            connect
            audio={joinPrefs.audio}
            video={joinPrefs.video}
            onDisconnected={() => {
              setToken(undefined);
              setServerUrl(undefined);
              setHasJoined(false);
            }}
            onError={(err) => {
              console.error("[community-live]", err);
            }}
            style={{ height: "100%" }}
          >
            <Box sx={{ height: "100%", minHeight: 480, "& .lk-video-conference": { height: "100%" } }}>
              <VideoConference />
            </Box>
          </LiveKitRoom>
        </Paper>
      </Box>
    </MainLayout>
  );
}
