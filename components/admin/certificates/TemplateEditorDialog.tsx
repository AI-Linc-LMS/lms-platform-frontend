"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Slider,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { IconWrapper } from "@/components/common/IconWrapper";
import { LoadingButton } from "@/components/common/LoadingButton";
import { useToast } from "@/components/common/Toast";
import { AdminCertificateUploadCard } from "@/components/admin/certificates/AdminCertificateUploadCard";
import { CertificatePreview } from "@/components/certificate/CertificatePreview";
import {
  DEFAULT_FIELD_PLACEMENTS,
  useCertificateArtworkLabels,
} from "@/components/certificate/CertificateArtwork";
import {
  CERTIFICATE_PRESETS,
  CERTIFICATE_PRESET_ORDER,
  getPreset,
  resolvePalette,
} from "@/lib/certificates/presets";
import { adminCertificatesService } from "@/lib/services/certificates.service";
import type {
  CertificateFieldName,
  CertificateFieldPlacement,
  CertificateIssuer,
  CertificateLayout,
  CertificateOrnamentLevel,
  CertificatePalette,
  CertificatePresetSlug,
  CertificateTemplate,
  CertificateTemplateWrite,
} from "@/lib/certificates/types";
import {
  CERTIFICATE_CANVAS_HEIGHT,
  CERTIFICATE_CANVAS_WIDTH,
} from "@/lib/certificates/types";
import {
  certificateAdminKeys,
  draftFromPreset,
  draftFromTemplate,
  previewPayloadFromDraft,
  type TemplateDraft,
} from "./shared";

/**
 * The design editor: a form on the left, the actual certificate on the right,
 * repainting on every keystroke.
 *
 * The preview is local (see shared.tsx) rather than a call to the server's
 * preview endpoint, because an admin nudging an ornament slider or trying six
 * accents in a row needs the artwork to follow the cursor. The server preview
 * is still what the Issued tab shows, since a real credential must render from
 * the frozen snapshot the backend holds and not from anything recomputed here.
 */

const LAYOUTS: Array<{ value: CertificateLayout; icon: string }> = [
  { value: "classic", icon: "mdi:crown-outline" },
  { value: "panel", icon: "mdi:view-split-vertical" },
  { value: "minimal", icon: "mdi:format-align-left" },
];

/** The six fields an uploaded background can carry, in reading order. */
const FIELD_ORDER: CertificateFieldName[] = [
  "title",
  "subtitle",
  "recipient",
  "date",
  "credentialId",
  "metric",
];

/** Palette tokens in the order they matter to someone tuning a design. `bg` is
 *  excluded here because it is a full CSS background value (the presets use
 *  radial-gradients), so it gets a text field of its own rather than a swatch. */
const PALETTE_SWATCH_TOKENS: Array<Exclude<keyof CertificatePalette, "bg">> = [
  "accent",
  "accentDeep",
  "metal",
  "metalDeep",
  "metalInk",
  "ink",
  "sub",
  "faint",
  "frame",
  "pattern",
];

const FONT_CHOICES = [
  { value: "Georgia, 'Times New Roman', serif", label: "Serif" },
  { value: "'Helvetica Neue', Arial, sans-serif", label: "Sans" },
  { value: "'Courier New', ui-monospace, monospace", label: "Mono" },
];

const WEIGHT_CHOICES = [300, 400, 500, 600, 700, 800];

export interface TemplateEditorDialogProps {
  open: boolean;
  clientId: string | number;
  issuer: CertificateIssuer;
  /** null opens the dialog on a brand-new template. */
  template: CertificateTemplate | null;
  /** Preset to start a new template from, when the admin picked one from the
   *  preset gallery rather than hitting the generic create button. */
  initialPreset?: CertificatePresetSlug;
  onClose: () => void;
  onSaved?: (template: CertificateTemplate) => void;
}

/** A colour token with a swatch picker and the hex beside it, because admins
 *  paste brand hexes far more often than they hunt in a colour wheel. */
function ColorField({
  label,
  value,
  onChange,
  onReset,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  onReset?: () => void;
}) {
  const theme = useTheme();
  // <input type="color"> only accepts #rrggbb. A token holding anything else
  // (a gradient, a CSS variable) must still be editable as text rather than
  // silently snapping to black the moment the picker mounts.
  const swatchValue = /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000";
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {/* A plain <input> rather than a styled MUI control: the native colour
          picker is the only widget that opens the OS palette, and wrapping it
          in anything with its own value handling has historically swallowed
          the change event on Safari. */}
      <input
        type="color"
        value={swatchValue}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        style={{
          width: 40,
          height: 34,
          padding: 0,
          border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
          borderRadius: 6,
          background: "none",
          cursor: "pointer",
          flexShrink: 0,
        }}
      />
      <TextField
        size="small"
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        fullWidth
        InputProps={{ sx: { borderRadius: 2, fontFamily: "ui-monospace, monospace", fontSize: 13 } }}
      />
      {onReset ? (
        <IconButton size="small" onClick={onReset} aria-label={`${label} reset`}>
          <IconWrapper icon="mdi:backup-restore" size={18} />
        </IconButton>
      ) : null}
    </Stack>
  );
}

export function TemplateEditorDialog({
  open,
  clientId,
  issuer,
  template,
  initialPreset,
  onClose,
  onSaved,
}: TemplateEditorDialogProps) {
  const { t } = useTranslation("common");
  const theme = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const labels = useCertificateArtworkLabels();

  const [draft, setDraft] = useState<TemplateDraft>(() =>
    template ? draftFromTemplate(template) : draftFromPreset(initialPreset ?? "brand-classic"),
  );
  const [selectedField, setSelectedField] = useState<CertificateFieldName>("recipient");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [touched, setTouched] = useState(false);

  // Re-seed whenever the dialog opens: leaving the previous template's state
  // behind meant clicking "new template" straight after editing one opened a
  // form pre-filled with the edited design, and admins saved it by accident.
  useEffect(() => {
    if (!open) return;
    setDraft(
      template ? draftFromTemplate(template) : draftFromPreset(initialPreset ?? "brand-classic"),
    );
    setSelectedField("recipient");
    setUploadFile(null);
    setTouched(false);
  }, [open, template, initialPreset]);

  const patch = useCallback((next: Partial<TemplateDraft>) => {
    setTouched(true);
    setDraft((prev) => ({ ...prev, ...next }));
  }, []);

  const preset = getPreset(draft.preset);
  const isUpload = draft.kind === "upload";

  const payload = useMemo(
    () => previewPayloadFromDraft(draft, issuer),
    [draft, issuer],
  );

  /** The palette actually painted, so the override inputs start from what the
   *  admin can see rather than from an empty string. */
  const effectivePalette: CertificatePalette = useMemo(() => {
    const base = resolvePalette({ preset: preset.slug }, issuer.accent);
    return { ...base, ...(draft.palette ?? {}) };
  }, [preset.slug, issuer.accent, draft.palette]);

  const placements = useMemo(
    () => ({ ...DEFAULT_FIELD_PLACEMENTS, ...(draft.fieldPlacements ?? {}) }),
    [draft.fieldPlacements],
  );

  /* -------------------------------------------------------------- *
   * Placement dragging
   * -------------------------------------------------------------- */

  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageWidth, setStageWidth] = useState(0);
  const dragField = useRef<CertificateFieldName | null>(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? 0;
      setStageWidth((prev) => (prev === next ? prev : next));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, isUpload]);

  const applyPointer = useCallback(
    (clientX: number, clientY: number) => {
      const field = dragField.current;
      const el = stageRef.current;
      if (!field || !el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      // Fractions, never pixels: the stage is whatever width the dialog happens
      // to be, and the same placement has to land identically on the 1000px
      // canvas and on the 2500px export.
      const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
      setTouched(true);
      setDraft((prev) => {
        const current = { ...DEFAULT_FIELD_PLACEMENTS, ...(prev.fieldPlacements ?? {}) };
        return {
          ...prev,
          fieldPlacements: {
            ...current,
            [field]: { ...current[field], x: Number(x.toFixed(4)), y: Number(y.toFixed(4)) },
          },
        };
      });
    },
    [],
  );

  useEffect(() => {
    if (!open || !isUpload) return;
    const move = (e: PointerEvent) => {
      if (!dragField.current) return;
      e.preventDefault();
      applyPointer(e.clientX, e.clientY);
    };
    const up = () => {
      dragField.current = null;
    };
    // Listeners on window rather than on the chip: a fast drag leaves the chip
    // behind the cursor, and a chip-scoped pointermove drops the field the
    // instant the pointer outruns it.
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [open, isUpload, applyPointer]);

  const startDrag = (field: CertificateFieldName) => (e: ReactPointerEvent) => {
    e.preventDefault();
    dragField.current = field;
    setSelectedField(field);
    applyPointer(e.clientX, e.clientY);
  };

  const patchPlacement = (field: CertificateFieldName, next: Partial<CertificateFieldPlacement>) => {
    setTouched(true);
    setDraft((prev) => {
      const current = { ...DEFAULT_FIELD_PLACEMENTS, ...(prev.fieldPlacements ?? {}) };
      return {
        ...prev,
        fieldPlacements: { ...current, [field]: { ...current[field], ...next } },
      };
    });
  };

  /* -------------------------------------------------------------- *
   * Validation
   * -------------------------------------------------------------- */

  const errors = useMemo(() => {
    const list: string[] = [];
    if (!draft.name?.trim()) {
      list.push(t("certificatesUpload.errNameRequired", "Give the template a name."));
    }
    if (!draft.title?.trim()) {
      list.push(t("certificatesUpload.errTitleRequired", "The certificate needs a heading."));
    }
    const seal = draft.sealCode?.trim() ?? "";
    if (seal.length !== 2) {
      list.push(
        t("certificatesUpload.errSealCode", "The seal code is exactly two letters, such as CO."),
      );
    }
    if (isUpload && !draft.backgroundUrl) {
      list.push(
        t(
          "certificatesUpload.errBackgroundRequired",
          "Upload a background image before saving this template.",
        ),
      );
    }
    return list;
  }, [draft, isUpload, t]);

  /* -------------------------------------------------------------- *
   * Persistence
   * -------------------------------------------------------------- */

  const buildWrite = (): CertificateTemplateWrite => ({
    name: draft.name?.trim(),
    kind: draft.kind ?? "design",
    layout: draft.layout ?? "classic",
    preset: preset.slug,
    title: draft.title?.trim(),
    tagline: draft.tagline?.trim() ?? "",
    bandLabel: draft.bandLabel?.trim() ?? "",
    sealCode: (draft.sealCode ?? "").trim().toUpperCase(),
    ornamentLevel: draft.ornamentLevel ?? preset.ornamentLevel,
    // Send the overrides only. Posting the whole resolved palette would freeze
    // a brand template's accent at whatever the tenant colour is today, so a
    // rebrand would stop reaching certificates.
    palette: draft.palette && Object.keys(draft.palette).length > 0 ? draft.palette : null,
    backgroundUrl: isUpload ? draft.backgroundUrl ?? null : null,
    fieldPlacements: isUpload ? draft.fieldPlacements ?? placements : null,
    is_active: draft.is_active ?? true,
  });

  const save = useMutation({
    mutationFn: async () => {
      const body = buildWrite();
      return draft.id
        ? adminCertificatesService.updateTemplate(clientId, draft.id, body)
        : adminCertificatesService.createTemplate(clientId, body);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: certificateAdminKeys.templates(clientId) });
      queryClient.invalidateQueries({ queryKey: certificateAdminKeys.overview(clientId) });
      showToast(
        draft.id
          ? t("certificatesUpload.templateUpdated", "Template updated.")
          : t("certificatesUpload.templateCreated", "Template created."),
        "success",
      );
      onSaved?.(saved);
      onClose();
    },
    onError: (err: unknown) => {
      showToast(
        err instanceof Error
          ? err.message
          : t("certificatesUpload.templateSaveError", "Could not save the template."),
        "error",
      );
    },
  });

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const result = await adminCertificatesService.uploadAsset(clientId, uploadFile);
      patch({ backgroundUrl: result.url, kind: "upload" });
      setUploadFile(null);
      showToast(t("certificatesUpload.uploadSuccess", "Upload completed"), "success");
    } catch (err: unknown) {
      showToast(
        err instanceof Error
          ? err.message
          : t("certificatesUpload.uploadError", "Upload failed"),
        "error",
      );
    } finally {
      setUploading(false);
    }
  };

  const stageHeight = stageWidth * (CERTIFICATE_CANVAS_HEIGHT / CERTIFICATE_CANVAS_WIDTH);

  return (
    <Dialog
      open={open}
      onClose={() => onClose()}
      maxWidth="xl"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3, height: { md: "92vh" } } } }}
    >
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              color: "warning.main",
              bgcolor: alpha(theme.palette.warning.main, theme.palette.mode === "dark" ? 0.22 : 0.12),
            }}
          >
            <IconWrapper icon="mdi:palette-outline" size={22} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.25 }}>
              {draft.id
                ? t("certificatesUpload.editTemplateTitle", "Edit certificate design")
                : t("certificatesUpload.newTemplateTitle", "New certificate design")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t(
                "certificatesUpload.editorSubtitle",
                "Everything you change is drawn on the right exactly as a learner will receive it.",
              )}
            </Typography>
          </Box>
          <IconButton onClick={() => onClose()} aria-label={t("common.close", "Close")}>
            <IconWrapper icon="mdi:close" size={22} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 420px) minmax(0, 1fr)" },
            alignItems: "start",
            height: "100%",
          }}
        >
          {/* ---------------- form ---------------- */}
          <Box
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRight: { md: "1px solid" },
              borderColor: { md: alpha(theme.palette.divider, 0.7) },
              maxHeight: { md: "calc(92vh - 190px)" },
              overflowY: { md: "auto" },
            }}
          >
            <Stack spacing={2.25}>
              <TextField
                label={t("certificatesUpload.fieldName", "Template name")}
                helperText={t(
                  "certificatesUpload.fieldNameHelp",
                  "Admin-only. Learners never see this.",
                )}
                value={draft.name ?? ""}
                onChange={(e) => patch({ name: e.target.value })}
                fullWidth
                size="small"
                InputProps={{ sx: { borderRadius: 2 } }}
              />

              <Box>
                <Typography variant="overline" sx={{ fontWeight: 800, color: "text.secondary" }}>
                  {t("certificatesUpload.fieldKind", "Artwork source")}
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  size="small"
                  value={draft.kind ?? "design"}
                  onChange={(_, v) => {
                    if (v) patch({ kind: v as CertificateTemplate["kind"] });
                  }}
                  sx={{ mt: 0.75, "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 700, borderRadius: 2 } }}
                >
                  <ToggleButton value="design">
                    <IconWrapper icon="mdi:draw-pen" size={18} />
                    <Box component="span" sx={{ ml: 0.75 }}>
                      {t("certificatesUpload.kindDesign", "Designed here")}
                    </Box>
                  </ToggleButton>
                  <ToggleButton value="upload">
                    <IconWrapper icon="mdi:image-outline" size={18} />
                    <Box component="span" sx={{ ml: 0.75 }}>
                      {t("certificatesUpload.kindUpload", "Uploaded background")}
                    </Box>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Divider />

              {isUpload ? (
                <>
                  <Typography variant="subtitle2" fontWeight={800}>
                    {t("certificatesUpload.backgroundSection", "Background image")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t(
                      "certificatesUpload.backgroundHelp",
                      "Use artwork at 1000 by 707 pixels or the same 1.41 ratio, then drag each text field onto it in the preview.",
                    )}
                  </Typography>
                  <AdminCertificateUploadCard
                    selectedFile={uploadFile}
                    onSelectFile={setUploadFile}
                    onUpload={handleUpload}
                    uploading={uploading}
                    lastUrl={draft.backgroundUrl ?? null}
                    onCopyUrl={() => {
                      if (!draft.backgroundUrl) return;
                      navigator.clipboard
                        ?.writeText(draft.backgroundUrl)
                        .then(() =>
                          showToast(t("certificatesUpload.copied", "Copied to clipboard"), "success"),
                        )
                        .catch(() =>
                          showToast(t("certificatesUpload.copyFailed", "Could not copy"), "error"),
                        );
                    }}
                  />

                  <Divider />
                  <Typography variant="subtitle2" fontWeight={800}>
                    {t("certificatesUpload.placementSection", "Text placement")}
                  </Typography>
                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={selectedField}
                    onChange={(_, v) => {
                      if (v) setSelectedField(v as CertificateFieldName);
                    }}
                    sx={{
                      flexWrap: "wrap",
                      gap: 0.5,
                      "& .MuiToggleButton-root": {
                        textTransform: "none",
                        borderRadius: "8px !important",
                        border: "1px solid !important",
                        borderColor: `${alpha(theme.palette.divider, 0.9)} !important`,
                        px: 1.25,
                        py: 0.5,
                        fontSize: 12.5,
                        fontWeight: 700,
                      },
                    }}
                  >
                    {FIELD_ORDER.map((field) => (
                      <ToggleButton key={field} value={field}>
                        {t(`certificatesUpload.field_${field}`, field)}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>

                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1.5}>
                      <TextField
                        size="small"
                        type="number"
                        label={t("certificatesUpload.placementX", "Across (%)")}
                        value={Math.round(placements[selectedField].x * 100)}
                        onChange={(e) =>
                          patchPlacement(selectedField, {
                            x: Math.min(1, Math.max(0, Number(e.target.value) / 100)),
                          })
                        }
                        fullWidth
                        InputProps={{ sx: { borderRadius: 2 } }}
                      />
                      <TextField
                        size="small"
                        type="number"
                        label={t("certificatesUpload.placementY", "Down (%)")}
                        value={Math.round(placements[selectedField].y * 100)}
                        onChange={(e) =>
                          patchPlacement(selectedField, {
                            y: Math.min(1, Math.max(0, Number(e.target.value) / 100)),
                          })
                        }
                        fullWidth
                        InputProps={{ sx: { borderRadius: 2 } }}
                      />
                    </Stack>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        {t("certificatesUpload.placementSize", "Text size")}
                      </Typography>
                      <Slider
                        size="small"
                        min={10}
                        max={80}
                        value={placements[selectedField].size}
                        valueLabelDisplay="auto"
                        onChange={(_, v) =>
                          patchPlacement(selectedField, { size: Array.isArray(v) ? v[0] : v })
                        }
                      />
                    </Box>
                    <Stack direction="row" spacing={1.5}>
                      <TextField
                        select
                        size="small"
                        label={t("certificatesUpload.placementWeight", "Weight")}
                        value={placements[selectedField].weight}
                        onChange={(e) =>
                          patchPlacement(selectedField, { weight: Number(e.target.value) })
                        }
                        fullWidth
                        InputProps={{ sx: { borderRadius: 2 } }}
                      >
                        {WEIGHT_CHOICES.map((w) => (
                          <MenuItem key={w} value={w}>
                            {w}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        select
                        size="small"
                        label={t("certificatesUpload.placementFont", "Typeface")}
                        value={placements[selectedField].font}
                        onChange={(e) => patchPlacement(selectedField, { font: e.target.value })}
                        fullWidth
                        InputProps={{ sx: { borderRadius: 2 } }}
                      >
                        {FONT_CHOICES.map((f) => (
                          <MenuItem key={f.value} value={f.value}>
                            {f.label}
                          </MenuItem>
                        ))}
                        {FONT_CHOICES.every((f) => f.value !== placements[selectedField].font) ? (
                          <MenuItem value={placements[selectedField].font}>
                            {t("certificatesUpload.fontCustom", "Custom")}
                          </MenuItem>
                        ) : null}
                      </TextField>
                    </Stack>
                    <ToggleButtonGroup
                      exclusive
                      size="small"
                      fullWidth
                      value={placements[selectedField].align}
                      onChange={(_, v) => {
                        if (v) patchPlacement(selectedField, { align: v as "left" | "center" | "right" });
                      }}
                      sx={{ "& .MuiToggleButton-root": { borderRadius: 2 } }}
                    >
                      <ToggleButton value="left">
                        <IconWrapper icon="mdi:format-align-left" size={18} />
                      </ToggleButton>
                      <ToggleButton value="center">
                        <IconWrapper icon="mdi:format-align-center" size={18} />
                      </ToggleButton>
                      <ToggleButton value="right">
                        <IconWrapper icon="mdi:format-align-right" size={18} />
                      </ToggleButton>
                    </ToggleButtonGroup>
                    <ColorField
                      label={t("certificatesUpload.placementColor", "Text colour")}
                      value={placements[selectedField].color}
                      onChange={(color) => patchPlacement(selectedField, { color })}
                    />
                  </Stack>
                </>
              ) : (
                <>
                  <Box>
                    <Typography variant="overline" sx={{ fontWeight: 800, color: "text.secondary" }}>
                      {t("certificatesUpload.fieldPreset", "Preset")}
                    </Typography>
                    <Box
                      sx={{
                        mt: 1,
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))",
                        gap: 1,
                      }}
                    >
                      {CERTIFICATE_PRESET_ORDER.map((slug) => {
                        const item = CERTIFICATE_PRESETS[slug];
                        const active = slug === preset.slug;
                        return (
                          <Tooltip key={slug} title={item.label}>
                            <Box
                              role="button"
                              tabIndex={0}
                              onClick={() =>
                                patch({
                                  preset: slug,
                                  // The ornament level follows the preset unless the admin
                                  // has already moved the slider: switching preset should
                                  // feel like picking a finished look, not like keeping
                                  // the last one's ornamentation.
                                  ornamentLevel: item.ornamentLevel,
                                  palette: null,
                                })
                              }
                              onKeyDown={(e: React.KeyboardEvent) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  patch({ preset: slug, ornamentLevel: item.ornamentLevel, palette: null });
                                }
                              }}
                              sx={{
                                cursor: "pointer",
                                borderRadius: 2,
                                p: 0.5,
                                border: "2px solid",
                                borderColor: active
                                  ? theme.palette.warning.main
                                  : alpha(theme.palette.divider, 0.8),
                                transition: theme.transitions.create(["border-color", "transform"]),
                                "&:hover": { transform: "translateY(-1px)" },
                              }}
                            >
                              <Box
                                sx={{
                                  height: 34,
                                  borderRadius: 1,
                                  background: item.palette.bg,
                                  display: "grid",
                                  placeItems: "center",
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: "50%",
                                    background: `linear-gradient(135deg, ${item.palette.accent}, ${item.palette.metal})`,
                                    boxShadow: `0 0 0 2px ${alpha(item.palette.frame, 0.9)}`,
                                  }}
                                />
                              </Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  display: "block",
                                  mt: 0.4,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  textAlign: "center",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {item.label}
                              </Typography>
                            </Box>
                          </Tooltip>
                        );
                      })}
                    </Box>
                    {preset.brandAccent ? (
                      <Chip
                        size="small"
                        sx={{ mt: 1, borderRadius: 1.5 }}
                        variant="outlined"
                        icon={<IconWrapper icon="mdi:palette-swatch-outline" size={14} />}
                        label={t(
                          "certificatesUpload.brandAccentNote",
                          "Uses your workspace colour",
                        )}
                      />
                    ) : null}
                  </Box>

                  <Box>
                    <Typography variant="overline" sx={{ fontWeight: 800, color: "text.secondary" }}>
                      {t("certificatesUpload.fieldLayout", "Layout")}
                    </Typography>
                    <ToggleButtonGroup
                      exclusive
                      fullWidth
                      size="small"
                      value={draft.layout ?? "classic"}
                      onChange={(_, v) => {
                        if (v) patch({ layout: v as CertificateLayout });
                      }}
                      sx={{
                        mt: 0.75,
                        "& .MuiToggleButton-root": {
                          textTransform: "none",
                          fontWeight: 700,
                          borderRadius: 2,
                          flexDirection: "column",
                          gap: 0.25,
                          py: 1,
                        },
                      }}
                    >
                      {LAYOUTS.map((l) => (
                        <ToggleButton key={l.value} value={l.value}>
                          <IconWrapper icon={l.icon} size={20} />
                          <Box component="span" sx={{ fontSize: 12 }}>
                            {t(`certificatesUpload.layout_${l.value}`, l.value)}
                          </Box>
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </Box>

                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="overline" sx={{ fontWeight: 800, color: "text.secondary" }}>
                        {t("certificatesUpload.fieldOrnament", "Ornamentation")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        {draft.ornamentLevel ?? preset.ornamentLevel} / 7
                      </Typography>
                    </Stack>
                    <Slider
                      size="small"
                      min={1}
                      max={7}
                      step={1}
                      marks
                      value={draft.ornamentLevel ?? preset.ornamentLevel}
                      onChange={(_, v) =>
                        patch({
                          ornamentLevel: (Array.isArray(v) ? v[0] : v) as CertificateOrnamentLevel,
                        })
                      }
                      sx={{ color: "warning.main" }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {t(
                        "certificatesUpload.ornamentHelp",
                        "1 is a single hairline rule. 7 adds guilloche, laurels and a scalloped seal.",
                      )}
                    </Typography>
                  </Box>
                </>
              )}

              <Divider />
              <Typography variant="subtitle2" fontWeight={800}>
                {t("certificatesUpload.copySection", "Wording")}
              </Typography>
              <TextField
                label={t("certificatesUpload.fieldTitle", "Heading")}
                value={draft.title ?? ""}
                onChange={(e) => patch({ title: e.target.value })}
                fullWidth
                size="small"
                InputProps={{ sx: { borderRadius: 2 } }}
              />
              <TextField
                label={t("certificatesUpload.fieldTagline", "Tagline")}
                value={draft.tagline ?? ""}
                onChange={(e) => patch({ tagline: e.target.value })}
                fullWidth
                size="small"
                InputProps={{ sx: { borderRadius: 2 } }}
              />
              <Stack direction="row" spacing={1.5}>
                <TextField
                  label={t("certificatesUpload.fieldBandLabel", "Band label")}
                  value={draft.bandLabel ?? ""}
                  onChange={(e) => patch({ bandLabel: e.target.value.toUpperCase() })}
                  fullWidth
                  size="small"
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
                <TextField
                  label={t("certificatesUpload.fieldSealCode", "Seal code")}
                  value={draft.sealCode ?? ""}
                  onChange={(e) =>
                    patch({ sealCode: e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() })
                  }
                  size="small"
                  sx={{ width: 130 }}
                  inputProps={{ maxLength: 2 }}
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
              </Stack>

              {!isUpload ? (
                <Accordion
                  disableGutters
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor: alpha(theme.palette.divider, 0.8),
                    borderRadius: "12px !important",
                    "&::before": { display: "none" },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<IconWrapper icon="mdi:chevron-down" size={22} />}
                    sx={{ px: 1.75 }}
                  >
                    <Typography variant="subtitle2" fontWeight={800}>
                      {t("certificatesUpload.paletteSection", "Colour overrides")}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 1.75, pb: 2 }}>
                    <Stack spacing={1.5}>
                      <Typography variant="caption" color="text.secondary">
                        {t(
                          "certificatesUpload.paletteHelp",
                          "Change only what you need. Anything you leave alone keeps following the preset, so a rebrand still reaches this design.",
                        )}
                      </Typography>
                      <TextField
                        size="small"
                        label={t("certificatesUpload.paletteBg", "Background (any CSS value)")}
                        value={draft.palette?.bg ?? effectivePalette.bg}
                        onChange={(e) =>
                          patch({ palette: { ...(draft.palette ?? {}), bg: e.target.value } })
                        }
                        fullWidth
                        multiline
                        maxRows={3}
                        InputProps={{
                          sx: { borderRadius: 2, fontFamily: "ui-monospace, monospace", fontSize: 12 },
                        }}
                      />
                      {PALETTE_SWATCH_TOKENS.map((token) => (
                        <ColorField
                          key={token}
                          label={t(`certificatesUpload.palette_${token}`, token)}
                          value={effectivePalette[token]}
                          onChange={(next) =>
                            patch({ palette: { ...(draft.palette ?? {}), [token]: next } })
                          }
                          onReset={
                            draft.palette && token in draft.palette
                              ? () => {
                                  const rest = { ...(draft.palette ?? {}) };
                                  delete rest[token];
                                  patch({ palette: Object.keys(rest).length ? rest : null });
                                }
                              : undefined
                          }
                        />
                      ))}
                      <Button
                        size="small"
                        startIcon={<IconWrapper icon="mdi:backup-restore" size={18} />}
                        onClick={() => patch({ palette: null })}
                        disabled={!draft.palette}
                        sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
                      >
                        {t("certificatesUpload.paletteReset", "Back to the preset colours")}
                      </Button>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ) : null}

              <FormControlLabel
                control={
                  <Switch
                    checked={draft.is_active ?? true}
                    onChange={(e) => patch({ is_active: e.target.checked })}
                  />
                }
                label={
                  <Typography variant="body2" fontWeight={700}>
                    {t("certificatesUpload.activeToggle", "Available for new certificates")}
                  </Typography>
                }
              />

              {errors.length > 0 && touched ? (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  <Stack spacing={0.25}>
                    {errors.map((message) => (
                      <Typography key={message} variant="body2">
                        {message}
                      </Typography>
                    ))}
                  </Stack>
                </Alert>
              ) : null}
            </Stack>
          </Box>

          {/* ---------------- live preview ---------------- */}
          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.05 : 0.03),
              position: { md: "sticky" },
              top: 0,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <IconWrapper icon="mdi:eye-outline" size={18} />
              <Typography variant="subtitle2" fontWeight={800}>
                {t("certificatesUpload.livePreview", "Live preview")}
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Typography variant="caption" color="text.secondary">
                {t("certificatesUpload.previewSampleNote", "Sample recipient and sample course")}
              </Typography>
            </Stack>

            <Box ref={stageRef} sx={{ position: "relative", width: "100%" }}>
              <CertificatePreview payload={payload} labels={labels} radius={10} />

              {/* Placement handles ride on top of the preview at the same
                  fractional coordinates the artwork draws with, so what the
                  admin drags is literally where the text lands. */}
              {isUpload && stageWidth > 0
                ? FIELD_ORDER.map((field) => {
                    const place = placements[field];
                    const active = field === selectedField;
                    return (
                      <Box
                        key={field}
                        onPointerDown={startDrag(field)}
                        sx={{
                          position: "absolute",
                          left: place.x * stageWidth,
                          top: place.y * stageHeight,
                          transform: "translate(-50%, -50%)",
                          px: 1,
                          py: 0.35,
                          borderRadius: 1.5,
                          cursor: "grab",
                          touchAction: "none",
                          userSelect: "none",
                          fontSize: 11,
                          fontWeight: 800,
                          whiteSpace: "nowrap",
                          color: active ? "#fff" : theme.palette.text.primary,
                          bgcolor: active
                            ? theme.palette.warning.main
                            : alpha(theme.palette.background.paper, 0.88),
                          border: "1px solid",
                          borderColor: active
                            ? theme.palette.warning.dark
                            : alpha(theme.palette.divider, 0.9),
                          boxShadow: "0 4px 12px rgba(15,23,42,0.24)",
                          "&:active": { cursor: "grabbing" },
                        }}
                      >
                        {t(`certificatesUpload.field_${field}`, field)}
                      </Box>
                    );
                  })
                : null}
            </Box>

            {isUpload ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1.5 }}
              >
                {t(
                  "certificatesUpload.dragHint",
                  "Drag any chip onto the artwork to place that line of text.",
                )}
              </Typography>
            ) : null}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={() => onClose()} sx={{ textTransform: "none", fontWeight: 700 }}>
          {t("common.cancel", "Cancel")}
        </Button>
        <LoadingButton
          variant="contained"
          onClick={() => {
            setTouched(true);
            if (errors.length === 0) save.mutate();
          }}
          loading={save.isPending}
          disabled={touched && errors.length > 0}
          startIcon={<IconWrapper icon="mdi:content-save-outline" size={20} />}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 800, px: 3 }}
        >
          {draft.id
            ? t("certificatesUpload.saveChanges", "Save changes")
            : t("certificatesUpload.createTemplate", "Create template")}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
