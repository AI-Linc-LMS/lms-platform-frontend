"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { ButtonBase, Container, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import { MainLayout } from "@/components/layout/MainLayout";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { VideoCompanion } from "@/components/adaptive-video/VideoCompanion";
import { NextStepCard, useNextStep } from "@/components/adaptive-course/NextStepCard";

export default function AdaptiveVideoCompanionPage() {
  const { push } = useInstantNavigation();
  const params = useParams();
  const courseId = Number(params.courseId);
  const submoduleId = Number(params.submoduleId);
  const configId = Number(params.configId);
  // Next appears once the video counts as watched: already on an earlier visit, or the moment this
  // watch reaches the end and is scored.
  const { next, alreadyCompleted } = useNextStep(courseId, submoduleId, `video:${configId}`);
  const [finishedNow, setFinishedNow] = useState(false);

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
            <VideoCompanion configId={configId} onCompleted={() => setFinishedNow(true)} />
          ) : (
            <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 6 }}>
              Missing video companion reference.
            </Typography>
          )}
        </AdaptiveSectionShell>
        {(alreadyCompleted || finishedNow) && <NextStepCard next={next} />}
      </Container>
    </MainLayout>
  );
}
