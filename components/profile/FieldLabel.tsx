"use client";

import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";

/**
 * The icon + caption that heads every tile on the profile form, and the one place that says a
 * field is mandatory.
 *
 * Three things were wrong with the fourteen hand-rolled copies this replaces, and they are all
 * the same bug seen from different angles: the caption was a `<span>`, so it named nothing. A
 * learner using a screen reader heard "edit text" with no field name; a learner using their eyes
 * was told which fields were mandatory only AFTER a save failed, by a red message under the box.
 * And one copy shrank to 11px on a phone while the other thirteen stayed at 12px.
 *
 * So: the caption is a real `<label htmlFor>` (or, for a MUI Select, the target of `labelId`),
 * the asterisk is `aria-hidden` because the control itself carries `required` / `aria-required`
 * — a screen reader that announced both would say "required" twice — and the size is one value
 * at every width.
 */
export function FieldLabel({
  icon,
  label,
  htmlFor,
  required = false,
}: {
  icon: string;
  label: string;
  /** Id of the control this names. Also gives the label its own id, `${htmlFor}-label`. */
  htmlFor: string;
  required?: boolean;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 0.75, sm: 1 },
        mb: { xs: 0.75, sm: 1 },
      }}
    >
      <IconWrapper icon={icon} size={16} color="var(--accent-indigo)" />
      <Typography
        component="label"
        htmlFor={htmlFor}
        id={`${htmlFor}-label`}
        variant="caption"
        sx={{
          color: "var(--font-secondary)",
          // One value, not a responsive pair: 0.6875rem here was 11px on every phone.
          fontSize: "0.75rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          minWidth: 0,
        }}
      >
        {label}
        {required && (
          <Box
            component="span"
            aria-hidden="true"
            sx={{ color: "var(--error-600, #ae0606)", fontWeight: 700, marginInlineStart: "0.2em" }}
          >
            *
          </Box>
        )}
      </Typography>
    </Box>
  );
}

/**
 * "* marks a required field", shown once per form so the asterisk means something the first
 * time a learner meets it. The asterisk is drawn here rather than written into the translated
 * string: a bare "*" glued into English copy is exactly what the Arabic build would inherit.
 */
export function RequiredFieldsLegend() {
  const { t } = useTranslation("common");

  return (
    <Typography
      variant="caption"
      sx={{
        display: "block",
        color: "var(--font-secondary)",
        fontSize: "0.75rem",
        mb: 1.5,
      }}
    >
      <Box component="span" aria-hidden="true" sx={{ color: "var(--error-600, #ae0606)", fontWeight: 700, marginInlineEnd: "0.35em" }}>
        *
      </Box>
      {t("profile.requiredFieldsLegend")}
    </Typography>
  );
}
