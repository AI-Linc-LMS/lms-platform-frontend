"use client";

import { Box, Container, Typography, Button, Chip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
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
}

const ResultHeaderComponent = ({
  title,
  topic,
  subtopic,
  difficulty,
  duration_minutes,
  overall_percentage,
  performanceLabel,
  scoreColors,
  onBack,
}: ResultHeaderProps) => {
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
              Back to Previous Interviews
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
              {title}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
              <Chip
                label={topic}
                size="small"
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  fontWeight: 600,
                }}
              />
              {subtopic && (
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
              <Chip
                icon={
                  <IconWrapper icon="mdi:clock-outline" size={14} color="#ffffff" />
                }
                label={`${duration_minutes} mins`}
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
                width: 120,
                height: 120,
                borderRadius: "50%",
                backgroundColor: "#ffffff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                border: `6px solid ${scoreColors.main}`,
              }}
            >
              <Typography
                variant="h3"
                sx={{ color: scoreColors.main, fontWeight: 800, lineHeight: 1 }}
              >
                {overall_percentage}%
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#6b7280", fontSize: "0.7rem", mt: 0.5 }}
              >
                OVERALL SCORE
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

