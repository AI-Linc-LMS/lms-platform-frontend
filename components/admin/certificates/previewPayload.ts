import { verifyUrlFor } from "@/lib/certificates/format";
import { getPreset, resolvePalette } from "@/lib/certificates/presets";
import type {
  CertificateDesign,
  CertificateIssuer,
  CertificateMetric,
  CertificateRenderPayload,
  CertificateSource,
  CertificateStatus,
  CertificateTemplate,
} from "@/lib/certificates/types";

/**
 * Turning a saved TEMPLATE into something the artwork component can draw.
 *
 * The artwork only ever consumes a full render payload (a real, issued
 * certificate), and an admin picking a design has no issued certificate to look
 * at. The obvious fix - ask the backend for a preview per template - is what
 * `adminCertificatesService.preview()` is for, and it is the right call for a
 * single confirmed design. It is the WRONG call for a picker: a gallery of ten
 * designs would fire ten round trips, and every click in the gallery would fire
 * another, which is exactly why lib/certificates/presets.ts mirrors the server's
 * palettes in the first place. This module is the other half of that mirror: it
 * assembles the payload locally so the picker repaints instantly.
 *
 * The server stays the source of truth for anything ISSUED. Nothing here is
 * ever persisted or shown to a learner; it exists purely so an admin can see
 * their own tenant's name, logo and accent on the design before choosing it.
 */

/**
 * The name on every preview. A real-looking name rather than "Learner Name" so
 * the admin sees the actual type size the artwork will use, and a two-word name
 * of ordinary length so the recipient font ladder in format.ts lands on its
 * middle rung rather than flattering the design with a short name.
 */
export const PREVIEW_RECIPIENT_NAME = "Priya Ramachandran";

/**
 * A fixed sample credential id, drawn from the Crockford-style alphabet the
 * real generator uses so the footer looks right, but hard-coded and therefore
 * resolvable to nothing. It must never be mistaken for a credential someone
 * holds: a preview is not an issuance.
 */
const PREVIEW_CREDENTIAL_SUFFIX = "2KQ9XRVW7T";

/** What a template that has not been chosen yet renders as: the platform's
 *  default branded certificate, which is what the backend falls back to when a
 *  rule carries no template. Keeping the fallback here means the preview never
 *  goes blank while an admin is still deciding. */
const FALLBACK_DESIGN = {
  kind: "design",
  layout: "classic",
  preset: "brand-classic",
  title: "Certificate of Completion",
  tagline: "for outstanding dedication and achievement",
  bandLabel: "CERTIFICATE OF COMPLETION",
  sealCode: "CO",
} as const;

export interface TemplatePreviewContext {
  /**
   * The thing being certified - the course or assessment title. This becomes
   * the payload's `subtitle`, which is the artwork's big display line.
   */
  subtitle?: string;
  /** Overrides the template's own heading, e.g. an admin's custom course title. */
  title?: string;
  tagline?: string;
  recipientName?: string;
  issuedAt?: string;
  source?: CertificateSource;
  metrics?: CertificateMetric[];
  status?: CertificateStatus;
}

/** Re-exported from lib/certificates/useIssuer so the admin previews and the
 *  learner gallery cannot drift apart. See that file for why it is shared. */
export { useCertificateIssuer } from "@/lib/certificates/useIssuer";

/** The drawing parameters for a template, with the tenant accent substituted
 *  into the three brandAccent presets exactly as the server would. */
export function designFromTemplate(
  template: CertificateTemplate | null | undefined,
  accent: string,
): CertificateDesign {
  const preset = getPreset(template?.preset ?? FALLBACK_DESIGN.preset);
  const heading = template?.title?.trim() || FALLBACK_DESIGN.title;
  return {
    kind: template?.kind ?? FALLBACK_DESIGN.kind,
    layout: template?.layout ?? FALLBACK_DESIGN.layout,
    preset: preset.slug,
    dark: preset.dark,
    palette: resolvePalette({ preset: preset.slug }, accent),
    metalLabel: preset.metalLabel,
    ornamentLevel: preset.ornamentLevel,
    // A template with no band label of its own gets its heading shouted across
    // the band, which is what every seeded template does anyway.
    bandLabel: template?.bandLabel?.trim() || heading.toUpperCase(),
    sealCode: (template?.sealCode?.trim() || FALLBACK_DESIGN.sealCode)
      .toUpperCase()
      .slice(0, 2),
    backgroundUrl: template?.backgroundUrl ?? null,
    fieldPlacements: template?.fieldPlacements ?? null,
  };
}

/**
 * A complete render payload for a template, for preview only.
 *
 * Pass `template = null` to preview the default branded certificate, which is
 * what a rule with no template awards.
 */
export function buildTemplatePreviewPayload(
  template: CertificateTemplate | null | undefined,
  issuer: CertificateIssuer,
  context: TemplatePreviewContext = {},
): CertificateRenderPayload {
  const design = designFromTemplate(template, issuer.accent);
  const credentialId = `AILINC-${design.sealCode}-${PREVIEW_CREDENTIAL_SUFFIX}`;
  const heading =
    context.title?.trim() || template?.title?.trim() || FALLBACK_DESIGN.title;

  return {
    credential_id: credentialId,
    status: context.status ?? "issued",
    title: heading,
    subtitle: context.subtitle?.trim() ?? "",
    tagline:
      context.tagline?.trim() || template?.tagline?.trim() || FALLBACK_DESIGN.tagline,
    recipient_name: context.recipientName?.trim() || PREVIEW_RECIPIENT_NAME,
    // A preview dated today, because a preview dated at the epoch reads as a
    // bug to the admin looking at it.
    issued_at: context.issuedAt ?? new Date().toISOString(),
    verify_url: verifyUrlFor(credentialId),
    issuer,
    source: context.source ?? {
      kind: "adaptive_course",
      id: null,
      label: context.subtitle?.trim() || heading,
    },
    metrics: context.metrics ?? [],
    design,
  };
}
