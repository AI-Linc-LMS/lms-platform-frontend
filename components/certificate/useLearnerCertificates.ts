"use client";

import { useMemo } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { getUserDisplayName } from "@/lib/utils/user-utils";
import { learnerCertificatesService } from "@/lib/services/certificates.service";
import { getPreset } from "@/lib/certificates/presets";
import { formatPoints, verifyUrlFor } from "@/lib/certificates/format";
import type {
  CertificateIssuer,
  CertificatePresetSlug,
  CertificateRenderPayload,
  ClaimableCertificate,
  IssuedCertificate,
  LearnerCertificatesResponse,
  LearnerTierStatus,
} from "@/lib/certificates/types";

/**
 * The learner side's data layer: one query, one issuer, and the two functions
 * that turn the list endpoint's rows into something CertificateArtwork can draw.
 *
 * Both learner surfaces (the profile section and /certificates) read the SAME
 * query key on purpose. They show overlapping numbers - certificates held,
 * points total, next tier - and the fastest way to ship two surfaces that
 * disagree with each other is to give each its own fetch. React Query dedupes
 * them into a single request and repaints both together.
 */

export const certificateQueryKeys = {
  /** GET me/certificates/ - the whole learner surface in one call. */
  learner: ["certificates", "me"] as const,
  /** GET me/certificates/<credential_id>/ - the authoritative render payload. */
  detail: (credentialId: string) => ["certificates", "me", "detail", credentialId] as const,
};

export function useLearnerCertificates(): UseQueryResult<LearnerCertificatesResponse> {
  return useQuery({
    queryKey: certificateQueryKeys.learner,
    queryFn: learnerCertificatesService.list,
    // Points move as the learner studies, so this cannot be cached for long;
    // but a learner bouncing between the profile and the gallery inside a
    // minute should not re-fetch on every hop either.
    staleTime: 60 * 1000,
  });
}

/* ------------------------------------------------------------------ *
 * Issuer
 * ------------------------------------------------------------------ */

/**
 * The tenant identity for the artwork. Shared with the admin preview surfaces
 * rather than defined twice: see lib/certificates/useIssuer for why the grid
 * derives it locally instead of fetching a detail payload per row, and why the
 * dialog still fetches the real one.
 */
export { useCertificateIssuer } from "@/lib/certificates/useIssuer";

/**
 * The name to print on a certificate the learner has not earned yet.
 *
 * Prefers the name on a credential they already hold, because that is the name
 * the BACKEND will actually stamp on the next one; the auth profile is only the
 * fallback for a learner with nothing issued. getUserDisplayName returns the
 * literal string "User" for a missing profile, which is fine as a nav avatar
 * label and absurd on a certificate, so it is filtered out here.
 */
export function useRecipientName(issued?: IssuedCertificate[]): string {
  const { user } = useAuth();
  return useMemo(() => {
    const fromIssued = issued?.find((c) => c.recipient_name?.trim())?.recipient_name?.trim();
    if (fromIssued) return fromIssued;
    const display = getUserDisplayName(user).trim();
    return display && display !== "User" ? display : "";
  }, [issued, user]);
}

/* ------------------------------------------------------------------ *
 * Row -> render payload
 * ------------------------------------------------------------------ */

/**
 * An issued row drawn as artwork. `design_snapshot` is the frozen design taken
 * at issuance, so this renders what the learner was actually given even if the
 * template it came from has since been edited or deleted.
 *
 * `metrics` is empty here rather than invented: the list endpoint does not send
 * it, and a fabricated "100%" chip on a credential is exactly the kind of thing
 * that must never appear on something a learner puts on LinkedIn. The detail
 * dialog fetches the server payload and gets the real chips.
 */
export function payloadFromIssued(
  cert: IssuedCertificate,
  issuer: CertificateIssuer,
): CertificateRenderPayload {
  return {
    credential_id: cert.credential_id,
    status: cert.status,
    title: cert.title,
    subtitle: cert.subtitle ?? "",
    tagline: cert.tagline,
    recipient_name: cert.recipient_name,
    issued_at: cert.issued_at,
    verify_url: cert.verify_url?.trim() || verifyUrlFor(cert.credential_id),
    issuer,
    source: cert.source,
    metrics: [],
    design: cert.design_snapshot,
  };
}

/**
 * Which preset each rung of the points ladder wears, from the spec's
 * "default role" column: sapphire, emerald, amethyst, bronze, platinum, gold,
 * grand-gold for ranks 1..7. The escalation a learner feels climbing the ladder
 * IS this list - ornament level runs 3, 3, 4, 4, 5, 6, 7 across it.
 *
 * This is a local mirror, and it is only ever used for rungs the learner has
 * NOT reached. The moment a tier is issued the server sends its real
 * design_snapshot and that wins, so a tenant who rebound tier 4 to a custom
 * template gets their design on the earned card and only the default preset on
 * the blurred teaser.
 */
export const TIER_PRESET_BY_RANK: CertificatePresetSlug[] = [
  "sapphire",
  "emerald",
  "amethyst",
  "bronze",
  "platinum",
  "gold",
  "grand-gold",
];

export function tierPresetSlug(rank: number): CertificatePresetSlug {
  const index = Math.round(rank) - 1;
  if (!Number.isFinite(index) || index < 0) return TIER_PRESET_BY_RANK[0];
  return TIER_PRESET_BY_RANK[Math.min(index, TIER_PRESET_BY_RANK.length - 1)];
}

export interface LockedTierPayloadLabels {
  /** Band across the top, e.g. "POINTS MILESTONE". */
  bandLabel: string;
  /** Document heading, e.g. "Certificate of Achievement". */
  title: string;
  /** Reads "for reaching 5,000 points". */
  tagline: string;
  /** Label on the points metric chip. */
  pointsLabel: string;
}

/**
 * A tier the learner has not unlocked, drawn as the real certificate.
 *
 * Seeing YOUR OWN NAME on a Grand Gold certificate you cannot have yet is the
 * entire motivational mechanism of the ladder, so the recipient name is the
 * learner's real one, not a placeholder.
 *
 * The credential id is masked rather than faked. A plausible-looking id on an
 * unissued certificate is a verification URL that 404s, and if anyone ever
 * screenshots a locked card the mask makes it self-evidently not a credential.
 */
export function payloadForLockedTier(
  tier: LearnerTierStatus,
  issuer: CertificateIssuer,
  recipientName: string,
  labels: LockedTierPayloadLabels,
  numberLocale = "en-US",
): CertificateRenderPayload {
  const preset = getPreset(tierPresetSlug(tier.rank));
  const code = (tier.code || "").trim().toUpperCase() || "TR";
  return {
    credential_id: `AILINC-${code}-••••••••••`,
    status: "issued",
    title: labels.title,
    subtitle: tier.name,
    tagline: labels.tagline,
    recipient_name: recipientName,
    // Today's date: the locked card is a picture of the certificate as it would
    // be issued now, and a blank date line leaves an obvious hole in the layout.
    issued_at: new Date().toISOString(),
    verify_url: verifyUrlFor(""),
    issuer,
    source: { kind: "points_tier", id: null, label: tier.name },
    metrics: [
      { label: labels.pointsLabel, value: formatPoints(tier.points, numberLocale) },
    ],
    design: {
      kind: "design",
      layout: "classic",
      preset: preset.slug,
      dark: preset.dark,
      palette: preset.palette,
      metalLabel: preset.metalLabel,
      ornamentLevel: preset.ornamentLevel,
      bandLabel: labels.bandLabel,
      sealCode: code,
      backgroundUrl: null,
      fieldPlacements: null,
    },
  };
}

/* ------------------------------------------------------------------ *
 * Claims
 * ------------------------------------------------------------------ */

/**
 * Which claim endpoint a claimable row belongs to. The three POSTs run the same
 * eligibility gate and the same idempotent get_or_create as the eager issuance
 * path, so a double click returns the credential the learner already has rather
 * than minting a second one.
 *
 * Returns null for a row this build does not know how to claim - a source kind
 * added on a newer backend degrades to "no claim button", never to a POST at a
 * URL assembled from a guess.
 */
export function claimCertificate(row: ClaimableCertificate) {
  if (row.kind === "points_tier") {
    const slug = row.tier_slug?.trim();
    if (!slug) return null;
    return () => learnerCertificatesService.claimTier(slug);
  }
  if (row.kind === "adaptive_course" && typeof row.id === "number") {
    const courseId = row.id;
    return () => learnerCertificatesService.claimCourse(courseId);
  }
  if (row.kind === "assessment" && typeof row.id === "number") {
    const assessmentId = row.id;
    return () => learnerCertificatesService.claimAssessment(assessmentId);
  }
  return null;
}

/** A stable React key for a claimable row: the backend sends no id of its own. */
export function claimableKey(row: ClaimableCertificate): string {
  return `${row.kind}:${row.tier_slug ?? row.id ?? row.label}`;
}

/* ------------------------------------------------------------------ *
 * Ladder maths
 * ------------------------------------------------------------------ */

export interface LadderPosition {
  /** The highest rung already crossed, if any. */
  current: LearnerTierStatus | null;
  /** The next rung to aim at, or null once the ladder is finished. */
  next: LearnerTierStatus | null;
  /** Points still owed on `next`. 0 when the ladder is finished. */
  pointsRemaining: number;
  /** 0..100 progress from `current`'s threshold to `next`'s. */
  progressToNext: number;
  achievedCount: number;
}

/**
 * Where the learner stands on the ladder.
 *
 * Progress is measured BETWEEN the two adjacent rungs, not from zero. A learner
 * on 26,000 points looking at the 50,000 rung is 52% of the way there measured
 * from zero and only 4% of the way there measured from the 25,000 rung they
 * just cleared. The second number is the true one, and the first one makes the
 * bar appear to jump backwards the moment they cross a threshold.
 */
export function ladderPosition(
  tiers: LearnerTierStatus[],
  pointsTotal: number,
): LadderPosition {
  const ordered = [...(tiers ?? [])].sort((a, b) => a.rank - b.rank);
  // Trust `achieved` from the server rather than re-deriving it from points:
  // a tier can be reached and then have its threshold raised by an admin, and
  // the credential the learner holds does not evaporate when that happens.
  const achieved = ordered.filter((t) => t.achieved);
  const current = achieved.length ? achieved[achieved.length - 1] : null;
  const next = ordered.find((t) => !t.achieved) ?? null;

  if (!next) {
    return {
      current,
      next: null,
      pointsRemaining: 0,
      progressToNext: 100,
      achievedCount: achieved.length,
    };
  }

  const floor = current?.points ?? 0;
  const span = Math.max(1, next.points - floor);
  const progress = Math.max(0, Math.min(100, ((pointsTotal - floor) / span) * 100));
  const remaining =
    typeof next.points_remaining === "number"
      ? Math.max(0, Math.round(next.points_remaining))
      : Math.max(0, Math.round(next.points - pointsTotal));

  return {
    current,
    next,
    pointsRemaining: remaining,
    progressToNext: progress,
    achievedCount: achieved.length,
  };
}
