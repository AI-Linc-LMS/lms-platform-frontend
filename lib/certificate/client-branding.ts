import type { CertificateBranding } from "@/lib/certificate/types";
import type { ClientInfo } from "@/lib/services/client.service";
import { resolveClientLogoUrl } from "@/lib/utils/resolveClientLogoUrl";

const DEFAULT_ACCENT = "#6d28d9";

function pickThemePrimary(clientInfo: ClientInfo | null | undefined): string {
  const c = clientInfo?.theme_settings?.colors;
  const candidates = [
    c?.["primary-600"],
    c?.["primary-700"],
    c?.["primary-500"],
    c?.["default-primary"],
  ];
  for (const hex of candidates) {
    const t = String(hex ?? "").trim();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(t)) return t;
  }
  return DEFAULT_ACCENT;
}

export interface ClientCertificateBrandingInput {
  issuerDisplayName: string;
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

  return {
    issuerDisplayName:
      overrides?.issuerDisplayName?.trim() ||
      clientInfo?.name?.trim() ||
      "Organization",
    logoUrl: overrides?.logoUrl?.trim() || resolveClientLogoUrl(clientInfo) || "",
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
    logoUrl: input.logoUrl ?? "",
    signatureImageUrl: input.signatureImageUrl ?? "",
    signatoryName: input.signatoryName ?? "",
    signatoryTitle: input.signatoryTitle ?? "",
    accentColor: input.accentColor ?? DEFAULT_ACCENT,
  };
}
