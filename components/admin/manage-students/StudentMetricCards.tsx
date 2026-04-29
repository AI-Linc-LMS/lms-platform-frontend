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
          border: "1px solid var(--border-default)",
          backgroundColor: "var(--card-bg)",
          boxShadow:
            "0 1px 3px color-mix(in srgb, var(--font-primary) 10%, transparent)",
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
            backgroundColor:
              "color-mix(in srgb, var(--accent-indigo) 16%, var(--surface) 84%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper
            icon="mdi:book-open-outline"
            size={28}
            color="var(--accent-indigo)"
          />
        </Box>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "var(--font-secondary)", fontSize: "0.75rem" }}
          >
            {t("manageStudents.enrollments")}
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "var(--font-primary)", mt: 0.5 }}
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
          border: "1px solid var(--border-default)",
          backgroundColor: "var(--card-bg)",
          boxShadow:
            "0 1px 3px color-mix(in srgb, var(--font-primary) 10%, transparent)",
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
            backgroundColor:
              "color-mix(in srgb, var(--warning-500) 16%, var(--surface) 84%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:trophy-outline" size={28} color="var(--warning-500)" />
        </Box>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "var(--font-secondary)", fontSize: "0.75rem" }}
          >
            {t("manageStudents.totalMarks")}
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "var(--font-primary)", mt: 0.5 }}
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
          border: "1px solid var(--border-default)",
          backgroundColor: "var(--card-bg)",
          boxShadow:
            "0 1px 3px color-mix(in srgb, var(--font-primary) 10%, transparent)",
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
            backgroundColor:
              "color-mix(in srgb, var(--accent-purple) 16%, var(--surface) 84%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:chart-line" size={28} color="var(--accent-purple)" />
        </Box>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "var(--font-secondary)", fontSize: "0.75rem" }}
          >
            {t("manageStudents.activities")}
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "var(--font-primary)", mt: 0.5 }}
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
          border: "1px solid var(--border-default)",
          backgroundColor: "var(--card-bg)",
          boxShadow:
            "0 1px 3px color-mix(in srgb, var(--font-primary) 10%, transparent)",
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
            backgroundColor:
              "color-mix(in srgb, var(--success-500) 16%, var(--surface) 84%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:lightning-bolt" size={28} color="var(--success-500)" />
        </Box>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "var(--font-secondary)", fontSize: "0.75rem" }}
          >
            {t("manageStudents.streak")}
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "var(--font-primary)", mt: 0.5 }}
          >
            {streak}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}


