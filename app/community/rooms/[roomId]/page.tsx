"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { DailyRoom } from "@/components/community/DailyRoom";
import {
  communityService,
  RoomDetail,
  RoomParticipant,
} from "@/lib/services/community.service";
import { useToast } from "@/components/common/Toast";
import { useAuth } from "@/lib/auth/auth-context";

export default function RoomDetailPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const roomId = Number(params?.roomId);

  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [inSession, setInSession] = useState(false);
  const [notFound, setNotFound] = useState(false);
  // Daily issues a per-user JWT each time the user clicks Join. We keep it in
  // state (not in `room`) because it expires and shouldn't be reused across
  // joins / page revisits.
  const [meetingToken, setMeetingToken] = useState<string>("");

  // Display name + email come from the auth context (single source of truth).
  const displayName = useMemo(() => {
    if (!user) return "Guest";
    const full = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
    return full || user.user_name || user.email || "Guest";
  }, [user]);

  const fetchRoom = async () => {
    try {
      const data = await communityService.getRoom(roomId);
      setRoom(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!roomId || Number.isNaN(roomId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    fetchRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Auto-call /leave/ when the user navigates away mid-session. We read
  // inSession via a ref so this effect only re-creates on roomId change -
  // otherwise every `setInSession(false)` from handleLeave would trigger
  // the cleanup of the *previous* effect (which captured inSession=true)
  // and fire a SECOND leaveRoom call. The handleLeave call is enough.
  const inSessionRef = useRef(false);
  inSessionRef.current = inSession;
  useEffect(() => {
    return () => {
      if (inSessionRef.current) {
        communityService.leaveRoom(roomId).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const updated = await communityService.joinRoom(roomId);
      setRoom(updated);
      setMeetingToken(updated.meeting_token ?? "");
      setInSession(true);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't join the room.", "error");
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    setInSession(false);
    setMeetingToken("");
    await communityService.leaveRoom(roomId).catch(() => {});
    await fetchRoom();
  };

  const handleEnd = async () => {
    try {
      const updated = await communityService.endRoom(roomId);
      setRoom(updated);
      setInSession(false);
      showToast("Room ended.", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to end room.", "error");
    }
  };

  const handleStart = async () => {
    try {
      const updated = await communityService.startRoom(roomId);
      setRoom(updated);
      showToast("Room is live!", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to start.", "error");
    }
  };

  const handleModerate = async (
    userId: number,
    action: "kick" | "ban" | "unban"
  ) => {
    try {
      const updated = await communityService.moderateRoomParticipant(roomId, userId, action);
      setRoom(updated);
      showToast(
        action === "kick" ? "Participant kicked." : action === "ban" ? "Participant banned." : "Participant unbanned.",
        "success"
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Moderation failed.", "error");
    }
  };

  if (loading) {
    return (
      <MainLayout fullWidthContent>
        <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (notFound || !room) {
    return (
      <MainLayout fullWidthContent>
        <Box
          sx={{
            maxWidth: 520,
            mx: "auto",
            textAlign: "center",
            py: 12,
            px: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          <IconWrapper icon="mdi:broadcast-off" size={56} color="var(--font-tertiary)" />
          <Typography variant="h6" sx={{ mt: 1 }}>
            Room not found
          </Typography>
          <Button
            variant="outlined"
            sx={{ mt: 2, textTransform: "none" }}
            onClick={() => router.push("/community/rooms")}
          >
            Back to all rooms
          </Button>
        </Box>
      </MainLayout>
    );
  }

  const isModerator = room.current_user_role === "host" || room.current_user_role === "moderator";
  const isBanned = room.current_user_role === "banned";

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ py: 2, maxWidth: 1400, mx: "auto", width: "100%", px: { xs: 1.5, md: 0 } }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, flexWrap: "wrap" }}>
          <IconButton onClick={() => router.push("/community/rooms")} size="small">
            <IconWrapper icon="mdi:arrow-left" size={20} />
          </IconButton>
          <Typography variant="h6" fontWeight={700} sx={{ flex: 1, minWidth: 0 }}>
            {room.title}
          </Typography>
          {room.status === "live" && (
            <Chip
              icon={
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    backgroundColor: "#ef4444",
                    ml: "6px !important",
                    animation: "pulse 1.4s infinite",
                    "@keyframes pulse": {
                      "0%, 100%": { opacity: 1 },
                      "50%": { opacity: 0.4 },
                    },
                  }}
                />
              }
              label="LIVE"
              size="small"
              sx={{
                height: 24,
                fontSize: "0.7rem",
                fontWeight: 800,
                letterSpacing: "0.08em",
                backgroundColor: "rgba(239,68,68,0.12)",
                color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.4)",
              }}
            />
          )}
          {isModerator && (
            <Chip
              icon={<IconWrapper icon="mdi:shield-crown-outline" size={12} color="#a78bfa" />}
              label="Moderator"
              size="small"
              sx={{
                height: 24,
                fontSize: "0.7rem",
                fontWeight: 700,
                backgroundColor: "rgba(167,139,250,0.12)",
                color: "#7c3aed",
                border: "1px solid rgba(167,139,250,0.4)",
              }}
            />
          )}
        </Box>

        {/* Main grid: Jitsi pane + participants sidebar */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 280px" },
            gap: 2,
          }}
        >
          {/* Left: media pane (Jitsi when joined, lobby otherwise) */}
          <Box>
            {inSession && room.status === "live" ? (
              room.daily_room_url ? (
                <DailyRoom
                  url={room.daily_room_url}
                  token={meetingToken}
                  displayName={displayName}
                  audioOnly={room.is_audio_only}
                  onLeft={handleLeave}
                />
              ) : (
                // Daily wasn't provisioned for this row - surface clearly so
                // the operator knows to either set DAILY_API_KEY and recreate,
                // or that the API call failed at create time.
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    border: "1px solid rgba(239,68,68,0.3)",
                    backgroundColor: "rgba(239,68,68,0.05)",
                    borderRadius: "14px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <IconWrapper icon="mdi:alert-circle-outline" size={42} color="#ef4444" />
                  <Typography variant="body1" fontWeight={700} sx={{ color: "#b91c1c" }}>
                    This room hasn&apos;t been provisioned yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    The video service is not configured on the server, or provisioning
                    failed at create time. Ask an admin to recreate the room.
                  </Typography>
                </Paper>
              )
            ) : (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, md: 5 },
                  border: "1px solid var(--border-default)",
                  borderRadius: "14px",
                  backgroundColor: "var(--card-bg)",
                  textAlign: "center",
                }}
              >
                <Box
                  sx={{
                    width: 92,
                    height: 92,
                    mx: "auto",
                    mb: 2.5,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #ec4899, #a78bfa)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                  }}
                >
                  <IconWrapper
                    icon={room.is_audio_only ? "mdi:microphone" : "mdi:video"}
                    size={42}
                    color="#fff"
                  />
                </Box>

                <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
                  {room.title}
                </Typography>
                {room.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 520, mx: "auto" }}>
                    {room.description}
                  </Typography>
                )}

                {isBanned ? (
                  <Typography sx={{ color: "#ef4444", fontWeight: 600 }}>
                    You have been banned from this room.
                  </Typography>
                ) : room.status === "ended" ? (
                  <Typography color="text.secondary">
                    This room has ended.
                  </Typography>
                ) : room.status === "live" ? (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleJoin}
                    disabled={joining}
                    startIcon={
                      joining ? (
                        <CircularProgress size={16} sx={{ color: "#fff" }} />
                      ) : (
                        <IconWrapper icon="mdi:video-account" size={18} />
                      )
                    }
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      borderRadius: "10px",
                      px: 3,
                      py: 1.25,
                      backgroundColor: "#ec4899",
                      boxShadow: "none",
                      "&:hover": { backgroundColor: "#db2777", boxShadow: "none" },
                    }}
                  >
                    {joining ? "Joining…" : "Join room"}
                  </Button>
                ) : isModerator ? (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleStart}
                    startIcon={<IconWrapper icon="mdi:play" size={18} />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      borderRadius: "10px",
                      backgroundColor: "#10b981",
                      boxShadow: "none",
                      "&:hover": { backgroundColor: "#059669", boxShadow: "none" },
                    }}
                  >
                    Go live
                  </Button>
                ) : (
                  <Typography color="text.secondary">
                    Waiting for the host to start this room.
                  </Typography>
                )}

                <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, mt: 3, flexWrap: "wrap" }}>
                  <Chip
                    icon={<IconWrapper icon="mdi:account-multiple" size={13} color="var(--font-secondary)" />}
                    label={`${room.active_count}/${room.max_participants} in room`}
                    size="small"
                    sx={{ backgroundColor: "var(--surface)" }}
                  />
                  {room.is_audio_only && (
                    <Chip
                      icon={<IconWrapper icon="mdi:microphone" size={13} color="var(--font-secondary)" />}
                      label="Audio only"
                      size="small"
                      sx={{ backgroundColor: "var(--surface)" }}
                    />
                  )}
                </Box>
              </Paper>
            )}

            {/* Moderator controls bar (only when in session) */}
            {inSession && isModerator && (
              <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  startIcon={<IconWrapper icon="mdi:stop-circle-outline" size={16} />}
                  onClick={handleEnd}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderColor: "#ef4444",
                    color: "#ef4444",
                    "&:hover": { backgroundColor: "rgba(239,68,68,0.08)", borderColor: "#ef4444" },
                  }}
                >
                  End room for everyone
                </Button>
              </Box>
            )}
          </Box>

          {/* Right: participants sidebar */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: "1px solid var(--border-default)",
              borderRadius: "14px",
              backgroundColor: "var(--card-bg)",
              alignSelf: "flex-start",
              maxHeight: { md: "calc(100vh - 220px)" },
              overflowY: "auto",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.5 }}>
              <IconWrapper icon="mdi:account-multiple" size={15} color="var(--font-secondary)" />
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--font-secondary)",
                }}
              >
                Participants ({room.participants.length})
              </Typography>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
              {room.participants.map((p: RoomParticipant) => {
                const isHost = p.user.id === room.host.id;
                return (
                  <Box
                    key={p.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      px: 1,
                      py: 0.75,
                      borderRadius: "8px",
                      backgroundColor: p.is_active ? "rgba(16,185,129,0.06)" : "transparent",
                      border: p.is_active ? "1px solid rgba(16,185,129,0.25)" : "1px solid transparent",
                    }}
                  >
                    <Avatar src={p.user.profile_pic_url} sx={{ width: 28, height: 28 }}>
                      {p.user.name?.charAt(0) ?? "?"}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {p.user.name}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        {isHost && (
                          <Typography variant="caption" sx={{ color: "#a78bfa", fontWeight: 700, fontSize: "0.65rem" }}>
                            HOST
                          </Typography>
                        )}
                        {p.is_active ? (
                          <Typography variant="caption" sx={{ color: "#10b981", fontWeight: 600, fontSize: "0.65rem" }}>
                            • IN ROOM
                          </Typography>
                        ) : p.role === "banned" ? (
                          <Typography variant="caption" sx={{ color: "#ef4444", fontWeight: 600, fontSize: "0.65rem" }}>
                            • BANNED
                          </Typography>
                        ) : (
                          <Typography variant="caption" sx={{ color: "var(--font-tertiary)", fontSize: "0.65rem" }}>
                            left
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    {isModerator && !isHost && (
                      <Box sx={{ display: "flex" }}>
                        {p.is_active && (
                          <Tooltip title="Kick (for this session)">
                            <IconButton
                              size="small"
                              onClick={() => handleModerate(p.user.id, "kick")}
                              sx={{ color: "var(--font-tertiary)", "&:hover": { color: "#f59e0b" } }}
                            >
                              <IconWrapper icon="mdi:logout-variant" size={15} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {p.role === "banned" ? (
                          <Tooltip title="Unban">
                            <IconButton
                              size="small"
                              onClick={() => handleModerate(p.user.id, "unban")}
                              sx={{ color: "var(--font-tertiary)", "&:hover": { color: "#10b981" } }}
                            >
                              <IconWrapper icon="mdi:account-check-outline" size={15} />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Ban from room">
                            <IconButton
                              size="small"
                              onClick={() => handleModerate(p.user.id, "ban")}
                              sx={{ color: "var(--font-tertiary)", "&:hover": { color: "#ef4444" } }}
                            >
                              <IconWrapper icon="mdi:account-cancel-outline" size={15} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    )}
                  </Box>
                );
              })}

              {room.participants.length === 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                  No one has joined yet.
                </Typography>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>
    </MainLayout>
  );
}
