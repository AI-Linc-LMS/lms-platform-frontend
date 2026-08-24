"use client";

import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  CERTIFICATE_PRESETS,
  getPreset,
  resolvePalette,
} from "@/lib/certificates/presets";
import { PREVIEW_RECIPIENT_NAME } from "./previewPayload";
import type {
  CertificateDesign,
  CertificateFieldPlacements,
  CertificateIssuer,
  CertificateLayout,
  CertificateMetric,
  CertificateOrnamentLevel,
  CertificatePalette,
  CertificatePresetSlug,
  CertificateRenderPayload,
  CertificateSourceKind,
  CertificateStatus,
  CertificateTemplate,
} from "@/lib/certificates/types";

/**
 * The pieces every tab of the admin certificates hub shares: react-query keys,
 * the tenant's issuer identity, and the local render payload that lets a
 * template preview repaint on every keystroke.
 *
 * Why a LOCAL payload builder when the backend exposes
 * `admin/clients/<cid>/preview/`: the design editor changes preset, layout,
 * ornament level, band label and eleven palette tokens, and a round trip per
 * change makes the picker feel broken. The server preview is still the right
 * call for "show me exactly what a learner gets" on a SAVED template; this is
 * for the unsaved draft under the admin's cursor.
 */

/* ------------------------------------------------------------------ *
 * Query keys
 * ------------------------------------------------------------------ */

/**
 * Every key is scoped by client id. The QueryClient cache is persisted to
 * localStorage and only cleared on an auth change, so an admin who switches
 * tenant inside one session would otherwise read the previous tenant's
 * templates out of cache.
 */
export const certificateAdminKeys = {
  all: (clientId: string | number) => ["certificates", "admin", String(clientId)] as const,
  overview: (clientId: string | number) =>
    [...certificateAdminKeys.all(clientId), "overview"] as const,
  presets: (clientId: string | number) =>
    [...certificateAdminKeys.all(clientId), "presets"] as const,
  templates: (clientId: string | number) =>
    [...certificateAdminKeys.all(clientId), "templates"] as const,
  tiers: (clientId: string | number) =>
    [...certificateAdminKeys.all(clientId), "tiers"] as const,
  rules: (
    clientId: string | number,
    scope: string,
    objectId: number | null,
  ) => [...certificateAdminKeys.all(clientId), "rules", scope, objectId] as const,
  issued: (clientId: string | number, query: Record<string, unknown>) =>
    [...certificateAdminKeys.all(clientId), "issued", query] as const,
  adaptiveCourses: () => ["certificates", "admin", "adaptive-courses"] as const,
  assessments: (clientId: string | number) =>
    [...certificateAdminKeys.all(clientId), "assessments"] as const,
};

/* ------------------------------------------------------------------ *
 * Issuer identity
 * ------------------------------------------------------------------ */

/** One sample recipient across every preview surface in the module, so the
 *  card miniature, the editor and the assignment preview all show the same
 *  name at the same type size. */
export { PREVIEW_RECIPIENT_NAME };

/**
 * The tenant identity every certificate carries.
 *
 * Re-exported from previewPayload.ts rather than reimplemented, because that
 * module routes through buildCertificateBranding, which already knows the
 * several shapes a client row arrives in (nested theme_settings.colors, flat
 * theme keys, two different logo fields). A second reader here would quietly
 * disagree with the learner-facing certificate for any tenant that stores its
 * branding the other way, and the admin would be approving a design that is
 * not what gets issued.
 */
export { useCertificateIssuer } from "./previewPayload";

/* ------------------------------------------------------------------ *
 * Draft -> design -> render payload
 * ------------------------------------------------------------------ */

/**
 * What the editor holds while the admin types. Every field optional because the
 * dialog is also open on a template that does not exist yet, and because a
 * backend that omits an optional template key must not blank the preview.
 */
export interface TemplateDraft {
  id?: number;
  name?: string;
  kind?: CertificateTemplate["kind"];
  layout?: CertificateLayout;
  preset?: CertificatePresetSlug;
  title?: string;
  tagline?: string;
  bandLabel?: string;
  sealCode?: string;
  ornamentLevel?: CertificateOrnamentLevel;
  palette?: Partial<CertificatePalette> | null;
  backgroundUrl?: string | null;
  fieldPlacements?: CertificateFieldPlacements | null;
  is_default?: boolean;
  is_active?: boolean;
}

/** A brand-new template, pre-filled from a preset so the first preview is a
 *  finished-looking certificate rather than an empty frame. */
export function draftFromPreset(slug: CertificatePresetSlug): TemplateDraft {
  const preset = CERTIFICATE_PRESETS[slug];
  return {
    name: `${preset.label} certificate`,
    kind: "design",
    layout: slug === "brand-minimal" ? "minimal" : "classic",
    preset: slug,
    title: "Certificate of Completion",
    tagline: "for outstanding dedication and achievement",
    bandLabel: "CERTIFICATE OF COMPLETION",
    sealCode: "CO",
    ornamentLevel: preset.ornamentLevel,
    palette: null,
    backgroundUrl: null,
    fieldPlacements: null,
    is_active: true,
  };
}

export function draftFromTemplate(template: CertificateTemplate): TemplateDraft {
  const preset = getPreset(template.preset);
  return {
    id: template.id,
    name: template.name,
    kind: template.kind,
    layout: template.layout,
    preset: preset.slug,
    title: template.title,
    tagline: template.tagline,
    bandLabel: template.bandLabel ?? "",
    sealCode: template.sealCode ?? "",
    ornamentLevel: template.ornamentLevel ?? preset.ornamentLevel,
    palette: template.palette ?? null,
    backgroundUrl: template.backgroundUrl ?? null,
    fieldPlacements: template.fieldPlacements ?? null,
    is_default: template.is_default,
    is_active: template.is_active ?? true,
  };
}

/**
 * The drawing parameters for a draft.
 *
 * Order matters: the preset supplies the base palette, `resolvePalette`
 * substitutes the tenant accent for a brand preset, and only then do the
 * admin's own token overrides land on top. Any other order and an admin who
 * hand-picked an accent would watch the tenant colour overwrite it.
 */
export function designFromDraft(
  draft: TemplateDraft,
  accent: string,
): CertificateDesign {
  const preset = getPreset(draft.preset);
  const base = resolvePalette({ preset: preset.slug }, accent);
  const palette: CertificatePalette = { ...base, ...(draft.palette ?? {}) };
  return {
    kind: draft.kind ?? "design",
    layout: draft.layout ?? "classic",
    preset: preset.slug,
    dark: preset.dark,
    palette,
    metalLabel: preset.metalLabel,
    ornamentLevel: draft.ornamentLevel ?? preset.ornamentLevel,
    bandLabel: draft.bandLabel?.trim() || preset.label.toUpperCase(),
    sealCode: (draft.sealCode?.trim() || "CO").slice(0, 2).toUpperCase(),
    backgroundUrl: draft.backgroundUrl ?? null,
    fieldPlacements: draft.fieldPlacements ?? null,
  };
}

export interface PreviewPayloadOptions {
  recipientName?: string;
  /** The big display line: what the certificate was earned FOR. */
  subtitle?: string;
  sourceKind?: CertificateSourceKind;
  sourceLabel?: string;
  metrics?: CertificateMetric[];
  status?: CertificateStatus;
  credentialId?: string;
  issuedAt?: string;
  verifyUrl?: string;
}

/**
 * A complete render payload for an unsaved draft, with a plausible recipient.
 *
 * The credential id is deliberately stamped PREVIEW rather than a random
 * lookalike: an admin who screenshots this and files it as a real credential
 * should get an id that fails verification loudly instead of one that looks
 * issued.
 */
export function previewPayloadFromDraft(
  draft: TemplateDraft,
  issuer: CertificateIssuer,
  options: PreviewPayloadOptions = {},
): CertificateRenderPayload {
  const design = designFromDraft(draft, issuer.accent);
  const credentialId =
    options.credentialId ?? `AILINC-${design.sealCode}-PREVIEW001`;
  return {
    credential_id: credentialId,
    status: options.status ?? "issued",
    title: draft.title?.trim() || "Certificate of Completion",
    subtitle: options.subtitle ?? "Data Structures and Algorithms",
    tagline: draft.tagline?.trim() || "",
    recipient_name: options.recipientName ?? PREVIEW_RECIPIENT_NAME,
    issued_at: options.issuedAt ?? new Date().toISOString(),
    verify_url: options.verifyUrl ?? `https://verify.example.com/${credentialId}`,
    issuer,
    source: {
      kind: options.sourceKind ?? "adaptive_course",
      id: null,
      label: options.sourceLabel ?? "Data Structures and Algorithms",
    },
    metrics: options.metrics ?? [{ label: "Completion", value: "100%" }],
    design,
  };
}

/** The payload for a template row, used by the card miniatures. */
export function previewPayloadFromTemplate(
  template: CertificateTemplate,
  issuer: CertificateIssuer,
  options: PreviewPayloadOptions = {},
): CertificateRenderPayload {
  return previewPayloadFromDraft(draftFromTemplate(template), issuer, options);
}

/* ------------------------------------------------------------------ *
 * Shared UI atoms
 * ------------------------------------------------------------------ */

/**
 * A real empty state: an icon, a headline, a sentence explaining what the
 * surface is for, and somewhere to go next. A bare "no data" line tells an
 * admin nothing about whether the module is broken or simply unused.
 */
export function EmptyState({
  icon,
  title,
  body,
  action,
  dense = false,
}: {
  icon: string;
  title: string;
  body: string;
  action?: React.ReactNode;
  dense?: boolean;
}) {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        p: dense ? 3 : { xs: 3, sm: 5 },
        borderRadius: 3,
        textAlign: "center",
        border: "1px dashed",
        borderColor: alpha(theme.palette.divider, 0.9),
        bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.03 : 0.015),
      }}
    >
      <Box
        sx={{
          width: dense ? 56 : 72,
          height: dense ? 56 : 72,
          borderRadius: "50%",
          mx: "auto",
          mb: 2,
          display: "grid",
          placeItems: "center",
          bgcolor: alpha(theme.palette.warning.main, theme.palette.mode === "dark" ? 0.18 : 0.1),
          color: "warning.main",
        }}
      >
        <IconWrapper icon={icon} size={dense ? 28 : 36} />
      </Box>
      <Typography variant={dense ? "subtitle1" : "h6"} fontWeight={800} gutterBottom>
        {title}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ maxWidth: 460, mx: "auto", lineHeight: 1.65 }}
      >
        {body}
      </Typography>
      {action ? <Box sx={{ mt: 2.5 }}>{action}</Box> : null}
    </Paper>
  );
}

/** The one card surface every tab sits on, so the four tabs read as one module. */
export function Surface({
  children,
  padded = true,
  sx,
}: {
  children: React.ReactNode;
  padded?: boolean;
  sx?: object;
}) {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: alpha(theme.palette.divider, theme.palette.mode === "dark" ? 0.55 : 1),
        bgcolor:
          theme.palette.mode === "dark"
            ? alpha(theme.palette.background.paper, 0.6)
            : theme.palette.background.paper,
        boxShadow:
          theme.palette.mode === "dark"
            ? `0 24px 48px -20px ${alpha("#000", 0.45)}`
            : `0 20px 42px -28px ${alpha("#0f172a", 0.18)}`,
        p: padded ? { xs: 2, sm: 2.5 } : 0,
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}

/** Label + value, used by the hub stat row and the issued detail dialog. */
export function StatTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
  tone: string;
}) {
  const theme = useTheme();
  return (
    <Surface sx={{ p: { xs: 1.75, sm: 2 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            color: tone,
            bgcolor: alpha(tone, theme.palette.mode === "dark" ? 0.24 : 0.12),
          }}
        >
          <IconWrapper icon={icon} size={22} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
        </Box>
      </Stack>
    </Surface>
  );
}

/** Human copy for a source kind, so the issued table never prints "points_tier". */
export function sourceKindMeta(kind: CertificateSourceKind): {
  icon: string;
  label: string;
} {
  switch (kind) {
    case "adaptive_course":
      return { icon: "mdi:school-outline", label: "Course" };
    case "assessment":
      return { icon: "mdi:clipboard-text-outline", label: "Assessment" };
    case "points_tier":
      return { icon: "mdi:trophy-outline", label: "Points tier" };
    default:
      return { icon: "mdi:certificate-outline", label: String(kind) };
  }
}

/** Turns a tier name into the slug the ladder stores. Kept here so the ladder
 *  editor and any future importer derive it identically. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
