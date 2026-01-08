"use client";

import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useState, useCallback, memo } from "react";

interface ScheduleInterviewFormProps {
  onSubmit: (data: ScheduleInterviewFormData) => void;
  loading?: boolean;
}

export interface ScheduleInterviewFormData {
  topic: string;
  subtopic: string;
  difficulty: string;
  scheduled_date_time: string;
}

const difficultyLevels = ["Easy", "Medium", "Hard"];

const ScheduleInterviewFormComponent = ({
  onSubmit,
  loading,
}: ScheduleInterviewFormProps) => {
  const [formData, setFormData] = useState<{
    topic: string;
    subtopic: string;
    difficulty: string;
    scheduled_date_time: string;
  }>({
    topic: "",
    subtopic: "",
    difficulty: "Medium",
    scheduled_date_time: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.topic) {
      newErrors.topic = "Topic is required";
    }
    if (!formData.subtopic) {
      newErrors.subtopic = "Subtopic is required";
    }
    if (!formData.difficulty) {
      newErrors.difficulty = "Difficulty level is required";
    }
    if (!formData.scheduled_date_time) {
      newErrors.scheduled_at = "Schedule date and time is required";
    } else {
      const scheduledDate = new Date(formData.scheduled_date_time);
      const now = new Date();
      if (scheduledDate <= now) {
        newErrors.scheduled_at = "Schedule date must be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(() => {
    if (validate()) {
      const submitData: ScheduleInterviewFormData = {
        topic: formData.topic,
        subtopic: formData.subtopic,
        difficulty: formData.difficulty,
        scheduled_date_time: new Date(
          formData.scheduled_date_time
        ).toISOString(),
      };
      onSubmit(submitData);
    }
  }, [formData, validate, onSubmit]);

  // Get minimum datetime (now + 1 hour)
  const minDateTime = new Date();
  minDateTime.setHours(minDateTime.getHours() + 1);
  const minDateTimeString = minDateTime.toISOString().slice(0, 16);

  return (
    <Box sx={{ position: "relative" }}>
      {loading && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            zIndex: 1000,
            borderRadius: 3,
          }}
        >
          <CircularProgress size={48} sx={{ color: "#6366f1" }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#1f2937" }}>
            Scheduling Interview...
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            Please wait while we schedule your interview
          </Typography>
        </Box>
      )}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          maxWidth: 600,
          mx: "auto",
          opacity: loading ? 0.5 : 1,
          transition: "opacity 0.3s ease",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              backgroundColor: "#6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:calendar-clock" size={28} color="#ffffff" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              Schedule Interview
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280" }}>
              Plan your interview ahead with detailed configuration
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <TextField
            fullWidth
            label="Topic"
            placeholder="e.g., Python, React, System Design"
            value={formData.topic}
            onChange={(e) => handleChange("topic", e.target.value)}
            error={Boolean(errors.topic)}
            helperText={
              errors.topic || "Enter the main topic for your interview"
            }
          />

          <TextField
            fullWidth
            label="Subtopic"
            placeholder="e.g., Data Structures, Hooks, Microservices"
            value={formData.subtopic}
            onChange={(e) => handleChange("subtopic", e.target.value)}
            error={Boolean(errors.subtopic)}
            helperText={
              errors.subtopic || "Enter specific areas you want to focus on"
            }
          />

          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1.5, fontWeight: 600, color: "#374151" }}
            >
              Difficulty Level
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 1.5,
              }}
            >
              {difficultyLevels.map((level) => (
                <Box
                  key={level}
                  onClick={() => handleChange("difficulty", level)}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: "2px solid",
                    borderColor:
                      formData.difficulty === level ? "#6366f1" : "#e5e7eb",
                    backgroundColor:
                      formData.difficulty === level ? "#eff6ff" : "#ffffff",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: "#6366f1",
                      backgroundColor: "#f5f7ff",
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color:
                        formData.difficulty === level ? "#6366f1" : "#6b7280",
                    }}
                  >
                    {level}
                  </Typography>
                </Box>
              ))}
            </Box>
            {errors.difficulty && (
              <Typography
                variant="caption"
                sx={{ color: "#ef4444", mt: 0.5, display: "block" }}
              >
                {errors.difficulty}
              </Typography>
            )}
          </Box>

          <TextField
            fullWidth
            type="datetime-local"
            label="Schedule Date & Time"
            value={formData.scheduled_date_time}
            onChange={(e) =>
              handleChange("scheduled_date_time", e.target.value)
            }
            error={Boolean(errors.scheduled_date_time)}
            helperText={errors.scheduled_date_time}
            InputLabelProps={{
              shrink: true,
            }}
            inputProps={{
              min: minDateTimeString,
            }}
          />

          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "flex-end",
              mt: 2,
            }}
          >
            <Button
              variant="outlined"
              onClick={() => window.history.back()}
              disabled={loading}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                px: 3,
                py: 1.25,
                borderColor: "#e5e7eb",
                color: "#6b7280",
                "&:hover": {
                  borderColor: "#d1d5db",
                  backgroundColor: "#f9fafb",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              endIcon={<IconWrapper icon="mdi:calendar-check" size={20} />}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                px: 3,
                py: 1.25,
                backgroundColor: "#6366f1",
                "&:hover": {
                  backgroundColor: "#4f46e5",
                },
              }}
            >
              {loading ? "Scheduling..." : "Schedule Interview"}
            </Button>
          </Box>
        </Box>

        {/* Info Box */}
        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: 2,
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
            <IconWrapper icon="mdi:information" size={20} color="#3b82f6" />
            <Typography
              variant="body2"
              sx={{ color: "#1e40af", fontSize: "0.875rem" }}
            >
              You can start the interview at the scheduled time.
            </Typography>
          </Box>
        </Paper>
      </Paper>
    </Box>
  );
};

export const ScheduleInterviewForm = memo(ScheduleInterviewFormComponent);
ScheduleInterviewForm.displayName = "ScheduleInterviewForm";
