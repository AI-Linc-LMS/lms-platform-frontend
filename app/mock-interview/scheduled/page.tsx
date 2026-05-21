"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Box, Container, Typography } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { ScheduledInterviewsTable } from "@/components/mock-interview/ScheduledInterviewsTable";
import { IconWrapper } from "@/components/common/IconWrapper";
import mockInterviewService, {
  MockInterview,
} from "@/lib/services/mock-interview.service";
import { useToast } from "@/components/common/Toast";
import { useRouter } from "next/navigation";
import { useStopCameraOnMount } from "@/lib/hooks/useStopCameraOnMount";

export default function ScheduledInterviewsPage() {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const router = useRouter();
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
        const data = await mockInterviewService.listInterviews("scheduled");
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

  const handleViewDetails = useCallback(
    (id: number) => {
      router.push(`/mock-interview/${id}`);
    },
    [router]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      if (window.confirm("Are you sure you want to cancel this interview?")) {
        try {
          // Call delete API here when available
          showToast("Interview cancelled successfully", "success");
          setInterviews((prev) => prev.filter((i) => i.id !== id));
        } catch (error) {
          showToast("Failed to cancel interview", "error");
        }
      }
    },
    [showToast]
  );


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
                backgroundColor: "var(--warning-500)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconWrapper
                icon="mdi:calendar-clock"
                size={32}
                color="var(--font-light)"
              />
            </Box>
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, fontSize: { xs: "1.5rem", md: "2rem" } }}
              >
                Scheduled Interviews
              </Typography>
              <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                {interviews.length} interview
                {interviews.length !== 1 ? "s" : ""} scheduled
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Tabs Navigation */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 4,
            p: 1,
            backgroundColor: "var(--surface)",
            borderRadius: 3,
            width: "fit-content",
          }}
        >
          <Box
            onClick={() => router.push("/mock-interview")}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 3,
              py: 1.5,
              borderRadius: 2.5,
              cursor: "pointer",
              transition: "all 0.3s ease",
              backgroundColor: "transparent",
              "&:hover": {
                backgroundColor:
                  "color-mix(in srgb, var(--font-primary) 8%, transparent)",
              },
            }}
          >
            <IconWrapper icon="mdi:lightning-bolt" size={20} color="var(--font-secondary)" />
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: "0.95rem",
                color: "var(--font-secondary)",
              }}
            >
              {t("mockInterview.newInterview")}
            </Typography>
          </Box>

          <Box
            onClick={() => router.push("/mock-interview/previous")}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 3,
              py: 1.5,
              borderRadius: 2.5,
              cursor: "pointer",
              transition: "all 0.3s ease",
              backgroundColor: "transparent",
              "&:hover": {
                backgroundColor:
                  "color-mix(in srgb, var(--font-primary) 8%, transparent)",
              },
            }}
          >
            <IconWrapper icon="mdi:history" size={20} color="var(--font-secondary)" />
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: "0.95rem",
                color: "var(--font-secondary)",
              }}
            >
              {t("mockInterview.previous")}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 3,
              py: 1.5,
              borderRadius: 2.5,
              cursor: "pointer",
              transition: "all 0.3s ease",
              backgroundColor: "var(--card-bg)",
              boxShadow:
                "0 2px 8px color-mix(in srgb, var(--font-primary) 10%, transparent)",
            }}
          >
            <IconWrapper icon="mdi:calendar-clock" size={20} color="var(--accent-indigo)" />
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: "0.95rem",
                color: "var(--font-primary)",
              }}
            >
              Scheduled
            </Typography>
          </Box>
        </Box>

        {/* Scheduled Interviews Table */}
        <ScheduledInterviewsTable
          interviews={interviews}
          onViewDetails={handleViewDetails}
          onDelete={handleDelete}
        />
      </Container>
    </MainLayout>
  );
}
