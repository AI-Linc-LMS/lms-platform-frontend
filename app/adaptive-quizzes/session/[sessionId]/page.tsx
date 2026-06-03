"use client";

import { useParams } from "next/navigation";
import { Box, Container, Typography } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { AdaptiveQuizLayout } from "@/components/adaptive-quiz/AdaptiveQuizLayout";
import { useAdaptiveFeatureGuard } from "@/hooks/useAdaptiveFeatureGuard";

export default function AdaptiveQuizSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const featureOn = useAdaptiveFeatureGuard();

  if (!featureOn) {
    return (
      <MainLayout>
        <Container sx={{ py: 8 }}>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Adaptive quiz is not enabled for this organisation.
            </Typography>
            <Typography sx={{ color: "text.secondary", mt: 1 }}>
              Ask your administrator to turn on the “Adaptive Quiz” feature.
            </Typography>
          </Box>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
        <AdaptiveQuizLayout sessionId={params.sessionId} />
      </Container>
    </MainLayout>
  );
}
