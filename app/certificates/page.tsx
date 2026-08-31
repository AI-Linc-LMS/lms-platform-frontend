"use client";

import { useCallback, useMemo, useState } from "react";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/common/PageShell";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { IconWrapper } from "@/components/common/IconWrapper";
import { PanelCard, StatBox } from "@/components/dashboard/v2/parts";
import { Reveal } from "@/components/scorecard/shared";
import {
  CertificateGallery,
  CertificateGallerySkeleton,
} from "@/components/certificate/CertificateGallery";
import { PointsLadderRail } from "@/components/certificate/PointsLadderRail";
import {
  ladderPosition,
  useLearnerCertificates,
} from "@/components/certificate/useLearnerCertificates";
import { formatPoints } from "@/lib/certificates/format";
import {
  CERT_ACCENT,
  CERT_CTA_GRADIENT,
  CERT_CTA_SHADOW,
} from "@/lib/certificates/ui-tokens";
import type { LearnerTierStatus } from "@/lib/certificates/types";

/**
 * The learner's certificates page.
 *
 * This is a MOTIVATIONAL surface before it is an archive. A learner with zero
 * credentials still has a reason to be here, because the whole points ladder is
 * drawn as real artwork with their own name on it, blurred behind the points
 * they still owe. That is why the locked rungs are rendered rather than listed:
 * a table of thresholds tells you what you have not done, and a blurred
 * certificate shows you what you are about to have.
 *
 * The rail across the top and the ladder grid below read the same query, so the
 * position marker and the cards can never disagree about which rung is next.
 *
 * Visually this is a STUDENT surface, so it speaks the dashboard's dialect:
 * literal hex, PanelCard/StatBox/SectionHeader from components/dashboard/v2/parts,
 * and the violet certificate identity that CertificatePanel already shows the same
 * learner on their dashboard. See docs/specs/certificates-ui-language.md.
 */
export default function CertificatesPage() {
  const { t, i18n } = useTranslation("common");
  const { clientInfo } = useClientInfo();
  // An institution can switch the student certificates surface off entirely
  // (`Client.hide_certificates_from_students`, set from the super-admin portal). The nav entry is
  // already filtered out; this covers the direct URL. The server 403s these endpoints too, so
  // without this the page would render its shell around a permanent error.
  const certificatesOff = Boolean(clientInfo?.hide_certificates_from_students);
  const { data, isLoading, isError, refetch, isFetching } = useLearnerCertificates({
    enabled: !certificatesOff,
  });
  const [focusTierSlug, setFocusTierSlug] = useState<string | null>(null);

  // The rail is a navigation control, not a second source of truth: tapping a
  // milestone scrolls to the card that already exists below it.
  const handleSelectTier = useCallback((tier: LearnerTierStatus) => {
    setFocusTierSlug(tier.slug);
    if (typeof document === "undefined") return;
    document
      .getElementById(`tier-${tier.slug}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const locale = i18n.language || "en-GB";

  const tiers = useMemo(
    () => [...(data?.tiers ?? [])].sort((a, b) => a.rank - b.rank),
    [data?.tiers],
  );
  // Revoked credentials do not count towards "certificates held" here for the same
  // reason they do not on the profile: the number is a claim, and a revoked one has
  // already been withdrawn. The gallery below still lists them, stamped.
  const heldCount = useMemo(
    () => (data?.issued ?? []).filter((cert) => cert.status !== "revoked").length,
    [data?.issued],
  );
  const position = useMemo(
    () => ladderPosition(tiers, data?.points_total ?? 0),
    [tiers, data?.points_total],
  );

  // Switched off for this institution. Say so plainly rather than rendering the motivational
  // ladder around an endpoint that will 403 - a blurred wall of certificates nobody here can earn
  // is a worse answer than "this isn't part of your programme".
  if (certificatesOff) {
    return (
      <PageShell>
        <PanelCard sx={{ p: { xs: 3, md: 5 }, textAlign: "center" }}>
          <IconWrapper icon="mdi:certificate-outline" size={44} color="var(--font-tertiary)" />
          <Typography sx={{ mt: 1.5, fontWeight: 800, fontSize: "1.05rem" }}>
            Certificates aren&apos;t part of this programme
          </Typography>
          <Typography sx={{ mt: 0.75, color: "var(--font-secondary)", fontSize: "0.9rem" }}>
            Your institution doesn&apos;t issue certificates here. Everything else in your
            programme works as normal.
          </Typography>
        </PanelCard>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow={t("certificatesUpload.pageEyebrow", "Achievements")}
        title={t("certificatesUpload.pageTitle", "Certificates")}
        description={t(
          "certificatesUpload.pageDescription",
          "Every credential you have earned here, and every milestone still ahead of you. Certificates are verifiable: each one has a public page anyone can check, and you can download it as a PNG or a print-ready PDF.",
        )}
        accent={CERT_ACCENT}
        icon="mdi:certificate"
      />

      {isLoading && <CertificateGallerySkeleton />}

      {!isLoading && isError && (
        <PanelCard sx={{ mb: 0, p: { xs: 3, md: 4 }, textAlign: "center" }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              mx: "auto",
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              bgcolor: "#fef2f2",
              color: "#b91c1c",
            }}
          >
            <IconWrapper icon="mdi:cloud-off-outline" size={28} />
          </Box>
          <Typography
            sx={{ mt: 1.5, fontWeight: 800, fontSize: "1.15rem", color: "#0f172a" }}
          >
            {t("certificatesUpload.loadErrorTitle", "Could not load your certificates")}
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
            {t(
              "certificatesUpload.loadErrorBody",
              "Nothing has been lost. Your credentials are safe on the server and the page just could not reach it.",
            )}
          </Typography>
          <ButtonBase
            disabled={isFetching}
            onClick={() => refetch()}
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
              "&.Mui-disabled": { opacity: 0.55, color: "#fff" },
            }}
          >
            {t("certificatesUpload.retry", "Try again")}
            <IconWrapper icon="mdi:refresh" size={16} />
          </ButtonBase>
        </PanelCard>
      )}

      {!isLoading && !isError && data && (
        <Stack spacing={2.5}>
          {/* The same four-up metric row every other student surface opens with, so
              /certificates does not read flatter than the dashboard it links from.
              Accents follow the canonical violet/amber/blue/green order. */}
          <Reveal>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2,1fr)", lg: "repeat(4,1fr)" },
                gap: 1.5,
              }}
            >
              <StatBox
                label={t("certificatesUpload.sectionStatHeld", "Certificates")}
                value={heldCount}
                icon="mdi:certificate-outline"
                accent="#7c3aed"
              />
              <StatBox
                label={t("certificatesUpload.sectionStatPoints", "Points")}
                value={formatPoints(
                  data.points_breakdown?.total ?? data.points_total ?? 0,
                )}
                icon="mdi:star-four-points-outline"
                accent="#f59e0b"
                sub={
                  data.points_breakdown
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
              <StatBox
                label={t("certificatesUpload.sectionStatMilestones", "Milestones")}
                value={`${position.achievedCount}/${tiers.length || 0}`}
                icon="mdi:stairs-up"
                accent="#3b82f6"
              />
              <StatBox
                label={t("certificatesUpload.statNextRung", "Next milestone")}
                value={
                  position.next
                    ? formatPoints(position.pointsRemaining)
                    : t("certificatesUpload.ladderAllDone", "All done")
                }
                sub={
                  position.next
                    ? position.next.name
                    : t(
                        "certificatesUpload.ladderComplete",
                        "Every milestone on the ladder is yours",
                      )
                }
                icon="mdi:flag-checkered"
                accent="#22c55e"
              />
            </Box>
          </Reveal>

          <PointsLadderRail
            tiers={data.tiers ?? []}
            pointsTotal={data.points_total ?? 0}
            activeSlug={focusTierSlug}
            onSelectTier={handleSelectTier}
          />
          <CertificateGallery data={data} locale={locale} focusTierSlug={focusTierSlug} />
        </Stack>
      )}
    </PageShell>
  );
}
