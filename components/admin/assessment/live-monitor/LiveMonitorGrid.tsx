"use client";

import { Box, Typography } from "@mui/material";
import { ParticipantLoop } from "@livekit/components-react";
import type { RemoteParticipant } from "livekit-client";
import { StudentVideoTile } from "./StudentVideoTile";
import { IconWrapper } from "@/components/common/IconWrapper";

interface LiveMonitorGridProps {
  participants: RemoteParticipant[];
  selectedIdentity: string | null;
  onSelect: (identity: string) => void;
}

export function LiveMonitorGrid({
  participants,
  selectedIdentity,
  onSelect,
}: LiveMonitorGridProps) {
  if (participants.length === 0) {
    return (
      <Box
        sx={{
          py: 10,
          px: 3,
          textAlign: "center",
          color: "#64748b",
          border: "1px dashed #d1d5db",
          borderRadius: 3,
          background:
            "linear-gradient(180deg, rgba(248,250,252,0.8) 0%, rgba(255,255,255,0.95) 100%)",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
          <IconWrapper icon="mdi:account-clock-outline" size={28} color="#94a3b8" />
        </Box>
        <Typography sx={{ fontWeight: 700, color: "#334155", mb: 0.5 }}>
          No students connected yet
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b" }}>
          Waiting for participants to join this live room.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(1, 1fr)",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
          lg: "repeat(4, 1fr)",
        },
        gap: { xs: 1.5, md: 2 },
      }}
    >
      <ParticipantLoop participants={participants}>
        <StudentVideoTile
          selectedIdentity={selectedIdentity}
          onSelect={onSelect}
        />
      </ParticipantLoop>
    </Box>
  );
}
