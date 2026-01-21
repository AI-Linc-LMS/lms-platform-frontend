"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { config } from "@/lib/config";
import {
  adminContentManagementService,
  ContentDetails,
  ContentType,
} from "@/lib/services/admin/admin-content-management.service";
import { VideoTutorialView } from "@/components/admin/content-management/VideoTutorialView";
import { CodingProblemView } from "@/components/admin/content-management/CodingProblemView";
import { QuizView } from "@/components/admin/content-management/QuizView";
import { ArticleView } from "@/components/admin/content-management/ArticleView";
import { AssignmentView } from "@/components/admin/content-management/AssignmentView";
import { ContentViewHeader } from "@/components/admin/content-management/ContentViewHeader";

export default function ContentViewPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [content, setContent] = useState<ContentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const contentId = params?.id ? parseInt(params.id as string) : null;

  useEffect(() => {
    if (contentId) {
      loadContent();
    }
  }, [contentId]);

  const loadContent = async () => {
    if (!contentId) return;

    try {
      setLoading(true);
      const data = await adminContentManagementService.getContentDetails(
        config.clientId,
        contentId
      );
      setContent(data);
    } catch (error: any) {
      showToast(error?.message || "Failed to load content", "error");
      router.push("/admin/verify-content");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerification = async () => {
    if (!content) return;

    try {
      setVerifying(true);
      await adminContentManagementService.verifyContent(
        config.clientId,
        content.id,
        { is_verified: !content.is_verified }
      );

      // Update local state
      setContent({
        ...content,
        is_verified: !content.is_verified,
      });

      showToast(
        `Content ${!content.is_verified ? "verified" : "unverified"} successfully`,
        "success"
      );
    } catch (error: any) {
      showToast(
        error?.message || "Failed to update verification status",
        "error"
      );
    } finally {
      setVerifying(false);
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
            minHeight: "80vh",
          }}
        >
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (!content) {
    return (
      <MainLayout>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6">Content not found</Typography>
          <Button onClick={() => router.push("/admin/verify-content")}>
            Back to Content Management
          </Button>
        </Box>
      </MainLayout>
    );
  }

  const renderContent = () => {
    switch (content.type) {
      case "VideoTutorial":
        return <VideoTutorialView content={content} />;
      case "CodingProblem":
      case "DevCodingProblem":
        return <CodingProblemView content={content} />;
      case "Quiz":
        return <QuizView content={content} />;
      case "Article":
        return <ArticleView content={content} />;
      case "Assignment":
        return <AssignmentView content={content} />;
      default:
        return (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {content.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Content type "{content.type}" is not yet supported in view mode.
            </Typography>
          </Paper>
        );
    }
  };

  return (
    <MainLayout>
      <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <ContentViewHeader
          title={content.title}
          type={content.type}
          isVerified={content.is_verified}
          verifying={verifying}
          onBack={() => router.push("/admin/verify-content")}
          onToggleVerification={handleToggleVerification}
        />

        {/* Content Area */}
        <Box
          sx={{
            flex: 1,
            overflow: "hidden",
            backgroundColor: "#f9fafb",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ flex: 1, overflow: "auto" }}>{renderContent()}</Box>
        </Box>
      </Box>
    </MainLayout>
  );
}
