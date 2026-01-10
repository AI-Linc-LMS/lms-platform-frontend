"use client";

import { Paper, Typography, Box } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { memo } from "react";

interface ProctoringReportProps {
  tabSwitches: number;
  windowSwitches: number;
  fullscreen_exits: number;
  face_validation_failures: number;
}

const ProctoringReportComponent = ({
  tabSwitches,
  windowSwitches,
  fullscreen_exits,
  face_validation_failures,
}: ProctoringReportProps) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px solid #e5e7eb",
        mb: 4,
        background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:shield-check" size={24} color="#ffffff" />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#78350f" }}>
            Proctoring Report
          </Typography>
          <Typography variant="body2" sx={{ color: "#92400e" }}>
            Interview integrity and monitoring data
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
          gap: 2,
        }}
      >
        <Box sx={{ p: 2, backgroundColor: "#ffffff", borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: "#6b7280", display: "block", mb: 0.5 }}>
            Tab Switches
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#1f2937" }}>
            {tabSwitches}
          </Typography>
        </Box>
        <Box sx={{ p: 2, backgroundColor: "#ffffff", borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: "#6b7280", display: "block", mb: 0.5 }}>
            Window Switches
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#1f2937" }}>
            {windowSwitches}
          </Typography>
        </Box>
        <Box sx={{ p: 2, backgroundColor: "#ffffff", borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: "#6b7280", display: "block", mb: 0.5 }}>
            Fullscreen Exits
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#1f2937" }}>
            {fullscreen_exits}
          </Typography>
        </Box>
        <Box sx={{ p: 2, backgroundColor: "#ffffff", borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: "#6b7280", display: "block", mb: 0.5 }}>
            Face Validation Failures
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#1f2937" }}>
            {face_validation_failures}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export const ProctoringReport = memo(ProctoringReportComponent);
ProctoringReport.displayName = "ProctoringReport";

