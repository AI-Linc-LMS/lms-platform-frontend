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
        border: "1px solid color-mix(in srgb, var(--accent-purple) 35%, var(--border-default))",
        borderRadius: 3,
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--accent-purple) 10%, var(--card-bg)) 0%, color-mix(in srgb, var(--accent-purple) 16%, var(--surface)) 100%)",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 8px 20px color-mix(in srgb, var(--accent-purple) 22%, transparent)",
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
            backgroundColor: "var(--assessment-chart-violet)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:message-text" size={22} color="var(--font-light)" />
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: "var(--font-primary)",
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
                color="var(--assessment-chart-violet)"
                style={{ marginTop: "2px", flexShrink: 0 }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: "var(--font-primary)",
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
              color: "var(--font-secondary)",
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

