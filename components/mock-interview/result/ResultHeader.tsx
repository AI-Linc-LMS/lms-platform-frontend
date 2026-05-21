"use client";

import { Box, Container, Typography, Button, Chip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { cleanInterviewTitle } from "@/lib/utils/mock-interview-title";
import { memo } from "react";

interface ResultHeaderProps {
  title: string;
  topic: string;
  subtopic?: string;
  difficulty: string;
  duration_minutes: number;
  overall_percentage: number;
  performanceLabel: string;
  scoreColors: { bg: string; color: string; main: string };
  onBack: () => void;
  backLabel?: string;
}

const ResultHeaderComponent = ({
  title,
  topic,
  subtopic,
  difficulty,
  duration_minutes: _duration_minutes,
  overall_percentage,
  performanceLabel,
  scoreColors,
  onBack,
  backLabel = "Back to Previous Interviews",
}: ResultHeaderProps) => {
  void _duration_minutes;

  // The backend stamps `title` as "{topic} - {subtopic} Interview", which collapses to
  // "System Design - System Design Interview" for quick-start interviews where the user
  // didn't pick a distinct subtopic. `cleanInterviewTitle` strips that duplication so the
  // header reads as "System Design Interview" / "Behavioral Questions Interview" etc.
  // We fall back to `"{topic} Interview"` for safety in case the backend ever omits title.
  const displayTitle =
    cleanInterviewTitle(title) || (topic ? `${topic} Interview` : "Interview");

  // Only render the subtopic chip when it actually adds information. Quick-start interviews
  // set subtopic = topic, which would otherwise render an identical chip twice in the
  // header.
  const hasMeaningfulSubtopic = !!(
    subtopic &&
    subtopic.trim() &&
    subtopic.trim().toLowerCase() !== topic.trim().toLowerCase()
  );
  return (
    <Box
      sx={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        py: 4,
        mb: 4,
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Button
              startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
              onClick={onBack}
              sx={{
                color: "#ffffff",
                mb: 2,
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
              }}
            >
              {backLabel}
            </Button>
            <Typography
              variant="h4"
              sx={{
                color: "#ffffff",
                fontWeight: 700,
                mb: 1,
                fontSize: { xs: "1.5rem", md: "2rem" },
              }}
            >
              {displayTitle}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
              {hasMeaningfulSubtopic && (
                <Chip
                  label={subtopic}
                  size="small"
                  sx={{
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                    fontWeight: 600,
                  }}
                />
              )}
              <Chip
                label={difficulty}
                size="small"
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  fontWeight: 600,
                }}
              />
            </Box>
          </Box>

          {/* Score Circle */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 140,
                height: 140,
                borderRadius: "50%",
                backgroundColor: "#ffffff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                border: `6px solid ${scoreColors.main}`,
                // Defensive: keep contents from spilling out of the circle when the
                // percentage hits 100 with the inherited h3 font size.
                overflow: "hidden",
                px: 1,
              }}
            >
              <Typography
                sx={{
                  color: scoreColors.main,
                  fontWeight: 800,
                  lineHeight: 1,
                  // Scales with viewport so even very wide values fit inside the
                  // circle on small screens. Caps at 2.25rem so the digits stay
                  // legible on desktop without overflowing the 140px container.
                  fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
                  whiteSpace: "nowrap",
                  textAlign: "center",
                }}
              >
                {/* Round to an integer for a clean display. Defensive Math.round in
                    case the backend ever returns 100.0 + tiny FP noise like 100.0001. */}
                {Math.round(overall_percentage)}%
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "var(--font-secondary)",
                  fontSize: "0.65rem",
                  mt: 0.5,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Overall Score
              </Typography>
            </Box>
            <Chip
              label={performanceLabel}
              sx={{
                backgroundColor: "#ffffff",
                color: scoreColors.main,
                fontWeight: 700,
                fontSize: "0.875rem",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              }}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export const ResultHeader = memo(ResultHeaderComponent);
ResultHeader.displayName = "ResultHeader";

