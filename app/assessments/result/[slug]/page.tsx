"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Box, Button, Typography } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  assessmentService,
  AssessmentResult,
} from "@/lib/services/assessment.service";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { AssessmentResultContent } from "@/components/assessment/result/AssessmentResultContent";
import { PsychometricResultView } from "@/components/assessment/result/PsychometricResultView";
import { getMockPsychometricData } from "@/lib/mock-data/assessment-mock-data";

export default function AssessmentResultPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const [assessmentResult, setAssessmentResult] =
    useState<AssessmentResult | null>(null);
  const [psychometricData, setPsychometricData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const { showToast } = useToast();

  const forcePsychometric = searchParams?.get("type") === "psychometric";

  useEffect(() => {
    if (!slug) return;

    let isCancelled = false;

    const loadData = async () => {
      if (isCancelled) return;
      await loadAssessmentResult();
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [slug]);

  const loadAssessmentResult = async () => {
    try {
      // Check if it's a psychometric assessment by slug or query parameter
      const slugLower = slug?.toLowerCase() || "";
      const isPsychometric = 
        forcePsychometric ||
        slugLower === "psychometric-personality-v1" || 
        slugLower.includes("psychometric") ||
        slugLower === "psychometric" ||
        slugLower.includes("k-disha") ||
        slugLower.includes("kdisha") ||
        slugLower.includes("k-sage") ||
        slugLower.includes("ksage");
      
      // For psychometric assessments, use mock data for now
      if (isPsychometric) {
        // Simulate a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 300));
        // Get different mock data based on slug or random selection
        setPsychometricData(getMockPsychometricData(slug));
        setLoading(false);
        return;
      }

      // For all other assessments, use real API call
      const result = await assessmentService.getAssessmentResult(slug);
      
      // Detection Logic:
      // 1. If response has 'assessment_meta' field → Psychometric Assessment
      // 2. If response has 'stats' field → Aptitude Test Assessment
      if ((result as any).assessment_meta) {
        // Psychometric assessment detected (from API)
        setPsychometricData(result as any);
      } else {
        // Aptitude test or other assessment type - use original structure
        setAssessmentResult(result);
      }
    } catch (error: any) {
      setLoadFailed(true);
      showToast("Failed to load assessment results", "error");
    } finally {
      setLoading(false);
    }
  };



  // If psychometric assessment, render psychometric view
  if (psychometricData) {
    return (
      <MainLayout>
        <div className="w-full bg-slate-50">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
            <button
              onClick={() => router.push("/assessments")}
              className="mb-3 sm:mb-4 md:mb-6 text-slate-600 active:text-blue-600 hover:text-blue-600 font-semibold flex items-center gap-2 transition-colors text-sm sm:text-base touch-manipulation min-h-[44px] sm:min-h-auto"
              aria-label="Back to Assessments"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span className="hidden xs:inline">Back to Assessments</span>
              <span className="xs:hidden">Back</span>
            </button>
          </div>
          <PsychometricResultView data={psychometricData} />
        </div>
      </MainLayout>
    );
  }

  if (loadFailed) {
    return (
      <MainLayout>
        <Box
          sx={{
            width: "100%",
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 4, sm: 6 },
            maxWidth: "600px",
            mx: "auto",
          }}
        >
          <Button
            startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
            onClick={() => router.push("/assessments")}
            sx={{
              mb: 3,
              color: "#6b7280",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": {
                backgroundColor: "rgba(99, 102, 241, 0.08)",
                color: "#6366f1",
              },
            }}
          >
            Back to Assessments
          </Button>
          <Box
            sx={{
              textAlign: "center",
              p: 4,
              borderRadius: 2,
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <IconWrapper
                icon="mdi:clock-outline"
                size={64}
                color="#6366f1"
              />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom textAlign="center">
              Evaluation in Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your assessment results are not available yet. Your submission is being 
              evaluated. You will receive your results soon.
            </Typography>
          </Box>
        </Box>
      </MainLayout>
    );
  }

  if (!assessmentResult) {
    return null;
  }

  // When show_result is false, show student-friendly evaluation message instead of full result
  if (assessmentResult.show_result === false) {
    return (
      <MainLayout>
        <Box
          sx={{
            width: "100%",
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 4, sm: 6 },
            maxWidth: "600px",
            mx: "auto",
          }}
        >
          <Button
            startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
            onClick={() => router.push("/assessments")}
            sx={{
              mb: 3,
              color: "#6b7280",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": {
                backgroundColor: "rgba(99, 102, 241, 0.08)",
                color: "#6366f1",
              },
            }}
          >
            Back to Assessments
          </Button>
          <Box
            sx={{
              textAlign: "center",
              p: 4,
              borderRadius: 2,
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <IconWrapper
                icon="mdi:clock-outline"
                size={64}
                color="#6366f1"
              />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom textAlign="center">
              Evaluation in Progress
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Thank you for completing <strong>{assessmentResult.assessment_name}</strong>.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your assessment has been submitted successfully and is being evaluated. 
              You will receive your results soon 
            </Typography>
          </Box>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box
        sx={{
          width: "100%",
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2, sm: 3 },
          maxWidth: "1200px",
          mx: "auto",
        }}
      >
        {/* Back Button */}
        <Button
          startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
          onClick={() => router.push("/assessments")}
          sx={{
            mb: 3,
            color: "#6b7280",
            textTransform: "none",
            fontWeight: 600,
            "&:hover": {
              backgroundColor: "rgba(99, 102, 241, 0.08)",
              color: "#6366f1",
            },
          }}
        >
          Back to Assessments
        </Button>

        {/* RESULTS VIEW */}
        <Box>
          <AssessmentResultContent assessmentResult={assessmentResult} />
        </Box>
      </Box>
    </MainLayout>
  );
}
