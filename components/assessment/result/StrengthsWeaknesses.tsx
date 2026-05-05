"use client";

import { Box, Paper, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface StrengthsWeaknessesProps {
  strengths: string[];
  weaknesses: string[];
}

export function StrengthsWeaknesses({
  strengths,
  weaknesses,
}: StrengthsWeaknessesProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
        gap: 3,
        mb: 3,
      }}
    >
      {/* Strengths */}
      <Paper
        elevation={0}
        sx={{
          p: 3.5,
          border: "2px solid color-mix(in srgb, var(--course-cta) 18%, transparent)",
          borderRadius: 3,
          background: "linear-gradient(135deg, color-mix(in srgb, var(--course-cta) 10%, var(--card-bg)) 0%, color-mix(in srgb, var(--course-cta) 14%, transparent) 100%)",
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 20px color-mix(in srgb, var(--course-cta) 18%, transparent)",
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
              backgroundColor: "var(--course-cta)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:thumb-up" size={22} color="var(--font-light)" />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "color-mix(in srgb, var(--course-cta) 75%, var(--font-dark))",
            }}
          >
            Strengths
          </Typography>
        </Box>

        <Box sx={{ pl: 1 }}>
          {strengths.length > 0 ? (
            strengths.map((strength, index) => (
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
                  icon="mdi:check-circle"
                  size={18}
                  color="var(--course-cta)"
                  style={{ marginTop: "2px", flexShrink: 0 }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: "color-mix(in srgb, var(--course-cta) 75%, var(--font-dark))",
                    lineHeight: 1.6,
                  }}
                >
                  {strength}
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
              Complete more assessments to identify your strengths
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Weaknesses / Areas for Improvement */}
      <Paper
        elevation={0}
        sx={{
          p: 3.5,
          border: "2px solid color-mix(in srgb, var(--error-500) 26%, transparent)",
          borderRadius: 3,
          background: "linear-gradient(135deg, color-mix(in srgb, var(--error-500) 10%, var(--card-bg)) 0%, color-mix(in srgb, var(--error-500) 12%, transparent) 100%)",
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 20px color-mix(in srgb, var(--error-500) 18%, transparent)",
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
              backgroundColor: "var(--error-500)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:lightbulb-on" size={22} color="var(--font-light)" />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "color-mix(in srgb, var(--error-600) 88%, var(--font-dark))",
            }}
          >
            Areas for Improvement
          </Typography>
        </Box>

        <Box sx={{ pl: 1 }}>
          {weaknesses.length > 0 ? (
            weaknesses.map((weakness, index) => (
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
                  icon="mdi:alert-circle"
                  size={18}
                  color="var(--error-500)"
                  style={{ marginTop: "2px", flexShrink: 0 }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: "color-mix(in srgb, var(--error-600) 88%, var(--font-dark))",
                    lineHeight: 1.6,
                  }}
                >
                  {weakness}
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
              Great job! Keep up the excellent work
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

