"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import Link from "next/link";
import { IconWrapper } from "@/components/common/IconWrapper";
import { aiCourseBuilderService } from "@/lib/services/admin/ai-course-builder.service";
import type { OutlineConfig } from "@/lib/services/admin/ai-course-builder.service";
import { OutlineConfigForm } from "@/components/admin/ai-course-builder/OutlineConfigForm";

const defaultConfig: OutlineConfig = {
  content_types: ["Quiz", "Article"],
  include_coding_problems: false,
  difficulty_level: "Medium",
  articles_per_submodule: 1,
  quizzes_per_submodule: 1,
  questions_per_quiz: 5,
  coding_problems_per_submodule: 0,
};

export default function GenerateDescriptionPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target_audience: "",
    duration_weeks: 8,
  });
  const [config, setConfig] = useState<OutlineConfig>(defaultConfig);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!formData.title.trim()) err.title = "Title is required";
    if (!formData.description.trim()) err.description = "Description is required";
    if (formData.duration_weeks < 1 || formData.duration_weeks > 52) {
      err.duration_weeks = "Duration must be between 1 and 52 weeks";
    }
    setErrors(err);
    if (Object.keys(err).length > 0) return;

    try {
      setSubmitting(true);
      const job = aiCourseBuilderService.generateOutline({
        input_type: "description",
        title: formData.title.trim(),
        description: formData.description.trim(),
        target_audience: formData.target_audience.trim() || undefined,
        duration_weeks: formData.duration_weeks,
        config,
      });
      showToast("Outline generation started", "success");
      router.push("/admin/ai-course-builder");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to generate outline";
      showToast(message, "error");
      try {
        if (typeof message === "string" && message.includes("{")) {
          const parsed = JSON.parse(
            message.substring(message.indexOf("{"))
          ) as Record<string, string | string[]>;
          const fieldErrors: Record<string, string> = {};
          Object.entries(parsed).forEach(([key, val]) => {
            fieldErrors[key] = Array.isArray(val) ? val.join(", ") : val;
          });
          setErrors(fieldErrors);
        }
      } catch {
        // ignore parse errors
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ mb: 2 }}>
          <Link
            href="/admin/ai-course-builder"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: "#6366f1",
              textDecoration: "none",
              fontSize: "0.875rem",
            }}
          >
            <IconWrapper icon="mdi:arrow-left" size={20} />
            Back to AI Course Builder
          </Link>
        </Box>

        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "#111827", mb: 1 }}
        >
          Generate course outline from description
        </Typography>
        <Typography variant="body2" sx={{ color: "#6b7280", mb: 3 }}>
          Enter a high-level description and we will generate a structured
          course outline with modules and submodules.
        </Typography>

        <Paper
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            maxWidth: 720,
          }}
        >
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Course title"
              value={formData.title}
              onChange={(e) =>
                setFormData((p) => ({ ...p, title: e.target.value }))
              }
              error={!!errors.title}
              helperText={errors.title}
              size="small"
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Course description"
              value={formData.description}
              onChange={(e) =>
                setFormData((p) => ({ ...p, description: e.target.value }))
              }
              error={!!errors.description}
              helperText={errors.description}
              multiline
              rows={4}
              size="small"
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Target audience (optional)"
              value={formData.target_audience}
              onChange={(e) =>
                setFormData((p) => ({ ...p, target_audience: e.target.value }))
              }
              size="small"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="number"
              label="Duration (weeks)"
              value={formData.duration_weeks}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  duration_weeks: parseInt(e.target.value, 10) || 1,
                }))
              }
              error={!!errors.duration_weeks}
              helperText={errors.duration_weeks}
              inputProps={{ min: 1, max: 52 }}
              size="small"
              sx={{ mb: 3 }}
            />

        
            <Box sx={{ mb: 3 }}>
              <OutlineConfigForm config={config} onChange={setConfig} />
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                sx={{
                  bgcolor: "#6366f1",
                  "&:hover": { bgcolor: "#4f46e5" },
                }}
              >
                {submitting ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Generating...
                  </>
                ) : (
                  "Generate outline"
                )}
              </Button>
              <Button
                component={Link}
                href="/admin/ai-course-builder"
                variant="outlined"
                disabled={submitting}
              >
                Cancel
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </MainLayout>
  );
}
