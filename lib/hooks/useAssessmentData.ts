"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { assessmentService } from "@/lib/services/assessment.service";
import { useToast } from "@/components/common/Toast";

interface QuizSection {
  id: number;
  title: string;
  description: string;
  order: number;
  mcqs: Array<{
    id: number;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
  }>;
}

interface CodingSection {
  id: number;
  title: string;
  description: string;
  order: number;
  coding_problems: Array<any>;
}

interface AssessmentResponse {
  id: number;
  title: string;
  slug: string;
  instructions: string;
  description: string;
  duration_minutes: number;
  quizSection?: QuizSection[];
  codingProblemSection?: CodingSection[];
  remaining_time: number;
  status: string;
  responseSheet: Record<string, any>;
  proctoring_enabled?: boolean;
}

export function useAssessmentData(slug: string) {
  const router = useRouter();
  const { showToast } = useToast();
  const [assessment, setAssessment] = useState<AssessmentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAssessment = async () => {
      try {
        setLoading(true);
        // Start the assessment
        const data: any = await assessmentService.startAssessment(slug);

        // Check if assessment is already submitted
        if (data.status === "submitted") {
          showToast("This assessment has already been submitted", "warning");
          router.push(`/assessments/${slug}`);
          return;
        }

        setAssessment(data as any);
      } catch (error: any) {
        showToast("Failed to start assessment", "error");
        router.push(`/assessments/${slug}`);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadAssessment();
    }
  }, [slug, router, showToast]);

  return { assessment, loading };
}
