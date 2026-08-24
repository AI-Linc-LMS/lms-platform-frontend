"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, LinearProgress, Skeleton, Stack, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { formatCertificateDate, formatPoints } from "@/lib/certificates/format";
import {
  CertificatePreview,
  LockedCertificatePreview,
} from "@/components/certificate/CertificatePreview";
import { useCertificateArtworkLabels } from "@/components/certificate/CertificateArtwork";
import {
  ladderPosition,
  payloadForLockedTier,
  useCertificateIssuer,
  useLearnerCertificates,
  useRecipientName,
} from "@/components/certificate/useLearnerCertificates";
import { ProfilePanel, ProfileSectionHeader, SectionAction, StatTile } from "./theme/surfaces";
import { PROFILE, STAT_ACCENT } from "./theme/profileTokens";

/**
 * EARNED certificates on the profile: credentials this platform issued.
 *
 * Deliberately NOT the same thing as CertificationsSection, which sits right
 * beside it. That one is self-reported: a learner types in an AWS or a Coursera
 * certificate they hold elsewhere, and nothing verifies it. This one is the set
 * of credentials the backend issued to them, each with a public verification
 * page. Two sections with near-identical names would be a usability trap, so the
 * copy never says "certifications" here and never says "earned" there.
 *
 * It is a SUMMARY, not a second gallery. Three miniatures, the points standing,
 * and one way out to /certificates. Everything a learner does with a credential
 * (download, verify, share) lives on that page, so this surface has no actions
 * of its own to get out of sync with it.
 */

interface CertificatesSectionProps {
  onRemoveSection?: () => void;
}

/** Three fits one row on a desktop profile column and two on a tablet without
 *  the miniatures dropping below the width where a name is still readable. */
const MAX_MINIATURES = 3;

export function CertificatesSection({ onRemoveSection }: CertificatesSectionProps) {
  const { t, i18n } = useTranslation("common");
  const { push, prefetch } = useInstantNavigation();
  const { data, isLoading, isError } = useLearnerCertificates();
  const labels = useCertificateArtworkLabels();
  const issuer = useCertificateIssuer();
  const recipientName = useRecipientName(data?.issued);

  const locale = i18n.language || "en-GB";

  const tiers = useMemo(
    () => [...(data?.tiers ?? [])].sort((a, b) => a.rank - b.rank),
    [data?.tiers],
  );
  const position = useMemo(
    () => ladderPosition(tiers, data?.points_total ?? 0),
    [tiers, data?.points_total],
  );

  // Revoked credentials are excluded from BOTH the count and the miniatures.
  // This is the surface a learner shows someone, and a revoked certificate
  // displayed proudly here, or silently inflating "3 certificates", is a claim
  // the platform has already withdrawn. The gallery still lists them, correctly
  // stamped, because a learner is entitled to see what happened to their own
  // credential.
  const active = useMemo(
    () => (data?.issued ?? []).filter((cert) => cert.status !== "revoked"),
    [data?.issued],
  );
  // Newest first: the certificate a learner just earned is the one they came to
  // look at, and it is the one they want to show someone.
  const recent = useMemo(
    () =>
      [...active]
        .sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime())
        .slice(0, MAX_MINIATURES),
    [active],
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

  const goToGallery = () => push("/certificates");

  return (
    <ProfilePanel id="section-certificates">
      <ProfileSectionHeader
        icon="mdi:certificate"
        title={t("certificatesUpload.sectionTitle", "Earned certificates")}
        subtitle={t(
          "certificatesUpload.sectionSubtitle",
          "Verified credentials this platform issued to you",
        )}
        gradient="linear-gradient(135deg, #f59e0b, #d97706)"
        action={
          <Stack direction="row" alignItems="center" spacing={0.5}>
            {onRemoveSection && (
              <Button
                variant="text"
                size="small"
                startIcon={<IconWrapper icon="mdi:close" size={16} />}
                onClick={onRemoveSection}
                sx={{
                  textTransform: "none",
                  color: PROFILE.inkFaint,
                  fontWeight: 500,
                  fontSize: "0.8125rem",
                  "&:hover": { color: "#ef4444", backgroundColor: "#fef2f2" },
                }}
              >
                {t("profile.remove", { defaultValue: "Remove" })}
              </Button>
            )}
            <SectionAction
              icon="mdi:arrow-right"
              label={t("certificatesUpload.sectionViewAll", "View all")}
              onClick={goToGallery}
            />
          </Stack>
        }
      />

      {isLoading ? (
        <SectionSkeleton />
      ) : isError ? (
        <Typography sx={{ fontSize: "0.82rem", color: PROFILE.inkFaint }}>
          {t(
            "certificatesUpload.sectionLoadError",
            "Your certificates could not be loaded right now. They are safe; open the certificates page to try again.",
          )}
        </Typography>
      ) : (
        <Stack spacing={2.25}>
          <Box
            sx={{
              display: "grid",
              gap: 1.25,
              gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, minmax(0, 1fr))" },
            }}
          >
            <StatTile
              label={t("certificatesUpload.sectionStatHeld", "Certificates")}
              value={active.length}
              icon="mdi:certificate-outline"
              accent={STAT_ACCENT.amber}
            />
            {/* The breakdown answers the commonest support question about this
                feature - "why does the ladder think I have fewer points than the
                dashboard says" - and the server has been sending it all along. */}
            <StatTile
              label={t("certificatesUpload.sectionStatPoints", "Points")}
              value={formatPoints(data?.points_breakdown?.total ?? data?.points_total ?? 0)}
              icon="mdi:star-four-points-outline"
              accent={STAT_ACCENT.violet}
              sub={
                data?.points_breakdown
                  ? t(
                      "certificatesUpload.pointsSplit",
                      "{{adaptive}} from courses, {{community}} from the community",
                      {
                        adaptive: formatPoints(data.points_breakdown.adaptive),
                        community: formatPoints(data.points_breakdown.community),
                      },
                    )
                  : undefined
              }
            />
            <StatTile
              label={t("certificatesUpload.sectionStatMilestones", "Milestones")}
              value={`${position.achievedCount}/${tiers.length || 0}`}
              icon="mdi:stairs-up"
              accent={STAT_ACCENT.green}
            />
          </Box>

          {/* The points-to-next-tier line. Progress is measured from the rung
              just cleared, not from zero, so the bar never appears to fall
              backwards the moment a learner crosses a threshold. */}
          {position.next && (
            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="baseline"
                gap={1}
                sx={{ mb: 0.75 }}
              >
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: PROFILE.ink }}>
                  {t("certificatesUpload.ladderNext", "{{points}} points to {{tier}}", {
                    points: formatPoints(position.pointsRemaining),
                    tier: position.next.name,
                  })}
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: PROFILE.inkFaint }}>
                  {formatPoints(position.next.points_threshold)}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={position.progressToNext}
                sx={{
                  height: 7,
                  borderRadius: 999,
                  bgcolor: PROFILE.hairlineSoft,
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 999,
                    backgroundImage: "linear-gradient(90deg, #f59e0b, #d97706)",
                  },
                }}
              />
            </Box>
          )}

          {recent.length > 0 ? (
            <Box
              sx={{
                display: "grid",
                gap: 1.5,
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: `repeat(${Math.min(recent.length, MAX_MINIATURES)}, minmax(0, 1fr))`,
                },
              }}
            >
              {recent.map((cert) => (
                <Box
                  key={cert.credential_id}
                  component="button"
                  onClick={goToGallery}
                  onMouseEnter={() => prefetch("/certificates")}
                  sx={{
                    p: 0,
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    textAlign: "start",
                    fontFamily: "inherit",
                    borderRadius: 3,
                    transition: "transform .18s",
                    "&:hover": { transform: "translateY(-2px)" },
                    "&:focus-visible": {
                      outline: "none",
                      boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${STAT_ACCENT.amber}`,
                    },
                  }}
                >
                  <CertificatePreview
                    /* `issued[]` elements are already render payloads. */
                    payload={cert}
                    labels={labels}
                    locale={locale}
                    radius={8}
                    elevated={false}
                    wrapperStyle={{ border: `1px solid ${PROFILE.hairline}` }}
                  />
                  <Typography
                    sx={{
                      mt: 0.9,
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      color: PROFILE.ink,
                      lineHeight: 1.25,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {cert.subtitle?.trim() || cert.source?.label || cert.title}
                  </Typography>
                  <Typography sx={{ fontSize: "0.7rem", color: PROFILE.inkFaint, mt: 0.2 }}>
                    {formatCertificateDate(cert.issued_at, locale)}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            /* Nothing earned yet. Rather than an empty box, show the very next
               rung as the real certificate, blurred: the learner sees their own
               name on the thing they are about to get. */
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              {position.next && (
                <Box sx={{ width: { xs: "100%", sm: 230 }, flexShrink: 0 }}>
                  <LockedCertificatePreview
                    payload={payloadForLockedTier(
                      position.next,
                      issuer,
                      recipientName,
                      tierLabels,
                    )}
                    labels={labels}
                    locale={locale}
                    radius={8}
                    pointsCurrent={data?.points_total ?? 0}
                    pointsRequired={position.next.points_threshold}
                  />
                </Box>
              )}
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", color: PROFILE.ink }}>
                  {t("certificatesUpload.sectionEmptyTitle", "Your first certificate is waiting")}
                </Typography>
                <Typography sx={{ fontSize: "0.78rem", color: PROFILE.inkFaint, mt: 0.4 }}>
                  {t(
                    "certificatesUpload.sectionEmptyBody",
                    "Finish a course or an assessment, or climb the points ladder, and your credential appears here with a public verification page you can share.",
                  )}
                </Typography>
                <Box sx={{ mt: 1.25 }}>
                  <SectionAction
                    icon="mdi:trophy-outline"
                    label={t("certificatesUpload.sectionSeeLadder", "See the ladder")}
                    onClick={goToGallery}
                  />
                </Box>
              </Box>
            </Stack>
          )}
        </Stack>
      )}
    </ProfilePanel>
  );
}

/** Skeletons in the exact shape of the loaded section, so the panel does not
 *  resize under the reader when the query lands. */
function SectionSkeleton() {
  return (
    <Stack spacing={2.25}>
      <Box
        sx={{
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" sx={{ height: 86, borderRadius: 3 }} />
        ))}
      </Box>
      <Skeleton variant="rounded" sx={{ height: 26, borderRadius: 999 }} />
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        {[0, 1, 2].map((i) => (
          <Skeleton
            key={i}
            variant="rounded"
            sx={{ width: "100%", aspectRatio: "1000 / 707", borderRadius: 2 }}
          />
        ))}
      </Box>
    </Stack>
  );
}
