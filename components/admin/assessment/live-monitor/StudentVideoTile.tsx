"use client";

import { Box, Paper, Typography } from "@mui/material";
import {
  useParticipantInfo,
  useParticipantTracks,
  VideoTrack,
} from "@livekit/components-react";
import { Track } from "livekit-client";

interface StudentVideoTileProps {
  selectedIdentity: string | null;
  onSelect: (identity: string) => void;
}

export function StudentVideoTile({
  selectedIdentity,
  onSelect,
}: StudentVideoTileProps) {
  const { identity, name } = useParticipantInfo();
  const cameraRefs = useParticipantTracks([Track.Source.Camera]);
  const trackRef = cameraRefs[0];
  const selected = identity === selectedIdentity;

  if (!identity?.startsWith("student-")) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      onClick={() => onSelect(identity)}
      sx={{
        cursor: "pointer",
        overflow: "hidden",
        borderRadius: 2,
        border: selected ? "2px solid #6366f1" : "1px solid #e2e8f0",
        transition: "border-color 0.2s, box-shadow 0.2s",
        "&:hover": {
          boxShadow: "0 4px 12px rgba(99, 102, 241, 0.15)",
        },
      }}
    >
      <Box
        sx={{
          aspectRatio: "4/3",
          bgcolor: "#0f172a",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {trackRef ? (
          <VideoTrack
            trackRef={trackRef}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
            No video
          </Typography>
        )}
      </Box>
      <Box sx={{ px: 1, py: 0.75, bgcolor: "#f8fafc" }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, color: "#0f172a", lineHeight: 1.3 }}
          noWrap
        >
          {name || identity}
        </Typography>
        <Typography variant="caption" sx={{ color: "#64748b" }} noWrap>
          {identity}
        </Typography>
      </Box>
    </Paper>
  );
}
