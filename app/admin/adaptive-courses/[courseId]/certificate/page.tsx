"use client";

import { useParams, useRouter } from "next/navigation";
import { Box, ButtonBase } from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { SectionHero } from "@/components/scorecard/shared";
import { CertificateAdminSection } from "@/components/admin/adaptive-course/CertificateAdminSection";

const AMBER_TOP = "#f59e0b";
const AMBER_BOTTOM = "#f97316";

export default function AdminAdaptiveCertificatePage() {
  const router = useRouter();
  const courseId = Number(useParams().courseId);

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>
        <ButtonBase
          onClick={() => router.push(`/admin/adaptive-courses/${courseId}`)}
          sx={{ mb: 2, color: "#6366f1", fontWeight: 700, gap: 0.5, fontSize: "0.9rem" }}
        >
          <Icon icon="mdi:arrow-left" width={18} /> Back to course
        </ButtonBase>

        <AdaptiveSectionShell>
          <SectionHero
            chapter="Course certificate"
            title="Course certificate"
            subtitle="Upload the certificate template and decide when learners can download it and share to LinkedIn."
            accentTop={AMBER_TOP}
            accentBottom={AMBER_BOTTOM}
            iconBadge={{
              icon: "mdi:certificate",
              gradient: `linear-gradient(135deg, ${AMBER_TOP} 0%, ${AMBER_BOTTOM} 100%)`,
              shadow: `0 18px 32px -16px color-mix(in srgb, ${AMBER_TOP} 60%, transparent)`,
            }}
          />
          <CertificateAdminSection courseId={courseId} />
        </AdaptiveSectionShell>
      </Box>
    </MainLayout>
  );
}
