"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, ButtonBase, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import {
  adaptiveCourseService,
  type AdaptivePresentationDetail,
} from "@/lib/services/adaptive-course.service";
import { PresentationViewer } from "@/components/adaptive-quiz/presentation/PresentationViewer";

export default function AdaptivePresentationPage() {
  const { push, prefetch } = useInstantNavigation();
  const params = useParams();
  const courseId = Number(params.courseId);
  const submoduleId = Number(params.submoduleId);
  const presentationId = Number(params.presentationId);

  const [detail, setDetail] = useState<AdaptivePresentationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(presentationId)) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await adaptiveCourseService.getPresentation(presentationId);
        if (!cancelled) setDetail(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load presentation.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [presentationId]);

  const backHref = `/adaptive-courses/${courseId}/submodule/${submoduleId}`;

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>
        <ButtonBase
          onMouseEnter={() => prefetch(backHref)}
          onClick={() => push(backHref)}
          sx={{ mb: 2, color: "#0d9488", fontWeight: 700, gap: 0.5, fontSize: "0.9rem" }}
        >
          <Icon icon="mdi:arrow-left" width={18} />
          Back to topic
        </ButtonBase>

        {loading && (
          <Box sx={{ aspectRatio: "16 / 9", borderRadius: 4, bgcolor: "color-mix(in srgb, var(--card-bg, #f1f5f9) 70%, transparent)", display: "grid", placeItems: "center" }}>
            <Icon icon="mdi:loading" width={32} className="spin" style={{ opacity: 0.5 }} />
          </Box>
        )}

        {error && (
          <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 6 }}>{error}</Typography>
        )}

        {detail && (
          <>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.3rem", md: "1.6rem" }, mb: 0.5, color: "#0f172a" }}>
              {detail.title}
            </Typography>
            <Typography sx={{ fontSize: "0.82rem", color: "#64748b", mb: 2 }}>
              {detail.slide_count} slide{detail.slide_count === 1 ? "" : "s"} · use ← / → to navigate
            </Typography>
            <PresentationViewer document={detail.document} />
          </>
        )}
      </Box>
    </MainLayout>
  );
}
