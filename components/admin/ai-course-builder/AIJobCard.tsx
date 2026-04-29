"use client";

import { Card, CardContent, Typography, Box, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { CourseBuilderJobListItem } from "@/lib/services/admin/ai-course-builder.service";

interface AIJobCardProps {
  job: CourseBuilderJobListItem;
}

const STATUS_KEYS: Record<string, string> = {
  pending: "pending",
  generating_outline: "generatingOutline",
  outline_ready: "outlineReady",
  creating_structure: "creatingStructure",
  generating_content: "generatingContent",
  completed: "completed",
  failed: "failed",
};

export function AIJobCard({ job }: AIJobCardProps) {
  const router = useRouter();
  const { t } = useTranslation("common");
  const statusKey = STATUS_KEYS[job.status];
  const statusLabel = statusKey ? t(`adminAICourseBuilder.${statusKey}`) : job.status;
  const progress = job.progress_percentage ?? 0;

  return (
    <Card
      sx={{
        borderRadius: 2,
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--card-bg)",
        boxShadow:
          "0 1px 3px color-mix(in srgb, var(--font-primary) 10%, transparent)",
        "&:hover": {
          boxShadow:
            "0 4px 12px color-mix(in srgb, var(--font-primary) 14%, transparent)",
        },
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: "var(--font-primary)" }}
          >
            {job.course_title || t("adminAICourseBuilder.untitledCourse")}
          </Typography>
          <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
            {statusLabel}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 1 }}>
          {job.input_type === "description" ? t("adminAICourseBuilder.fromDescription") : t("adminAICourseBuilder.structuredPlan")}
        </Typography>
        {(job.total_content_items != null &&
          job.total_content_items > 0 &&
          job.status !== "outline_ready") && (
          <Box sx={{ mb: 1 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.75rem",
                color: "var(--font-secondary)",
                mb: 0.5,
              }}
            >
              <span>{t("adminAICourseBuilder.progress")}</span>
              <span>
                {job.completed_content_items ?? 0} / {job.total_content_items} ({progress}%)
              </span>
            </Box>
            <Box
              sx={{
                height: 6,
                borderRadius: 1,
                bgcolor: "var(--border-default)",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  width: `${progress}%`,
                  bgcolor: "var(--accent-indigo)",
                  transition: "width 0.3s ease",
                }}
              />
            </Box>
          </Box>
        )}
        <Button
          size="small"
          variant="outlined"
          onClick={() => router.push(`/admin/ai-course-builder/jobs/${job.job_id}`)}
          sx={{
            mt: 1,
            color: "var(--accent-indigo)",
            borderColor: "var(--accent-indigo)",
          }}
        >
          {t("adminAICourseBuilder.viewDetails")}
        </Button>
      </CardContent>
    </Card>
  );
}
