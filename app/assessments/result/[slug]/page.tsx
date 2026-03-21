"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Box, Button } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  assessmentService,
  AssessmentResult,
} from "@/lib/services/assessment.service";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { AssessmentResultContent } from "@/components/assessment/result/AssessmentResultContent";
import { PsychometricResultView } from "@/components/assessment/result/PsychometricResultView";
import { generateAssessmentResultPdfVector } from "@/lib/utils/assessment-result-pdf.utils";
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
  const [pdfExporting, setPdfExporting] = useState(false);

  const { showToast } = useToast();

  const forcePsychometric = searchParams?.get("type") === "psychometric";

  useEffect(() => {
    if (!slug) return;
    loadAssessmentResult();
  }, [slug]);

  const loadAssessmentResult = async () => {
    try {
      const slugLower = slug?.toLowerCase() || "";

      const isPsychometric =
        forcePsychometric ||
        slugLower.includes("psychometric") ||
        slugLower.includes("kdisha") ||
        slugLower.includes("ksage");

      if (isPsychometric) {
        await new Promise((r) => setTimeout(r, 300));
        setPsychometricData(getMockPsychometricData(slug));
        setLoading(false);
        return;
      }

      const result = await assessmentService.getAssessmentResult(slug);

      if ((result as any).assessment_meta) {
        setPsychometricData(result);
      } else {
        setAssessmentResult(result);
      }
    } catch (error) {
      showToast("Failed to load assessment results", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!assessmentResult && !psychometricData) return null;

  if (psychometricData) {
    return (
      <MainLayout>
        <PsychometricResultView data={psychometricData} />
      </MainLayout>
    );
  }

  const stats = assessmentResult?.stats || ({} as AssessmentResult["stats"]);

  const quizResponses = assessmentResult?.user_responses?.quiz_responses || [];

  const handleDownloadResultPdf = () => {
    if (!assessmentResult || pdfExporting) return;

    setPdfExporting(true);

    try {
      const base =
        (assessmentResult.assessment_name || slug || "assessment-result")
          .replace(/[^a-z0-9]+/gi, "-")
          .replace(/^-+|-+$/g, "") || "assessment-result";

      generateAssessmentResultPdfVector(assessmentResult, `${base}-result.pdf`);
      showToast("PDF downloaded", "success");
    } catch {
      showToast("Could not generate PDF", "error");
    } finally {
      setPdfExporting(false);
    }
  };

  return (
    <MainLayout>
      <Box
        sx={{
          maxWidth: "1200px",
          mx: "auto",
          px: 3,
          py: 3,
        }}
      >
        {/* Top Actions */}
        <Box
          className="exclude-from-pdf"
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Button
            startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
            onClick={() => router.push("/assessments")}
          >
            Back
          </Button>

          <Button
            variant="outlined"
            disabled={pdfExporting}
            startIcon={
              <IconWrapper icon="mdi:file-download-outline" size={20} />
            }
            onClick={handleDownloadResultPdf}
          >
            {pdfExporting ? "Preparing PDF…" : "Download PDF"}
          </Button>
        </Box>

        {/* RESULTS VIEW */}
        <Box>
          <AssessmentResultContent assessmentResult={assessmentResult} />
        </Box>
      </Box>
    </MainLayout>
  );
}
