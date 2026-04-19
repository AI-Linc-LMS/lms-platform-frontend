"use client";

import {
  Box,
  Typography,
  Chip,
  Paper,
  Stack,
  alpha,
  type SxProps,
  type Theme,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  ASSESSMENT_DEVICE_CLASS_ICONS,
  assessmentHasDeviceRestrictions,
  getClientDeviceClass,
  isCurrentDeviceAllowedForAssessment,
  type AssessmentDeviceClass,
} from "@/lib/utils/assessment-device";

export type DevicePanelAssessment = {
  allow_desktop?: boolean;
  allow_mobile?: boolean;
  allow_tablet?: boolean;
};

function allowedClasses(assessment: DevicePanelAssessment): AssessmentDeviceClass[] {
  const out: AssessmentDeviceClass[] = [];
  if (assessment.allow_desktop !== false) out.push("desktop");
  if (assessment.allow_mobile !== false) out.push("mobile");
  if (assessment.allow_tablet !== false) out.push("tablet");
  return out;
}

interface AssessmentDeviceStatusPanelProps {
  assessment: DevicePanelAssessment;
  /** Merged onto the root Paper (e.g. `{ mb: 0 }` when nested). */
  sx?: SxProps<Theme>;
}

/**
 * Learner-facing summary: current device vs allowed types, with clear
 * success / warning styling when restrictions apply.
 */
export function AssessmentDeviceStatusPanel({
  assessment,
  sx: sxProp,
}: AssessmentDeviceStatusPanelProps) {
  const { t } = useTranslation("common");
  const current = getClientDeviceClass();
  const allowed = isCurrentDeviceAllowedForAssessment(assessment);
  const restricted = assessmentHasDeviceRestrictions(assessment);
  const allowedList = allowedClasses(assessment);

  const classLabel = (c: AssessmentDeviceClass) =>
    t(`assessmentDevice.classNames.${c}`);

  if (!restricted) {
    return (
      <Paper
        elevation={0}
        sx={[
          {
            p: 2,
            mb: 3,
            borderRadius: 2,
            border: "1px solid",
            borderColor: alpha("#10b981", 0.35),
            background: alpha("#ecfdf5", 0.65),
          },
          ...(Array.isArray(sxProp) ? sxProp : sxProp != null ? [sxProp] : []),
        ]}
      >
        <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
          <IconWrapper icon="mdi:check-decagram" size={26} color="#059669" />
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, color: "#047857", lineHeight: 1.3 }}
            >
              {t("assessmentDevice.panelTitleAllOk")}
            </Typography>
            <Typography variant="caption" sx={{ color: "#065f46" }}>
              {t("assessmentDevice.panelSubtitleAllOk")}
            </Typography>
          </Box>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={[
        {
          p: 2.5,
          mb: 3,
          borderRadius: 2,
          border: "2px solid",
          borderColor: allowed ? alpha("#6366f1", 0.45) : alpha("#f59e0b", 0.7),
          backgroundColor: allowed
            ? alpha("#eef2ff", 0.85)
            : alpha("#fffbeb", 0.95),
        },
        ...(Array.isArray(sxProp) ? sxProp : sxProp != null ? [sxProp] : []),
      ]}
    >
      <Stack spacing={2}>
        <Stack direction="row" alignItems="flex-start" gap={1.5}>
          <IconWrapper
            icon={
              allowed
                ? "mdi:shield-check-outline"
                : "mdi:cellphone-off"
            }
            size={28}
            color={allowed ? "#4f46e5" : "#d97706"}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                color: allowed ? "#3730a3" : "#92400e",
                mb: 0.5,
              }}
            >
              {allowed
                ? t("assessmentDevice.panelTitleAllowed")
                : t("assessmentDevice.learnerAlertTitle")}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: allowed ? "#4338ca" : "#78350f",
                lineHeight: 1.55,
              }}
            >
              {allowed
                ? t("assessmentDevice.panelBodyAllowed", {
                    device: classLabel(current),
                  })
                : t("assessmentDevice.learnerAlertBody", {
                    types: allowedList.map(classLabel).join(", "),
                  })}
            </Typography>
          </Box>
        </Stack>

        <Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#6b7280",
              display: "block",
              mb: 1,
            }}
          >
            {t("assessmentDevice.allowedDevicesHeading")}
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {allowedList.map((c) => (
              <Chip
                key={c}
                icon={
                  <IconWrapper
                    icon={ASSESSMENT_DEVICE_CLASS_ICONS[c]}
                    size={18}
                  />
                }
                label={classLabel(c)}
                size="small"
                sx={{
                  fontWeight: 600,
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                }}
              />
            ))}
          </Stack>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
            pt: 0.5,
            borderTop: "1px dashed",
            borderColor: alpha("#000", 0.08),
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#6b7280",
            }}
          >
            {t("assessmentDevice.currentDeviceHeading")}
          </Typography>
          <Chip
            icon={
              <IconWrapper
                icon={ASSESSMENT_DEVICE_CLASS_ICONS[current]}
                size={18}
              />
            }
            label={classLabel(current)}
            size="small"
            color={allowed ? "default" : "warning"}
            variant={allowed ? "outlined" : "filled"}
            sx={{
              fontWeight: 700,
              ...(allowed
                ? {}
                : {
                    backgroundColor: alpha("#f59e0b", 0.2),
                    color: "#92400e",
                  }),
            }}
          />
        </Box>
      </Stack>
    </Paper>
  );
}
