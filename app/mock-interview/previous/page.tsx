"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Box, Container, Typography } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { PreviousInterviewsTable } from "@/components/mock-interview/PreviousInterviewsTable";
import { IconWrapper } from "@/components/common/IconWrapper";
import mockInterviewService, {
  MockInterview,
} from "@/lib/services/mock-interview.service";
import { useToast } from "@/components/common/Toast";
import { useStopCameraOnMount } from "@/lib/hooks/useStopCameraOnMount";

export default function PreviousInterviewsPage() {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<MockInterview[]>([]);
  const hasLoadedRef = useRef(false);

  // Stop any active camera streams on this page
  useStopCameraOnMount();

  useEffect(() => {
    if (hasLoadedRef.current) return;

    const loadInterviews = async () => {
      try {
        hasLoadedRef.current = true;
        setLoading(true);
        const data = await mockInterviewService.listInterviews("completed");
        setInterviews(data);
      } catch (error) {
        showToast("Failed to load interviews", "error");
        hasLoadedRef.current = false;
      } finally {
        setLoading(false);
      }
    };

    loadInterviews();
  }, [showToast]);


  return (
    <MainLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 4,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                backgroundColor: "var(--success-500)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconWrapper icon="mdi:history" size={32} color="var(--font-light)" />
            </Box>
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, fontSize: { xs: "1.5rem", md: "2rem" } }}
              >
                {t("mockInterview.previousInterviews")}
              </Typography>
              <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                {interviews.length} interview
                {interviews.length !== 1 ? "s" : ""} completed
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* The three-tab strip that sat here - New Interview (/mock-interview), Previous,
            Scheduled (/mock-interview/scheduled) - belonged to the standalone legacy mock
            interview, which is retired. Two of its three tabs pointed into that product and
            the third was this page, so the strip is gone rather than left with one dead tab
            and one tab pointing at itself. This page stays: it is the learner's own
            completed-attempt history, it is where the result page sends them, and it lists
            course interview ROUNDS as well as the standalone attempts they already sat. */}
        {/* Previous Interviews Table */}
        <PreviousInterviewsTable interviews={interviews} />
      </Container>
    </MainLayout>
  );
}
