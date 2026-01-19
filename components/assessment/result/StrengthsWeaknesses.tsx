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
          border: "2px solid #d1fae5",
          borderRadius: 3,
          background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 20px rgba(16, 185, 129, 0.15)",
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
              backgroundColor: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:thumb-up" size={22} color="#ffffff" />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "#065f46",
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
                  color="#10b981"
                  style={{ marginTop: "2px", flexShrink: 0 }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: "#065f46",
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
                color: "#6b7280",
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
          border: "2px solid #fecaca",
          borderRadius: 3,
          background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 20px rgba(239, 68, 68, 0.15)",
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
              backgroundColor: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:lightbulb-on" size={22} color="#ffffff" />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "#991b1b",
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
                  color="#ef4444"
                  style={{ marginTop: "2px", flexShrink: 0 }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: "#991b1b",
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
                color: "#6b7280",
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

