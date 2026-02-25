"use client";

import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

interface ContentMarksInfoProps {
  marks: number;
  obtainedMarks: number | null;
  submissions: number;
}

export function ContentMarksInfo({
  marks,
  obtainedMarks,
  submissions,
}: ContentMarksInfoProps) {
  const { t } = useTranslation("common");
  if (marks === 0) return null;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        flexWrap: "wrap",
        p: 1.5,
        backgroundColor: "#f9fafb",
        borderRadius: 1,
        border: "1px solid #e5e7eb",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography
          variant="body2"
          sx={{ color: "#6b7280", fontWeight: 500, fontSize: "0.875rem" }}
        >
          {t("courses.totalMarks")}:
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "#1a1f2e", fontWeight: 600, fontSize: "0.875rem" }}
        >
          {marks}
        </Typography>
      </Box>
      {obtainedMarks !== null && (
        <>
          <Box
            sx={{
              width: "1px",
              height: "20px",
              backgroundColor: "#e5e7eb",
            }}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="body2"
              sx={{ color: "#6b7280", fontWeight: 500, fontSize: "0.875rem" }}
            >
              {t("courses.obtainedMarks")}:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color:
                  obtainedMarks >= marks * 0.8
                    ? "#065f46"
                    : obtainedMarks >= marks * 0.6
                    ? "#92400e"
                    : "#991b1b",
                fontWeight: 600,
                fontSize: "0.875rem",
              }}
            >
              {obtainedMarks}
            </Typography>
          </Box>
        </>
      )}
      {submissions > 0 && (
        <>
          <Box
            sx={{
              width: "1px",
              height: "20px",
              backgroundColor: "#e5e7eb",
            }}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="body2"
              sx={{ color: "#6b7280", fontWeight: 500, fontSize: "0.875rem" }}
            >
              {t("courses.submissions")}:
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "#1a1f2e", fontWeight: 600, fontSize: "0.875rem" }}
            >
              {submissions}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
}

