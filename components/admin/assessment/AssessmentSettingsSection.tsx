"use client";

import {
  Box,
  Typography,
  TextField,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  Paper,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface AssessmentSettingsSectionProps {
  durationMinutes: number;
  startTime: string;
  endTime: string;
  isPaid: boolean;
  price: string;
  currency: string;
  isActive: boolean;
  proctoringEnabled: boolean;
  liveStreaming: boolean;
  showLiveStreamingToggle?: boolean;
  sendCommunication: boolean;
  showResult: boolean;
  /** Assessment-wide: learners may move between section blocks (quiz, coding, etc.). */
  allowMovementAcrossSections: boolean;
  certificateAvailable: boolean;
  passBandLowerPercent: string;
  passBandUpperPercent: string;
  passBandLowerError?: string;
  passBandUpperError?: string;
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
  onAllowMovementAcrossSectionsChange: (value: boolean) => void;
  onCertificateAvailableChange: (value: boolean) => void;
  onPassBandLowerPercentChange: (value: string) => void;
  onPassBandUpperPercentChange: (value: string) => void;
  onCourseIdsChange: (value: number[]) => void;
  onCollegesChange: (value: string[]) => void;
  readOnly?: boolean;
}

const switchSx = {
  "& .MuiSwitch-switchBase.Mui-checked": {
    color: "#6366f1",
  },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: "#818cf8",
  },
};

const listSubheaderSx = {
  py: 1,
  px: 2,
  lineHeight: 1.5,
  fontSize: "0.7rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#64748b",
  bgcolor: "rgba(248, 250, 252, 0.95)",
  borderTop: "1px solid",
  borderColor: "rgba(15, 23, 42, 0.06)",
  "&:first-of-type": {
    borderTop: "none",
  },
};

const helperFormProps = {
  sx: {
    fontSize: "0.8125rem",
    lineHeight: 1.45,
    color: "#475569",
    mt: 0.5,
  },
};

const groupTitleSx = {
  fontSize: "0.7rem",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  color: "#64748b",
  mb: 0.25,
};

function FieldGroup({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Typography component="h4" variant="subtitle2" sx={groupTitleSx}>
        {title}
      </Typography>
      {hint ? (
        <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 1.25 }}>
          {hint}
        </Typography>
      ) : (
        <Box sx={{ mb: 1 }} />
      )}
      {children}
    </Box>
  );
}

function PolicySwitchRow({
  icon,
  title,
  subtitle,
  checked,
  onChange,
  disabled,
  "aria-label": ariaLabel,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const label = ariaLabel ?? title;
  return (
    <ListItem
      alignItems="flex-start"
      secondaryAction={
        <Switch
          edge="end"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          sx={{ ...switchSx, mt: 0.25 }}
          inputProps={{ "aria-label": label }}
        />
      }
      sx={{
        py: 1.35,
        px: 2,
        borderBottom: "1px solid",
        borderColor: "rgba(15, 23, 42, 0.06)",
        transition: "background-color 0.15s ease",
        "&:hover": {
          bgcolor: disabled ? undefined : "rgba(99, 102, 241, 0.04)",
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 48, mt: 0.15 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(99, 102, 241, 0.1)",
            border: "1px solid rgba(99, 102, 241, 0.18)",
          }}
        >
          <IconWrapper icon={icon} size={22} color="#4f46e5" />
        </Box>
      </ListItemIcon>
      <ListItemText
        primary={title}
        secondary={subtitle}
        primaryTypographyProps={{
          variant: "body2",
          sx: { fontWeight: 600, color: "#0f172a", pr: 1 },
        }}
        secondaryTypographyProps={{
          variant: "caption",
          sx: {
            display: "block",
            mt: 0.35,
            color: "text.secondary",
            lineHeight: 1.45,
            maxWidth: "min(100%, 36rem)",
          },
        }}
      />
    </ListItem>
  );
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
  liveStreaming,
  showLiveStreamingToggle = false,
  sendCommunication,
  showResult,
  allowMovementAcrossSections,
  certificateAvailable,
  passBandLowerPercent,
  passBandUpperPercent,
  passBandLowerError,
  passBandUpperError,
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
  onAllowMovementAcrossSectionsChange,
  onCertificateAvailableChange,
  onPassBandLowerPercentChange,
  onPassBandUpperPercentChange,
  onCourseIdsChange,
  onCollegesChange,
  readOnly = false,
}: AssessmentSettingsSectionProps) {
  return (
    <Paper
      elevation={0}
      component="section"
      aria-labelledby="assessment-settings-heading"
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: "rgba(99, 102, 241, 0.2)",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
        background:
          "linear-gradient(180deg, rgba(99, 102, 241, 0.05) 0%, #ffffff 56px)",
        opacity: readOnly ? 0.96 : 1,
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: "flex",
          alignItems: "flex-start",
          gap: 1.5,
          borderBottom: "1px solid",
          borderColor: "rgba(99, 102, 241, 0.12)",
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(99, 102, 241, 0.12)",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            flexShrink: 0,
          }}
        >
          <IconWrapper icon="mdi:tune-vertical" size={24} color="#4f46e5" />
        </Box>
        <Box>
          <Typography
            id="assessment-settings-heading"
            variant="subtitle1"
            sx={{ fontWeight: 700, color: "#1e1b4b" }}
          >
            Assessment settings
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5, lineHeight: 1.5 }}>
            Configure duration, scheduling, pricing, and availability for this assessment.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 2.5, display: "flex", flexDirection: "column", gap: 3 }}>
        <FieldGroup
          title="Overall duration"
          hint="Total minutes for the full attempt. You can still set per-section time limits separately."
        >
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
            helperText="Applies to the entire attempt. Section blocks can define their own time limits."
            FormHelperTextProps={helperFormProps}
          />
        </FieldGroup>

        <FieldGroup
          title="Courses"
          hint="Link this assessment to one or more courses so it appears in the right catalogs."
        >
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
                placeholder="Search and select courses"
                helperText="Select multiple courses. Click × on a chip to remove."
                FormHelperTextProps={helperFormProps}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option?.title ?? option?.name ?? `Course ${option?.id}`}
                  {...getTagProps({ index })}
                  key={option?.id ?? index}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: "rgba(99, 102, 241, 0.35)", bgcolor: "rgba(99, 102, 241, 0.04)" }}
                  onDelete={getTagProps({ index }).onDelete}
                />
              ))
            }
          />
        </FieldGroup>

        <FieldGroup
          title="Colleges"
          hint="Restrict visibility by institution using free-form college names."
        >
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
                placeholder="Type a name, then press Enter"
                helperText="Add college names. Press Enter after each name."
                FormHelperTextProps={helperFormProps}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option}
                  {...getTagProps({ index })}
                  key={index}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: "rgba(99, 102, 241, 0.35)", bgcolor: "rgba(99, 102, 241, 0.04)" }}
                />
              ))
            }
          />
        </FieldGroup>

        <FieldGroup
          title="Availability window (optional)"
          hint="When set, learners only see start/end boundaries you define here. All times are interpreted in IST."
        >
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
              FormHelperTextProps={helperFormProps}
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
              FormHelperTextProps={helperFormProps}
              InputLabelProps={{ shrink: true }}
              slotProps={{ htmlInput: { step: 60 } }}
              disabled={readOnly}
            />
          </Box>
        </FieldGroup>
      </Box>

      <Box
        sx={{
          borderTop: "1px solid",
          borderColor: "rgba(99, 102, 241, 0.14)",
          bgcolor: "rgba(248, 250, 252, 0.65)",
        }}
      >
        <Box
          sx={{
            px: 2.25,
            py: 1.75,
            borderBottom: "1px solid",
            borderColor: "rgba(15, 23, 42, 0.06)",
            bgcolor: "rgba(255, 255, 255, 0.9)",
          }}
        >
          <Typography
            id="assessment-policies-heading"
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "#312e81", letterSpacing: 0.02 }}
          >
            Policies & learner experience
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, display: "block", lineHeight: 1.45 }}
          >
            These options apply to every learner for this assessment. Use the switches on the
            right—each row is one policy.
          </Typography>
        </Box>

        <List dense disablePadding sx={{ py: 0, bgcolor: "rgba(255, 255, 255, 0.65)" }}>
            <ListSubheader component="div" disableSticky sx={listSubheaderSx}>
              Billing
            </ListSubheader>
            <PolicySwitchRow
              icon="mdi:cash-multiple"
              title="Paid assessment"
              subtitle="Charge learners before they can start. Opens price and currency below."
              checked={isPaid}
              onChange={onPaidChange}
              disabled={readOnly}
            />
            <Collapse in={isPaid} timeout="auto" unmountOnExit>
              <ListItem
                sx={{
                  display: "block",
                  px: 2,
                  py: 2,
                  bgcolor: "rgba(248, 250, 252, 0.98)",
                  borderBottom: "1px solid",
                  borderColor: "rgba(15, 23, 42, 0.06)",
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                    maxWidth: 520,
                    ml: { xs: 0, sm: 1 },
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
                    helperText="Amount charged for access"
                    FormHelperTextProps={helperFormProps}
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
              </ListItem>
            </Collapse>

            <ListSubheader component="div" disableSticky sx={listSubheaderSx}>
              Session & integrity
            </ListSubheader>
            <PolicySwitchRow
              icon="mdi:calendar-check"
              title="Active"
              subtitle="Inactive assessments stay out of the catalog."
              checked={isActive}
              onChange={onActiveChange}
              disabled={readOnly}
            />
            <PolicySwitchRow
              icon="mdi:cctv"
              title="Proctoring enabled"
              subtitle="Camera and integrity checks during the attempt."
              checked={proctoringEnabled ?? true}
              onChange={onProctoringEnabledChange}
              disabled={readOnly}
            />
            {showLiveStreamingToggle && (
              <PolicySwitchRow
                icon="mdi:video-wireless"
                title="Live streaming"
                subtitle="Allow live monitoring when your tenant supports it."
                checked={liveStreaming}
                onChange={onLiveStreamingChange}
                disabled={readOnly}
              />
            )}

            <ListSubheader component="div" disableSticky sx={listSubheaderSx}>
              Notifications & results
            </ListSubheader>
            <PolicySwitchRow
              icon="mdi:email-outline"
              title="Send notification email to students"
              subtitle="Email when this assessment is created."
              checked={sendCommunication}
              onChange={onSendCommunicationChange}
              disabled={readOnly}
            />
            <PolicySwitchRow
              icon="mdi:chart-box-outline"
              title="Show results to students"
              subtitle="When off, learners see an evaluation-in-progress message instead of scores."
              checked={showResult}
              onChange={onShowResultChange}
              disabled={readOnly}
            />
            <PolicySwitchRow
              icon="mdi:swap-horizontal"
              title="Allow movement across sections"
              subtitle="Learners can revisit other blocks (e.g. quiz ↔ coding) when on."
              checked={allowMovementAcrossSections}
              onChange={onAllowMovementAcrossSectionsChange}
              disabled={readOnly}
            />

            <ListSubheader component="div" disableSticky sx={listSubheaderSx}>
              Certificates
            </ListSubheader>
            <PolicySwitchRow
              icon="mdi:certificate"
              title="Certificate available"
              subtitle="When on, set pass-band thresholds below for tiered certificates."
              checked={certificateAvailable}
              onChange={onCertificateAvailableChange}
              disabled={readOnly}
            />
            <Collapse in={certificateAvailable} timeout="auto" unmountOnExit>
              <ListItem
                sx={{
                  display: "block",
                  alignItems: "stretch",
                  py: 2,
                  px: 2,
                  bgcolor: "rgba(99, 102, 241, 0.06)",
                  borderTop: "1px solid",
                  borderColor: "rgba(99, 102, 241, 0.12)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  <IconWrapper icon="mdi:percent" size={20} color="#4338ca" />
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, color: "#312e81" }}
                  >
                    Pass band thresholds
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 2, lineHeight: 1.45 }}
                >
                  Overall score percentages (0–100). Lower must be less than or equal
                  to upper.
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  <TextField
                    label="Lower threshold (%)"
                    value={passBandLowerPercent}
                    onChange={(e) => onPassBandLowerPercentChange(e.target.value)}
                    fullWidth
                    disabled={readOnly}
                    required
                    placeholder="e.g. 50"
                    error={Boolean(passBandLowerError)}
                    helperText={passBandLowerError || " "}
                    FormHelperTextProps={
                      passBandLowerError
                        ? { sx: { fontSize: "0.8125rem", lineHeight: 1.45, mt: 0.5 } }
                        : helperFormProps
                    }
                    InputLabelProps={{ shrink: true }}
                    sx={{ bgcolor: "background.paper" }}
                  />
                  <TextField
                    label="Upper threshold (%)"
                    value={passBandUpperPercent}
                    onChange={(e) => onPassBandUpperPercentChange(e.target.value)}
                    fullWidth
                    disabled={readOnly}
                    required
                    placeholder="e.g. 80"
                    error={Boolean(passBandUpperError)}
                    helperText={passBandUpperError || " "}
                    FormHelperTextProps={
                      passBandUpperError
                        ? { sx: { fontSize: "0.8125rem", lineHeight: 1.45, mt: 0.5 } }
                        : helperFormProps
                    }
                    InputLabelProps={{ shrink: true }}
                    sx={{ bgcolor: "background.paper" }}
                  />
                </Box>
              </ListItem>
            </Collapse>
          </List>
      </Box>
    </Paper>
  );
}
