"use client";

import { useCallback, useState } from "react";
import { Box, Button, Stack, Typography, alpha, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  CertificateGallery,
  CertificateGallerySkeleton,
} from "@/components/certificate/CertificateGallery";
import { PointsLadderRail } from "@/components/certificate/PointsLadderRail";
import { useLearnerCertificates } from "@/components/certificate/useLearnerCertificates";
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
 */
export default function CertificatesPage() {
  const theme = useTheme();
  const { t, i18n } = useTranslation("common");
  const { data, isLoading, isError, refetch, isFetching } = useLearnerCertificates();
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

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow={t("certificatesUpload.pageEyebrow", "ACHIEVEMENTS")}
        title={t("certificatesUpload.pageTitle", "Certificates")}
        description={t(
          "certificatesUpload.pageDescription",
          "Every credential you have earned here, and every milestone still ahead of you. Certificates are verifiable: each one has a public page anyone can check, and you can download it as a PNG or a print-ready PDF.",
        )}
        accent="amber"
        icon="mdi:certificate"
      />

      {isLoading && <CertificateGallerySkeleton />}

      {!isLoading && isError && (
        <Box
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 4,
            textAlign: "center",
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.error.main, 0.06),
          }}
        >
          <Box sx={{ color: theme.palette.error.main }}>
            <IconWrapper icon="mdi:cloud-off-outline" size={34} />
          </Box>
          <Typography
            sx={{ mt: 1, fontWeight: 800, fontSize: "1rem", color: theme.palette.text.primary }}
          >
            {t("certificatesUpload.loadErrorTitle", "Could not load your certificates")}
          </Typography>
          <Typography
            sx={{
              mt: 0.5,
              fontSize: "0.85rem",
              color: theme.palette.text.secondary,
              maxWidth: 420,
              mx: "auto",
            }}
          >
            {t(
              "certificatesUpload.loadErrorBody",
              "Nothing has been lost. Your credentials are safe on the server and the page just could not reach it.",
            )}
          </Typography>
          <Button
            variant="contained"
            color="warning"
            disabled={isFetching}
            onClick={() => refetch()}
            sx={{ mt: 2, borderRadius: 999, fontWeight: 800, textTransform: "none" }}
          >
            {t("certificatesUpload.retry", "Try again")}
          </Button>
        </Box>
      )}

      {!isLoading && !isError && data && (
        <Stack spacing={4}>
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
