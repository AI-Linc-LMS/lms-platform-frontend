"use client";

import { useState, useCallback } from "react";
import { Container, Box, Typography, Button } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  ScheduleInterviewForm,
  ScheduleInterviewFormData,
} from "@/components/mock-interview/ScheduleInterviewForm";
import { IconWrapper } from "@/components/common/IconWrapper";
import mockInterviewService from "@/lib/services/mock-interview.service";
import { useToast } from "@/components/common/Toast";
import { useRouter } from "next/navigation";
import { useStopCameraOnMount } from "@/lib/hooks/useStopCameraOnMount";

export default function ScheduleInterviewPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Stop any active camera streams on this page
  useStopCameraOnMount();

  const handleSubmit = useCallback(
    async (formData: ScheduleInterviewFormData) => {
      try {
        setLoading(true);
        await mockInterviewService.createInterview(formData);
        showToast("Interview scheduled successfully!", "success");
        router.push("/mock-interview");
      } catch (error) {
        showToast("Failed to schedule interview", "error");
      } finally {
        setLoading(false);
      }
    },
    [showToast, router]
  );

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumb */}
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
            onClick={() => router.push("/mock-interview")}
            sx={{
              textTransform: "none",
              color: "var(--font-secondary)",
              fontWeight: 500,
              "&:hover": {
                backgroundColor:
                  "color-mix(in srgb, var(--surface) 75%, var(--background) 25%)",
              },
            }}
          >
            Back to Mock Interviews
          </Button>
        </Box>

        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "2rem", md: "2.5rem" },
              mb: 1,
            }}
          >
            Schedule Your Interview
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "var(--font-secondary)", maxWidth: 600, mx: "auto" }}
          >
            Choose a convenient time and prepare in advance for your mock interview
            with detailed configuration options.
          </Typography>
        </Box>

        {/* Form */}
        <ScheduleInterviewForm onSubmit={handleSubmit} loading={loading} />
      </Container>
    </MainLayout>
  );
}

