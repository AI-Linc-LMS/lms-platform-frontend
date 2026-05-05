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
          color: "var(--font-secondary)",
          border: "1px dashed var(--border-default)",
          borderRadius: 3,
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--surface) 80%, transparent) 0%, color-mix(in srgb, var(--card-bg) 95%, transparent) 100%)",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
          <IconWrapper icon="mdi:account-clock-outline" size={28} color="var(--font-tertiary)" />
        </Box>
        <Typography sx={{ fontWeight: 700, color: "var(--font-primary)", mb: 0.5 }}>
          No students connected yet
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
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
