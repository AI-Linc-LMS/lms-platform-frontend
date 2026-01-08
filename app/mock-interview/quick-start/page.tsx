"use client";

import { useState, useCallback } from "react";
import { Container, Box, Typography, Button } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  QuickStartForm,
  QuickStartFormData,
} from "@/components/mock-interview/QuickStartForm";
import { IconWrapper } from "@/components/common/IconWrapper";
import mockInterviewService from "@/lib/services/mock-interview.service";
import { useToast } from "@/components/common/Toast";
import { useRouter } from "next/navigation";
import { useStopCameraOnMount } from "@/lib/hooks/useStopCameraOnMount";

export default function QuickStartPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Stop any active camera streams on this page
  useStopCameraOnMount();

  const handleSubmit = useCallback(
    async (formData: QuickStartFormData) => {
      try {
        setLoading(true);
        const interview = await mockInterviewService.createInterview(formData);
        showToast("Interview created successfully!", "success");

        // Redirect to device-check page
        router.push(`/mock-interview/${interview.id}/device-check`);
      } catch (error) {
        showToast("Failed to create interview", "error");
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
              color: "#6b7280",
              fontWeight: 500,
              "&:hover": {
                backgroundColor: "#f3f4f6",
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
            Quick Start Interview
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "#6b7280", maxWidth: 600, mx: "auto" }}
          >
            Select your preferences and start your mock interview instantly.
            Perfect for quick practice sessions.
          </Typography>
        </Box>

        {/* Form */}
        <QuickStartForm onSubmit={handleSubmit} loading={loading} />
      </Container>
    </MainLayout>
  );
}
