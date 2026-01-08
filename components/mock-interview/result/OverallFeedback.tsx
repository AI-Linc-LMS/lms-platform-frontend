"use client";

import { Paper, Typography, Box } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { memo } from "react";

interface OverallFeedbackProps {
  areas_for_improvement: string[];
  overall_feedback: string;
}

const OverallFeedbackComponent = ({
  areas_for_improvement,
  overall_feedback,
}: OverallFeedbackProps) => {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        gap: 3,
      }}
    >
      {/* Areas for Improvement */}
      {areas_for_improvement.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: "1px solid #e5e7eb",
            background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconWrapper icon="mdi:lightbulb-on" size={22} color="#ffffff" />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#78350f" }}>
              Areas for Improvement
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {areas_for_improvement.map((area, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.5,
                  p: 2,
                  backgroundColor: "#ffffff",
                  borderRadius: 2,
                  border: "1px solid #fed7aa",
                }}
              >
                <Box
                  sx={{
                    minWidth: 24,
                    height: 24,
                    borderRadius: "50%",
                    backgroundColor: "#f59e0b",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  {idx + 1}
                </Box>
                <Typography variant="body2" sx={{ color: "#78350f", flex: 1 }}>
                  {area}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Overall Feedback */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:message-text" size={22} color="#ffffff" />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e40af" }}>
            Overall Feedback
          </Typography>
        </Box>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            backgroundColor: "#ffffff",
            borderRadius: 2,
            border: "1px solid #bfdbfe",
          }}
        >
          <Typography variant="body2" sx={{ color: "#1e40af", lineHeight: 1.8 }}>
            {overall_feedback}
          </Typography>
        </Paper>
      </Paper>
    </Box>
  );
};

export const OverallFeedback = memo(OverallFeedbackComponent);
OverallFeedback.displayName = "OverallFeedback";

