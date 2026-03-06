"use client";

import { useTranslation } from "react-i18next";
import { Box, Typography, Paper } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface StudentMetricCardsProps {
  enrollments: number;
  totalMarks: number;
  activities: number;
  streak: number;
}

export function StudentMetricCards({
  enrollments,
  totalMarks,
  activities,
  streak,
}: StudentMetricCardsProps) {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(4, 1fr)",
        },
        gap: 2,
        mb: 3,
      }}
    >
      {/* Enrollments Card */}
      <Paper
        sx={{
          p: 3,
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            backgroundColor: "#dbeafe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper
            icon="mdi:book-open-outline"
            size={28}
            color="#3b82f6"
          />
        </Box>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "#6b7280", fontSize: "0.75rem" }}
          >
            {t("manageStudents.enrollments")}
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#111827", mt: 0.5 }}
          >
            {enrollments}
          </Typography>
        </Box>
      </Paper>

      {/* Total Marks Card */}
      <Paper
        sx={{
          p: 3,
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            backgroundColor: "#fef3c7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:trophy-outline" size={28} color="#f59e0b" />
        </Box>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "#6b7280", fontSize: "0.75rem" }}
          >
            {t("manageStudents.totalMarks")}
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#111827", mt: 0.5 }}
          >
            {totalMarks}
          </Typography>
        </Box>
      </Paper>

      {/* Activities Card */}
      <Paper
        sx={{
          p: 3,
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            backgroundColor: "#ede9fe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:chart-line" size={28} color="#8b5cf6" />
        </Box>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "#6b7280", fontSize: "0.75rem" }}
          >
            {t("manageStudents.activities")}
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#111827", mt: 0.5 }}
          >
            {activities}
          </Typography>
        </Box>
      </Paper>

      {/* Streak Card */}
      <Paper
        sx={{
          p: 3,
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            backgroundColor: "#d1fae5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:lightning-bolt" size={28} color="#10b981" />
        </Box>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "#6b7280", fontSize: "0.75rem" }}
          >
            {t("manageStudents.streak")}
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#111827", mt: 0.5 }}
          >
            {streak}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}


