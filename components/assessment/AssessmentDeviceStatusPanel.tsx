"use client";

import {
  Box,
  Typography,
  Chip,
  Paper,
  Stack,
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
            borderColor: "color-mix(in srgb, var(--course-cta) 35%, transparent)",
            background:
              "color-mix(in srgb, var(--success-50) 65%, transparent)",
          },
          ...(Array.isArray(sxProp) ? sxProp : sxProp != null ? [sxProp] : []),
        ]}
      >
        <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
          <IconWrapper icon="mdi:check-decagram" size={26} color="var(--assessment-success-strong)" />
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, color: "color-mix(in srgb, var(--course-cta) 82%, var(--font-dark))", lineHeight: 1.3 }}
            >
              {t("assessmentDevice.panelTitleAllOk")}
            </Typography>
            <Typography variant="caption" sx={{ color: "color-mix(in srgb, var(--course-cta) 75%, var(--font-dark))" }}>
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
          borderColor: allowed
            ? "color-mix(in srgb, var(--accent-indigo) 45%, transparent)"
            : "color-mix(in srgb, var(--warning-500) 70%, transparent)",
          backgroundColor: allowed
            ? "color-mix(in srgb, var(--surface-indigo-light) 85%, transparent)"
            : "color-mix(in srgb, var(--warning-100) 75%, var(--card-bg))",
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
            color={allowed ? "var(--accent-indigo-dark)" : "var(--ats-warning-muted)"}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                color: allowed ? "color-mix(in srgb, var(--accent-indigo) 78%, var(--font-dark))" : "color-mix(in srgb, var(--accent-orange) 55%, var(--font-dark))",
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
                color: allowed ? "var(--accent-indigo-dark)" : "color-mix(in srgb, var(--warning-500) 55%, var(--font-dark))",
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
              color: "var(--font-secondary)",
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
                  backgroundColor: "var(--font-light)",
                  border: "1px solid var(--border-default)",
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
            borderColor: "color-mix(in srgb, var(--font-dark) 8%, transparent)",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--font-secondary)",
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
                    backgroundColor:
                      "color-mix(in srgb, var(--warning-500) 20%, transparent)",
                    color: "color-mix(in srgb, var(--accent-orange) 55%, var(--font-dark))",
                  }),
            }}
          />
        </Box>
      </Stack>
    </Paper>
  );
}
