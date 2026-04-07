"use client";

import { Box, Paper, Typography, Button, IconButton, Chip } from "@mui/material";
import {
  useRemoteParticipant,
  useParticipantTracks,
  VideoTrack,
  AudioTrack,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { IconWrapper } from "@/components/common/IconWrapper";

interface StudentFocusViewProps {
  identity: string;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onBack: () => void;
}

export function StudentFocusView({
  identity,
  audioEnabled,
  onToggleAudio,
  onBack,
}: StudentFocusViewProps) {
  const participant = useRemoteParticipant(identity);
  const cameraRefs = useParticipantTracks([Track.Source.Camera], identity);
  const micRefs = useParticipantTracks([Track.Source.Microphone], identity);
  const cameraRef = cameraRefs[0];
  const micRef = micRefs[0];

  let metaName = participant?.name || identity;
  try {
    if (participant?.metadata) {
      const m = JSON.parse(participant.metadata) as { name?: string };
      if (m?.name) metaName = m.name;
    }
  } catch {
    /* ignore */
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "1px solid #e2e8f0",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
          borderBottom: "1px solid #e2e8f0",
          bgcolor: "#f8fafc",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
            {metaName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {identity}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            size="small"
            color={audioEnabled ? "success" : "default"}
            icon={
              <IconWrapper
                icon={audioEnabled ? "mdi:volume-high" : "mdi:volume-off"}
                size={14}
              />
            }
            label={audioEnabled ? "Audio monitoring on" : "Audio muted"}
          />
          <Button
            size="small"
            variant={audioEnabled ? "contained" : "outlined"}
            color={audioEnabled ? "warning" : "primary"}
            onClick={onToggleAudio}
            startIcon={
              <IconWrapper
                icon={audioEnabled ? "mdi:volume-mute" : "mdi:volume-high"}
                size={18}
              />
            }
          >
            {audioEnabled ? "Mute audio" : "Turn on audio"}
          </Button>
          <IconButton onClick={onBack} aria-label="Back to grid">
            <IconWrapper icon="mdi:close" size={22} />
          </IconButton>
        </Box>
      </Box>

      <Box
        sx={{
          position: "relative",
          bgcolor: "#000",
          minHeight: { xs: 240, sm: 400, md: 520 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {cameraRef ? (
          <VideoTrack
            trackRef={cameraRef}
            style={{
              width: "100%",
              maxHeight: "70vh",
              objectFit: "contain",
            }}
          />
        ) : (
          <Typography color="grey.500">No camera track</Typography>
        )}
        {micRef && audioEnabled ? (
          <Box sx={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
            <AudioTrack trackRef={micRef} volume={1} />
          </Box>
        ) : null}
      </Box>
    </Paper>
  );
}
