"use client";

import { Box, Typography, Card, CircularProgress } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface StatusCardsProps {
  lessons: {
    completed: number;
    total: number;
  };
  assignments: {
    completed: number;
    total: number;
  };
  tests: {
    completed: number;
    total: number;
  };
}

export const StatusCards = ({
  lessons,
  assignments,
  tests,
}: StatusCardsProps) => {
  const lessonsPercentage = Math.round(
    (lessons.completed / lessons.total) * 100
  );
  const assignmentsPercentage = Math.round(
    (assignments.completed / assignments.total) * 100
  );
  const testsPercentage = Math.round((tests.completed / tests.total) * 100);

  return (
    <Box>
      <Typography
        variant="h6"
        sx={{
          fontSize: "1.125rem",
          fontWeight: 600,
          color: "#111827",
          mb: 2,
        }}
      >
        My Progress
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(3, 1fr)",
          },
          gap: 2,
        }}
      >
        {/* Lessons Card */}
        <Card
          sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: "#FEF3C7",
            position: "relative",
            border: "1px solid #FDE68A",
          }}
        >
          <Box sx={{ position: "absolute", top: 16, right: 16 }}>
            <CircularProgress
              variant="determinate"
              value={lessonsPercentage}
              size={48}
              thickness={4}
              sx={{
                color: "#F59E0B",
                transform: "rotate(-90deg)",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#92400E",
              }}
            >
              {lessonsPercentage}%
            </Box>
          </Box>
          <IconWrapper
            icon="mdi:file-document-outline"
            size={32}
            style={{ color: "#F59E0B", marginBottom: 12 }}
          />
          <Typography
            variant="h5"
            sx={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#111827",
              mb: 0.5,
            }}
          >
            {lessons.completed} Lessons
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontSize: "0.875rem", color: "#6B7280" }}
          >
            of {lessons.total} completed
          </Typography>
        </Card>

        {/* Assignments Card */}
        <Card
          sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: "#FCE7F3",
            position: "relative",
            border: "1px solid #FBCFE8",
          }}
        >
          <Box sx={{ position: "absolute", top: 16, right: 16 }}>
            <CircularProgress
              variant="determinate"
              value={assignmentsPercentage}
              size={48}
              thickness={4}
              sx={{
                color: "#EC4899",
                transform: "rotate(-90deg)",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#BE185D",
              }}
            >
              {assignmentsPercentage}%
            </Box>
          </Box>
          <IconWrapper
            icon="mdi:check-circle-outline"
            size={32}
            style={{ color: "#EC4899", marginBottom: 12 }}
          />
          <Typography
            variant="h5"
            sx={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#111827",
              mb: 0.5,
            }}
          >
            {assignments.completed} Assignments
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontSize: "0.875rem", color: "#6B7280" }}
          >
            of {assignments.total} completed
          </Typography>
        </Card>

        {/* Tests Card */}
        <Card
          sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: "#D1FAE5",
            position: "relative",
            border: "1px solid #A7F3D0",
          }}
        >
          <Box sx={{ position: "absolute", top: 16, right: 16 }}>
            <CircularProgress
              variant="determinate"
              value={testsPercentage}
              size={48}
              thickness={4}
              sx={{
                color: "#10B981",
                transform: "rotate(-90deg)",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#065F46",
              }}
            >
              {testsPercentage}%
            </Box>
          </Box>
          <IconWrapper
            icon="mdi:clipboard-check-outline"
            size={32}
            style={{ color: "#10B981", marginBottom: 12 }}
          />
          <Typography
            variant="h5"
            sx={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#111827",
              mb: 0.5,
            }}
          >
            {tests.completed} Tests
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontSize: "0.875rem", color: "#6B7280" }}
          >
            of {tests.total} completed
          </Typography>
        </Card>
      </Box>
    </Box>
  );
};
