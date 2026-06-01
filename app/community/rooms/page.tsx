"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { CreateRoomDialog } from "@/components/community/CreateRoomDialog";
import {
  communityService,
  Room,
  RoomStatus,
} from "@/lib/services/community.service";
import { useToast } from "@/components/common/Toast";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDistanceToNow } from "@/lib/utils/date-utils";

type TabValue = "all" | RoomStatus;

const STATUS_COLOR: Record<RoomStatus, string> = {
  live: "#ef4444",
  scheduled: "#0ea5e9",
  ended: "#6b7280",
};

const STATUS_LABEL: Record<RoomStatus, string> = {
  live: "Live now",
  scheduled: "Scheduled",
  ended: "Ended",
};

export default function RoomsListPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabValue>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const canCreate = useMemo(
    () => ["admin", "instructor", "superadmin"].includes(user?.role ?? ""),
    [user?.role]
  );

  const load = async () => {
    setLoading(true);
    try {
      const data = await communityService.getRooms();
      setRooms(data);
    } catch {
      showToast("Failed to load rooms.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Refresh when the tab regains focus, so live rooms stay current.
    const onVis = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => (tab === "all" ? rooms : rooms.filter((r) => r.status === tab)),
    [rooms, tab]
  );

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ py: 2, maxWidth: 1200, mx: "auto", width: "100%", px: { xs: 2, md: 0 } }}>
        <Button
          startIcon={<IconWrapper icon="mdi:arrow-left" size={16} />}
          onClick={() => router.push("/community")}
          sx={{ textTransform: "none", mb: 2, color: "var(--font-secondary)" }}
        >
          Back to community
        </Button>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
            mb: 2,
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <IconWrapper icon="mdi:broadcast" size={26} color="#ec4899" />
              <Typography variant="h5" fontWeight={700}>
                Live Rooms
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Drop into live voice/video sessions hosted by the community.
            </Typography>
          </Box>
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<IconWrapper icon="mdi:video-plus" size={16} />}
              onClick={() => setCreateOpen(true)}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: "10px",
                backgroundColor: "#ec4899",
                boxShadow: "none",
                "&:hover": { backgroundColor: "#db2777", boxShadow: "none" },
              }}
            >
              Start a Room
            </Button>
          )}
        </Box>

        <Paper
          elevation={0}
          sx={{
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--card-bg)",
            borderRadius: 2,
            mb: 2,
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{ px: 2, "& .MuiTab-root": { textTransform: "none", fontWeight: 600 } }}
          >
            <Tab label={`All (${rooms.length})`} value="all" />
            <Tab label={`Live (${rooms.filter((r) => r.status === "live").length})`} value="live" />
            <Tab label={`Scheduled (${rooms.filter((r) => r.status === "scheduled").length})`} value="scheduled" />
            <Tab label="Ended" value="ended" />
          </Tabs>
        </Paper>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filtered.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: "center",
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--card-bg)",
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            <IconWrapper icon="mdi:broadcast-off" size={48} color="var(--font-tertiary)" />
            <Typography variant="body1" color="text.secondary">
              {tab === "live"
                ? "No rooms are live right now."
                : tab === "scheduled"
                ? "No upcoming rooms scheduled."
                : tab === "ended"
                ? "No past rooms yet."
                : "No rooms yet — be the first to start one."}
            </Typography>
          </Paper>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" },
              gap: 2,
            }}
          >
            {filtered.map((room) => {
              const statusColor = STATUS_COLOR[room.status];
              return (
                <Paper
                  key={room.id}
                  elevation={0}
                  onClick={() => router.push(`/community/rooms/${room.id}`)}
                  sx={{
                    p: 2,
                    border: "1px solid var(--border-default)",
                    borderRadius: "14px",
                    backgroundColor: "var(--card-bg)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.25,
                    "&:hover": {
                      borderColor: statusColor,
                      transform: "translateY(-1px)",
                      boxShadow: `0 6px 18px ${statusColor}22`,
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      icon={
                        room.status === "live" ? (
                          <Box
                            sx={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              backgroundColor: statusColor,
                              ml: "6px !important",
                              animation: "pulse 1.4s infinite",
                              "@keyframes pulse": {
                                "0%, 100%": { opacity: 1 },
                                "50%": { opacity: 0.4 },
                              },
                            }}
                          />
                        ) : (
                          <IconWrapper
                            icon={room.status === "scheduled" ? "mdi:clock-outline" : "mdi:check"}
                            size={11}
                            color={statusColor}
                          />
                        )
                      }
                      label={STATUS_LABEL[room.status]}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        backgroundColor: `${statusColor}15`,
                        color: statusColor,
                        border: `1px solid ${statusColor}40`,
                      }}
                    />
                    {room.is_audio_only && (
                      <Chip
                        icon={<IconWrapper icon="mdi:microphone" size={11} color="var(--font-secondary)" />}
                        label="Audio"
                        size="small"
                        sx={{ height: 22, fontSize: "0.68rem", backgroundColor: "var(--surface)" }}
                      />
                    )}
                    <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 0.5, color: "var(--font-tertiary)" }}>
                      <IconWrapper icon="mdi:account-multiple-outline" size={14} />
                      <Typography variant="caption">
                        {room.active_count}/{room.max_participants}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.25 }}>
                    {room.title}
                  </Typography>

                  {room.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {room.description}
                    </Typography>
                  )}

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: "auto", pt: 0.5 }}>
                    <Avatar src={room.host.profile_pic_url} sx={{ width: 24, height: 24 }}>
                      {room.host.name?.charAt(0) ?? "?"}
                    </Avatar>
                    <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                      Hosted by <strong>{room.host.name}</strong>
                    </Typography>
                    <Typography variant="caption" sx={{ ml: "auto", color: "var(--font-tertiary)" }}>
                      {room.status === "live" && room.started_at
                        ? `started ${formatDistanceToNow(room.started_at)}`
                        : room.status === "scheduled" && room.scheduled_for
                        ? `at ${new Date(room.scheduled_for).toLocaleString()}`
                        : formatDistanceToNow(room.created_at)}
                    </Typography>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}

        <CreateRoomDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={(room) => router.push(`/community/rooms/${room.id}`)}
        />
      </Box>
    </MainLayout>
  );
}
