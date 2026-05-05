"use client";

import { Box, Paper, Typography, Chip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface SkillsTagsProps {
  strongSkills: string[];
  weakSkills: string[];
}

export function SkillsTags({ strongSkills, weakSkills }: SkillsTagsProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
        gap: 3,
        mb: 3,
      }}
    >
      {/* Skills You Shine In */}
      <Paper
        elevation={0}
        sx={{
          p: 3.5,
          border: "1px solid color-mix(in srgb, var(--course-cta) 18%, transparent)",
          borderRadius: 3,
          background: "linear-gradient(135deg, var(--font-light) 0%, color-mix(in srgb, var(--course-cta) 10%, var(--card-bg)) 100%)",
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 20px color-mix(in srgb, var(--course-cta) 12%, transparent)",
            borderColor: "var(--course-cta)",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 2,
          }}
        >
          <IconWrapper icon="mdi:star-circle" size={24} color="var(--course-cta)" />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "var(--font-primary-dark)",
            }}
          >
            Skills You Shine In
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          {strongSkills.length > 0 ? (
            strongSkills.map((skill, index) => (
              <Chip
                key={index}
                label={skill}
                icon={<IconWrapper icon="mdi:check" size={16} />}
                sx={{
                  backgroundColor: "color-mix(in srgb, var(--course-cta) 18%, transparent)",
                  color: "color-mix(in srgb, var(--course-cta) 75%, var(--font-dark))",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  height: 32,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "color-mix(in srgb, var(--course-cta) 30%, transparent)",
                    transform: "scale(1.05)",
                  },
                  "& .MuiChip-icon": {
                    color: "var(--course-cta)",
                  },
                }}
              />
            ))
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: "var(--font-secondary)",
                fontStyle: "italic",
              }}
            >
              No strong skills identified yet
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Skills That Need Attention */}
      <Paper
        elevation={0}
        sx={{
          p: 3.5,
          border: "1px solid color-mix(in srgb, var(--warning-500) 18%, transparent)",
          borderRadius: 3,
          background: "linear-gradient(135deg, var(--font-light) 0%, color-mix(in srgb, var(--warning-100) 95%, var(--card-bg)) 100%)",
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 20px color-mix(in srgb, var(--warning-500) 12%, transparent)",
            borderColor: "var(--warning-500)",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 2,
          }}
        >
          <IconWrapper icon="mdi:target" size={24} color="var(--warning-500)" />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "var(--font-primary-dark)",
            }}
          >
            Skills That Need Attention
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          {weakSkills.length > 0 ? (
            weakSkills.map((skill, index) => (
              <Chip
                key={index}
                label={skill}
                icon={<IconWrapper icon="mdi:alert" size={16} />}
                sx={{
                  backgroundColor: "color-mix(in srgb, var(--warning-500) 18%, transparent)",
                  color: "color-mix(in srgb, var(--accent-orange) 55%, var(--font-dark))",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  height: 32,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "color-mix(in srgb, var(--warning-500) 35%, transparent)",
                    transform: "scale(1.05)",
                  },
                  "& .MuiChip-icon": {
                    color: "var(--warning-500)",
                  },
                }}
              />
            ))
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: "var(--font-secondary)",
                fontStyle: "italic",
              }}
            >
              No weak areas identified
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

