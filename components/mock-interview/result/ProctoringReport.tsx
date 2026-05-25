"use client";

import { Paper, Typography, Box } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { memo } from "react";

interface ProctoringReportProps {
  tabSwitches: number;
  windowSwitches: number;
  fullscreen_exits: number;
  face_validation_failures: number;
  looking_away_count?: number;
  multiple_face_detections?: number;
}

const ProctoringReportComponent = ({
  tabSwitches,
  windowSwitches,
  fullscreen_exits,
  face_validation_failures,
  looking_away_count = 0,
  multiple_face_detections = 0,
}: ProctoringReportProps) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px solid var(--border-default)",
        mb: 4,
        background: "linear-gradient(135deg, var(--proctoring-gradient-start) 0%, var(--proctoring-gradient-end) 100%)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            background: "linear-gradient(135deg, var(--proctoring-strong) 0%, var(--proctoring-strong-dark) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:shield-check" size={24} color="var(--font-light)" />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--proctoring-heading)" }}>
            Proctoring Report
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--proctoring-subheading)" }}>
            Interview integrity and monitoring data
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          gap: 2,
        }}
      >
        <Box sx={{ p: 2, backgroundColor: "var(--card-bg)", borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mb: 0.5 }}>
            Tab Switches
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--font-primary-dark)" }}>
            {tabSwitches}
          </Typography>
        </Box>
        <Box sx={{ p: 2, backgroundColor: "var(--card-bg)", borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mb: 0.5 }}>
            Window Switches
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--font-primary-dark)" }}>
            {windowSwitches}
          </Typography>
        </Box>
        <Box sx={{ p: 2, backgroundColor: "var(--card-bg)", borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mb: 0.5 }}>
            Fullscreen Exits
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--font-primary-dark)" }}>
            {fullscreen_exits}
          </Typography>
        </Box>
        <Box sx={{ p: 2, backgroundColor: "var(--card-bg)", borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mb: 0.5 }}>
            Face Validation Failures
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--font-primary-dark)" }}>
            {face_validation_failures}
          </Typography>
        </Box>
        <Box sx={{ p: 2, backgroundColor: "var(--card-bg)", borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mb: 0.5 }}>
            Looking Away
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--font-primary-dark)" }}>
            {looking_away_count}
          </Typography>
        </Box>
        <Box sx={{ p: 2, backgroundColor: "var(--card-bg)", borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mb: 0.5 }}>
            Multiple Faces
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--font-primary-dark)" }}>
            {multiple_face_detections}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export const ProctoringReport = memo(ProctoringReportComponent);
ProctoringReport.displayName = "ProctoringReport";

