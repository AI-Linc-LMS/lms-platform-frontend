"use client";

import { useParams } from "next/navigation";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { ButtonBase, Container, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import { MainLayout } from "@/components/layout/MainLayout";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { VideoCompanion } from "@/components/adaptive-video/VideoCompanion";

export default function AdaptiveVideoCompanionPage() {
  const { push } = useInstantNavigation();
  const params = useParams();
  const courseId = Number(params.courseId);
  const submoduleId = Number(params.submoduleId);
  const configId = Number(params.configId);

  return (
    <MainLayout>
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
        <ButtonBase
          onClick={() => push(`/adaptive-courses/${courseId}/submodule/${submoduleId}`)}
          sx={{ mb: 2, color: "#6366f1", fontWeight: 700, gap: 0.5, fontSize: "0.9rem" }}
        >
          <Icon icon="mdi:arrow-left" width={18} />
          Back to submodule
        </ButtonBase>

        <AdaptiveSectionShell meshOpacity={0.18}>
          {Number.isFinite(configId) ? (
            <VideoCompanion configId={configId} />
          ) : (
            <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 6 }}>
              Missing video companion reference.
            </Typography>
          )}
        </AdaptiveSectionShell>
      </Container>
    </MainLayout>
  );
}
