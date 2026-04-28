"use client";

import { useMemo } from "react";
import {
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

type CategoryKey = "classic" | "vibrant" | "high_contrast";

type ExtendedCategoryKey =
  | CategoryKey
  | "light"
  | "dark"
  | "minimal";

const CATEGORY_ORDER: ExtendedCategoryKey[] = [
  "light",
  "classic",
  "vibrant",
  "high_contrast",
  "dark",
  "minimal",
];

const FALLBACK_PREVIEW = {
  sidebar: "var(--secondary-500)",
  primary: "var(--primary-500)",
  active: "var(--primary-300)",
  surface: "var(--surface)",
};

function categoryLabelKey(cat: string): string {
  switch (cat) {
    case "light":
      return "branding.presetCategoryLight";
    case "dark":
      return "branding.presetCategoryDark";
    case "minimal":
      return "branding.presetCategoryMinimal";
    case "vibrant":
      return "branding.presetCategoryVibrant";
    case "high_contrast":
      return "branding.presetCategoryHighContrast";
    default:
      return "branding.presetCategoryClassic";
  }
}

function categoryBlurbKey(cat: string): string {
  switch (cat) {
    case "light":
      return "branding.presetGroupBlurb_light";
    case "dark":
      return "branding.presetGroupBlurb_dark";
    case "minimal":
      return "branding.presetGroupBlurb_minimal";
    case "vibrant":
      return "branding.presetGroupBlurb_vibrant";
    case "high_contrast":
      return "branding.presetGroupBlurb_high_contrast";
    default:
      return "branding.presetGroupBlurb_classic";
  }
}

function categoryIcon(cat: string): string {
  switch (cat) {
    case "light":
      return "mdi:white-balance-sunny";
    case "dark":
      return "mdi:weather-night";
    case "minimal":
      return "mdi:shape-outline";
    case "vibrant":
      return "mdi:palette";
    case "high_contrast":
      return "mdi:contrast-circle";
    default:
      return "mdi:view-grid-outline";
  }
}

function categoryChipColor(
  cat: string
): "default" | "primary" | "secondary" | "warning" | "success" | "info" {
  switch (cat) {
    case "light":
      return "info";
    case "dark":
      return "secondary";
    case "minimal":
      return "success";
    case "vibrant":
      return "warning";
    case "high_contrast":
      return "secondary";
    default:
      return "default";
  }
}

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
        height: 92,
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

  const grouped = useMemo((): {
    category: ExtendedCategoryKey;
    items: Array<{
      baseId: string;
      defaultPreset: BrandingPresetSummary;
      whiteBgPreset?: BrandingPresetSummary;
    }>;
  }[] => {
    const pairMap = new Map<
      string,
      {
        baseId: string;
        category: ExtendedCategoryKey;
        defaultPreset?: BrandingPresetSummary;
        whiteBgPreset?: BrandingPresetSummary;
      }
    >();

    for (const p of presets) {
      const baseId = p.base_id || p.id;
      const c = (p.category || "classic") as ExtendedCategoryKey;
      const existing = pairMap.get(baseId) || {
        baseId,
        category: c,
      };
      if (p.variant === "white_bg") {
        existing.whiteBgPreset = p;
      } else {
        existing.defaultPreset = p;
      }
      if (!existing.defaultPreset) {
        existing.defaultPreset = p;
      }
      pairMap.set(baseId, existing);
    }

    const groupedMap = new Map<
      ExtendedCategoryKey,
      Array<{ baseId: string; defaultPreset: BrandingPresetSummary; whiteBgPreset?: BrandingPresetSummary }>
    >();
    for (const entry of pairMap.values()) {
      if (!entry.defaultPreset) continue;
      if (!groupedMap.has(entry.category)) groupedMap.set(entry.category, []);
      groupedMap.get(entry.category)!.push({
        baseId: entry.baseId,
        defaultPreset: entry.defaultPreset,
        whiteBgPreset: entry.whiteBgPreset,
      });
    }

    return CATEGORY_ORDER.filter((k) => groupedMap.has(k)).map((k) => ({
      category: k,
      items: groupedMap.get(k)!,
    }));
  }, [presets]);

  const customSelected = !selectedId;

  return (
    <Stack spacing={2.5}>
      <Typography variant="body2" color="text.secondary">
        {t("branding.presetGalleryHint")}
      </Typography>

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

      {grouped.map(({ category, items }) => (
        <Box key={category}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <Chip
              size="small"
              icon={<IconWrapper icon={categoryIcon(category)} size={14} />}
              label={t(categoryLabelKey(category))}
              color={categoryChipColor(category)}
              variant={category === "classic" || category === "minimal" ? "outlined" : "filled"}
              sx={{ fontWeight: 700, fontSize: "0.7rem" }}
            />
            <Typography variant="caption" color="text.secondary">
              {t(categoryBlurbKey(category))}
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
            {items.map((pair) => {
              const currentPreset = pair.defaultPreset;
              const whiteBgPreset = pair.whiteBgPreset;
              const selectedUsesWhite = selectedId === whiteBgPreset?.id;
              const activePreset = selectedUsesWhite ? whiteBgPreset! : currentPreset;
              const preview = activePreset.preview ?? FALLBACK_PREVIEW;
              const selected =
                selectedId === currentPreset.id || (whiteBgPreset ? selectedId === whiteBgPreset.id : false);
              const loading =
                applyingId === currentPreset.id || (whiteBgPreset ? applyingId === whiteBgPreset.id : false);
              return (
                <ButtonBase
                  key={pair.baseId}
                  focusRipple
                  disabled={Boolean(applyingId)}
                  onClick={() => onSelectPreset(activePreset.id)}
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
                            `0 0 0 1px ${alpha(theme.palette.primary.main, 0.25)}`
                        : "0 1px 2px color-mix(in srgb, var(--font-primary) 6%, transparent)",
                      "&:hover": {
                        borderColor: "primary.light",
                        boxShadow: (theme) =>
                          `0 4px 14px ${alpha(theme.palette.primary.main, 0.12)}`,
                      },
                    }}
                  >
                    {loading && (
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: 1.75,
                          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.72),
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
                          {currentPreset.label.replace(/\s*\(White BG\)\s*$/i, "")}
                        </Typography>
                        {selected && !loading && (
                          <IconWrapper
                            icon="mdi:check-circle"
                            size={18}
                            color={theme.palette.primary.main}
                          />
                        )}
                      </Stack>
                      <Stack direction="row" spacing={0.75} sx={{ pt: 0.25 }}>
                        <Chip
                          size="small"
                          clickable
                          label="Current"
                          color={!selectedUsesWhite ? "primary" : "default"}
                          variant={!selectedUsesWhite ? "filled" : "outlined"}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onSelectPreset(currentPreset.id);
                          }}
                          sx={{ fontWeight: 600, fontSize: "0.68rem" }}
                        />
                        <Chip
                          size="small"
                          clickable
                          disabled={!whiteBgPreset}
                          label="White BG"
                          color={selectedUsesWhite ? "primary" : "default"}
                          variant={selectedUsesWhite ? "filled" : "outlined"}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (whiteBgPreset) onSelectPreset(whiteBgPreset.id);
                          }}
                          sx={{ fontWeight: 600, fontSize: "0.68rem" }}
                        />
                      </Stack>
                      {activePreset.tagline ? (
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.35 }}>
                          {activePreset.tagline}
                        </Typography>
                      ) : null}
                    </Stack>
                  </Box>
                </ButtonBase>
              );
            })}
          </Box>
        </Box>
      ))}
    </Stack>
  );
}
