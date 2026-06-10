"use client";

import { Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CircularProgress, Container, Typography } from "@mui/material";

import { MainLayout } from "@/components/layout/MainLayout";
import { AdaptiveCodingSolve } from "@/components/coding/AdaptiveCodingSolve";

function SolveInner() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const courseId = Number(params.courseId);
  const submoduleId = Number(params.submoduleId);
  const problemId = Number(params.problemId);
  const configId = Number(searchParams.get("configId"));

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
      onBack={() => router.push(`/adaptive-courses/${courseId}/submodule/${submoduleId}`)}
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
