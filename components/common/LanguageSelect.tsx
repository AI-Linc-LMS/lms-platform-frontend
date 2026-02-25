"use client";

import { useTranslation } from "react-i18next";
import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Typography } from "@mui/material";
import { supportedLngs, type SupportedLng } from "@/lib/i18n";

const LANGUAGE_LABELS: Record<SupportedLng, string> = {
  en: "English",
  ar: "العربية",
};

interface LanguageSelectProps {
  size?: "small" | "medium";
  variant?: "outlined" | "filled" | "standard";
  fullWidth?: boolean;
  label?: string;
  sx?: object;
}

export function LanguageSelect({
  size = "small",
  variant = "outlined",
  fullWidth = false,
  label,
  sx,
}: LanguageSelectProps) {
  const { t, i18n } = useTranslation("common");

  const currentLng = (supportedLngs.includes(i18n.language as SupportedLng) ? i18n.language : "en") as SupportedLng;

  const handleChange = (e: SelectChangeEvent<string>) => {
    const value = e.target.value as SupportedLng;
    i18n.changeLanguage(value);
  };

  return (
    <FormControl size={size} variant={variant} fullWidth={fullWidth} sx={{ minWidth: 120, ...sx }}>
      <InputLabel id="language-select-label">{label ?? t("common.language")}</InputLabel>
      <Select
        labelId="language-select-label"
        value={currentLng}
        label={label ?? t("common.language")}
        onChange={handleChange}
      >
        {supportedLngs.map((lng) => (
          <MenuItem key={lng} value={lng}>
            <Typography component="span" sx={{ direction: lng === "ar" ? "rtl" : "ltr" }}>
              {LANGUAGE_LABELS[lng]}
            </Typography>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
