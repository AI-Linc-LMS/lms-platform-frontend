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

interface QuickStartFormProps {
  onSubmit: (data: QuickStartFormData) => void;
  loading?: boolean;
}

export interface QuickStartFormData {
  topic: string;
  difficulty: string;
  scheduled_date_time: string;
  subtopic: string;
}

const interviewTopics = [
  "JavaScript",
  "React",
  "TypeScript",
  "Node.js",
  "Python",
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

const QuickStartFormComponent = ({
  onSubmit,
  loading,
}: QuickStartFormProps) => {
  // Set default date to today
  const defaultDate = new Date();
  defaultDate.setHours(9, 0, 0, 0); // Set to 9 AM today

  const [formData, setFormData] = useState<QuickStartFormData>({
    topic: "",
    subtopic: "",
    difficulty: "Medium",
    scheduled_date_time: defaultDate.toISOString(),
  });

  const [errors, setErrors] = useState<Partial<QuickStartFormData>>({});
  const [customTopic, setCustomTopic] = useState<string>("");

  const handleChange = useCallback(
    (field: keyof QuickStartFormData, value: string) => {
      setFormData((prev) => {
        const updated = { ...prev, [field]: value };
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
    const newErrors: Partial<QuickStartFormData> = {};

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
          <CircularProgress size={48} sx={{ color: "#10b981" }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#1f2937" }}>
            Creating Interview...
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            Please wait while we set up your interview
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
