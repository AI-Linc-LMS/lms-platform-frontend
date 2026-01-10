"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Box, Container, Typography } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { Loading } from "@/components/common/Loading";
import { ScheduledInterviewsTable } from "@/components/mock-interview/ScheduledInterviewsTable";
import { IconWrapper } from "@/components/common/IconWrapper";
import mockInterviewService, {
  MockInterview,
} from "@/lib/services/mock-interview.service";
import { useToast } from "@/components/common/Toast";
import { useRouter } from "next/navigation";
import { useStopCameraOnMount } from "@/lib/hooks/useStopCameraOnMount";

export default function ScheduledInterviewsPage() {
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

  if (loading) {
    return (
      <MainLayout>
        <Loading fullScreen />
      </MainLayout>
    );
  }

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
                backgroundColor: "#f59e0b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconWrapper
                icon="mdi:calendar-clock"
                size={32}
                color="#ffffff"
              />
            </Box>
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, fontSize: { xs: "1.5rem", md: "2rem" } }}
              >
                Scheduled Interviews
              </Typography>
              <Typography variant="body2" sx={{ color: "#6b7280" }}>
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
            backgroundColor: "#f3f4f6",
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
                backgroundColor: "#e5e7eb",
              },
            }}
          >
            <IconWrapper icon="mdi:lightning-bolt" size={20} color="#6b7280" />
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: "0.95rem",
                color: "#6b7280",
              }}
            >
              New Interview
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
                backgroundColor: "#e5e7eb",
              },
            }}
          >
            <IconWrapper icon="mdi:history" size={20} color="#6b7280" />
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: "0.95rem",
                color: "#6b7280",
              }}
            >
              Previous
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
              backgroundColor: "#ffffff",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            }}
          >
            <IconWrapper icon="mdi:calendar-clock" size={20} color="#6366f1" />
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: "0.95rem",
                color: "#1f2937",
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
