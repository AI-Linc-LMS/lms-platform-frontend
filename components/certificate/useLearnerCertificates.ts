"use client";

import { useMemo } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { getUserDisplayName } from "@/lib/utils/user-utils";
import { learnerCertificatesService } from "@/lib/services/certificates.service";
import { getPreset } from "@/lib/certificates/presets";
import { formatPoints, verifyUrlFor } from "@/lib/certificates/format";
import type {
  CertificateDesign,
  CertificateIssuer,
  CertificatePresetSlug,
  CertificateRenderPayload,
  ClaimCertificateResponse,
  ClaimableCertificate,
  LearnerCertificatesResponse,
  LearnerTierStatus,
} from "@/lib/certificates/types";

/**
 * The learner side's data layer: one query, one issuer, and the ladder maths.
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

export function useLearnerCertificates(
  /** `enabled: false` when the tenant has the student certificates surface switched off, so the
   *  page does not fire a request the server will 403. */
  opts: { enabled?: boolean } = {},
): UseQueryResult<LearnerCertificatesResponse> {
  return useQuery({
    queryKey: certificateQueryKeys.learner,
    queryFn: learnerCertificatesService.list,
    enabled: opts.enabled ?? true,
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
export function useRecipientName(issued?: CertificateRenderPayload[]): string {
  const { user } = useAuth();
  return useMemo(() => {
    const fromIssued = issued?.find((c) => c.recipient_name?.trim())?.recipient_name?.trim();
    if (fromIssued) return fromIssued;
    const display = getUserDisplayName(user).trim();
    return display && display !== "User" ? display : "";
  }, [issued, user]);
}

/* ------------------------------------------------------------------ *
 * Issued rows
 * ------------------------------------------------------------------ */

/*
 * There is deliberately NO `payloadFromIssued` mapper here.
 *
 * `me/certificates/`.`issued[]` is an array of FULL RENDER PAYLOADS: the server
 * ran the same `render_payload` that the detail endpoint and the public
 * verification page run, so `design` is already resolved (from the row's frozen
 * snapshot) and `metrics` is already computed.
 *
 * The mapper that used to live here rebuilt a payload by hand, set
 * `design: cert.design_snapshot` - a key that exists on neither the wire shape
 * nor the local one, so `undefined` - and hard-coded `metrics: []`. The first
 * produced a TypeError inside CertificateArtwork at `design.sealCode`, taking
 * down the whole gallery for any learner who had earned anything; the second
 * silently discarded the "Completion 94%" chips the server had already sent.
 *
 * Pass the element straight to the artwork.
 */

/**
 * Which preset each rung of the points ladder wears, from the spec's
 * "default role" column: sapphire, emerald, amethyst, bronze, platinum, gold,
 * grand-gold for ranks 1..7. The escalation a learner feels climbing the ladder
 * IS this list - ornament level runs 3, 3, 4, 4, 5, 6, 7 across it.
 *
 * PRE-HYDRATION PLACEHOLDER ONLY. Every rung in `tiers[]` carries a real
 * `design` (the frozen snapshot for an issued rung, the live resolution
 * otherwise) and that wins the moment the response lands - otherwise a tenant
 * who rebound rung 4 to a custom template would never see it on a locked card.
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
  // The server's artwork for this rung whenever it sent one. The local preset
  // mirror is only the fallback for a rung with no template bound to it.
  const design: CertificateDesign = tier.design ?? {
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
  };
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
    source: { kind: "points", id: tier.id, label: tier.name },
    metrics: [
      {
        label: labels.pointsLabel,
        value: formatPoints(tier.points_threshold, numberLocale),
      },
    ],
    design,
  };
}

/* ------------------------------------------------------------------ *
 * Claims
 * ------------------------------------------------------------------ */

/**
 * Claim whatever a row points at.
 *
 * There is no branch on `kind` here and no URL assembled anywhere. Every
 * claimable row and every ladder rung carries a server-supplied `claim_path`,
 * and posting that verbatim removes a whole class of bug rather than patching
 * one instance of it: the previous version built `courses/<id>/claim/` out of
 * whatever id was to hand, which on the legacy course page was an
 * `lms_core.Course` id posted at an endpoint that resolves ids against
 * `AdaptiveCourse`. It also means a fourth source kind claims correctly without
 * a frontend release instead of falling through to a dead button.
 *
 * The gate and the idempotent get_or_create are the same ones the eager
 * issuance path runs, so a double click returns the credential the learner
 * already holds rather than minting a second one.
 */
export function claimCertificate(
  row: Pick<ClaimableCertificate, "claim_path">,
): Promise<ClaimCertificateResponse> {
  return learnerCertificatesService.claim(row.claim_path);
}

/** A stable React key for a claimable row. No single field is unique across
 *  kinds - a tier id and a course id collide happily - but (kind, id) is. */
export function claimableKey(row: Pick<ClaimableCertificate, "kind" | "id">): string {
  return `${row.kind}:${row.id}`;
}

/* ------------------------------------------------------------------ *
 * Ladder maths
 * ------------------------------------------------------------------ */

export interface LadderPosition {
  /** The highest rung already crossed, if any. */
  current: LearnerTierStatus | null;
  /** The next rung to aim at, or null once the ladder is finished. */
  next: LearnerTierStatus | null;
  /** Points still owed on `next`, straight from the server. 0 when finished. */
  pointsRemaining: number;
  /** 0..100 progress from `current`'s threshold to `next`'s. */
  progressToNext: number;
  /** How many rungs the learner has UNLOCKED. */
  achievedCount: number;
}

/**
 * Where the learner stands on the ladder.
 *
 * Every input is the server's own: `unlocked` (crossed the threshold) rather
 * than a re-derivation from points, because a rung can be reached and then have
 * its threshold raised by an admin and the credential does not evaporate; and
 * `remaining_points` rather than an arithmetic guess.
 *
 * Progress is measured BETWEEN the two adjacent rungs, not from zero. A learner
 * on 26,000 points looking at the 50,000 rung is 52% of the way there measured
 * from zero and only 4% of the way there measured from the 25,000 rung they
 * just cleared. The second number is the true one, and the first makes the bar
 * appear to jump backwards the moment they cross a threshold. When two rungs
 * share a floor (a threshold-0 rung) the span is zero, and the server's own
 * `progress_percent` - which carries the divide-by-zero guard - is used instead.
 */
export function ladderPosition(
  tiers: LearnerTierStatus[],
  pointsTotal: number,
): LadderPosition {
  const ordered = [...(tiers ?? [])].sort((a, b) => a.rank - b.rank);
  const unlocked = ordered.filter((t) => t.unlocked);
  const current = unlocked.length ? unlocked[unlocked.length - 1] : null;
  const next = ordered.find((t) => !t.unlocked) ?? null;

  if (!next) {
    return {
      current,
      next: null,
      pointsRemaining: 0,
      progressToNext: 100,
      achievedCount: unlocked.length,
    };
  }

  const floor = current?.points_threshold ?? 0;
  const span = next.points_threshold - floor;
  const progress =
    span > 0
      ? Math.max(0, Math.min(100, ((pointsTotal - floor) / span) * 100))
      : next.progress_percent;

  return {
    current,
    next,
    pointsRemaining: Math.max(0, Math.round(next.remaining_points)),
    progressToNext: progress,
    achievedCount: unlocked.length,
  };
}
