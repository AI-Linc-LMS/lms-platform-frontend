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

const CATEGORY_ORDER: CategoryKey[] = ["classic", "vibrant", "high_contrast"];

const FALLBACK_PREVIEW = {
  sidebar: "#12293a",
  primary: "#255c79",
  active: "#63b6d3",
  surface: "#f1f5f9",
};

function categoryLabelKey(cat: string): string {
  switch (cat) {
    case "vibrant":
      return "branding.presetCategoryVibrant";
    case "high_contrast":
      return "branding.presetCategoryHighContrast";
    default:
      return "branding.presetCategoryClassic";
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
        boxShadow: "0 1px 4px rgba(15, 23, 42, 0.07)",
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
            bgcolor: alpha("#ffffff", 0.12),
          }}
        />
        <Box
          sx={{
            height: 5,
            borderRadius: 0.75,
            bgcolor: alpha("#ffffff", 0.07),
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
            bgcolor: alpha("#64748b", 0.18),
            width: "92%",
          }}
        />
        <Box
          sx={{
            height: 7,
            borderRadius: 1,
            bgcolor: alpha("#64748b", 0.12),
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
            color: "#fff",
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
    category: CategoryKey;
    items: BrandingPresetSummary[];
  }[] => {
    const m = new Map<string, BrandingPresetSummary[]>();
    for (const p of presets) {
      const c = (p.category || "classic") as CategoryKey;
      if (!m.has(c)) m.set(c, []);
      m.get(c)!.push(p);
    }
    return CATEGORY_ORDER.filter((k) => m.has(k)).map((k) => ({
      category: k,
      items: m.get(k)!,
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
              label={t(categoryLabelKey(category))}
              color={
                category === "vibrant"
                  ? "warning"
                  : category === "high_contrast"
                    ? "secondary"
                    : "default"
              }
              variant={category === "classic" ? "outlined" : "filled"}
              sx={{ fontWeight: 700, fontSize: "0.7rem" }}
            />
            <Typography variant="caption" color="text.secondary">
              {t(`branding.presetGroupBlurb_${category}`)}
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
            {items.map((p) => {
              const preview = p.preview ?? FALLBACK_PREVIEW;
              const selected = selectedId === p.id;
              const loading = applyingId === p.id;
              return (
                <ButtonBase
                  key={p.id}
                  focusRipple
                  disabled={Boolean(applyingId)}
                  onClick={() => onSelectPreset(p.id)}
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
                        : "0 1px 2px rgba(15,23,42,0.04)",
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
                          {p.label}
                        </Typography>
                        {selected && !loading && (
                          <IconWrapper
                            icon="mdi:check-circle"
                            size={18}
                            color={theme.palette.primary.main}
                          />
                        )}
                      </Stack>
                      {p.tagline ? (
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.35 }}>
                          {p.tagline}
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
