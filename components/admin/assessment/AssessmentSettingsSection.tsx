"use client";

import {
  Box,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  CircularProgress,
} from "@mui/material";

interface AssessmentSettingsSectionProps {
  durationMinutes: number;
  startTime: string;
  endTime: string;
  isPaid: boolean;
  price: string;
  currency: string;
  isActive: boolean;
  courseIds: number[];
  courses: any[];
  loadingCourses: boolean;
  onDurationChange: (value: number) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onPaidChange: (value: boolean) => void;
  onPriceChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onActiveChange: (value: boolean) => void;
  onCourseIdsChange: (value: number[]) => void;
}

export function AssessmentSettingsSection({
  durationMinutes,
  startTime,
  endTime,
  isPaid,
  price,
  currency,
  isActive,
  courseIds,
  courses,
  loadingCourses,
  onDurationChange,
  onStartTimeChange,
  onEndTimeChange,
  onPaidChange,
  onPriceChange,
  onCurrencyChange,
  onActiveChange,
  onCourseIdsChange,
}: AssessmentSettingsSectionProps) {
  return (
    <Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: "#111827",
          mb: 1,
        }}
      >
        Assessment Settings
      </Typography>
      <Typography variant="body2" sx={{ color: "#6b7280", mb: 3 }}>
        Configure duration, scheduling, pricing, and availability settings.
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <TextField
          label="Duration (minutes)"
          type="number"
          value={durationMinutes}
          onChange={(e) => onDurationChange(Number(e.target.value))}
          fullWidth
          required
          inputProps={{ min: 1 }}
        />
        <FormControl fullWidth>
          <InputLabel>Courses (optional)</InputLabel>
          <Select
            multiple
            value={courseIds}
            onChange={(e) => {
              const value = e.target.value;
              onCourseIdsChange(typeof value === "string" ? [] : value);
            }}
            input={<OutlinedInput label="Courses (optional)" />}
            renderValue={(selected) => {
              if (selected.length === 0) return "";
              return selected
                .map((id) => {
                  const course = courses.find((c) => c.id === id);
                  return course?.title || course?.name || `Course ${id}`;
                })
                .join(", ");
            }}
            disabled={loadingCourses}
          >
            {loadingCourses ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Loading courses...
              </MenuItem>
            ) : courses.length === 0 ? (
              <MenuItem disabled>No courses available</MenuItem>
            ) : (
              courses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  <Checkbox checked={courseIds.indexOf(course.id) > -1} />
                  <ListItemText primary={course.title || course.name || `Course ${course.id}`} />
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          <TextField
            label="Start date & time (optional)"
            type="datetime-local"
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: new Date().toISOString().slice(0, 16),
            }}
            helperText="When the assessment becomes available"
          />
          <TextField
            label="End date & time (optional)"
            type="datetime-local"
            value={endTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: startTime || new Date().toISOString().slice(0, 16),
            }}
            helperText="When the assessment closes"
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          <FormControlLabel
            control={
              <Switch checked={isPaid} onChange={(e) => onPaidChange(e.target.checked)} />
            }
            label="Paid Assessment"
          />
          {isPaid && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
                ml: 4,
              }}
            >
              <TextField
                label="Price"
                type="number"
                value={price}
                onChange={(e) => onPriceChange(e.target.value)}
                fullWidth
                required
                inputProps={{ min: 0, step: 0.01 }}
                helperText="Enter price"
              />
              <FormControl fullWidth required>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={currency}
                  onChange={(e) => onCurrencyChange(e.target.value)}
                  label="Currency"
                >
                  <MenuItem value="INR">INR (₹)</MenuItem>
                  <MenuItem value="USD">USD ($)</MenuItem>
                  <MenuItem value="EUR">EUR (€)</MenuItem>
                  <MenuItem value="GBP">GBP (£)</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
          <FormControlLabel
            control={
              <Switch checked={isActive} onChange={(e) => onActiveChange(e.target.checked)} />
            }
            label="Active"
          />
        </Box>
      </Box>
    </Box>
  );
}

