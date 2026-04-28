"use client";

import { useTranslation } from "react-i18next";
import { Box, Typography, Paper } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface StudentRankingCardProps {
  expandForPdf?: boolean;
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

export function StudentRankingCard({ leaderboard, expandForPdf }: StudentRankingCardProps) {
  const { t } = useTranslation("common");
  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--card-bg)",
        boxShadow:
          "0 1px 3px color-mix(in srgb, var(--font-primary) 10%, transparent)",
        height: "100%",
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: "var(--font-primary)",
          mb: 3,
          fontSize: { xs: "1rem", sm: "1.25rem" },
        }}
      >
        {t("admin.dashboard.studentRanking")}
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
              color: "var(--font-primary)",
              mb: 2,
              fontSize: { xs: "0.875rem", sm: "1rem" },
            }}
          >
            {t("admin.dashboard.noLeaderboardAvailable")}
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              p: 2,
              borderRadius: 1,
              backgroundColor:
                "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
              maxWidth: 400,
            }}
          >
            <IconWrapper icon="mdi:information" size={20} color="var(--accent-indigo)" />
            <Typography
              variant="body2"
              sx={{
                color: "var(--font-secondary)",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              }}
            >
              {t("admin.dashboard.leaderboardHint")}
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: expandForPdf ? "auto" : "240px", // Expand to show all records during PDF capture
            overflowY: expandForPdf ? "visible" : "auto",
            gap: 1,
            pr: 0.5,
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "var(--surface)",
              borderRadius: "3px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "var(--border-default)",
              borderRadius: "3px",
              "&:hover": {
                backgroundColor:
                  "color-mix(in srgb, var(--border-default) 70%, var(--font-secondary) 30%)",
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
            const medalColors = [
              "var(--warning-500)",
              "var(--font-tertiary)",
              "var(--accent-purple)",
            ];
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
                  backgroundColor:
                    rank <= 3
                      ? "color-mix(in srgb, var(--warning-500) 18%, var(--surface) 82%)"
                      : "transparent",
                  minHeight: "80px",
                  flexShrink: 0,
                  "&:hover": {
                    backgroundColor:
                      rank <= 3
                        ? "color-mix(in srgb, var(--warning-500) 26%, var(--surface) 74%)"
                        : "var(--surface)",
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
                        color:
                          rank <= 3 ? "var(--font-primary)" : "var(--font-secondary)",
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
                        color: "var(--font-primary)",
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
                          color: "var(--font-secondary)",
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
                      color: "var(--font-secondary)",
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

