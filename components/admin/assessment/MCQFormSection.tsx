"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  IconButton,
  Divider,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { MCQ } from "@/lib/services/admin/admin-assessment.service";

interface MCQFormSectionProps {
  mcqs: MCQ[];
  onMCQsChange: (mcqs: MCQ[]) => void;
}

export function MCQFormSection({ mcqs, onMCQsChange }: MCQFormSectionProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<MCQ>({
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "A",
    explanation: "",
    difficulty_level: "Medium",
    topic: "",
    skills: "",
  });

  const handleAddMCQ = () => {
    if (!formData.question_text.trim()) {
      return;
    }
    if (
      !formData.option_a.trim() ||
      !formData.option_b.trim() ||
      !formData.option_c.trim() ||
      !formData.option_d.trim()
    ) {
      return;
    }

    if (editingIndex !== null) {
      const updated = [...mcqs];
      updated[editingIndex] = formData;
      onMCQsChange(updated);
      setEditingIndex(null);
    } else {
      onMCQsChange([...mcqs, formData]);
    }

    // Reset form
    setFormData({
      question_text: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_option: "A",
      explanation: "",
      difficulty_level: "Medium",
      topic: "",
      skills: "",
    });
  };

  const handleEdit = (index: number) => {
    setFormData(mcqs[index]);
    setEditingIndex(index);
  };

  const handleDelete = (index: number) => {
    const updated = mcqs.filter((_, i) => i !== index);
    onMCQsChange(updated);
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setFormData({
      question_text: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_option: "A",
      explanation: "",
      difficulty_level: "Medium",
      topic: "",
      skills: "",
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        Add MCQ Questions
      </Typography>

      {/* MCQ Form */}
      <Paper sx={{ p: 3, bgcolor: "#f9fafb" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Question Text"
            value={formData.question_text}
            onChange={(e) =>
              setFormData({ ...formData, question_text: e.target.value })
            }
            fullWidth
            required
            multiline
            rows={3}
          />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              label="Option A"
              value={formData.option_a}
              onChange={(e) =>
                setFormData({ ...formData, option_a: e.target.value })
              }
              fullWidth
              required
              inputProps={{ maxLength: 255 }}
            />
            <TextField
              label="Option B"
              value={formData.option_b}
              onChange={(e) =>
                setFormData({ ...formData, option_b: e.target.value })
              }
              fullWidth
              required
              inputProps={{ maxLength: 255 }}
            />
            <TextField
              label="Option C"
              value={formData.option_c}
              onChange={(e) =>
                setFormData({ ...formData, option_c: e.target.value })
              }
              fullWidth
              required
              inputProps={{ maxLength: 255 }}
            />
            <TextField
              label="Option D"
              value={formData.option_d}
              onChange={(e) =>
                setFormData({ ...formData, option_d: e.target.value })
              }
              fullWidth
              required
              inputProps={{ maxLength: 255 }}
            />
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
              gap: 2,
            }}
          >
            <FormControl fullWidth required>
              <InputLabel>Correct Option</InputLabel>
              <Select
                value={formData.correct_option}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    correct_option: e.target.value as "A" | "B" | "C" | "D",
                  })
                }
                label="Correct Option"
              >
                <MenuItem value="A">A</MenuItem>
                <MenuItem value="B">B</MenuItem>
                <MenuItem value="C">C</MenuItem>
                <MenuItem value="D">D</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Difficulty Level</InputLabel>
              <Select
                value={formData.difficulty_level}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    difficulty_level: e.target.value as "Easy" | "Medium" | "Hard",
                  })
                }
                label="Difficulty Level"
              >
                <MenuItem value="Easy">Easy</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Hard">Hard</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Topic"
              value={formData.topic}
              onChange={(e) =>
                setFormData({ ...formData, topic: e.target.value })
              }
              fullWidth
              inputProps={{ maxLength: 255 }}
            />
          </Box>
          <TextField
            label="Explanation"
            value={formData.explanation}
            onChange={(e) =>
              setFormData({ ...formData, explanation: e.target.value })
            }
            fullWidth
            multiline
            rows={2}
          />
          <TextField
            label="Skills"
            value={formData.skills}
            onChange={(e) =>
              setFormData({ ...formData, skills: e.target.value })
            }
            fullWidth
            inputProps={{ maxLength: 255 }}
          />
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            {editingIndex !== null && (
              <Button variant="outlined" onClick={handleCancel}>
                Cancel
              </Button>
            )}
            <Button
              variant="contained"
              onClick={handleAddMCQ}
              disabled={
                !formData.question_text.trim() ||
                !formData.option_a.trim() ||
                !formData.option_b.trim() ||
                !formData.option_c.trim() ||
                !formData.option_d.trim()
              }
              startIcon={<IconWrapper icon="mdi:plus" size={18} />}
              sx={{ bgcolor: "#6366f1" }}
            >
              {editingIndex !== null ? "Update Question" : "Add Question"}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* MCQ List */}
      {mcqs.length > 0 && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Added Questions ({mcqs.length})
          </Typography>
          {mcqs.map((mcq, index) => (
            <Paper
              key={index}
              sx={{
                p: 2,
                mb: 2,
                border: "1px solid #e5e7eb",
                position: "relative",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 1,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Question {index + 1}
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(index)}
                    sx={{ color: "#6366f1" }}
                  >
                    <IconWrapper icon="mdi:pencil" size={16} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(index)}
                    sx={{ color: "#ef4444" }}
                  >
                    <IconWrapper icon="mdi:delete" size={16} />
                  </IconButton>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {mcq.question_text}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Typography variant="caption">
                  A. {mcq.option_a}
                  {mcq.correct_option === "A" && (
                    <IconWrapper
                      icon="mdi:check-circle"
                      size={14}
                      color="#10b981"
                      style={{ marginLeft: 8, verticalAlign: "middle" }}
                    />
                  )}
                </Typography>
                <Typography variant="caption">
                  B. {mcq.option_b}
                  {mcq.correct_option === "B" && (
                    <IconWrapper
                      icon="mdi:check-circle"
                      size={14}
                      color="#10b981"
                      style={{ marginLeft: 8, verticalAlign: "middle" }}
                    />
                  )}
                </Typography>
                <Typography variant="caption">
                  C. {mcq.option_c}
                  {mcq.correct_option === "C" && (
                    <IconWrapper
                      icon="mdi:check-circle"
                      size={14}
                      color="#10b981"
                      style={{ marginLeft: 8, verticalAlign: "middle" }}
                    />
                  )}
                </Typography>
                <Typography variant="caption">
                  D. {mcq.option_d}
                  {mcq.correct_option === "D" && (
                    <IconWrapper
                      icon="mdi:check-circle"
                      size={14}
                      color="#10b981"
                      style={{ marginLeft: 8, verticalAlign: "middle" }}
                    />
                  )}
                </Typography>
              </Box>
              {mcq.difficulty_level && (
                <Typography variant="caption" sx={{ color: "#6b7280", mt: 1 }}>
                  Difficulty: {mcq.difficulty_level}
                </Typography>
              )}
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}

