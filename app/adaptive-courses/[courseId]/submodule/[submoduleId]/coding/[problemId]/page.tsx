"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { useReturnTo } from "@/lib/hooks/useReturnTo";
import { CircularProgress, Container, Typography } from "@mui/material";

import { MainLayout } from "@/components/layout/MainLayout";
import { AdaptiveCodingSolve } from "@/components/coding/AdaptiveCodingSolve";

function SolveInner() {
  const { push } = useInstantNavigation();
  const params = useParams();
  const searchParams = useSearchParams();

  const courseId = Number(params.courseId);
  const submoduleId = Number(params.submoduleId);
  const problemId = Number(params.problemId);
  const configId = Number(searchParams.get("configId"));
  // Honours ?from= so a learner who arrived from a roadmap returns to it, not to the course.
  const returnTo = useReturnTo({
    href: `/adaptive-courses/${courseId}/submodule/${submoduleId}`,
    label: "Back to submodule",
  });

  const valid = Number.isFinite(problemId) && Number.isFinite(configId);

  if (!valid) {
    return (
      <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 6 }}>
        Missing problem or coding-set reference.
      </Typography>
    );
  }

  return (
    <AdaptiveCodingSolve
      configId={configId}
      problemId={problemId}
      onBack={() => push(returnTo.href)}
    />
  );
}

export default function AdaptiveCodingSolvePage() {
  return (
    <MainLayout fullWidthContent>
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
        <Suspense fallback={<CircularProgress sx={{ display: "block", mx: "auto", my: 8 }} />}>
          <SolveInner />
        </Suspense>
      </Container>
    </MainLayout>
  );
}
