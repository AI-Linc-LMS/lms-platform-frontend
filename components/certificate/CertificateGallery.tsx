"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  ButtonBase,
  CircularProgress,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { SectionHeader } from "@/components/dashboard/v2/parts";
import { formatCertificateDate, formatPoints } from "@/lib/certificates/format";
import {
  CERT_BADGE_GRADIENT,
  CERT_CTA_GRADIENT,
  CERT_CTA_SHADOW,
  CERT_FOCUS_RING,
  CERT_HOVER_BORDER,
  CERT_PANEL_SHADOW,
} from "@/lib/certificates/ui-tokens";
import type {
  CertificateRenderPayload,
  ClaimableCertificate,
  LearnerCertificatesResponse,
  LearnerTierStatus,
} from "@/lib/certificates/types";
import { CertificateClaimError } from "@/lib/services/certificates.service";
import {
  CertificatePreview,
  LockedCertificatePreview,
} from "./CertificatePreview";
import { useCertificateArtworkLabels } from "./CertificateArtwork";
import { CertificateDetailDialog } from "./CertificateDetailDialog";
import {
  certificateQueryKeys,
  claimCertificate,
  claimableKey,
  payloadForLockedTier,
  useCertificateIssuer,
  useRecipientName,
} from "./useLearnerCertificates";

/**
 * Everything a learner holds and everything they do not, on one page.
 *
 * The organising rule, and the reason the two grids never show the same thing
 * twice: the LADDER grid owns every tier, earned or not, because the ladder only
 * reads as a ladder when its rungs sit together; the EARNED grid owns everything
 * the ladder did not claim, which is courses, assessments, and any tier
 * credential whose rung has since been deleted by an admin. That last case is
 * why the split is computed from the set of credential ids the ladder actually
 * rendered rather than from `source.kind` - filtering on the kind would make a
 * real credential disappear from the page the moment its tier row went away.
 */

export interface CertificateGalleryProps {
  data: LearnerCertificatesResponse;
  locale?: string;
  numberLocale?: string;
  /** Highlight ring on one tier card, driven by the rail above. */
  focusTierSlug?: string | null;
}

/** Wide enough that a 1000x707 certificate is still legible as a thumbnail.
 *  Below about 260px the recipient name stops being readable and the card stops
 *  doing the one job it has. */
const CARD_MIN = 280;

/** Scroll target so the "no certificates yet" card can point at the ladder that is
 *  already on the page rather than sending the learner somewhere else. */
const LADDER_ANCHOR_ID = "certificates-ladder";

const GRID_SX = {
  display: "grid",
  gap: 2.5,
  gridTemplateColumns: {
    xs: "1fr",
    sm: `repeat(auto-fill, minmax(${CARD_MIN}px, 1fr))`,
  },
} as const;

export function CertificateGallery({
  data,
  locale = "en-GB",
  numberLocale = "en-US",
  focusTierSlug,
}: CertificateGalleryProps) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const labels = useCertificateArtworkLabels();
  const issuer = useCertificateIssuer();
  const recipientName = useRecipientName(data.issued);

  const [open, setOpen] = useState<{
    credentialId: string;
    payload: CertificateRenderPayload | null;
  } | null>(null);

  const tiers = useMemo(
    () => [...(data.tiers ?? [])].sort((a, b) => a.rank - b.rank),
    [data.tiers],
  );
  // Memoised because `?? []` mints a fresh array on every render, which would
  // otherwise re-run every derivation below it on every keystroke elsewhere on
  // the page - and each of those redraws a grid of full certificates.
  const issued = useMemo(() => data.issued ?? [], [data.issued]);
  const pointsTotal = data.points_total ?? 0;

  // `issued[]` elements ARE render payloads, so nothing is re-mapped: the
  // server already resolved each one's design and metrics.
  const issuedById = useMemo(() => {
    const map = new Map<string, CertificateRenderPayload>();
    for (const cert of issued) map.set(cert.credential_id, cert);
    return map;
  }, [issued]);

  /** Credential ids the ladder is already drawing, so the earned grid skips them. */
  const ladderCredentialIds = useMemo(() => {
    const ids = new Set<string>();
    for (const tier of tiers) {
      if (tier.credential_id && issuedById.has(tier.credential_id)) {
        ids.add(tier.credential_id);
      }
    }
    return ids;
  }, [tiers, issuedById]);

  const earned = useMemo(
    () => issued.filter((cert) => !ladderCredentialIds.has(cert.credential_id)),
    [issued, ladderCredentialIds],
  );

  /** Held credentials the LADDER grid drew, counted the same way the page's
   *  "Certificates" stat counts (revoked ones are not a claim any more). Only
   *  used to keep the earned-grid empty state from contradicting that stat. */
  const ladderHeldCount = useMemo(
    () =>
      issued.filter(
        (cert) => ladderCredentialIds.has(cert.credential_id) && cert.status !== "revoked",
      ).length,
    [issued, ladderCredentialIds],
  );

  const tierLabels = useMemo(
    () => ({
      bandLabel: t("certificatesUpload.tierBandLabel", "POINTS MILESTONE"),
      title: t("certificatesUpload.tierDocTitle", "Certificate of Achievement"),
      tagline: t(
        "certificatesUpload.tierTagline",
        "for steady progress and points earned on the platform",
      ),
      pointsLabel: t("certificatesUpload.tierPointsLabel", "Points"),
    }),
    [t],
  );

  const claimables = data.claimable ?? [];

  const claim = useMutation({
    mutationFn: (row: ClaimableCertificate) => claimCertificate(row),
    onSuccess: (result) => {
      // Refetch rather than patch the cache: a claim can also flip a tier to
      // unlocked and empty the claimable list, and reconstructing all of that
      // client side is how the two grids start disagreeing with the server.
      queryClient.invalidateQueries({ queryKey: certificateQueryKeys.learner });
      // Claiming ONE rung mints every rung the learner has crossed. Say so, or
      // somebody who crosses three at once is shown one and quietly granted
      // three documents nobody tells them to look for.
      const extras = result.also_issued ?? [];
      showToast(
        extras.length > 0
          ? t(
              "certificatesUpload.claimDoneMany",
              "Certificate claimed, along with {{count}} more you had already earned.",
              { count: extras.length },
            )
          : t("certificatesUpload.claimDone", "Certificate claimed. It is yours now."),
        "success",
      );
      // The claim response IS the render payload - flattened, and byte-identical
      // to what the detail endpoint would return - so there is nothing to unwrap
      // and no follow-up request to make. `created` is false on a repeat claim,
      // which is what stops a reload re-celebrating.
      setOpen({ credentialId: result.credential_id, payload: result });
    },
    onError: (error: unknown) => {
      // A refusal is not a failure. The 409 body says WHY, and the two codes
      // need opposite messages: LOCKED is "you are 200 points short", while
      // UNAVAILABLE is a tenant misconfiguration and telling that learner to go
      // and earn more is simply wrong.
      if (error instanceof CertificateClaimError) {
        const { code, shortfall, completion_percent, threshold } = error.body;
        if (code === "CERTIFICATE_UNAVAILABLE") {
          showToast(
            t(
              "certificatesUpload.claimUnavailable",
              "This certificate is not available right now. Your progress is safe; your institution has been notified.",
            ),
            "warning",
          );
          return;
        }
        if (typeof shortfall === "number" && shortfall > 0) {
          showToast(
            t("certificatesUpload.claimShortfall", "{{points}} points to go.", {
              points: formatPoints(shortfall, numberLocale),
            }),
            "warning",
          );
          return;
        }
        if (typeof completion_percent === "number" && typeof threshold === "number") {
          showToast(
            t(
              "certificatesUpload.claimCompletionShort",
              "You are at {{done}}% and this certificate needs {{needed}}%.",
              { done: Math.round(completion_percent), needed: Math.round(threshold) },
            ),
            "warning",
          );
          return;
        }
        showToast(error.body.detail, "warning");
        return;
      }
      showToast(
        error instanceof Error
          ? error.message
          : t("certificatesUpload.claimFailed", "Could not claim this certificate."),
        "error",
      );
    },
  });

  const claimingKey = claim.isPending && claim.variables ? claimableKey(claim.variables) : null;

  return (
    <Stack spacing={2.5}>
      {claimables.length > 0 && (
        <Section
          icon="mdi:gift-outline"
          title={t("certificatesUpload.claimTitle", "Ready to claim")}
          subtitle={t(
            "certificatesUpload.claimSubtitle",
            "You have met the requirements. Claim these to add them to your collection.",
          )}
        >
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(auto-fill, minmax(340px, 1fr))",
              },
            }}
          >
            {claimables.map((row) => {
              const key = claimableKey(row);
              const busy = claimingKey === key;
              return (
                <Stack
                  key={key}
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{
                    p: 1.75,
                    borderRadius: 2.5,
                    border: "1px solid #ede9fe",
                    bgcolor: "#f5f3ff",
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      flexShrink: 0,
                      display: "grid",
                      placeItems: "center",
                      color: "#fff",
                      backgroundImage: CERT_BADGE_GRADIENT,
                    }}
                  >
                    <IconWrapper icon="mdi:certificate" size={22} />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.86rem",
                        color: "#0f172a",
                        lineHeight: 1.25,
                      }}
                    >
                      {row.label}
                    </Typography>
                    {row.kind === "adaptive_course" && (
                      <Typography
                        sx={{ fontSize: "0.72rem", color: "#64748b" }}
                      >
                        {t("certificatesUpload.claimCourseMeta", "{{percent}}% complete", {
                          percent: Math.round(row.completion_percent),
                        })}
                      </Typography>
                    )}
                  </Box>
                  <ButtonBase
                    disabled={busy || claim.isPending}
                    onClick={() => claim.mutate(row)}
                    sx={{
                      px: 2,
                      py: 0.75,
                      borderRadius: 999,
                      fontWeight: 800,
                      fontSize: "0.8rem",
                      color: "#fff",
                      gap: 0.75,
                      flexShrink: 0,
                      background: CERT_CTA_GRADIENT,
                      boxShadow: CERT_CTA_SHADOW,
                      "&:hover": { filter: "brightness(1.06)" },
                      "&.Mui-disabled": { opacity: 0.55, color: "#fff" },
                    }}
                  >
                    {busy && <CircularProgress size={14} color="inherit" />}
                    {t("certificatesUpload.claimCta", "Claim")}
                  </ButtonBase>
                </Stack>
              );
            })}
          </Box>
        </Section>
      )}

      <Section
        icon="mdi:certificate"
        title={t("certificatesUpload.earnedTitle", "Your certificates")}
        subtitle={t(
          "certificatesUpload.earnedSubtitle",
          "Credentials you earned on courses and assessments. Every one has a public verification page.",
        )}
      >
        {earned.length === 0 ? (
          <EmptyEarned
            ladderHeldCount={ladderHeldCount}
            onSeeLadder={
              tiers.length > 0
                ? () =>
                    document
                      .getElementById(LADDER_ANCHOR_ID)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                : undefined
            }
          />
        ) : (
          <Box sx={GRID_SX}>
            {earned.map((payload) => {
              const cert = payload;
              return (
                <CertificateCard
                  key={cert.credential_id}
                  caption={cert.subtitle?.trim() || cert.source?.label || cert.title}
                  meta={formatCertificateDate(cert.issued_at, locale)}
                  revoked={cert.status === "revoked"}
                  revokedLabel={t("certificatesUpload.artRevoked", "Revoked")}
                  viewLabel={t("certificatesUpload.viewCertificate", "View certificate")}
                  onOpen={() =>
                    setOpen({ credentialId: cert.credential_id, payload })
                  }
                >
                  <CertificatePreview
                    payload={payload}
                    labels={labels}
                    locale={locale}
                    radius={10}
                    elevated={false}
                  />
                </CertificateCard>
              );
            })}
          </Box>
        )}
      </Section>

      {tiers.length > 0 && (
        <Section
          anchorId={LADDER_ANCHOR_ID}
          icon="mdi:stairs-up"
          title={t("certificatesUpload.ladderTitle", "The points ladder")}
          /* The split, not just the total. "Why does the ladder think I have
             fewer points than my dashboard says" is the commonest support
             question about this feature, and the answer has been in the payload
             all along. */
          subtitle={
            data.points_breakdown
              ? t(
                  "certificatesUpload.ladderSubtitleSplit",
                  "Every milestone certificate, including the ones still ahead of you. You have {{total}} points: {{adaptive}} from courses and {{community}} from the community.",
                  {
                    total: formatPoints(data.points_breakdown.total, numberLocale),
                    adaptive: formatPoints(data.points_breakdown.adaptive, numberLocale),
                    community: formatPoints(data.points_breakdown.community, numberLocale),
                  },
                )
              : t(
                  "certificatesUpload.ladderSubtitle",
                  "Every milestone certificate, including the ones still ahead of you. Points come from your courses and from the community.",
                )
          }
        >
          <Box sx={GRID_SX}>
            {tiers.map((tier) => {
              const cert = tier.credential_id ? issuedById.get(tier.credential_id) : undefined;
              if (cert) {
                const payload = cert;
                return (
                  <CertificateCard
                    key={tier.slug}
                    anchorId={`tier-${tier.slug}`}
                    caption={tier.name}
                    meta={formatCertificateDate(cert.issued_at, locale)}
                    focused={focusTierSlug === tier.slug}
                    revoked={cert.status === "revoked"}
                    revokedLabel={t("certificatesUpload.artRevoked", "Revoked")}
                    viewLabel={t("certificatesUpload.viewCertificate", "View certificate")}
                    onOpen={() =>
                      setOpen({ credentialId: cert.credential_id, payload })
                    }
                  >
                    <CertificatePreview
                      payload={payload}
                      labels={labels}
                      locale={locale}
                      radius={10}
                      elevated={false}
                    />
                  </CertificateCard>
                );
              }

              return (
                <TierTeaser
                  key={tier.slug}
                  tier={tier}
                  focused={focusTierSlug === tier.slug}
                  caption={tier.name}
                  meta={t("certificatesUpload.ladderRequires", "{{points}} points", {
                    points: formatPoints(tier.points_threshold, numberLocale),
                  })}
                >
                  <LockedCertificatePreview
                    payload={payloadForLockedTier(
                      tier,
                      issuer,
                      recipientName,
                      tierLabels,
                      numberLocale,
                    )}
                    labels={labels}
                    locale={locale}
                    radius={10}
                    pointsCurrent={pointsTotal}
                    pointsRequired={tier.points_threshold}
                    numberLocale={numberLocale}
                    /* A tier can be UNLOCKED and still have no credential: the
                       learner crossed the threshold but has not pulled it yet.
                       The derived chip would read "0 points to unlock" there,
                       which tells them nothing about what to do next. */
                    unlockLabel={
                      tier.unlocked
                        ? t("certificatesUpload.ladderReadyToClaim", "Ready to claim")
                        : undefined
                    }
                  />
                </TierTeaser>
              );
            })}
          </Box>
        </Section>
      )}

      <CertificateDetailDialog
        open={open != null}
        onClose={() => setOpen(null)}
        credentialId={open?.credentialId ?? null}
        fallbackPayload={open?.payload ?? null}
        locale={locale}
      />
    </Stack>
  );
}

/* ------------------------------------------------------------------ *
 * Pieces
 * ------------------------------------------------------------------ */

function Section({
  icon,
  title,
  subtitle,
  children,
  anchorId,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Scroll target, so a card elsewhere on the page can point at this section. */
  anchorId?: string;
}) {
  return (
    <Box component="section" id={anchorId} sx={{ scrollMarginTop: "104px" }}>
      <SectionHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
        gradient={CERT_BADGE_GRADIENT}
      />
      {children}
    </Box>
  );
}

/**
 * A certificate thumbnail that opens the detail dialog.
 *
 * The card is a single ButtonBase rather than a div with a nested "View" button,
 * because the certificate image is the obvious click target and a learner who
 * clicks the artwork and gets nothing concludes the page is broken. The visible
 * "View certificate" line is an affordance, not the hit area.
 */
function CertificateCard({
  children,
  caption,
  meta,
  onOpen,
  focused,
  revoked,
  revokedLabel,
  viewLabel,
  anchorId,
}: {
  children: React.ReactNode;
  caption: string;
  meta?: string;
  onOpen: () => void;
  focused?: boolean;
  revoked?: boolean;
  revokedLabel: string;
  viewLabel: string;
  /** Scroll target for the milestone rail above. */
  anchorId?: string;
}) {
  return (
    <ButtonBase
      id={anchorId}
      onClick={onOpen}
      sx={{
        display: "block",
        scrollMarginTop: "104px",
        width: "100%",
        textAlign: "start",
        p: 1.25,
        borderRadius: 4,
        border: `1px solid ${focused ? "#7c3aed" : "#e4e7f0"}`,
        bgcolor: "#fff",
        boxShadow: CERT_PANEL_SHADOW,
        transition: "transform .18s, box-shadow .18s, border-color .18s",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: CERT_HOVER_BORDER,
          boxShadow:
            "0 1px 2px rgba(16,24,40,0.04), 0 18px 34px -22px rgba(124,58,237,0.45)",
        },
        "&:focus-visible": {
          outline: "none",
          boxShadow: CERT_FOCUS_RING,
        },
      }}
    >
      <Box sx={{ position: "relative" }}>
        {children}
        {revoked && (
          <Box
            sx={{
              position: "absolute",
              top: 8,
              insetInlineEnd: 8,
              px: 1,
              py: 0.25,
              borderRadius: 999,
              fontSize: "0.62rem",
              fontWeight: 900,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: "#fff",
              bgcolor: "#b91c1c",
              '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
            }}
          >
            {revokedLabel}
          </Box>
        )}
      </Box>
      <Box sx={{ px: 0.75, pt: 1.25, pb: 0.5 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "0.86rem",
            lineHeight: 1.3,
            color: "#0f172a",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {caption}
        </Typography>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ mt: 0.5 }}
        >
          {meta && (
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8" }}>
              {meta}
            </Typography>
          )}
          <Stack
            direction="row"
            spacing={0.25}
            alignItems="center"
            sx={{ color: "#7c3aed", flexShrink: 0 }}
          >
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 800 }}>{viewLabel}</Typography>
            <IconWrapper icon="mdi:chevron-right" size={16} />
          </Stack>
        </Stack>
      </Box>
    </ButtonBase>
  );
}

/** A rung the learner has not reached. Inert on purpose: there is no credential
 *  behind it to open, and a card that looks clickable and does nothing is worse
 *  than one that plainly is not. */
function TierTeaser({
  children,
  caption,
  meta,
  focused,
  tier,
}: {
  children: React.ReactNode;
  caption: string;
  meta: string;
  focused?: boolean;
  tier: LearnerTierStatus;
}) {
  return (
    <Box
      id={`tier-${tier.slug}`}
      sx={{
        p: 1.25,
        borderRadius: 4,
        border: `1px solid ${focused ? "#7c3aed" : "#eef2f7"}`,
        bgcolor: "#faf9ff",
        scrollMarginTop: "104px",
      }}
    >
      {children}
      <Box sx={{ px: 0.75, pt: 1.25, pb: 0.5 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "0.86rem",
            lineHeight: 1.3,
            color: "#64748b",
          }}
        >
          {caption}
        </Typography>
        <Typography
          sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", mt: 0.5 }}
        >
          {meta}
        </Typography>
      </Box>
    </Box>
  );
}

/** The StartJourneyCard recipe (components/dashboard/v2/DashboardV2.tsx), so an
 *  empty certificates page reads like an empty dashboard rather than like an
 *  error. */
function EmptyEarned({
  onSeeLadder,
  ladderHeldCount = 0,
}: {
  onSeeLadder?: () => void;
  /** How many credentials the learner holds that the LADDER grid already drew.
   *  When this is non-zero the learner DOES hold certificates, they are simply
   *  all points milestones, so "No certificates yet" would contradict both the
   *  "Certificates" stat above this section and the ladder right below it. */
  ladderHeldCount?: number;
}) {
  const { t } = useTranslation("common");
  const holdsLadderOnly = ladderHeldCount > 0;
  return (
    <Box
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: 4,
        border: "1px solid #eef2f7",
        bgcolor: "#faf9ff",
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          mx: "auto",
          display: "grid",
          placeItems: "center",
          color: "#fff",
          background: CERT_BADGE_GRADIENT,
          boxShadow: "0 12px 26px -12px rgba(124,58,237,0.6)",
        }}
      >
        <IconWrapper icon="mdi:certificate-outline" size={28} />
      </Box>
      <Typography sx={{ mt: 1.5, fontWeight: 800, fontSize: "1.15rem", color: "#0f172a" }}>
        {holdsLadderOnly
          ? t("certificatesUpload.earnedOnlyLadderTitle", "All on the points ladder")
          : t("certificatesUpload.earnedEmptyTitle", "No certificates yet")}
      </Typography>
      <Typography
        sx={{
          mt: 0.5,
          fontSize: "0.85rem",
          color: "#64748b",
          maxWidth: 460,
          mx: "auto",
        }}
      >
        {holdsLadderOnly
          ? t(
              "certificatesUpload.earnedOnlyLadderBody",
              "The {{count}} certificate(s) you hold are all points milestones, so they sit together on the ladder below. Certificates you earn on a course or an assessment will appear here.",
              { count: ladderHeldCount },
            )
          : t(
              "certificatesUpload.earnedEmptyBody",
              "Finish a course or an assessment and your first credential appears here. The blurred certificates below are the milestones waiting for you.",
            )}
      </Typography>
      {onSeeLadder && (
        <ButtonBase
          onClick={onSeeLadder}
          sx={{
            mt: 2,
            px: 2.5,
            py: 1,
            borderRadius: 999,
            fontWeight: 800,
            fontSize: "0.85rem",
            color: "#fff",
            gap: 0.5,
            background: CERT_CTA_GRADIENT,
            boxShadow: CERT_CTA_SHADOW,
            "&:hover": { filter: "brightness(1.06)" },
          }}
        >
          {t("certificatesUpload.sectionSeeLadder", "See the ladder")}
          <IconWrapper icon="mdi:arrow-down" size={16} />
        </ButtonBase>
      )}
    </Box>
  );
}

/** Skeletons rather than a spinner: the page is a grid of fixed-ratio cards, so
 *  the shimmer can occupy the exact shape the content will, and nothing jumps
 *  when the data lands. */
export function CertificateGallerySkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <Stack spacing={2.5}>
      {/* The stat row, then the ladder rail, in the shape the page really has. */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2,1fr)", lg: "repeat(4,1fr)" },
          gap: 1.5,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" sx={{ height: 92, borderRadius: 3 }} />
        ))}
      </Box>
      <Skeleton variant="rounded" sx={{ height: 212, borderRadius: 4 }} />
      <Box>
        <Skeleton variant="text" sx={{ width: 200, fontSize: "0.95rem" }} />
        <Skeleton variant="text" sx={{ width: 340, fontSize: "0.72rem", mb: 1.5 }} />
        <Box sx={GRID_SX}>
          {Array.from({ length: cards }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              sx={{ width: "100%", aspectRatio: "1000 / 707", borderRadius: 4 }}
            />
          ))}
        </Box>
      </Box>
    </Stack>
  );
}
