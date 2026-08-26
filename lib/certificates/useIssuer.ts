"use client";

import { useMemo } from "react";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { buildCertificateBranding } from "@/lib/certificate/client-branding";
import { DEFAULT_BRAND_ACCENT } from "@/lib/certificates/presets";
import type { CertificateIssuer } from "@/lib/certificates/types";

/**
 * The tenant identity printed on every certificate this client issues.
 *
 * This lives here, on its own, because it was written twice: once for the admin
 * preview surfaces and once for the learner gallery, in parallel, from the same
 * brief. Both copies were byte-identical, which is the dangerous kind of
 * duplication - nothing was broken, so nothing would have flagged it, and the
 * first time somebody fixed a branding fallback in one copy the admin would
 * have started approving a design that is not the one learners are issued.
 *
 * Why derive the issuer locally at all, when the server sends one:
 *
 * The LIST endpoints (a gallery of templates, a grid of issued rows) carry a
 * design but no issuer block - that only appears on a full render payload from
 * a detail endpoint. Fetching a detail per row just to print a logo would mean
 * N requests to draw one grid. client-info is already loaded for the app shell,
 * so the grid draws from it and costs nothing.
 *
 * Why buildCertificateBranding rather than reading theme_settings directly:
 * it already knows the entire fallback chain (app logo, then login logo, then
 * icon; primary-600, then 700, then 500, then the flat theme keys). A second,
 * subtly different chain here is how certificates drawn in the gallery start
 * looking unlike the ones the legacy flow draws for the same tenant.
 *
 * The server stays the authority for anything ISSUED. The detail dialog fetches
 * the real payload, because that is the copy a learner exports and shares.
 */
export function useCertificateIssuer(): CertificateIssuer {
  const { clientInfo } = useClientInfo();
  return useMemo(() => {
    const branding = buildCertificateBranding(clientInfo);
    return {
      name: branding.issuerDisplayName,
      logo_url: branding.logoUrl?.trim() || null,
      accent: branding.accentColor?.trim() || DEFAULT_BRAND_ACCENT,
      signatory_name: branding.signatoryName ?? "",
      signatory_title: branding.signatoryTitle ?? "",
      signature_url: branding.signatureImageUrl?.trim() || null,
    };
  }, [clientInfo]);
}
