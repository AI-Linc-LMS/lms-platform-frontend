"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Box, Tooltip, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import { communityService, Room } from "@/lib/services/community.service";

interface LiveRoomsStripProps {
  // How often (ms) to refresh the live list. Default: 30s.
  refreshMs?: number;
  // Triggered when user clicks "Start a Room" tile (admin/instructor).
  onCreateClick?: () => void;
  // Whether the current user can create rooms (drives the leading "+" tile).
  canCreate?: boolean;
}

const PINK = "#ec4899";
const PINK_BG = "rgba(236,72,153,0.08)";

/**
 * Instagram-style horizontally-scrolling strip of currently-live rooms.
 * Each room is a circular avatar with a red ring + pulsing dot.
 *
 * Polls the active-rooms endpoint at `refreshMs`; pauses when the document
 * is hidden to avoid burning CPU on background tabs.
 */
export function LiveRoomsStrip({
  refreshMs = 30000,
  onCreateClick,
  canCreate = false,
}: LiveRoomsStripProps) {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchOnce = () =>
      communityService
        .getActiveRooms()
        .then((data) => {
          if (!cancelled) {
            setRooms(data);
            setLoaded(true);
          }
        })
        .catch(() => {
          if (!cancelled) setLoaded(true);
        });

    fetchOnce();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") fetchOnce();
    }, refreshMs);
    const onVis = () => {
      if (document.visibilityState === "visible") fetchOnce();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refreshMs]);

  // Don't render anything before the first fetch returns — avoids layout jump
  // when there are no live rooms.
  if (!loaded) return null;
  if (rooms.length === 0 && !canCreate) return null;

  const liveCount = rooms.length;

  return (
    <Box sx={{ mb: 3 }}>
      {/* Clickable header — matches Bounty-section visual rhythm. Whole row
          routes to /community/rooms; pulses gently when someone is live so
          it reads as a real "tap me" target rather than decoration. */}
      <Box
        onClick={() => router.push("/community/rooms")}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 1.5,
          cursor: "pointer",
          userSelect: "none",
          width: "fit-content",
          pr: 1,
          borderRadius: "8px",
          "&:hover": {
            "& .live-rooms-arrow": {
              transform: "translateX(3px)",
              opacity: 1,
            },
            "& .live-rooms-title": {
              color: PINK,
            },
          },
        }}
      >
        <Box
          component={motion.div}
          animate={liveCount > 0 ? { scale: [1, 1.12, 1] } : { scale: 1 }}
          transition={
            liveCount > 0
              ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.2 }
          }
          sx={{ display: "inline-flex" }}
        >
          <IconWrapper icon="mdi:broadcast" size={18} color={PINK} />
        </Box>
        <Typography
          className="live-rooms-title"
          variant="subtitle2"
          fontWeight={700}
          sx={{
            color: "var(--font-primary)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontSize: "0.72rem",
            transition: "color 0.15s",
          }}
        >
          Live Rooms
        </Typography>
        {liveCount > 0 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.35,
              px: 0.85,
              py: 0.1,
              borderRadius: "999px",
              backgroundColor: PINK_BG,
              border: `1px solid ${PINK}33`,
            }}
          >
            <Box
              component={motion.div}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: PINK }}
            />
            <Typography sx={{ fontSize: "0.66rem", fontWeight: 800, color: PINK, letterSpacing: "0.06em" }}>
              {liveCount} LIVE
            </Typography>
          </Box>
        )}
        <Box
          className="live-rooms-arrow"
          sx={{
            display: "inline-flex",
            opacity: 0.55,
            transition: "all 0.18s",
            color: "var(--font-secondary)",
          }}
        >
          <IconWrapper icon="mdi:chevron-right" size={16} />
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          alignItems: "flex-start",
          overflowX: "auto",
          pb: 1,
          // Hide horizontal scrollbar visually but keep keyboard scroll working.
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
        }}
      >
      {canCreate && (
        <Tooltip title="Start a new room">
          <Box
            onClick={onCreateClick}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.5,
              minWidth: 78,
              cursor: "pointer",
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px dashed var(--border-default)",
                color: "var(--font-secondary)",
                transition: "all 0.15s",
                "&:hover": {
                  borderColor: "#ec4899",
                  color: "#ec4899",
                  backgroundColor: "rgba(236,72,153,0.06)",
                },
              }}
            >
              <IconWrapper icon="mdi:plus" size={26} />
            </Box>
            <Typography variant="caption" sx={{ fontSize: "0.7rem", color: "var(--font-secondary)", textAlign: "center" }} noWrap>
              Start
            </Typography>
          </Box>
        </Tooltip>
      )}

      {rooms.map((room) => (
        <Box
          key={room.id}
          onClick={() => router.push(`/community/rooms/${room.id}`)}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0.5,
            minWidth: 78,
            cursor: "pointer",
          }}
        >
          {/* Avatar with static gradient ring + count-aware LIVE pill */}
          <Box sx={{ position: "relative", padding: "3px", display: "inline-flex" }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                padding: "2.5px",
                background:
                  "conic-gradient(from 0deg, #ef4444, #ec4899, #f59e0b, #ef4444)",
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  backgroundColor: "var(--card-bg)",
                  padding: "2px",
                }}
              >
                <Avatar
                  src={room.host.profile_pic_url}
                  sx={{ width: "100%", height: "100%", fontSize: "1.1rem" }}
                >
                  {room.host.name?.charAt(0) ?? "?"}
                </Avatar>
              </Box>
            </Box>

            {/* "{N} LIVE" pill, overlaps the bottom of the avatar */}
            <Box
              component={motion.div}
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              sx={{
                position: "absolute",
                bottom: -2,
                left: "50%",
                transform: "translateX(-50%)",
                px: 0.85,
                py: 0.15,
                borderRadius: "999px",
                backgroundColor: "#ef4444",
                color: "#fff",
                fontSize: "0.58rem",
                fontWeight: 800,
                letterSpacing: "0.07em",
                border: "1.5px solid var(--card-bg)",
                lineHeight: 1.4,
                whiteSpace: "nowrap",
              }}
            >
              {room.active_count} LIVE
            </Box>
          </Box>

          <Typography
            variant="caption"
            sx={{
              fontSize: "0.7rem",
              color: "var(--font-primary)",
              textAlign: "center",
              maxWidth: 78,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontWeight: 600,
            }}
          >
            {room.title}
          </Typography>
        </Box>
      ))}
      </Box>
    </Box>
  );
}
