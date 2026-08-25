"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { CertificatePreview } from "@/components/certificate/CertificatePreview";
import { useCertificateArtworkLabels } from "@/components/certificate/CertificateArtwork";
import { adminCertificatesService } from "@/lib/services/certificates.service";
import { getPreset } from "@/lib/certificates/presets";
import type {
  CertificateSourceKind,
  CertificateTemplate,
} from "@/lib/certificates/types";

/** A default is per SOURCE KIND, so "Default" on its own would be ambiguous. */
const DEFAULT_FOR_LABEL: Record<CertificateSourceKind, string> = {
  adaptive_course: "Course default",
  assessment: "Assessment default",
  points: "Ladder default",
};
import {
  buildTemplatePreviewPayload,
  useCertificateIssuer,
  type TemplatePreviewContext,
} from "./previewPayload";
import { MetaPill } from "./shared";

/**
 * Picking a certificate design, the same way in every module.
 *
 * The reason this is a shared field rather than a dropdown copied into each
 * authoring screen: a certificate design is not a setting an admin can reason
 * about from its name. "Brand Obsidian" tells you nothing; the artwork tells
 * you everything. So the field IS the artwork, rendered at the tenant's own
 * branding, and the gallery behind "Change" is a wall of real certificates
 * rather than a list of slugs.
 */

/* ------------------------------------------------------------------ *
 * Loading the tenant's templates
 * ------------------------------------------------------------------ */

export interface CertificateTemplatesState {
  templates: CertificateTemplate[];
  loading: boolean;
  /** True when the list could not be loaded at all, as opposed to loading fine
   *  and being empty. The two need different empty states: one is "create a
   *  design", the other is "something is broken". */
  failed: boolean;
  reload: () => void;
}

/**
 * Load a tenant's certificate designs once, high up, and pass the array down.
 *
 * Every rule row renders a picker, and a picker that fetched its own list would
 * mean one request per row plus one per gallery open. The list is small,
 * changes rarely, and is identical for every picker on the page, so the module
 * that owns the screen fetches it and hands it to every field.
 */
export function useCertificateTemplates(
  clientId: string | number,
  enabled = true,
): CertificateTemplatesState {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [failed, setFailed] = useState(false);
  const [nonce, setNonce] = useState(0);
  /** The request that has finished. Loading is DERIVED from it rather than
   *  held as its own flag, because a `setLoading(true)` at the top of the
   *  effect is a synchronous setState inside an effect: a cascading render on
   *  every mount, and one React's own lint rule rejects outright. */
  const [settledKey, setSettledKey] = useState<string | null>(null);
  const requestKey = `${clientId}|${nonce}`;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void adminCertificatesService
      .listTemplates(clientId)
      .then((list) => {
        if (cancelled) return;
        setTemplates(list);
        setFailed(false);
      })
      .catch(() => {
        if (cancelled) return;
        // Keep the field usable: an admin whose designs failed to load can
        // still see the default certificate rather than an empty box.
        setTemplates([]);
        setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setSettledKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId, enabled, requestKey]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { templates, loading: enabled && settledKey !== requestKey, failed, reload };
}

/* ------------------------------------------------------------------ *
 * The field
 * ------------------------------------------------------------------ */

export interface TemplatePickerFieldProps {
  templates: CertificateTemplate[];
  loading?: boolean;
  /** The chosen template id. Null means the default branded certificate. */
  value: number | null;
  onChange: (templateId: number | null) => void;
  /** Course or assessment context so the miniature shows the real title. */
  previewContext?: TemplatePreviewContext;
  label?: string;
  helperText?: string;
  disabled?: boolean;
  /** "featured" is the headline design choice on a page; "compact" sits in a
   *  rule row next to a threshold field. */
  variant?: "featured" | "compact";
  /** Offer "default branded certificate" as a choice in the gallery. */
  allowDefault?: boolean;
}

const LAYOUT_LABEL_KEYS: Record<string, [string, string]> = {
  classic: ["certificatesUpload.pickerLayoutClassic", "Classic"],
  panel: ["certificatesUpload.pickerLayoutPanel", "Panel"],
  minimal: ["certificatesUpload.pickerLayoutMinimal", "Minimal"],
};

/**
 * This field is a GUEST on two screens that look nothing alike: the adaptive-course
 * admin page and the assessment settings accordion. So it is expressed in the admin
 * dialect's CSS custom properties (`var(--card-bg)`, `var(--border-default)`,
 * `var(--font-secondary)`) rather than in either host's literal palette, which is what
 * both hosts already use for their own chrome. It reads native in each and imports
 * nothing from either.
 *
 * It used to call `useTheme()` + `alpha()` instead. That looked theme-aware and was not:
 * `palette.mode` is never "dark" in this app, `palette.divider` is MUI's untouched
 * rgba(0,0,0,0.12), and `palette.primary.main` is tenant-overridable - so the SELECTED
 * state of a certificate design was painted in whatever blue the tenant happens to have
 * configured, never in the product's violet.
 */
export function TemplatePickerField({
  templates,
  loading = false,
  value,
  onChange,
  previewContext,
  label,
  helperText,
  disabled = false,
  variant = "compact",
  allowDefault = true,
}: TemplatePickerFieldProps) {
  const { t } = useTranslation("common");
  const issuer = useCertificateIssuer();
  const artLabels = useCertificateArtworkLabels();
  const [galleryOpen, setGalleryOpen] = useState(false);

  const featured = variant === "featured";
  const selected = useMemo(
    () => templates.find((tpl) => tpl.id === value) ?? null,
    [templates, value],
  );

  // An archived design must not be offered: the rule and tier write validators
  // reject binding one outright, so choosing it here would produce a 400 the
  // admin cannot interpret. A template ALREADY bound and since archived still
  // shows above, because the rule still points at it and they need to see that.
  const selectable = useMemo(
    () => templates.filter((tpl) => !tpl.is_archived),
    [templates],
  );

  // A template id that is no longer in the list (deleted, or deactivated) must
  // not silently render as "default design": the rule still points at it on the
  // server and the admin needs to see that it has gone missing.
  const missing = value != null && !selected;

  const payloadFor = useCallback(
    (template: CertificateTemplate | null) =>
      buildTemplatePreviewPayload(template, issuer, previewContext),
    [issuer, previewContext],
  );

  const selectedName = selected
    ? selected.name
    : allowDefault
      ? t("certificatesUpload.pickerDefaultName", "Default branded certificate")
      : t("certificatesUpload.pickerUnset", "No design chosen yet");

  const selectedHint = selected
    ? [
        getPreset(selected.preset).label,
        selected.kind === "upload"
          ? t("certificatesUpload.pickerKindUpload", "Uploaded artwork")
          : t(
              LAYOUT_LABEL_KEYS[selected.layout]?.[0] ??
                "certificatesUpload.pickerLayoutClassic",
              LAYOUT_LABEL_KEYS[selected.layout]?.[1] ?? "Classic",
            ),
      ].join(" · ")
    : allowDefault
      ? t(
          "certificatesUpload.pickerDefaultHint",
          "The platform design, in your institution's colours.",
        )
      : t(
          "certificatesUpload.pickerUnsetHint",
          "Pick a design for this band. A band with no design awards nothing.",
        );

  const choose = (templateId: number | null) => {
    onChange(templateId);
    setGalleryOpen(false);
  };

  return (
    <Box>
      {label ? (
        <Typography
          sx={{
            fontSize: "0.72rem",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--font-tertiary)",
            mb: 0.75,
            '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
          }}
        >
          {label}
        </Typography>
      ) : null}

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          gap: featured ? 2.25 : 1.75,
          p: featured ? 2 : 1.5,
          borderRadius: 2.5,
          bgcolor: "var(--surface)",
          border: "1px solid var(--border-default)",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <Box sx={{ width: { xs: "100%", sm: featured ? 300 : 176 }, flexShrink: 0 }}>
          {loading ? (
            <Skeleton
              variant="rectangular"
              sx={{ width: "100%", aspectRatio: "1000 / 707", borderRadius: 2 }}
            />
          ) : (
            <CertificatePreview
              payload={payloadFor(selected)}
              labels={artLabels}
              radius={8}
              elevated={false}
              wrapperStyle={{ border: "1px solid var(--border-default)" }}
            />
          )}
        </Box>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: featured ? "1rem" : "0.9rem",
                lineHeight: 1.25,
                color: "var(--font-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {loading
                ? t("certificatesUpload.loadingList", "Loading…")
                : missing
                  ? t("certificatesUpload.pickerMissing", "Design no longer available")
                  : selectedName}
            </Typography>
            {selected?.default_for ? (
              /* Named, because "Default" alone is ambiguous now that a tenant
                 can hold one default per source kind. */
              <MetaPill
                color="var(--ai-violet)"
                label={t(
                  `certificatesUpload.defaultFor_${selected.default_for}`,
                  DEFAULT_FOR_LABEL[selected.default_for],
                )}
              />
            ) : null}
            {selected?.is_archived ? (
              /* Was `color="warning"`, i.e. MUI's factory orange #ed6c02. */
              <MetaPill label={t("certificatesUpload.pickerArchivedChip", "Archived")} />
            ) : null}
          </Stack>

          <Typography sx={{ fontSize: "0.78rem", color: "var(--font-secondary)" }}>
            {missing
              ? t(
                  "certificatesUpload.pickerMissingHint",
                  "The design this was set to has been removed. Pick another one.",
                )
              : selectedHint}
          </Typography>

          {helperText ? (
            <Typography sx={{ fontSize: "0.75rem", color: "var(--font-secondary)", mt: 0.75 }}>
              {helperText}
            </Typography>
          ) : null}

          <Button
            size="small"
            variant="outlined"
            disabled={disabled || loading}
            onClick={() => setGalleryOpen(true)}
            startIcon={<IconWrapper icon="mdi:view-grid-outline" size={16} />}
            sx={{
              mt: 1.25,
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              borderColor: "var(--border-default)",
              color: "var(--ai-violet)",
              "&:hover": {
                borderColor: "color-mix(in srgb, var(--ai-violet) 45%, var(--border-default))",
                bgcolor: "color-mix(in srgb, var(--ai-violet) 6%, transparent)",
              },
            }}
          >
            {t("certificatesUpload.pickerChange", "Change")}
          </Button>
        </Box>
      </Box>

      <Dialog
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        maxWidth="lg"
        fullWidth
        // Certificates are wide; a dialog that scrolls its own body keeps the
        // gallery header in place while an admin scans a long wall of designs.
        scroll="paper"
        PaperProps={{ sx: { borderRadius: { xs: 0, sm: 4 }, bgcolor: "var(--card-bg)" } }}
      >
        <DialogTitle sx={{ pr: 6 }}>
          <Typography
            component="span"
            sx={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--font-primary)" }}
          >
            {t("certificatesUpload.pickerDialogTitle", "Choose a certificate design")}
          </Typography>
          <Typography sx={{ fontSize: "0.82rem", color: "var(--font-secondary)", mt: 0.25 }}>
            {t(
              "certificatesUpload.pickerDialogHint",
              "Every design carries your institution's name, logo and colour. Previews use a sample learner.",
            )}
          </Typography>
          <IconButton
            onClick={() => setGalleryOpen(false)}
            sx={{ position: "absolute", insetInlineEnd: 12, top: 12, color: "var(--font-tertiary)" }}
            aria-label={t("certificatesUpload.pickerClose", "Close")}
          >
            <IconWrapper icon="mdi:close" size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              },
              gap: 2,
            }}
          >
            {allowDefault ? (
              <GalleryCard
                name={t(
                  "certificatesUpload.pickerDefaultName",
                  "Default branded certificate",
                )}
                hint={t(
                  "certificatesUpload.pickerDefaultHint",
                  "The platform design, in your institution's colours.",
                )}
                selected={value == null}
                onSelect={() => choose(null)}
                payload={payloadFor(null)}
                labels={artLabels}
                selectedCopy={t("certificatesUpload.pickerSelected", "Selected")}
              />
            ) : null}

            {selectable.map((tpl) => (
              <GalleryCard
                key={tpl.id}
                name={tpl.name}
                hint={[
                  getPreset(tpl.preset).label,
                  tpl.kind === "upload"
                    ? t("certificatesUpload.pickerKindUpload", "Uploaded artwork")
                    : t(
                        LAYOUT_LABEL_KEYS[tpl.layout]?.[0] ??
                          "certificatesUpload.pickerLayoutClassic",
                        LAYOUT_LABEL_KEYS[tpl.layout]?.[1] ?? "Classic",
                      ),
                ].join(" · ")}
                selected={value === tpl.id}
                onSelect={() => choose(tpl.id)}
                payload={payloadFor(tpl)}
                labels={artLabels}
                selectedCopy={t("certificatesUpload.pickerSelected", "Selected")}
              />
            ))}
          </Box>

          {selectable.length === 0 && !loading ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "var(--font-primary)", mb: 0.5 }}>
                {t("certificatesUpload.pickerEmptyTitle", "No custom designs yet")}
              </Typography>
              <Typography sx={{ fontSize: "0.875rem", color: "var(--font-secondary)" }}>
                {t(
                  "certificatesUpload.pickerEmptyBody",
                  "Build designs in the certificates module and they appear here for every course and assessment.",
                )}
              </Typography>
            </Box>
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

/* ------------------------------------------------------------------ *
 * One card in the gallery
 * ------------------------------------------------------------------ */

function GalleryCard({
  name,
  hint,
  selected,
  onSelect,
  payload,
  labels,
  selectedCopy,
}: {
  name: string;
  hint: string;
  selected: boolean;
  onSelect: () => void;
  payload: ReturnType<typeof buildTemplatePreviewPayload>;
  labels: ReturnType<typeof useCertificateArtworkLabels>;
  selectedCopy: string;
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      sx={{
        p: 1.25,
        textAlign: "start",
        cursor: "pointer",
        borderRadius: "var(--radius-card)",
        font: "inherit",
        // Selected is VIOLET, not `palette.primary.main`: that one is overridden
        // per tenant, so the chosen design used to be outlined in whatever blue a
        // given institution had configured.
        bgcolor: selected
          ? "color-mix(in srgb, var(--ai-violet) 8%, var(--card-bg) 92%)"
          : "var(--surface)",
        border: `2px solid ${selected ? "var(--ai-violet)" : "var(--border-default)"}`,
        transition: "border-color 0.15s ease, background-color 0.15s ease",
        "&:hover": { borderColor: "var(--ai-violet)" },
        "&:focus-visible": {
          outline: "2px solid var(--ai-violet)",
          outlineOffset: "2px",
        },
      }}
    >
      <CertificatePreview payload={payload} labels={labels} radius={6} elevated={false} />
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{ mt: 1 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: "0.88rem",
              color: "var(--font-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "var(--font-secondary)" }}>
            {hint}
          </Typography>
        </Box>
        {selected ? <MetaPill color="var(--ai-violet)" label={selectedCopy} /> : null}
      </Stack>
    </Box>
  );
}
