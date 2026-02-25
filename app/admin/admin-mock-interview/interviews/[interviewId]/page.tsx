"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import adminMockInterviewService from "@/lib/services/admin/admin-mock-interview.service";
import { AdminInterviewResultAdapter } from "@/components/admin/mock-interview";

export default function AdminMockInterviewInterviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof adminMockInterviewService.getInterviewDetail>> | null>(null);

  const interviewId = params.interviewId as string;
  const numericId = parseInt(interviewId, 10);

  useEffect(() => {
    const load = async () => {
      if (!interviewId || isNaN(numericId)) {
        showToast("Invalid interview ID", "error");
        router.push("/admin/admin-mock-interview");
        return;
      }
      try {
        setLoading(true);
        const result = await adminMockInterviewService.getInterviewDetail(numericId);
        setData(result);
      } catch {
        showToast("Failed to load interview", "error");
        router.push("/admin/admin-mock-interview");
      } finally {
        setLoading(false);
      }
    };
    if (interviewId) load();
  }, [interviewId, numericId, router, showToast]);

  const handleBack = () => {
    router.push("/admin/admin-mock-interview");
  };

  if (loading) {
    return (
      <MainLayout>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
          }}
        >
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <MainLayout>
      <AdminInterviewResultAdapter data={data} onBack={handleBack} />
    </MainLayout>
  );
}
