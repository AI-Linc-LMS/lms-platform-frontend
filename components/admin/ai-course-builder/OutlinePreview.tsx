"use client";

import { Box, Typography, Paper } from "@mui/material";
import type { CourseOutline } from "@/lib/services/admin/ai-course-builder.service";

interface OutlinePreviewProps {
  outline: CourseOutline;
}

export function OutlinePreview({ outline }: OutlinePreviewProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        borderRadius: 2,
        width: "100%",
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          color: "#111827",
          fontSize: { xs: "1.5rem", sm: "1.75rem" },
          mb: 2,
        }}
      >
        {outline.course_title}
      </Typography>
      {outline.course_description && (
        <Typography
          variant="body1"
          sx={{ color: "#4b5563", lineHeight: 1.6, mb: 3 }}
        >
          {outline.course_description}
        </Typography>
      )}

      {outline.learning_objectives && outline.learning_objectives.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: "#111827", mb: 1 }}
          >
            Learning objectives
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5, "& li": { mb: 0.5 } }}>
            {outline.learning_objectives.map((obj, i) => (
              <li key={i}>
                <Typography variant="body2" sx={{ color: "#4b5563" }}>
                  {obj}
                </Typography>
              </li>
            ))}
          </Box>
        </Box>
      )}

      {outline.prerequisites && outline.prerequisites.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: "#111827", mb: 1 }}
          >
            Prerequisites
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5, "& li": { mb: 0.5 } }}>
            {outline.prerequisites.map((p, i) => (
              <li key={i}>
                <Typography variant="body2" sx={{ color: "#4b5563" }}>
                  {p}
                </Typography>
              </li>
            ))}
          </Box>
        </Box>
      )}

      {outline.total_estimated_hours != null && (
        <Typography variant="body2" sx={{ fontWeight: 500, color: "#374151", mb: 2 }}>
          Estimated total: {outline.total_estimated_hours} hours
        </Typography>
      )}

      {outline.skills_covered && outline.skills_covered.length > 0 && (
        <Typography variant="body2" sx={{ color: "#6b7280", mb: 3 }}>
          Skills covered: {outline.skills_covered.join(", ")}
        </Typography>
      )}

      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 600, color: "#111827", mb: 2 }}
      >
        Modules
      </Typography>

      {outline.modules.map((mod, i) => (
        <Box
          key={i}
          sx={{
            borderLeft: "3px solid #e5e7eb",
            pl: 2,
            mb: 2.5,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: "#111827" }}
          >
            Week {mod.week}: {mod.title}
          </Typography>
          {mod.description && (
            <Typography
              variant="body2"
              sx={{ color: "#6b7280", mt: 0.5, mb: 0.5 }}
            >
              {mod.description}
            </Typography>
          )}
          {mod.learning_goals && mod.learning_goals.length > 0 && (
            <Typography
              variant="body2"
              sx={{ color: "#6b7280", fontSize: "0.8125rem", mb: 1 }}
            >
              Goals: {mod.learning_goals.join("; ")}
            </Typography>
          )}
          <Box sx={{ mt: 1 }}>
            {mod.submodules.map((sub, j) => (
              <Box key={j} sx={{ mb: 0.75 }}>
                <Typography
                  variant="body2"
                  component="span"
                  sx={{ fontWeight: 600, color: "#374151" }}
                >
                  {sub.title}
                </Typography>
                {sub.description && (
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{ color: "#6b7280" }}
                  >
                    {" "}
                    — {sub.description}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Paper>
  );
}
