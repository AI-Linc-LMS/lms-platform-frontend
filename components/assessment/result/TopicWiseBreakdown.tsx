"use client";

import { Box, Paper, Typography, LinearProgress } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface TopicStats {
  total: number;
  correct: number;
  incorrect: number;
  accuracy_percent: number;
  rating_out_of_5: number;
}

interface TopicWiseBreakdownProps {
  topicWiseStats: Record<string, TopicStats>;
}

export function TopicWiseBreakdown({
  topicWiseStats,
}: TopicWiseBreakdownProps) {
  if (!topicWiseStats || Object.keys(topicWiseStats).length === 0) {
    return null;
  }

  const topics = Object.entries(topicWiseStats);

  const getRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return { fullStars, hasHalfStar, emptyStars };
  };

  const getPerformanceColor = (accuracy: number) => {
    if (accuracy >= 80) return "#10b981";
    if (accuracy >= 60) return "#3b82f6";
    if (accuracy >= 40) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        border: "1px solid #e5e7eb",
        borderRadius: 3,
        background: "#ffffff",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 3,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:chart-box" size={24} color="#6366f1" />
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "#1f2937",
              mb: 0.25,
            }}
          >
            Topic-wise Performance
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "#6b7280",
              fontSize: "0.8125rem",
            }}
          >
            Detailed breakdown by topic
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {topics.map(([topic, stats]) => {
          const color = getPerformanceColor(stats.accuracy_percent);
          const { fullStars, hasHalfStar, emptyStars } = getRatingStars(
            stats.rating_out_of_5
          );

          return (
            <Box
              key={topic}
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: "1px solid #e5e7eb",
                background: "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
                transition: "all 0.3s ease",
                "&:hover": {
                  borderColor: color,
                  boxShadow: `0 4px 12px ${color}20`,
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      color: "#1f2937",
                      mb: 1,
                      fontSize: "1rem",
                    }}
                  >
                    {topic}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      <IconWrapper
                        icon="mdi:check-circle"
                        size={18}
                        color="#10b981"
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#10b981",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                        }}
                      >
                        {stats.correct} Correct
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      <IconWrapper
                        icon="mdi:close-circle"
                        size={18}
                        color="#ef4444"
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#ef4444",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                        }}
                      >
                        {stats.incorrect} Incorrect
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#6b7280",
                        fontSize: "0.875rem",
                      }}
                    >
                      {stats.total} Total
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    textAlign: "right",
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: color,
                      mb: 0.5,
                      fontSize: "1.75rem",
                    }}
                  >
                    {stats.accuracy_percent.toFixed(1)}%
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#6b7280",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    Accuracy
                  </Typography>
                </Box>
              </Box>

              {/* Progress Bar */}
              <Box sx={{ mb: 1.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(stats.accuracy_percent, 100)}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#f3f4f6",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 5,
                      backgroundColor: color,
                    },
                  }}
                />
              </Box>

              {/* Rating Stars */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                {Array.from({ length: fullStars }).map((_, i) => (
                  <IconWrapper
                    key={`full-${i}`}
                    icon="mdi:star"
                    size={16}
                    color="#fbbf24"
                  />
                ))}
                {hasHalfStar && (
                  <IconWrapper
                    icon="mdi:star-half-full"
                    size={16}
                    color="#fbbf24"
                  />
                )}
                {Array.from({ length: emptyStars }).map((_, i) => (
                  <IconWrapper
                    key={`empty-${i}`}
                    icon="mdi:star-outline"
                    size={16}
                    color="#d1d5db"
                  />
                ))}
                <Typography
                  variant="caption"
                  sx={{
                    ml: 1,
                    color: "#6b7280",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  {stats.rating_out_of_5.toFixed(1)}/5.0
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}

