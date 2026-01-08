"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  CircularProgress,
  Typography,
  SelectChangeEvent,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useState } from "react";

interface CreateCourseModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    level: string;
    description: string;
  }) => void;
  loading?: boolean;
  existingTitles?: string[];
}

export function CreateCourseModal({
  open,
  onClose,
  onSubmit,
  loading = false,
  existingTitles = [],
}: CreateCourseModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    level: "",
    description: "",
  });
  const [errors, setErrors] = useState<{
    name?: string;
    level?: string;
  }>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      level: value,
    }));
    // Clear error when user selects
    if (errors.level) {
      setErrors((prev) => ({
        ...prev,
        level: undefined,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: typeof errors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Course name is required";
    }
    if (!formData.level) {
      newErrors.level = "Difficulty level is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Check for duplicate titles
    const isDuplicate = existingTitles.some(
      (title) => title.toLowerCase() === formData.name.toLowerCase()
    );

    if (isDuplicate) {
      if (!confirm(`A course with a similar title already exists. Create anyway?`)) {
        return;
      }
    }

    onSubmit(formData);
    // Reset form
    setFormData({ name: "", level: "", description: "" });
    setErrors({});
  };

  const handleClose = () => {
    setFormData({ name: "", level: "", description: "" });
    setErrors({});
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Add New Course
        </Typography>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{ color: "#6b7280" }}
        >
          <IconWrapper icon="mdi:close" size={20} />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField
              label="Course Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Data Structures"
              fullWidth
              required
              error={!!errors.name}
              helperText={errors.name}
              inputProps={{ maxLength: 255 }}
            />

            <FormControl fullWidth required error={!!errors.level}>
              <InputLabel>Difficulty Level</InputLabel>
              <Select
                value={formData.level}
                onChange={handleSelectChange}
                label="Difficulty Level"
              >
                <MenuItem value="">Choose a level</MenuItem>
                <MenuItem value="Easy">Easy</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Hard">Hard</MenuItem>
              </Select>
              {errors.level && (
                <Typography variant="caption" sx={{ color: "#d32f2f", mt: 0.5, ml: 1.75 }}>
                  {errors.level}
                </Typography>
              )}
            </FormControl>

            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="e.g., This course covers..."
              fullWidth
              multiline
              rows={4}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={
              loading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <IconWrapper icon="mdi:check" size={18} />
              )
            }
            sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}
          >
            {loading ? "Creating..." : "Create Course"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

