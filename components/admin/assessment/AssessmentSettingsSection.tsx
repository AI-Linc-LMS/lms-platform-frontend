"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

/** Lead times (minutes before start) offered as reminder checkboxes. Mirrors the
 *  backend's ALLOWED_REMINDER_OFFSETS in assessment/reminders.py. */
export const REMINDER_OFFSET_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 120, label: "2 hours before" },
  { minutes: 360, label: "6 hours before" },
  { minutes: 720, label: "12 hours before" },
  { minutes: 1440, label: "1 day before" },
];
import {
  EmailNotificationEditor,
  type EmailNotificationEditorHandle,
} from "@/components/admin/assessment/EmailNotificationEditor";

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

  /** Assessment-wide: learners may move between section blocks (quiz, coding, etc.). */
  allowMovementAcrossSections: boolean;
  tabSwitchLimitEnabled: boolean;
  tabSwitchLimitCount: number;
  certificateAvailable: boolean;
  passBandLowerPercent: string;
  passBandUpperPercent: string;
  passBandLowerError?: string;
  passBandUpperError?: string;
  sendCommunication?: boolean;
  /**
   * The actual "will an email be sent" flag - computed in the parent from
   * `sendCommunication` AND whether the editor currently has data. Drives
   * the visibility of the editor block.
   */
  emailNotificationEnabled?: boolean;
  /** Reports editor data-presence transitions back up to the parent. */
  onEmailEnabledChange?: (enabled: boolean) => void;
  /** Auto-send the notification email at chosen lead times before start_time. */
  emailRemindersEnabled?: boolean;
  /** Lead times in minutes (subset of 120/360/720/1440) at which to send reminders. */
  emailReminderOffsets?: number[];
  onEmailRemindersEnabledChange?: (enabled: boolean) => void;
  onEmailReminderOffsetsChange?: (offsets: number[]) => void;
  /**
   * Ref handle so the parent can read the email editor state at submit time.
   * The editor owns subject/body/attachment locally to keep typing snappy.
   */
  emailEditorRef?: React.Ref<EmailNotificationEditorHandle>;
  /** Seed for the email subject (live-syncs into the field until edited). */
  defaultEmailSubject?: string;
  /** Seed for the email body (used once when the editor mounts). */
  defaultEmailBody?: string;
  /** URL of a previously-saved email attachment (shown as a chip on edit). */
  existingEmailAttachmentUrl?: string | null;
  /** Filename for the previously-saved attachment. Derived from URL if omitted. */
  existingEmailAttachmentName?: string | null;
  /**
   * Assessment schedule shown as a dedicated panel inside the email preview
   * so start/end/duration always appear in the email regardless of body edits.
   */
  emailSchedule?: {
    startTime?: string | null;
    endTime?: string | null;
    durationMinutes?: number | null;
  } | null;
  showResult?: boolean;
  evaluationMode?: "auto" | "manual";
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
  onEvaluationModeChange: (value: "auto" | "manual") => void;
  onAllowMovementAcrossSectionsChange: (value: boolean) => void;
  onTabSwitchLimitEnabledChange: (value: boolean) => void;
  onTabSwitchLimitCountChange: (value: number) => void;
  onCertificateAvailableChange: (value: boolean) => void;
  onPassBandLowerPercentChange: (value: string) => void;
  onPassBandUpperPercentChange: (value: string) => void;
  onAllowDesktopChange: (value: boolean) => void;
  onAllowMobileChange: (value: boolean) => void;
  onAllowTabletChange: (value: boolean) => void;
  onCourseIdsChange: (value: number[]) => void;
  onCollegesChange: (value: string[]) => void;
  readOnly?: boolean;
}

const softBorder = "color-mix(in srgb, var(--border-default) 55%, transparent)";

const listSubheaderSx = {
  py: 0.9,
  px: { xs: 1.5, sm: 1.75 },
  lineHeight: 1.4,
  fontSize: "0.72rem",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--font-tertiary)",
  bgcolor: "transparent",
  borderTop: `1px solid ${softBorder}`,
  "&:first-of-type": {
    borderTop: "none",
  },
};

const helperFormProps = {
  sx: {
    fontSize: "0.8125rem",
    lineHeight: 1.45,
    color: "var(--font-secondary)",
    mt: 0.5,
  },
};

const groupTitleSx = {
  fontSize: "0.72rem",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "var(--font-tertiary)",
  mb: 0.25,
};

const hourOptions = Array.from({ length: 24 }, (_, index) => index);
const minuteOptions = Array.from({ length: 60 }, (_, index) => index);

function splitDateTime(value: string) {
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
  return {
    date: match?.[1] ?? "",
    hours: match?.[2] ?? "",
    minutes: match?.[3] ?? "",
  };
}

function joinDateTime(date: string, hours: string, minutes: string) {
  if (!date) {
    return "";
  }
  const safeHours = hours ? hours.padStart(2, "0") : "00";
  const safeMinutes = minutes ? minutes.padStart(2, "0") : "00";
  return `${date}T${safeHours}:${safeMinutes}`;
}

function DateTimePartsField({
  label,
  value,
  onChange,
  helperText,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  helperText?: string;
  disabled?: boolean;
}) {
  const parts = splitDateTime(value);

  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--font-primary)", mb: 0.75 }}>
        {label}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1.2fr 1fr" },
          gap: 1.5,
        }}
      >
        <TextField
          label="Date"
          type="date"
          value={parts.date}
          onChange={(e) => onChange(joinDateTime(e.target.value, parts.hours, parts.minutes))}
          fullWidth
          helperText={helperText}
          FormHelperTextProps={helperFormProps}
          InputLabelProps={{ shrink: true }}
          disabled={disabled}
        />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr" },
            gap: 1.5,
          }}
        >
          <TextField
            select
            label="Hours"
            value={parts.hours}
            onChange={(e) => onChange(joinDateTime(parts.date, e.target.value, parts.minutes))}
            fullWidth
            InputLabelProps={{ shrink: true }}
            disabled={disabled}
          >
            <MenuItem value="">
              <em>--</em>
            </MenuItem>
            {hourOptions.map((hour) => (
              <MenuItem key={hour} value={hour.toString().padStart(2, "0")}>
                {hour.toString().padStart(2, "0")}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Minutes"
            value={parts.minutes}
            onChange={(e) => onChange(joinDateTime(parts.date, parts.hours, e.target.value))}
            fullWidth
            InputLabelProps={{ shrink: true }}
            disabled={disabled}
          >
            <MenuItem value="">
              <em>--</em>
            </MenuItem>
            {minuteOptions.map((minute) => (
              <MenuItem key={minute} value={minute.toString().padStart(2, "0")}>
                {minute.toString().padStart(2, "0")}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>
    </Box>
  );
}

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
        <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mb: 1.25 }}>
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
  accent = "var(--accent-indigo)",
  "aria-label": ariaLabel,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Per-toggle semantic color for the icon tile + the ON switch (mockup language). */
  accent?: string;
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
          sx={{
            width: 46,
            height: 26,
            p: 0,
            mt: 0.5,
            "& .MuiSwitch-switchBase": {
              p: "3px",
              "&.Mui-checked": {
                transform: "translateX(20px)",
                color: "#fff",
                "& + .MuiSwitch-track": { backgroundColor: accent, opacity: 1 },
              },
            },
            "& .MuiSwitch-thumb": { width: 20, height: 20, boxShadow: "0 1px 2px rgba(0,0,0,0.25)" },
            "& .MuiSwitch-track": {
              borderRadius: 13,
              backgroundColor: "color-mix(in srgb, var(--font-tertiary) 55%, transparent)",
              opacity: 1,
            },
          }}
          inputProps={{ "aria-label": label }}
        />
      }
      sx={{
        py: 1.15,
        px: { xs: 1.5, sm: 1.75 },
        borderBottom: `1px solid ${softBorder}`,
        transition: "background-color 0.15s ease",
        "&:last-of-type": { borderBottom: "none" },
        "&:hover": {
          bgcolor: disabled ? undefined : `color-mix(in srgb, ${accent} 6%, transparent)`,
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 46, mt: 0.15 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: `color-mix(in srgb, ${accent} 12%, var(--card-bg) 88%)`,
          }}
        >
          <IconWrapper icon={icon} size={19} color={accent} />
        </Box>
      </ListItemIcon>
      <ListItemText
        primary={title}
        secondary={subtitle}
        primaryTypographyProps={{
          variant: "body2",
          sx: { fontWeight: 700, color: "var(--font-primary)", pr: 1, fontSize: "0.9rem" },
        }}
        secondaryTypographyProps={{
          variant: "caption",
          sx: {
            display: "block",
            mt: 0.25,
            color: "text.secondary",
            lineHeight: 1.4,
            maxWidth: "min(100%, 36rem)",
          },
        }}
      />
    </ListItem>
  );
}

/**
 * Accordion card matching the "Live outline" design language: 16px-radius
 * white card, icon tile + bold Jakarta title, live one-line summary of the
 * group's current values, chevron toggle. Children stay MOUNTED when closed
 * (Collapse hides via style, no unmountOnExit) so nothing inside - notably
 * the email editor - is ever torn down by expanding/collapsing.
 */
function SettingsGroupCard({
  id,
  icon,
  accent,
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  id: string;
  icon: string;
  accent: string;
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "16px",
        border: `1px solid ${softBorder}`,
        boxShadow: "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.08)",
        bgcolor: "var(--card-bg)",
        overflow: "hidden",
      }}
    >
      <Box
        component="button"
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${id}-body`}
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          px: { xs: 1.5, sm: 1.75 },
          py: 1.3,
          border: 0,
          borderBottom: open ? `1px solid ${softBorder}` : "1px solid transparent",
          background: "none",
          textAlign: "left",
          cursor: "pointer",
          font: "inherit",
          color: "inherit",
          transition: "background-color 0.15s ease, border-color 0.15s ease",
          "&:hover": { bgcolor: `color-mix(in srgb, ${accent} 5%, transparent)` },
          "&:focus-visible": {
            outline: "2px solid var(--ai-violet)",
            outlineOffset: "-2px",
          },
        }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            bgcolor: `color-mix(in srgb, ${accent} 12%, var(--card-bg) 88%)`,
          }}
        >
          <IconWrapper icon={icon} size={20} color={accent} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontFamily: "var(--font-jakarta)",
              fontWeight: 800,
              fontSize: "0.95rem",
              lineHeight: 1.3,
              color: "var(--font-primary)",
            }}
          >
            {title}
          </Typography>
          <Typography
            noWrap
            sx={{
              display: "block",
              fontSize: "0.78rem",
              lineHeight: 1.4,
              color: "var(--font-secondary)",
            }}
          >
            {summary}
          </Typography>
        </Box>
        <Box
          sx={{
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          <IconWrapper icon="mdi:chevron-down" size={20} color="var(--font-tertiary)" />
        </Box>
      </Box>
      {/* No unmountOnExit: closed groups hide via style only, children stay mounted. */}
      <Collapse in={open} timeout="auto">
        <Box id={`${id}-body`}>{children}</Box>
      </Collapse>
    </Paper>
  );
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
  allowMovementAcrossSections,
  tabSwitchLimitEnabled,
  tabSwitchLimitCount,
  certificateAvailable,
  passBandLowerPercent,
  passBandUpperPercent,
  passBandLowerError,
  passBandUpperError,
  sendCommunication = false,
  emailNotificationEnabled = false,
  onEmailEnabledChange,
  emailRemindersEnabled = false,
  emailReminderOffsets = [],
  onEmailRemindersEnabledChange,
  onEmailReminderOffsetsChange,
  emailEditorRef,
  defaultEmailSubject = "",
  defaultEmailBody = "",
  existingEmailAttachmentUrl,
  existingEmailAttachmentName,
  emailSchedule,
  showResult = true,
  evaluationMode = "auto",
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
  onEvaluationModeChange,
  onAllowMovementAcrossSectionsChange,
  onTabSwitchLimitEnabledChange,
  onTabSwitchLimitCountChange,
  onCertificateAvailableChange,
  onPassBandLowerPercentChange,
  onPassBandUpperPercentChange,
  onAllowDesktopChange,
  onAllowMobileChange,
  onAllowTabletChange,
  onCourseIdsChange,
  onCollegesChange,
  readOnly = false,
}: AssessmentSettingsSectionProps) {
  const { t } = useTranslation("common");
  // Mount the email editor lazily once and keep it mounted so toggling
  // on/off becomes a CSS display swap (no Tiptap re-init, no Collapse height
  // animation). Sticky derived state is set during render - the recommended
  // React 19 pattern for "once true, always true" flags.
  const [emailEditorMounted, setEmailEditorMounted] = useState(
    Boolean(sendCommunication)
  );
  if (sendCommunication && !emailEditorMounted) {
    setEmailEditorMounted(true);
  }
  // Pre-warm the editor in the background after first paint so the very
  // first toggle-on is instant too. setState is scheduled inside an idle
  // callback (asynchronous), so this doesn't violate the
  // set-state-in-effect rule.
  useEffect(() => {
    if (emailEditorMounted) return;
    if (typeof window === "undefined") return;
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    if (typeof win.requestIdleCallback === "function") {
      const handle = win.requestIdleCallback(
        () => setEmailEditorMounted(true),
        { timeout: 2000 }
      );
      return () => win.cancelIdleCallback?.(handle);
    }
    const handle = window.setTimeout(() => setEmailEditorMounted(true), 800);
    return () => window.clearTimeout(handle);
  }, [emailEditorMounted]);

  // ---- Accordion open/closed state (presentation only). "Timing & audience"
  // starts open; everything else starts collapsed since the defaults are
  // sensible. Notifications auto-opens when the email toggle turns on.
  const [timingOpen, setTimingOpen] = useState(true);
  const [billingOpen, setBillingOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(
    Boolean(sendCommunication)
  );
  // Auto-open Notifications on the false→true transition of sendCommunication
  // (render-time prev-props pattern; the admin can still collapse it after).
  const [prevSendCommunication, setPrevSendCommunication] = useState(
    Boolean(sendCommunication)
  );
  if (Boolean(sendCommunication) !== prevSendCommunication) {
    setPrevSendCommunication(Boolean(sendCommunication));
    if (sendCommunication && !notificationsOpen) {
      setNotificationsOpen(true);
    }
  }

  // ---- Live header summaries, computed from props only.
  const courseCount = courseIds.length;
  const collegeCount = colleges.length;
  const timingSummary = [
    durationMinutes > 0 ? `${durationMinutes} min` : "duration not set",
    courseCount > 0 ? `${courseCount} course${courseCount === 1 ? "" : "s"}` : "no courses",
    collegeCount > 0 ? `${collegeCount} college${collegeCount === 1 ? "" : "s"}` : null,
    startTime || endTime ? "window set" : "window not set",
  ]
    .filter(Boolean)
    .join(" · ");

  const enabledDevices = [
    allowDesktop ? "desktop" : null,
    allowMobile ? "mobile" : null,
    allowTablet ? "tablet" : null,
  ].filter(Boolean);
  const deviceSummary =
    enabledDevices.length === 3
      ? "all devices"
      : enabledDevices.length === 0
        ? "no devices allowed"
        : enabledDevices.join(" + ");
  const billingSummary = `${
    isPaid ? (price ? `Paid · ${price} ${currency}` : `Paid · ${currency}`) : "Free"
  } · ${deviceSummary}`;

  const sessionSummary = [
    isActive ? "Active" : "Inactive",
    proctoringEnabled ? "proctored" : "unproctored",
    showLiveStreamingToggle && liveStreaming ? "live stream on" : null,
    allowMovementAcrossSections ? "free section movement" : "sections locked",
    tabSwitchLimitEnabled
      ? `${tabSwitchLimitCount > 0 ? tabSwitchLimitCount : "?"} tab-switch limit`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const resultsSummary = [
    evaluationMode === "auto" ? "Auto-graded" : "Manual evaluation",
    showResult ? "results shown" : "results hidden",
    certificateAvailable
      ? passBandLowerPercent && passBandUpperPercent
        ? `certificate ${passBandLowerPercent}–${passBandUpperPercent}%`
        : "certificate on"
      : "no certificate",
  ].join(" · ");

  const reminderCount = emailReminderOffsets.length;
  const notificationsSummary = sendCommunication
    ? [
        emailNotificationEnabled ? "Email on publish" : "Email on · content pending",
        emailRemindersEnabled
          ? reminderCount > 0
            ? `${reminderCount} reminder${reminderCount === 1 ? "" : "s"}`
            : "reminders need times"
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "No email will be sent";

  return (
    <Box
      component="section"
      aria-labelledby="assessment-settings-heading"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        opacity: readOnly ? 0.96 : 1,
      }}
    >
      <Typography
        id="assessment-settings-heading"
        sx={{
          fontSize: "0.72rem",
          fontWeight: 800,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--font-tertiary)",
        }}
      >
        Assessment settings
      </Typography>

      {/* ---- Timing & audience -------------------------------------------- */}
      <SettingsGroupCard
        id="settings-timing"
        icon="mdi:calendar-clock"
        accent="var(--accent-indigo)"
        title="Timing & audience"
        summary={timingSummary}
        open={timingOpen}
        onToggle={() => setTimingOpen((v) => !v)}
      >
        <Box
          sx={{
            p: { xs: 1.5, sm: 2 },
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
              alignItems: "start",
            }}
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
                    sx={{
                      borderColor:
                        "color-mix(in srgb, var(--accent-indigo) 35%, var(--border-default) 65%)",
                      bgcolor:
                        "color-mix(in srgb, var(--accent-indigo) 8%, var(--surface) 92%)",
                    }}
                    onDelete={getTagProps({ index }).onDelete}
                  />
                ))
              }
            />
          </Box>

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
                  sx={{
                    borderColor:
                      "color-mix(in srgb, var(--accent-indigo) 35%, var(--border-default) 65%)",
                    bgcolor:
                      "color-mix(in srgb, var(--accent-indigo) 8%, var(--surface) 92%)",
                  }}
                />
              ))
            }
          />

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
              <DateTimePartsField
                label="Start date & time (optional)"
                value={startTime}
                onChange={onStartTimeChange}
                helperText="IST timezone"
                disabled={readOnly}
              />
              <DateTimePartsField
                label="End date & time (optional)"
                value={endTime}
                onChange={onEndTimeChange}
                helperText="IST timezone"
                disabled={readOnly}
              />
            </Box>
          </FieldGroup>
        </Box>
      </SettingsGroupCard>

      {/* ---- Billing & access --------------------------------------------- */}
      <SettingsGroupCard
        id="settings-billing"
        icon="mdi:cash-multiple"
        accent="var(--success-500)"
        title="Billing & access"
        summary={billingSummary}
        open={billingOpen}
        onToggle={() => setBillingOpen((v) => !v)}
      >
        <List dense disablePadding sx={{ py: 0 }}>
          <PolicySwitchRow
            icon="mdi:cash-multiple"
            title="Paid assessment"
            subtitle="Charge learners before they can start. Opens price and currency below."
            checked={isPaid}
            onChange={onPaidChange}
            disabled={readOnly}
            accent="var(--success-500)"
          />
          <Collapse in={isPaid} timeout="auto" unmountOnExit>
            <ListItem
              sx={{
                display: "block",
                px: 2,
                py: 2,
                bgcolor: "var(--surface)",
                borderBottom: "1px solid",
                borderColor: "var(--border-default)",
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
                    <MenuItem value="SAR">SAR (﷼)</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </ListItem>
          </Collapse>

          <ListSubheader component="div" disableSticky sx={listSubheaderSx}>
            {t("assessmentDevice.sectionTitle")}
          </ListSubheader>
          <ListItem
            sx={{
              display: "block",
              py: 1.1,
              px: { xs: 1.5, sm: 1.75 },
              bgcolor: "var(--surface)",
              borderBottom: `1px solid ${softBorder}`,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", lineHeight: 1.45 }}
            >
              {t("assessmentDevice.sectionIntro")}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                mt: 0.5,
                fontWeight: 600,
                lineHeight: 1.45,
              }}
            >
              {t("assessmentDevice.sectionHint")}
            </Typography>
          </ListItem>
          <PolicySwitchRow
            icon="mdi:monitor"
            title={t("assessmentDevice.allowDesktop")}
            subtitle={t("assessmentDevice.allowDesktopHint")}
            checked={allowDesktop}
            onChange={onAllowDesktopChange}
            disabled={readOnly}
          />
          <PolicySwitchRow
            icon="mdi:cellphone"
            title={t("assessmentDevice.allowMobile")}
            subtitle={t("assessmentDevice.allowMobileHint")}
            checked={allowMobile}
            onChange={onAllowMobileChange}
            disabled={readOnly}
          />
          <PolicySwitchRow
            icon="mdi:tablet"
            title={t("assessmentDevice.allowTablet")}
            subtitle={t("assessmentDevice.allowTabletHint")}
            checked={allowTablet}
            onChange={onAllowTabletChange}
            disabled={readOnly}
          />
        </List>
      </SettingsGroupCard>

      {/* ---- Session & integrity ------------------------------------------ */}
      <SettingsGroupCard
        id="settings-session"
        icon="mdi:shield-check-outline"
        accent="var(--tone-proctored)"
        title="Session & integrity"
        summary={sessionSummary}
        open={sessionOpen}
        onToggle={() => setSessionOpen((v) => !v)}
      >
        <List dense disablePadding sx={{ py: 0 }}>
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
            accent="var(--tone-proctored)"
          />
          {showLiveStreamingToggle && (
            <PolicySwitchRow
              icon="mdi:video-wireless"
              title="Live streaming"
              subtitle="Allow live monitoring for this assessment."
              checked={liveStreaming}
              onChange={onLiveStreamingChange}
              disabled={readOnly}
              accent="var(--tone-proctored)"
            />
          )}
          <PolicySwitchRow
            icon="mdi:swap-horizontal"
            title="Allow movement across sections"
            subtitle="Learners can revisit other blocks (e.g. quiz ↔ coding) when on."
            checked={allowMovementAcrossSections}
            onChange={onAllowMovementAcrossSectionsChange}
            disabled={readOnly}
            accent="var(--ai-violet)"
          />
          <PolicySwitchRow
            icon="mdi:tab"
            title="Auto-submit on tab switches"
            subtitle="When enabled, attempt is auto-submitted once tab switch count reaches the configured limit."
            checked={tabSwitchLimitEnabled}
            onChange={onTabSwitchLimitEnabledChange}
            disabled={readOnly}
            accent="var(--warning-500)"
          />
          <Collapse in={tabSwitchLimitEnabled} timeout="auto" unmountOnExit>
            <ListItem
              sx={{
                display: "block",
                px: 2,
                py: 2,
                bgcolor: "var(--surface)",
                borderBottom: "1px solid",
                borderColor: "var(--border-default)",
              }}
            >
              <TextField
                label="Allowed tab switches"
                type="number"
                value={tabSwitchLimitCount > 0 ? tabSwitchLimitCount : ""}
                onChange={(e) => onTabSwitchLimitCountChange(Number(e.target.value || 0))}
                fullWidth
                required
                inputProps={{ min: 1 }}
                helperText="Attempt auto-submits immediately when this count is reached."
                FormHelperTextProps={helperFormProps}
                disabled={readOnly}
              />
            </ListItem>
          </Collapse>
        </List>
      </SettingsGroupCard>

      {/* ---- Results & certificates --------------------------------------- */}
      <SettingsGroupCard
        id="settings-results"
        icon="mdi:certificate"
        accent="var(--ai-violet)"
        title="Results & certificates"
        summary={resultsSummary}
        open={resultsOpen}
        onToggle={() => setResultsOpen((v) => !v)}
      >
        <List dense disablePadding sx={{ py: 0 }}>
          <ListItem
            sx={{
              py: 1.15,
              px: { xs: 1.5, sm: 1.75 },
              borderBottom: `1px solid ${softBorder}`,
            }}
          >
            <ListItemIcon sx={{ minWidth: 46, mt: 0.15 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor:
                    "color-mix(in srgb, var(--accent-indigo) 12%, var(--card-bg) 88%)",
                }}
              >
                <IconWrapper icon="mdi:clipboard-check-outline" size={19} color="var(--accent-indigo)" />
              </Box>
            </ListItemIcon>
            <ListItemText
              primary="Evaluation mode"
              secondary="Manual mode requires admins to evaluate and publish results."
              primaryTypographyProps={{
                variant: "body2",
                sx: { fontWeight: 700, color: "var(--font-primary)", pr: 1, fontSize: "0.9rem" },
              }}
              secondaryTypographyProps={{
                variant: "caption",
                sx: { display: "block", mt: 0.25, color: "text.secondary", lineHeight: 1.4 },
              }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={evaluationMode}
                disabled={readOnly}
                onChange={(e) => onEvaluationModeChange(e.target.value as "auto" | "manual")}
              >
                <MenuItem value="auto">Auto (AI)</MenuItem>
                <MenuItem value="manual">Manual</MenuItem>
              </Select>
            </FormControl>
          </ListItem>
          <PolicySwitchRow
            icon="mdi:chart-box-outline"
            title="Show results to students"
            subtitle="When off, learners see an evaluation-in-progress message instead of scores."
            checked={showResult}
            onChange={onShowResultChange}
            disabled={readOnly || evaluationMode === "manual"}
          />
          <PolicySwitchRow
            icon="mdi:certificate"
            title="Certificate available"
            subtitle="When on, set pass-band thresholds below for tiered certificates."
            checked={certificateAvailable}
            onChange={onCertificateAvailableChange}
            disabled={readOnly}
            accent="var(--ai-violet)"
          />
          <Collapse in={certificateAvailable} timeout="auto" unmountOnExit>
            <ListItem
              sx={{
                display: "block",
                alignItems: "stretch",
                py: 2,
                px: 2,
                bgcolor:
                  "color-mix(in srgb, var(--accent-indigo) 8%, var(--surface) 92%)",
                borderTop: "1px solid",
                borderColor:
                  "color-mix(in srgb, var(--accent-indigo) 20%, var(--border-default) 80%)",
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
                <IconWrapper icon="mdi:percent" size={20} color="var(--accent-indigo-dark)" />
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, color: "var(--font-primary)" }}
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
      </SettingsGroupCard>

      {/* ---- Notifications ------------------------------------------------ */}
      <SettingsGroupCard
        id="settings-notifications"
        icon="mdi:email-outline"
        accent="var(--warning-500)"
        title="Notifications"
        summary={notificationsSummary}
        open={notificationsOpen}
        onToggle={() => setNotificationsOpen((v) => !v)}
      >
        <List dense disablePadding sx={{ py: 0 }}>
          <PolicySwitchRow
            icon="mdi:email-outline"
            title="Send notification email to students"
            subtitle="Email when this assessment is created."
            checked={sendCommunication}
            onChange={onSendCommunicationChange}
            disabled={readOnly}
            accent="var(--warning-500)"
          />
        </List>
        {emailEditorMounted ? (
          <Box
            sx={{
              display: emailNotificationEnabled ? "block" : "none",
              px: { xs: 1.5, sm: 2 },
              pt: 1,
              pb: 2,
            }}
          >
            <EmailNotificationEditor
              ref={emailEditorRef}
              initialSubject={defaultEmailSubject}
              initialBody={defaultEmailBody}
              initialAttachmentUrl={existingEmailAttachmentUrl}
              initialAttachmentName={existingEmailAttachmentName}
              schedule={emailSchedule}
              readOnly={readOnly}
              onEnabledChange={onEmailEnabledChange}
            />

            {/* Scheduled reminders - additive to the on-publish send. */}
            <Box
              sx={{
                mt: 1.5,
                p: 1.75,
                borderRadius: 2,
                border: "1px solid var(--border-default)",
                bgcolor:
                  "color-mix(in srgb, var(--accent-indigo) 4%, var(--surface) 96%)",
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={emailRemindersEnabled}
                    disabled={readOnly}
                    onChange={(e) =>
                      onEmailRemindersEnabledChange?.(e.target.checked)
                    }
                  />
                }
                label={
                  <Box>
                    <Typography
                      sx={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--font-primary)" }}
                    >
                      Send reminder emails before it starts
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Automatically re-sends this email at the times you pick before the start
                      time. The announcement on publish is still sent.
                    </Typography>
                  </Box>
                }
              />

              {emailRemindersEnabled ? (
                <Box
                  sx={{
                    mt: 1,
                    pl: 3.5,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 0.5,
                  }}
                >
                  {REMINDER_OFFSET_OPTIONS.map((opt) => {
                    const checked = emailReminderOffsets.includes(opt.minutes);
                    return (
                      <FormControlLabel
                        key={opt.minutes}
                        sx={{ minWidth: 150 }}
                        control={
                          <Checkbox
                            size="small"
                            checked={checked}
                            disabled={readOnly}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...emailReminderOffsets, opt.minutes]
                                : emailReminderOffsets.filter((m) => m !== opt.minutes);
                              // keep sorted + de-duped so the payload is stable
                              onEmailReminderOffsetsChange?.(
                                Array.from(new Set(next)).sort((a, b) => a - b)
                              );
                            }}
                          />
                        }
                        label={
                          <Typography sx={{ fontSize: "0.85rem" }}>{opt.label}</Typography>
                        }
                      />
                    );
                  })}
                  {emailReminderOffsets.length === 0 ? (
                    <Typography
                      variant="caption"
                      sx={{ display: "block", width: "100%", color: "var(--warning-500)", pl: 0.5 }}
                    >
                      Pick at least one time, or no reminder will be sent.
                    </Typography>
                  ) : null}
                </Box>
              ) : null}
            </Box>
          </Box>
        ) : null}
      </SettingsGroupCard>
    </Box>
  );
}
