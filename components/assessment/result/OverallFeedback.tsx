"use client";

import { Box, Paper, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface OverallFeedbackProps {
  feedbackPoints: string[];
}

export function OverallFeedback({ feedbackPoints }: OverallFeedbackProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3.5,
        mb: 3,
        border: "2px solid #c4b5fd",
        borderRadius: 3,
        background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 8px 20px rgba(139, 92, 246, 0.15)",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: "#8b5cf6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:message-text" size={22} color="#ffffff" />
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: "#5b21b6",
          }}
        >
          Overall Feedback
        </Typography>
      </Box>

      <Box sx={{ pl: 1 }}>
        {feedbackPoints.length > 0 ? (
          feedbackPoints.map((point, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1.5,
                mb: 1.5,
              }}
            >
              <IconWrapper
                icon="mdi:checkbox-marked-circle"
                size={18}
                color="#8b5cf6"
                style={{ marginTop: "2px", flexShrink: 0 }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: "#5b21b6",
                  lineHeight: 1.6,
                  fontWeight: 500,
                }}
              >
                {point}
              </Typography>
            </Box>
          ))
        ) : (
          <Typography
            variant="body2"
            sx={{
              color: "#6b7280",
              fontStyle: "italic",
            }}
          >
            No feedback available at this time
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

