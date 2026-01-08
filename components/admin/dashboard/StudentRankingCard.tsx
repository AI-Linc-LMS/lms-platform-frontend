"use client";

import { Box, Typography, Paper } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface StudentRankingCardProps {
  leaderboard: Array<{
    name?: string;
    studentName?: string;
    course?: string;
    marks?: number;
    rank?: number;
    Present_streak?: number;
    Active_days?: number;
  }>;
}

export function StudentRankingCard({ leaderboard }: StudentRankingCardProps) {
  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        height: "100%",
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: "#111827",
          mb: 3,
          fontSize: { xs: "1rem", sm: "1.25rem" },
        }}
      >
        Student Ranking
      </Typography>
      {leaderboard.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 4,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              color: "#111827",
              mb: 2,
              fontSize: { xs: "0.875rem", sm: "1rem" },
            }}
          >
            No leaderboard available
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              p: 2,
              borderRadius: 1,
              backgroundColor: "#eef2ff",
              maxWidth: 400,
            }}
          >
            <IconWrapper icon="mdi:information" size={20} color="#6366f1" />
            <Typography
              variant="body2"
              sx={{
                color: "#6b7280",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              }}
            >
              As you complete modules you will move to the top of the leaderboard
              and earn exciting rewards.
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "240px", // Fixed height to show exactly 3 records (80px each)
            overflowY: "auto",
            gap: 1,
            pr: 0.5,
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "#f3f4f6",
              borderRadius: "3px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#d1d5db",
              borderRadius: "3px",
              "&:hover": {
                backgroundColor: "#9ca3af",
              },
            },
          }}
        >
          {leaderboard.map((student, index) => {
            const name = student.name || student.studentName || "";
            const rank = student.rank || index + 1;
            const displayValue = student.marks
              ? `${student.marks.toFixed(0)} Marks`
              : student.Active_days
              ? `${student.Active_days} days`
              : "";

            // Medal icons for top 3
            const medalIcons = ["mdi:trophy", "mdi:trophy-variant", "mdi:trophy-award"];
            const medalColors = ["#fbbf24", "#9ca3af", "#cd7f32"];
            const showIcon = rank <= 3;

            return (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1.5,
                  borderRadius: 1,
                  backgroundColor: rank <= 3 ? "#fef3c7" : "transparent", // Yellowish background for top 3
                  minHeight: "80px",
                  flexShrink: 0,
                  "&:hover": {
                    backgroundColor: rank <= 3 ? "#fde68a" : "#f9fafb",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      minWidth: showIcon ? 50 : 32,
                    }}
                  >
                    {showIcon && (
                      <IconWrapper
                        icon={medalIcons[rank - 1]}
                        size={24}
                        color={medalColors[rank - 1]}
                      />
                    )}
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: rank <= 3 ? 700 : 600,
                        color: rank <= 3 ? "#111827" : "#6b7280",
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      }}
                    >
                      #{rank}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: rank <= 3 ? 600 : 500,
                        color: "#111827",
                        fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {name}
                    </Typography>
                    {student.course && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#6b7280",
                          fontSize: { xs: "0.7rem", sm: "0.75rem" },
                        }}
                      >
                        {student.course}
                      </Typography>
                    )}
                  </Box>
                </Box>
                {displayValue && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#6b7280",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      ml: 1,
                      fontWeight: rank <= 3 ? 500 : 400,
                    }}
                  >
                    {displayValue}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}

