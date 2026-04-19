"use client";

import { useTranslation } from "react-i18next";
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
  Paper,
  Stack,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { IconWrapper } from "@/components/common/IconWrapper";

interface AssessmentSettingsSectionProps {
  durationMinutes: number;
  startTime: string;
  endTime: string;
  /** Omitted or undefined is normalized via default params so MUI Switch stays controlled. */
  isPaid?: boolean;
  price: string;
  currency: string;
  isActive?: boolean;
  proctoringEnabled?: boolean;
  liveStreaming?: boolean;
  showLiveStreamingToggle?: boolean;
  sendCommunication?: boolean;
  showResult?: boolean;
  allowDesktop?: boolean;
  allowMobile?: boolean;
  allowTablet?: boolean;
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
  onLiveStreamingChange: (value: boolean) => void;
  onSendCommunicationChange: (value: boolean) => void;
  onShowResultChange: (value: boolean) => void;
  onAllowDesktopChange: (value: boolean) => void;
  onAllowMobileChange: (value: boolean) => void;
  onAllowTabletChange: (value: boolean) => void;
  onCourseIdsChange: (value: number[]) => void;
  onCollegesChange: (value: string[]) => void;
  readOnly?: boolean;
}

export function AssessmentSettingsSection({
  durationMinutes,
  startTime,
  endTime,
  isPaid = false,
  price,
  currency,
  isActive = true,
  proctoringEnabled = true,
  liveStreaming = false,
  showLiveStreamingToggle = false,
  sendCommunication = false,
  showResult = true,
  allowDesktop = true,
  allowMobile = true,
  allowTablet = true,
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
  onLiveStreamingChange,
  onSendCommunicationChange,
  onShowResultChange,
  onAllowDesktopChange,
  onAllowMobileChange,
  onAllowTabletChange,
  onCourseIdsChange,
  onCollegesChange,
  readOnly = false,
}: AssessmentSettingsSectionProps) {
  const { t } = useTranslation("common");
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
          disabled={readOnly}
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
          disabled={readOnly || loadingCourses}
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
          disabled={readOnly}
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
            disabled={readOnly}
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
            disabled={readOnly}
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
              <Switch
                checked={isPaid}
                onChange={(e) => onPaidChange(e.target.checked)}
                disabled={readOnly}
              />
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
                disabled={readOnly}
              />
              <FormControl fullWidth required>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={currency}
                  onChange={(e) => onCurrencyChange(e.target.value)}
                  label="Currency"
                  disabled={readOnly}
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
              <Switch
                checked={isActive}
                onChange={(e) => onActiveChange(e.target.checked)}
                disabled={readOnly}
              />
            }
            label="Active"
          />
          <FormControlLabel
            control={
              <Switch
                checked={proctoringEnabled}
                onChange={(e) => onProctoringEnabledChange(e.target.checked)}
                disabled={readOnly}
              />
            }
            label="Proctoring Enabled"
          />
          {showLiveStreamingToggle && (
            <FormControlLabel
              control={
                <Switch
                  checked={liveStreaming}
                  onChange={(e) => onLiveStreamingChange(e.target.checked)}
                  disabled={readOnly}
                />
              }
              label="Live Streaming"
            />
          )}
          <FormControlLabel
            control={
              <Switch
                checked={sendCommunication}
                onChange={(e) => onSendCommunicationChange(e.target.checked)}
                disabled={readOnly}
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
                disabled={readOnly}
              />
            }
            label="Show results to students"
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
            When enabled, students can view their score and detailed results after submission. When disabled, they will see an evaluation-in-progress message instead.
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mt: 2,
              borderRadius: 2,
              borderColor: "#e5e7eb",
              backgroundColor: "#fafafa",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  bgcolor: alpha("#6366f1", 0.12),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconWrapper icon="mdi:devices" size={22} color="#6366f1" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, color: "#111827" }}
                >
                  {t("assessmentDevice.sectionTitle")}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", lineHeight: 1.5 }}
                >
                  {t("assessmentDevice.sectionIntro")}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 0.75, fontWeight: 600 }}
                >
                  {t("assessmentDevice.sectionHint")}
                </Typography>
              </Box>
            </Stack>
            <Stack spacing={0}>
              <Box
                sx={{
                  py: 1.25,
                  borderBottom: "1px solid",
                  borderColor: "#ececec",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <IconWrapper icon="mdi:monitor" size={22} color="#6366f1" />
                  <FormControlLabel
                    sx={{ flex: 1, m: 0 }}
                    control={
                      <Switch
                        checked={allowDesktop}
                        onChange={(e) => onAllowDesktopChange(e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label={
                      <Typography variant="body2" fontWeight={600}>
                        {t("assessmentDevice.allowDesktop")}
                      </Typography>
                    }
                  />
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 0.5, ml: 5.5, lineHeight: 1.45 }}
                >
                  {t("assessmentDevice.allowDesktopHint")}
                </Typography>
              </Box>
              <Box
                sx={{
                  py: 1.25,
                  borderBottom: "1px solid",
                  borderColor: "#ececec",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <IconWrapper icon="mdi:cellphone" size={22} color="#6366f1" />
                  <FormControlLabel
                    sx={{ flex: 1, m: 0 }}
                    control={
                      <Switch
                        checked={allowMobile}
                        onChange={(e) => onAllowMobileChange(e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label={
                      <Typography variant="body2" fontWeight={600}>
                        {t("assessmentDevice.allowMobile")}
                      </Typography>
                    }
                  />
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 0.5, ml: 5.5, lineHeight: 1.45 }}
                >
                  {t("assessmentDevice.allowMobileHint")}
                </Typography>
              </Box>
              <Box sx={{ py: 1.25 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <IconWrapper icon="mdi:tablet" size={22} color="#6366f1" />
                  <FormControlLabel
                    sx={{ flex: 1, m: 0 }}
                    control={
                      <Switch
                        checked={allowTablet}
                        onChange={(e) => onAllowTabletChange(e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label={
                      <Typography variant="body2" fontWeight={600}>
                        {t("assessmentDevice.allowTablet")}
                      </Typography>
                    }
                  />
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 0.5, ml: 5.5, lineHeight: 1.45 }}
                >
                  {t("assessmentDevice.allowTabletHint")}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

