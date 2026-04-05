"use client";

import { Box } from "@mui/material";
import { ParticipantLoop } from "@livekit/components-react";
import type { RemoteParticipant } from "livekit-client";
import { StudentVideoTile } from "./StudentVideoTile";

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
          py: 8,
          textAlign: "center",
          color: "#64748b",
          border: "1px dashed #cbd5e1",
          borderRadius: 2,
        }}
      >
        No students connected to this room yet.
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
        gap: 2,
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
