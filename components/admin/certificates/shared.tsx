"use client";

import { Box, Stack, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { IconWrapper } from "@/components/common/IconWrapper";
import { CERT_BADGE_GRADIENT } from "@/lib/certificates/ui-tokens";
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
 * Shared UI atoms - the admin dialect
 * ------------------------------------------------------------------ *
 *
 * These are expressed in the admin surfaces' own tokens: the CSS custom
 * properties from app/globals.css (`var(--card-bg)`, `var(--border-default)`,
 * `var(--font-primary)`, `var(--ai-violet)`, `var(--radius-card)`), never
 * `useTheme()` / `alpha()` / `theme.palette.*`. Two reasons this matters here
 * specifically:
 *
 * 1. `palette.warning` is MUI's untouched factory orange (#ed6c02), not the
 *    amber (#f59e0b) this module believed it was painting, and it is a colour
 *    that appears nowhere else in the product.
 * 2. `palette.primary` and `palette.background.paper` are overridden per
 *    tenant, so a bare `variant="contained"` or a `background.paper` card is a
 *    different colour on every workspace.
 *
 * The certificate accent is VIOLET, the identity already shipped by
 * components/dashboard/v2/CertificatePanel.tsx. Amber is spoken for elsewhere
 * (the Momentum stat, the rank-1 medal, the Tickets module).
 */

/** The certificate badge tile. Re-exported from the single identity module so
 *  the admin gradient and the student one cannot drift apart. */
export { CERT_BADGE_GRADIENT } from "@/lib/certificates/ui-tokens";
/** The admin card shadow, per SegmentedTabs.tsx:43 - the shallowest in the app. */
export const ADMIN_CARD_SHADOW =
  "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.08)";
/** A violet-tinted selected/active surface in the admin dialect. */
export const VIOLET_TINT = "color-mix(in srgb, var(--ai-violet) 10%, var(--card-bg) 90%)";
export const VIOLET_BORDER = "color-mix(in srgb, var(--ai-violet) 32%, var(--card-bg) 68%)";

/** The one primary-action recipe. A bare `variant="contained"` paints tenant
 *  blue, so every primary button in this module carries the gradient. */
export const primaryButtonSx = {
  textTransform: "none",
  fontWeight: 700,
  borderRadius: "999px",
  background: "var(--gradient-ai)",
  color: "var(--font-light)",
  boxShadow: "none",
  "&:hover": { background: "var(--gradient-ai)", filter: "brightness(1.06)", boxShadow: "none" },
} as const;

/** The secondary-action recipe: a violet-tinted outline, never MUI's default. */
export const secondaryButtonSx = {
  textTransform: "none",
  fontWeight: 700,
  borderRadius: 2,
  borderColor: "var(--border-default)",
  color: "var(--ai-violet)",
  "&:hover": {
    borderColor: VIOLET_BORDER,
    bgcolor: "color-mix(in srgb, var(--ai-violet) 8%, var(--surface) 92%)",
  },
} as const;

/** A quiet text action (Cancel, Discard, Clear). */
export const quietButtonSx = {
  textTransform: "none",
  fontWeight: 700,
  color: "var(--font-secondary)",
} as const;

/** Every text input in the module reads as one tokenized set, matching
 *  AssessmentFilterBar's own field styling. */
export const fieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "var(--surface)",
    color: "var(--font-primary)",
    borderRadius: 2,
    "& fieldset": { borderColor: "var(--border-default)" },
    "&:hover fieldset": { borderColor: "var(--border-default)" },
    "&.Mui-focused fieldset": { borderColor: "var(--ai-violet)" },
  },
  "& .MuiInputLabel-root": { color: "var(--font-tertiary)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "var(--ai-violet)" },
  "& .MuiSvgIcon-root": { color: "var(--font-tertiary)" },
} as const;

/** The one card surface every tab sits on, so the four tabs read as one module
 *  and read as a card the same way every other admin card does. */
export function Surface({
  children,
  padded = true,
  sx,
}: {
  children: React.ReactNode;
  padded?: boolean;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      sx={{
        borderRadius: "var(--radius-card)",
        border: "1px solid var(--border-default)",
        bgcolor: "var(--card-bg)",
        boxShadow: ADMIN_CARD_SHADOW,
        p: padded ? { xs: 2, sm: 2.5 } : 0,
        ...((sx as object) ?? {}),
      }}
    >
      {children}
    </Box>
  );
}

/** The header of a section inside a card: a 30px gradient tile, a 0.95rem/800
 *  title and a 0.72rem subtitle. The same anatomy as the dashboard's
 *  SectionHeader, expressed in admin tokens. */
export function SectionHeading({
  icon,
  title,
  subtitle,
  action,
  gradient = CERT_BADGE_GRADIENT,
  sx,
}: {
  icon: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  gradient?: string;
  sx?: SxProps<Theme>;
}) {
  return (
    <Stack
      direction="row"
      spacing={1.25}
      alignItems="center"
      sx={{ mb: 1.5, ...((sx as object) ?? {}) }}
    >
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: 2,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          color: "var(--font-light)",
          background: gradient,
        }}
      >
        <IconWrapper icon={icon} size={17} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            fontWeight: 800,
            color: "var(--font-primary)",
            fontSize: "0.95rem",
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>
        {subtitle ? (
          <Typography sx={{ fontSize: "0.72rem", color: "var(--font-secondary)" }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {action}
    </Stack>
  );
}

/** The uppercase micro-label above a value or a chip row. `variant="overline"`
 *  is MUI's scale, not the app's. RTL drops the letterspacing and the casing,
 *  which is what every other letterspaced style in the app does. */
export function Eyebrow({
  children,
  sx,
}: {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}) {
  return (
    <Typography
      component="div"
      sx={{
        fontSize: "0.6rem",
        fontWeight: 800,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        color: "var(--font-secondary)",
        '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
        ...((sx as object) ?? {}),
      }}
    >
      {children}
    </Typography>
  );
}

export type NoticeTone = "violet" | "warning" | "danger";

const NOTICE_TONE: Record<NoticeTone, { fg: string; bg: string; border: string }> = {
  violet: {
    fg: "var(--ai-violet)",
    bg: "color-mix(in srgb, var(--ai-violet) 8%, var(--card-bg) 92%)",
    border: "var(--border-default)",
  },
  warning: {
    fg: "var(--warning-600)",
    bg: "color-mix(in srgb, var(--warning-500) 12%, var(--card-bg) 88%)",
    border: "color-mix(in srgb, var(--warning-500) 30%, var(--card-bg) 70%)",
  },
  danger: {
    fg: "var(--error-600)",
    bg: "color-mix(in srgb, var(--error-500) 10%, var(--card-bg) 90%)",
    border: "color-mix(in srgb, var(--error-500) 28%, var(--card-bg) 72%)",
  },
};

/** An inline notice. `<Alert>` brings MUI's own blue/orange palette, which is
 *  in no token file and reads as a different product. */
export function NoticeStrip({
  icon,
  tone = "violet",
  title,
  children,
  sx,
}: {
  icon?: string;
  tone?: NoticeTone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  sx?: SxProps<Theme>;
}) {
  const palette = NOTICE_TONE[tone];
  const glyph =
    icon ??
    (tone === "danger"
      ? "mdi:alert-circle-outline"
      : tone === "warning"
        ? "mdi:alert-outline"
        : "mdi:information-outline");
  return (
    <Stack
      direction="row"
      spacing={1.25}
      alignItems="flex-start"
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: `1px solid ${palette.border}`,
        bgcolor: palette.bg,
        ...((sx as object) ?? {}),
      }}
    >
      <Box sx={{ color: palette.fg, display: "inline-flex", flexShrink: 0, mt: "1px" }}>
        <IconWrapper icon={glyph} size={18} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        {title ? (
          <Typography
            sx={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--font-primary)", mb: 0.25 }}
          >
            {title}
          </Typography>
        ) : null}
        <Typography
          component="div"
          sx={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--font-primary)", lineHeight: 1.6 }}
        >
          {children}
        </Typography>
      </Box>
    </Stack>
  );
}

/** A neutral or toned meta pill. Same geometry as the admin StatusChip, but it
 *  takes any token colour so a violet "default design" chip and a grey "12
 *  bands" chip are the same shape. One radius: 999. */
export function MetaPill({
  label,
  icon,
  color = "var(--font-secondary)",
  title,
  sx,
}: {
  label: React.ReactNode;
  icon?: string;
  color?: string;
  title?: string;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      component="span"
      title={title}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        maxWidth: "100%",
        height: 23,
        px: 1,
        borderRadius: 999,
        backgroundColor: `color-mix(in srgb, ${color} 14%, var(--surface) 86%)`,
        border: "1px solid transparent",
        color,
        fontSize: "0.72rem",
        fontWeight: 600,
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...((sx as object) ?? {}),
      }}
    >
      {icon ? <IconWrapper icon={icon} size={13} color={color} /> : null}
      <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
        {label}
      </Box>
    </Box>
  );
}

/** The frame the platform puts around media: a hairline box on the page canvas
 *  tint, with the artwork inset. Used for the live certificate miniatures. */
export const mediaFrameSx = {
  p: 1.5,
  bgcolor: "var(--surface)",
  borderBottom: "1px solid var(--border-default)",
} as const;

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
