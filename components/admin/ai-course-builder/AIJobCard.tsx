"use client";

import { Card, CardContent, Typography, Box, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { CourseBuilderJobListItem } from "@/lib/services/admin/ai-course-builder.service";

interface AIJobCardProps {
  job: CourseBuilderJobListItem;
}

const statusLabels: Record<string, string> = {
  pending: "Pending",
  generating_outline: "Generating outline",
  outline_ready: "Outline ready",
  creating_structure: "Creating structure",
  generating_content: "Generating content",
  completed: "Completed",
  failed: "Failed",
};

export function AIJobCard({ job }: AIJobCardProps) {
  const router = useRouter();
  const statusLabel = statusLabels[job.status] ?? job.status;
  const progress = job.progress_percentage ?? 0;

  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
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
            sx={{ fontWeight: 600, color: "#111827" }}
          >
            {job.course_title || "Untitled course"}
          </Typography>
          <Typography variant="caption" sx={{ color: "#6b7280" }}>
            {statusLabel}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: "#6b7280", mb: 1 }}>
          {job.input_type === "description" ? "From description" : "Structured plan"}
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
                color: "#6b7280",
                mb: 0.5,
              }}
            >
              <span>Progress</span>
              <span>
                {job.completed_content_items ?? 0} / {job.total_content_items} ({progress}%)
              </span>
            </Box>
            <Box
              sx={{
                height: 6,
                borderRadius: 1,
                bgcolor: "#e5e7eb",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  width: `${progress}%`,
                  bgcolor: "#6366f1",
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
          sx={{ mt: 1, color: "#6366f1", borderColor: "#6366f1" }}
        >
          View details
        </Button>
      </CardContent>
    </Card>
  );
}
