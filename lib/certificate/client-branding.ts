import type { CertificateBranding } from "@/lib/certificate/types";
import type { ClientInfo } from "@/lib/services/client.service";
import { resolveCertificateLogoUrl } from "@/lib/utils/resolveCertificateLogoUrl";

const DEFAULT_ACCENT = "#6d28d9";

function isHexColor(t: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(t.trim());
}

function pickThemePrimary(clientInfo: ClientInfo | null | undefined): string {
  const c = clientInfo?.theme_settings?.colors;
  const flat = clientInfo?.theme_settings as Record<string, unknown> | undefined;
  const candidates = [
    c?.["primary-600"],
    c?.["primary-700"],
    c?.["primary-500"],
    c?.["default-primary"],
    flat?.primary700,
    flat?.primary600,
    flat?.primary500,
    flat?.muiPrimaryMain,
    flat?.defaultPrimary,
    flat?.default_primary,
  ];
  for (const hex of candidates) {
    const t = String(hex ?? "").trim();
    if (isHexColor(t)) return t;
  }
  return DEFAULT_ACCENT;
}

export interface ClientCertificateBrandingInput {
  issuerDisplayName: string;
  issuerSubtitle?: string;
  issuerTagline?: string;
  logoUrl?: string;
  signatureImageUrl?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  accentColor?: string;
}

/** Map client-info (and optional overrides) into certificate branding fields. */
export function buildCertificateBranding(
  clientInfo: ClientInfo | null | undefined,
  overrides?: Partial<ClientCertificateBrandingInput>
): ClientCertificateBrandingInput {
  const ext = clientInfo as Record<string, unknown> | null | undefined;
  const signatureFromApi =
    clientInfo?.certificate_signature_url?.trim() ||
    (ext?.signatory_signature_url as string | undefined)?.trim() ||
    "";
  const signatoryName =
    clientInfo?.certificate_signatory_name?.trim() ||
    (ext?.signatory_name as string | undefined)?.trim() ||
    "";
  const signatoryTitle =
    clientInfo?.certificate_signatory_title?.trim() ||
    (ext?.signatory_title as string | undefined)?.trim() ||
    "";

  const row = clientInfo as Record<string, unknown> | null | undefined;
  const slug =
    clientInfo?.slug?.trim() ||
    (typeof row?.slug === "string" ? row.slug.trim() : "") ||
    undefined;
  const organizationSubtitle =
    overrides?.issuerSubtitle?.trim() || (slug ? `@${slug}` : undefined);

  const flatTheme = clientInfo?.theme_settings as Record<string, unknown> | undefined;
  const taglineFromTheme = String(
    flatTheme?.loginHeroSlogan ??
      flatTheme?.login_hero_slogan ??
      flatTheme?.loginHeroBrandName ??
      ""
  ).trim();

  return {
    issuerDisplayName:
      overrides?.issuerDisplayName?.trim() ||
      clientInfo?.name?.trim() ||
      "Organization",
    issuerSubtitle: organizationSubtitle,
    issuerTagline: overrides?.issuerTagline?.trim() || taglineFromTheme || undefined,
    logoUrl: overrides?.logoUrl?.trim() || resolveCertificateLogoUrl(clientInfo) || "",
    signatureImageUrl:
      overrides?.signatureImageUrl?.trim() || signatureFromApi || "",
    signatoryName: overrides?.signatoryName?.trim() || signatoryName || "",
    signatoryTitle: overrides?.signatoryTitle?.trim() || signatoryTitle || "",
    accentColor: overrides?.accentColor?.trim() || pickThemePrimary(clientInfo),
  };
}

export function finalizeBranding(input: ClientCertificateBrandingInput): CertificateBranding {
  return {
    issuerDisplayName: input.issuerDisplayName,
    issuerSubtitle: input.issuerSubtitle?.trim() || undefined,
    issuerTagline: input.issuerTagline?.trim() || undefined,
    logoUrl: input.logoUrl ?? "",
    signatureImageUrl: input.signatureImageUrl ?? "",
    signatoryName: input.signatoryName ?? "",
    signatoryTitle: input.signatoryTitle ?? "",
    accentColor: input.accentColor ?? DEFAULT_ACCENT,
  };
}
