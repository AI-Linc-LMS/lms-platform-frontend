"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import adminMockInterviewService from "@/lib/services/admin/admin-mock-interview.service";
import { AdminInterviewResultAdapter } from "@/components/admin/mock-interview";

export default function AdminInterviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof adminMockInterviewService.getInterviewDetail>> | null>(null);

  useEffect(() => {
    const load = async () => {
      const id = params.id as string;
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        showToast(t("adminMockInterview.invalidInterviewId"), "error");
        router.push("/admin/admin-mock-interview");
        return;
      }
      try {
        setLoading(true);
        const result = await adminMockInterviewService.getInterviewDetail(numericId);
        setData(result);
      } catch {
        showToast(t("adminMockInterview.failedToLoadInterview"), "error");
        router.push("/admin/admin-mock-interview");
      } finally {
        setLoading(false);
      }
    };
    if (params.id) load();
  }, [params.id, router, showToast, t]);

  const handleBack = () => {
    // Go ONE step back to wherever the admin came from (e.g. the Interviews list with its
    // filters/page intact), not a fixed hub. Fall back to the interview admin only when there
    // is no history to go back to (e.g. the page was opened directly).
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/admin/mock-interview");
    }
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
