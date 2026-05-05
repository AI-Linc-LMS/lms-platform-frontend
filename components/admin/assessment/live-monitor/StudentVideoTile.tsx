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
        border: selected
          ? "2px solid var(--accent-indigo)"
          : "1px solid var(--border-default)",
        transition: "border-color 0.2s, box-shadow 0.2s",
        "&:hover": {
          boxShadow:
            "0 4px 12px color-mix(in srgb, var(--accent-indigo) 20%, transparent)",
        },
      }}
    >
      <Box
        sx={{
          aspectRatio: "4/3",
          bgcolor: "color-mix(in srgb, var(--font-primary) 88%, black 12%)",
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
          <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>
            No video
          </Typography>
        )}
      </Box>
      <Box sx={{ px: 1, py: 0.75, bgcolor: "var(--surface)" }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, color: "var(--font-primary)", lineHeight: 1.3 }}
          noWrap
        >
          {name || identity}
        </Typography>
        <Typography variant="caption" sx={{ color: "var(--font-secondary)" }} noWrap>
          {identity}
        </Typography>
      </Box>
    </Paper>
  );
}
