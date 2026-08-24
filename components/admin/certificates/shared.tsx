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
import { fromDesign, toWriteShape } from "@/lib/certificates/types";
import type {
  CertificateDesign,
  CertificateIssuer,
  CertificateMetric,
  CertificatePalette,
  CertificatePresetSlug,
  CertificateRenderPayload,
  CertificateSourceKind,
  CertificateStatus,
  CertificateTemplate,
  CertificateTemplateDraft,
} from "@/lib/certificates/types";

/** The sample copy every preview draws with. A template stores no title or
 *  tagline of its own, so the preview has to supply one; keeping it here means
 *  the card miniature, the editor and the assignment preview all show the same
 *  wording at the same type size. */
const PREVIEW_TITLE = "Certificate of Completion";
const PREVIEW_SUBTITLE = "Data Structures and Algorithms";

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
  issued: (clientId: string | number, query: object) =>
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
 * What the editor holds while the admin types.
 *
 * The draft type and the camel-to-snake translation live in
 * lib/certificates/types.ts, not here, so there is exactly ONE place that knows
 * `bandLabel` is written as `band_label`. Seven keys were previously open-coded
 * per field and posted under names the write serializer had never heard of; it
 * accepted them with a 200 and stored none of them.
 */
export type TemplateDraft = CertificateTemplateDraft;
export { toWriteShape, fromDesign };

/** A brand-new template, pre-filled from a preset so the first preview is a
 *  finished-looking certificate rather than an empty frame. */
export function draftFromPreset(slug: CertificatePresetSlug): TemplateDraft {
  const preset = CERTIFICATE_PRESETS[slug];
  return {
    name: `${preset.label} certificate`,
    description: "",
    kind: "design",
    layout: slug === "brand-minimal" ? "minimal" : "classic",
    preset: slug,
    bandLabel: "CERTIFICATE OF COMPLETION",
    sealCode: "CO",
    ornamentLevel: preset.ornamentLevel,
    palette: null,
    asset: null,
    previewUrl: null,
    fieldPlacements: null,
    defaultFor: null,
    isActive: true,
    isArchived: false,
  };
}

/**
 * A saved template as a draft.
 *
 * The design-shaped half comes through `fromDesign(template.design)`, because
 * `design` is the server's own resolution of preset + overrides + ornament
 * level and is what the artwork will actually draw. The palette here is the
 * OVERRIDES (`palette_overrides`), never `design.palette`: that one is fully
 * resolved, and round-tripping it would freeze a brand template's accent at
 * whatever the tenant colour happens to be today.
 *
 * `previewUrl` is the freshly signed `asset_url`, held for drawing only. The
 * thing that gets submitted is `asset`, which holds the storage key.
 */
export function draftFromTemplate(template: CertificateTemplate): TemplateDraft {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    ...fromDesign(template.design),
    ornamentLevel: template.ornament_level ?? template.design.ornamentLevel,
    palette: template.palette_overrides ?? null,
    asset: template.asset ?? null,
    previewUrl: template.asset_url ?? null,
    fieldPlacements: template.field_placements ?? null,
    defaultFor: template.default_for ?? null,
    isActive: template.is_active,
    isArchived: template.is_archived,
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
    // The signed, ephemeral preview URL - the only place it is ever read. It is
    // never submitted; `toWriteShape` drops it.
    backgroundUrl: draft.previewUrl ?? null,
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
  /** A template carries no title of its own; the preview needs one to draw. */
  title?: string;
  tagline?: string;
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
    title: options.title?.trim() || PREVIEW_TITLE,
    subtitle: options.subtitle ?? PREVIEW_SUBTITLE,
    tagline: options.tagline?.trim() ?? "",
    recipient_name: options.recipientName ?? PREVIEW_RECIPIENT_NAME,
    issued_at: options.issuedAt ?? new Date().toISOString(),
    verify_url: options.verifyUrl ?? `https://verify.example.com/${credentialId}`,
    issuer,
    source: {
      kind: options.sourceKind ?? "adaptive_course",
      id: null,
      label: options.sourceLabel ?? PREVIEW_SUBTITLE,
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
  const credentialId =
    options.credentialId ?? `AILINC-${template.design.sealCode}-PREVIEW001`;
  return {
    credential_id: credentialId,
    status: options.status ?? "issued",
    title: options.title?.trim() || PREVIEW_TITLE,
    subtitle: options.subtitle ?? PREVIEW_SUBTITLE,
    tagline: options.tagline?.trim() ?? "",
    recipient_name: options.recipientName ?? PREVIEW_RECIPIENT_NAME,
    issued_at: options.issuedAt ?? new Date().toISOString(),
    verify_url: options.verifyUrl ?? `https://verify.example.com/${credentialId}`,
    issuer,
    source: {
      kind: options.sourceKind ?? "adaptive_course",
      id: null,
      label: options.sourceLabel ?? PREVIEW_SUBTITLE,
    },
    metrics: options.metrics ?? [{ label: "Completion", value: "100%" }],
    // The server's own resolution, never a locally reassembled one.
    design: template.design,
  };
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

/** Human copy for a source kind, so the issued table never prints "points". */
export function sourceKindMeta(kind: CertificateSourceKind): {
  icon: string;
  label: string;
} {
  switch (kind) {
    case "adaptive_course":
      return { icon: "mdi:school-outline", label: "Course" };
    case "assessment":
      return { icon: "mdi:clipboard-text-outline", label: "Assessment" };
    case "points":
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
