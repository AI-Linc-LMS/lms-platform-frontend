"use client";

import { useMemo } from "react";
import {
  Alert,
  Box,
  ButtonBase,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import type { BrandingPresetSummary } from "@/lib/services/admin/branding.service";
import { IconWrapper } from "@/components/common/IconWrapper";

const GROUP_ORDER: Array<{
  key: string;
  label: string;
  blurb: string;
  icon: string;
  match: (p: BrandingPresetSummary) => boolean;
}> = [
  {
    key: "light",
    label: "Light",
    blurb: "Soft tonal canvases — easy on the eyes for content-heavy modules.",
    icon: "mdi:white-balance-sunny",
    match: (p) => (p.category ?? "") !== "white_bg",
  },
  {
    key: "white_bg",
    label: "White BG",
    blurb: "Dark sidebar + active palette with a crisp white canvas.",
    icon: "mdi:monitor-shimmer",
    match: (p) => (p.category ?? "") === "white_bg",
  },
];

const FALLBACK_PREVIEW = {
  sidebar: "var(--secondary-500)",
  primary: "var(--primary-500)",
  active: "var(--primary-300)",
  surface: "var(--surface)",
};

function MiniChromePreview({
  preview,
}: {
  preview: NonNullable<BrandingPresetSummary["preview"]>;
}) {
  const { sidebar, primary, active, surface } = preview;
  return (
    <Box
      sx={{
        display: "flex",
        height: 96,
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        boxShadow:
          "0 1px 4px color-mix(in srgb, var(--font-primary) 8%, transparent)",
      }}
    >
      <Stack
        spacing={0.65}
        sx={{
          width: "30%",
          bgcolor: sidebar,
          py: 1,
          px: 0.65,
          alignItems: "stretch",
        }}
      >
        <Box
          sx={{
            height: 5,
            borderRadius: 0.75,
            bgcolor: alpha(active, 0.4),
            borderInlineStart: `3px solid ${primary}`,
          }}
        />
        <Box
          sx={{
            height: 5,
            borderRadius: 0.75,
            bgcolor: "color-mix(in srgb, var(--font-light) 12%, transparent)",
          }}
        />
        <Box
          sx={{
            height: 5,
            borderRadius: 0.75,
            bgcolor: "color-mix(in srgb, var(--font-light) 7%, transparent)",
          }}
        />
      </Stack>
      <Stack
        spacing={0.75}
        sx={{
          flex: 1,
          bgcolor: surface,
          p: 1,
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            height: 10,
            borderRadius: 1,
            bgcolor: alpha(primary, 0.22),
            width: "72%",
          }}
        />
        <Box
          sx={{
            height: 7,
            borderRadius: 1,
            bgcolor: "color-mix(in srgb, var(--font-secondary) 18%, transparent)",
            width: "92%",
          }}
        />
        <Box
          sx={{
            height: 7,
            borderRadius: 1,
            bgcolor: "color-mix(in srgb, var(--font-secondary) 12%, transparent)",
            width: "58%",
          }}
        />
        <Box
          sx={{
            mt: "auto",
            alignSelf: "flex-start",
            px: 1.1,
            py: 0.45,
            borderRadius: 1,
            bgcolor: primary,
            color: "var(--font-light)",
            fontSize: 10,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: "0.02em",
            boxShadow: `0 2px 8px ${alpha(primary, 0.42)}`,
          }}
        >
          CTA
        </Box>
      </Stack>
    </Box>
  );
}

export function BrandingPresetGallery({
  presets,
  selectedId,
  applyingId,
  onSelectPreset,
  onSelectCustom,
}: {
  presets: BrandingPresetSummary[];
  selectedId: string;
  applyingId: string | null;
  onSelectPreset: (id: string) => void;
  onSelectCustom: () => void;
}) {
  const { t } = useTranslation("common");
  const theme = useTheme();

  const customSelected = !selectedId;
  // Tenant still has _preset = "graphite_night" etc. from before the catalogue trim.
  const retiredPreset =
    selectedId && !presets.some((p) => p.id === selectedId) ? selectedId : null;

  const groups = useMemo(
    () =>
      GROUP_ORDER.map((g) => ({
        ...g,
        items: presets.filter(g.match),
      })),
    [presets]
  );

  return (
    <Stack spacing={2.5}>
      <Typography variant="body2" color="text.secondary">
        {t("branding.presetGalleryHint")}
      </Typography>

      {retiredPreset ? (
        <Alert
          severity="info"
          icon={<IconWrapper icon="mdi:history" size={20} />}
          sx={{
            borderRadius: 2,
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--surface)",
            color: "var(--font-primary)",
          }}
        >
          Your theme ({retiredPreset}) was retired. Your colors still render —
          pick a current preset below or keep using your saved palette.
        </Alert>
      ) : null}

      <ButtonBase
        focusRipple
        disabled={Boolean(applyingId)}
        onClick={onSelectCustom}
        sx={{
          width: "100%",
          display: "block",
          textAlign: "left",
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            border: "2px solid",
            borderColor: customSelected ? "primary.main" : "divider",
            bgcolor: (theme) =>
              customSelected
                ? alpha(theme.palette.primary.main, 0.06)
                : alpha(theme.palette.grey[500], 0.04),
            transition: "border-color 0.2s, box-shadow 0.2s",
            boxShadow: customSelected
              ? (theme) => `0 0 0 1px ${alpha(theme.palette.primary.main, 0.35)}`
              : "none",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 1.5,
                bgcolor: "grey.200",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "text.secondary",
              }}
            >
              <IconWrapper icon="mdi:tune-variant" size={26} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight={700}>{t("branding.presetCustomTitle")}</Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {t("branding.presetCustomDesc")}
              </Typography>
            </Box>
            {customSelected && (
              <Chip
                size="small"
                color="primary"
                label={t("branding.presetSelected")}
                sx={{ fontWeight: 600 }}
              />
            )}
          </Stack>
        </Box>
      </ButtonBase>

      {groups.map((group) =>
        group.items.length === 0 ? null : (
          <Box key={group.key}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 1.25 }}
            >
              <Chip
                size="small"
                icon={<IconWrapper icon={group.icon} size={14} />}
                label={group.label}
                color={group.key === "white_bg" ? "secondary" : "primary"}
                variant={group.key === "white_bg" ? "filled" : "outlined"}
                sx={{ fontWeight: 700, fontSize: "0.7rem" }}
              />
              <Typography variant="caption" color="text.secondary">
                {group.blurb}
              </Typography>
            </Stack>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                },
                gap: 1.75,
              }}
            >
              {group.items.map((preset) => {
                const preview = preset.preview ?? FALLBACK_PREVIEW;
                const selected = selectedId === preset.id;
                const loading = applyingId === preset.id;
                return (
                  <ButtonBase
                    key={preset.id}
                    focusRipple
                    disabled={Boolean(applyingId)}
                    onClick={() => onSelectPreset(preset.id)}
                    sx={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      borderRadius: 2,
                    }}
                  >
                    <Box
                      sx={{
                        position: "relative",
                        p: 1.25,
                        borderRadius: 2,
                        border: "2px solid",
                        borderColor: selected ? "primary.main" : "divider",
                        bgcolor: (theme) =>
                          selected
                            ? alpha(theme.palette.primary.main, 0.04)
                            : "background.paper",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                        boxShadow: selected
                          ? (theme) =>
                              `0 0 0 1px ${alpha(
                                theme.palette.primary.main,
                                0.25
                              )}`
                          : "0 1px 2px color-mix(in srgb, var(--font-primary) 6%, transparent)",
                        "&:hover": {
                          borderColor: "primary.light",
                          boxShadow: (theme) =>
                            `0 4px 14px ${alpha(
                              theme.palette.primary.main,
                              0.12
                            )}`,
                        },
                      }}
                    >
                      {loading && (
                        <Box
                          sx={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: 1.75,
                            bgcolor: (theme) =>
                              alpha(theme.palette.background.paper, 0.72),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 1,
                          }}
                        >
                          <CircularProgress size={28} />
                        </Box>
                      )}
                      <MiniChromePreview preview={preview} />
                      <Stack spacing={0.35} sx={{ mt: 1.25 }}>
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                          <Typography fontWeight={700} fontSize="0.95rem" noWrap>
                            {preset.label.replace(/\s*\(White BG\)\s*$/i, "")}
                          </Typography>
                          {selected && !loading && (
                            <IconWrapper
                              icon="mdi:check-circle"
                              size={18}
                              color={theme.palette.primary.main}
                            />
                          )}
                        </Stack>
                        {preset.tagline ? (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ lineHeight: 1.35 }}
                          >
                            {preset.tagline}
                          </Typography>
                        ) : null}
                      </Stack>
                    </Box>
                  </ButtonBase>
                );
              })}
            </Box>
          </Box>
        )
      )}
    </Stack>
  );
}
