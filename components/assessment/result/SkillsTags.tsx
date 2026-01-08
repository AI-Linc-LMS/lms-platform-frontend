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
          p: 3,
          border: "1px solid #e5e7eb",
          borderRadius: 3,
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
          <IconWrapper icon="mdi:star-circle" size={24} color="#10b981" />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "#1f2937",
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
                  backgroundColor: "#d1fae5",
                  color: "#065f46",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  "& .MuiChip-icon": {
                    color: "#10b981",
                  },
                }}
              />
            ))
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: "#6b7280",
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
          p: 3,
          border: "1px solid #e5e7eb",
          borderRadius: 3,
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
          <IconWrapper icon="mdi:target" size={24} color="#f59e0b" />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "#1f2937",
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
                  backgroundColor: "#fef3c7",
                  color: "#92400e",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  "& .MuiChip-icon": {
                    color: "#f59e0b",
                  },
                }}
              />
            ))
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: "#6b7280",
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

