"use client";

import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";

interface ProgressStats {
  totalHours: number;
  visitedLectures: number;
  totalLectures: number;
  completedTasks: number;
  totalTasks: number;
}

interface MyProgressSectionProps {
  stats: ProgressStats;
}

export const MyProgressSection: React.FC<MyProgressSectionProps> = ({
  stats,
}) => {
  const progressPercentage = Math.round(
    (stats.visitedLectures / stats.totalLectures) * 100
  );
  const tasksPercentage = Math.round(
    (stats.completedTasks / stats.totalTasks) * 100
  );

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h5"
        sx={{
          fontSize: "1.25rem",
          fontWeight: 700,
          color: "#111827",
          mb: 3,
        }}
      >
        My progress
      </Typography>
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          p: 4,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            flexWrap: "wrap",
          }}
        >
          {/* Circular Progress */}
          <Box sx={{ position: "relative", display: "inline-flex" }}>
            <CircularProgress
              variant="determinate"
              value={progressPercentage}
              size={120}
              thickness={4}
              sx={{
                color: "#6366f1",
                "& .MuiCircularProgress-circle": {
                  strokeLinecap: "round",
                },
              }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: "absolute",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                {stats.totalHours}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  fontWeight: 500,
                }}
              >
                Total hours spent
              </Typography>
            </Box>
          </Box>

          {/* Progress Stats */}
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {stats.visitedLectures}/{stats.totalLectures} Visited items
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progressPercentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#e5e7eb",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: "#6366f1",
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {stats.completedTasks}/{stats.totalTasks} Completed tasks
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={tasksPercentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#e5e7eb",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: "#10b981",
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
          </Box>

          {/* Date Selector */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value="June 2024"
              sx={{
                fontSize: "0.875rem",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#e5e7eb",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#d1d5db",
                },
              }}
            >
              <MenuItem value="June 2024">June 2024</MenuItem>
              <MenuItem value="May 2024">May 2024</MenuItem>
              <MenuItem value="April 2024">April 2024</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Card>
    </Box>
  );
};
