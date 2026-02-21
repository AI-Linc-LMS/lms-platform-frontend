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
  Autocomplete,
  Chip,
} from "@mui/material";

interface AssessmentSettingsSectionProps {
  durationMinutes: number;
  startTime: string;
  endTime: string;
  isPaid: boolean;
  price: string;
  currency: string;
  isActive: boolean;
  proctoringEnabled: boolean;
  sendCommunication: boolean;
  showResult: boolean;
  courseIds: number[];
  courses: any[];
  loadingCourses: boolean;
  colleges: string[];
  onDurationChange: (value: number) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onPaidChange: (value: boolean) => void;
  onPriceChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onActiveChange: (value: boolean) => void;
  onProctoringEnabledChange: (value: boolean) => void;
  onSendCommunicationChange: (value: boolean) => void;
  onShowResultChange: (value: boolean) => void;
  onCourseIdsChange: (value: number[]) => void;
  onCollegesChange: (value: string[]) => void;
}

export function AssessmentSettingsSection({
  durationMinutes,
  startTime,
  endTime,
  isPaid,
  price,
  currency,
  isActive,
  proctoringEnabled,
  sendCommunication,
  showResult,
  courseIds,
  courses,
  loadingCourses,
  colleges,
  onDurationChange,
  onStartTimeChange,
  onEndTimeChange,
  onPaidChange,
  onPriceChange,
  onCurrencyChange,
  onActiveChange,
  onProctoringEnabledChange,
  onSendCommunicationChange,
  onShowResultChange,
  onCourseIdsChange,
  onCollegesChange,
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
          value={durationMinutes === 0 ? "" : durationMinutes}
          onChange={(e) => {
            const v = e.target.value;
            onDurationChange(v === "" ? 0 : Number(v));
          }}
          fullWidth
          required
          inputProps={{ min: 0 }}
        />
        <Autocomplete
          multiple
          options={courses}
          getOptionLabel={(option: any) =>
            option?.title ?? option?.name ?? `Course ${option?.id ?? ""}`
          }
          isOptionEqualToValue={(option: any, value: any) =>
            option?.id === value?.id
          }
          value={courseIds
            .map((id) => courses.find((c: any) => Number(c?.id) === Number(id)))
            .filter(Boolean)}
          onChange={(_, newValue: any[]) => {
            onCourseIdsChange(newValue.map((c) => c.id));
          }}
          loading={loadingCourses}
          disabled={loadingCourses}
          renderOption={(props, option: any) => (
            <li {...props} key={option?.id != null ? option.id : props.id}>
              {option?.title ?? option?.name ?? `Course ${option?.id}`}
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Courses (optional)"
              placeholder="Select courses or remove selected"
              helperText="Select multiple courses. Click × on a chip to remove."
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                label={option?.title ?? option?.name ?? `Course ${option?.id}`}
                {...getTagProps({ index })}
                key={option?.id ?? index}
                size="small"
                onDelete={getTagProps({ index }).onDelete}
              />
            ))
          }
        />
        <Autocomplete
          multiple
          freeSolo
          options={[]}
          value={colleges}
          onChange={(_, newValue) => {
            onCollegesChange(newValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Colleges (optional)"
              placeholder="Type and press Enter to add college"
              helperText="Add college names. Press Enter after each name."
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                label={option}
                {...getTagProps({ index })}
                key={index}
                size="small"
              />
            ))
          }
        />
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
            helperText="IST timezone"
            InputLabelProps={{ shrink: true }}
            slotProps={{ htmlInput: { step: 60 } }}
          />
          <TextField
            label="End date & time (optional)"
            type="datetime-local"
            value={endTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
            fullWidth
            helperText="IST timezone"
            InputLabelProps={{ shrink: true }}
            slotProps={{ htmlInput: { step: 60 } }}
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
          <FormControlLabel
            control={
              <Switch checked={proctoringEnabled ?? true} onChange={(e) => onProctoringEnabledChange(e.target.checked)} />
            }
            label="Proctoring Enabled"
          />
          <FormControlLabel
            control={
              <Switch
                checked={sendCommunication}
                onChange={(e) => onSendCommunicationChange(e.target.checked)}
              />
            }
            label="Send notification email to students"
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
            Should the notification email be sent when this assessment is created?
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={showResult}
                onChange={(e) => onShowResultChange(e.target.checked)}
              />
            }
            label="Show results to students"
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
            When enabled, students can view their score and detailed results after submission. When disabled, they will see an evaluation-in-progress message instead.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

