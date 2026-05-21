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
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useState, useCallback, memo, useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { isClientOrgAdminRole } from "@/lib/auth/role-utils";

interface QuickStartFormProps {
  onSubmit: (data: QuickStartFormData) => void;
  loading?: boolean;
}

export interface QuickStartFormData {
  topic: string;
  difficulty: string;
  scheduled_date_time: string;
  subtopic: string;
  // Candidate-chosen interview length in minutes. The backend scales the number of AI turns
  // so the conversation wraps naturally within this window. Valid range 5..20 for normal
  // users; admins can additionally pick 2 from the form for testing (see `useAdminDurations`).
  duration_minutes: number;
}

const interviewTopics = [
  "JavaScript",
  "React",
  "TypeScript",
  "Node.js",
  "Python",
  "SQL",
  "System Design",
  "Data Structures & Algorithms",
  "Algorithms",
  "Database Design",
  "Cloud Architecture",
  "Behavioral Questions",
  "Leadership & Management",
];

const CUSTOM_TOPIC_VALUE = "__CUSTOM__";

const difficultyLevels = ["Easy", "Medium", "Hard"];

const DURATION_OPTIONS_REGULAR = [5, 7, 10, 15, 20];
const DURATION_OPTIONS_ADMIN = [2, ...DURATION_OPTIONS_REGULAR];
const DEFAULT_DURATION_MINUTES = 7;

const QuickStartFormComponent = ({
  onSubmit,
  loading,
}: QuickStartFormProps) => {
  const defaultDate = new Date();
  defaultDate.setHours(9, 0, 0, 0);

  const { user } = useAuth();
  const isAdmin = isClientOrgAdminRole(user?.role);
  const durationOptions = useMemo(
    () => (isAdmin ? DURATION_OPTIONS_ADMIN : DURATION_OPTIONS_REGULAR),
    [isAdmin],
  );

  const [formData, setFormData] = useState<QuickStartFormData>({
    topic: "",
    subtopic: "",
    difficulty: "Medium",
    scheduled_date_time: defaultDate.toISOString(),
    duration_minutes: DEFAULT_DURATION_MINUTES,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof QuickStartFormData, string>>>({});
  const [customTopic, setCustomTopic] = useState<string>("");

  const handleDurationChange = useCallback((minutes: number) => {
    setFormData((prev) => ({ ...prev, duration_minutes: minutes }));
    setErrors((prev) => ({ ...prev, duration_minutes: "" }));
  }, []);

  const handleChange = useCallback(
    (field: keyof QuickStartFormData, value: string) => {
      setFormData((prev) => {
        const updated = { ...prev, [field]: value } as QuickStartFormData;
        // When topic changes, update subtopic to match
        if (field === "topic") {
          updated.subtopic = value;
          // Clear custom topic if switching away from custom
          if (value !== CUSTOM_TOPIC_VALUE) {
            setCustomTopic("");
          }
        }
        return updated;
      });
      setErrors((prev) => ({ ...prev, [field]: "" }));
    },
    []
  );

  const handleCustomTopicChange = useCallback((value: string) => {
    setCustomTopic(value);
    setErrors((prev) => ({ ...prev, topic: "" }));
  }, []);

  const validate = useCallback(() => {
    const newErrors: Partial<Record<keyof QuickStartFormData, string>> = {};

    if (!formData.topic) {
      newErrors.topic = "Interview topic is required";
    } else if (formData.topic === CUSTOM_TOPIC_VALUE && !customTopic.trim()) {
      newErrors.topic = "Please enter a custom topic";
    }
    if (!formData.difficulty) {
      newErrors.difficulty = "Difficulty level is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, customTopic]);

  const handleSubmit = useCallback(() => {
    if (validate()) {
      // Use custom topic if selected, otherwise use the selected topic
      const finalTopic = formData.topic === CUSTOM_TOPIC_VALUE ? customTopic.trim() : formData.topic;
      onSubmit({
        ...formData,
        topic: finalTopic,
        subtopic: finalTopic, // Update subtopic to match topic
      });
    }
  }, [formData, customTopic, validate, onSubmit]);

  return (
    <Box sx={{ position: "relative" }}>
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
              backgroundColor: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:lightning-bolt" size={28} color="#ffffff" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              Quick Start Interview
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280" }}>
              Fill in the details to start your interview instantly
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <FormControl fullWidth error={Boolean(errors.topic)}>
            <InputLabel>Interview Topic</InputLabel>
            <Select
              value={formData.topic}
              label="Interview Topic"
              onChange={(e) => handleChange("topic", e.target.value)}
            >
              {interviewTopics.map((topic) => (
                <MenuItem key={topic} value={topic}>
                  {topic}
                </MenuItem>
              ))}
              <MenuItem value={CUSTOM_TOPIC_VALUE}>Custom Topic</MenuItem>
            </Select>
            {errors.topic && (
              <Typography variant="caption" sx={{ color: "#ef4444", mt: 0.5 }}>
                {errors.topic}
              </Typography>
            )}
          </FormControl>

          {formData.topic === CUSTOM_TOPIC_VALUE && (
            <TextField
              fullWidth
              label="Enter Custom Topic"
              placeholder="e.g., Machine Learning, DevOps, Frontend Architecture"
              value={customTopic}
              onChange={(e) => handleCustomTopicChange(e.target.value)}
              error={Boolean(errors.topic)}
              helperText={errors.topic || "Enter your custom interview topic"}
            />
          )}

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
                      formData.difficulty === level ? "#10b981" : "#e5e7eb",
                    backgroundColor:
                      formData.difficulty === level ? "#ecfdf5" : "#ffffff",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: "#10b981",
                      backgroundColor: "#f0fdf4",
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color:
                        formData.difficulty === level ? "#10b981" : "#6b7280",
                    }}
                  >
                    {level}
                  </Typography>
                </Box>
              ))}
            </Box>
            {errors.difficulty && (
              <Typography variant="caption" sx={{ color: "#ef4444", mt: 0.5 }}>
                {errors.difficulty}
              </Typography>
            )}
          </Box>

          {/* Duration picker. The AI scales the number of conversational turns it plans to fit
              the chosen window, so a 5-min interview will feel tighter and a 20-min one will
              go deeper. The candidate is never auto-cut-off — the timer is advisory only.
              Uses theme tokens so admin branding-theme changes propagate. */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1.5, fontWeight: 600, color: "var(--font-muted)" }}
            >
              Interview Length
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: `repeat(${durationOptions.length}, 1fr)`,
                gap: 1.5,
              }}
            >
              {durationOptions.map((mins) => {
                const selected = formData.duration_minutes === mins;
                const isAdminOnlyOption = mins < 5;
                return (
                  <Box
                    key={mins}
                    onClick={() => handleDurationChange(mins)}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: "2px solid",
                      borderColor: selected
                        ? "var(--course-cta)"
                        : "var(--border-default)",
                      backgroundColor: selected
                        ? "color-mix(in srgb, var(--course-cta) 8%, var(--card-bg))"
                        : "var(--card-bg)",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.2s ease",
                      position: "relative",
                      "&:hover": {
                        borderColor: "var(--course-cta)",
                        backgroundColor:
                          "color-mix(in srgb, var(--course-cta) 5%, var(--card-bg))",
                      },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: selected ? "var(--course-cta)" : "var(--font-secondary)",
                      }}
                    >
                      {mins} min
                    </Typography>
                    {isAdminOnlyOption && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: -8,
                          right: -8,
                          px: 0.75,
                          py: 0.1,
                          borderRadius: 999,
                          fontSize: "0.6rem",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          backgroundColor: "var(--accent-indigo)",
                          color: "var(--font-light)",
                          lineHeight: 1.4,
                        }}
                      >
                        Admin · Test
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
            <Typography
              variant="caption"
              sx={{ display: "block", color: "var(--font-secondary)", mt: 1 }}
            >
              The AI will pace itself to wrap up naturally within this time — you won't be cut off mid-answer.
            </Typography>
          </Box>

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
              endIcon={<IconWrapper icon="mdi:lightning-bolt" size={20} />}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                px: 3,
                py: 1.25,
                backgroundColor: "#10b981",
                "&:hover": {
                  backgroundColor: "#059669",
                },
              }}
            >
              {loading ? "Creating..." : "Start Interview"}
            </Button>
          </Box>
        </Box>

        {/* Info Box */}
        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: 2,
            backgroundColor: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
            <IconWrapper icon="mdi:information" size={20} color="#10b981" />
            <Typography
              variant="body2"
              sx={{ color: "#065f46", fontSize: "0.875rem" }}
            >
              Your interview will start immediately after creation. Make sure
              you're ready before proceeding.
            </Typography>
          </Box>
        </Paper>
      </Paper>
    </Box>
  );
};

export const QuickStartForm = memo(QuickStartFormComponent);
QuickStartForm.displayName = "QuickStartForm";
