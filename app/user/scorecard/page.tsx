"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Box, Container, Typography, Button, Paper, Skeleton, CircularProgress } from "@mui/material";

import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ActivityHeatmap } from "@/components/profile/ActivityHeatmap";
import { LearningConsumptionSection } from "@/components/scorecard/detailed/LearningConsumptionSection";
import { StudentOverviewSection } from "@/components/scorecard/detailed/StudentOverviewSection";
import { profileService, type HeatmapData } from "@/lib/services/profile.service";
import { scorecardService } from "@/lib/services/scorecard.service";
import type { ScorecardData } from "@/lib/types/scorecard.types";

export default function ScorecardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ScorecardData | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [scorecardData, heatmapRes] = await Promise.all([
        scorecardService.getScorecardData(),
        profileService.getUserActivityHeatmap().catch(() => ({ heatmap_data: {} as HeatmapData })),
      ]);
      setData(scorecardData);
      setHeatmapData(heatmapRes.heatmap_data ?? {});
    } catch {
      /* Error state: data remains null */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <MainLayout>
        <Box
          sx={{
            width: "100%",
            backgroundColor: "#f9fafb",
            minHeight: "100vh",
            pb: 4,
          }}
        >
          <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header skeleton */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 4,
              }}
            >
              <Box>
                <Skeleton variant="text" width={320} height={40} sx={{ mb: 0.5 }} />
                <Skeleton variant="text" width={380} height={24} />
              </Box>
              <Skeleton variant="rounded" width={160} height={40} sx={{ display: { xs: "none", sm: "block" } }} />
            </Box>

            {/* Overview stats row */}
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  height={88}
                  animation="wave"
                  sx={{ flex: "1 1 140px", minWidth: 120, borderRadius: 2 }}
                />
              ))}
            </Box>

            {/* Main content blocks */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Skeleton variant="rounded" height={180} animation="wave" sx={{ borderRadius: 2, width: "100%" }} />
              <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", md: "row" } }}>
                <Skeleton variant="rounded" height={280} animation="wave" sx={{ borderRadius: 2, flex: 1 }} />
                <Skeleton variant="rounded" height={280} animation="wave" sx={{ borderRadius: 2, flex: 1 }} />
              </Box>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {[1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    variant="rounded"
                    height={160}
                    animation="wave"
                    sx={{ flex: "1 1 200px", minWidth: 180, borderRadius: 2 }}
                  />
                ))}
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1 }}>
                <CircularProgress size={18} sx={{ color: "primary.main" }} />
                <Typography variant="body2" sx={{ color: "#6b7280", fontWeight: 500 }}>
                  Loading your scorecard...
                </Typography>
              </Box>
            </Box>
          </Container>
        </Box>
      </MainLayout>
    );
  }

  if (!data) {
    return (
      <MainLayout>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Typography variant="body1" sx={{ color: "#666666" }}>
            Failed to load scorecard data.
          </Typography>
        </Container>
      </MainLayout>
    );
  }

  const enabledModules = data.scorecardConfig?.enabledModules;
  const showAll = !enabledModules || enabledModules.length === 0;

  const SECTION_ORDER = ["overview", "activity_heatmap", "learning_consumption"] as const;

  const sectionOrder = showAll
    ? [...SECTION_ORDER]
    : (SECTION_ORDER as readonly string[]).filter((id) => (enabledModules as string[]).includes(id));

  return (
    <MainLayout>
      <Box
        sx={{
          width: "100%",
          backgroundColor: "#f9fafb",
          minHeight: "100vh",
          pb: 4,
        }}
      >
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Wrapper for PDF export capture */}
          <Box data-scorecard-pdf-content>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 4,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: "#000000",
                  fontSize: { xs: "1.75rem", sm: "2rem" },
                  mb: 0.5,
                }}
              >
                Learning scorecard
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "#666666",
                  fontSize: "0.9375rem",
                }}
              >
                Overview, activity, and learning consumption
              </Typography>
            </Box>
            <Button
              data-scorecard-pdf-exclude
              variant="outlined"
              startIcon={<IconWrapper icon="mdi:arrow-left" size={18} />}
              onClick={() => router.push("/dashboard")}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: "#0a66c2",
                borderColor: "#0a66c2",
                borderRadius: "24px",
                px: 2.5,
                py: 1,
                "&:hover": {
                  borderColor: "#004182",
                  backgroundColor: "rgba(10, 102, 194, 0.05)",
                },
                display: { xs: "none", sm: "flex" },
              }}
            >
              Back to Dashboard
            </Button>
          </Box>

          {/* Sections - order from enabled_modules when configured */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {sectionOrder.map((sectionId) => {
              const visible = showAll || (enabledModules && enabledModules.includes(sectionId));
              if (!visible) return null;
              switch (sectionId) {
                case "overview":
                  return <StudentOverviewSection key={sectionId} data={data.overview} />;
                case "activity_heatmap":
                  return <ActivityHeatmap key={sectionId} heatmapData={heatmapData} />;
                case "learning_consumption":
                  return <LearningConsumptionSection key={sectionId} data={data.learningConsumption} />;
                default:
                  return null;
              }
            })}
          </Box>
          </Box>
        </Container>
      </Box>
    </MainLayout>
  );
}
