"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { config } from "@/lib/config";
import {
  adminContentManagementService,
  ContentListItem,
  ContentCountByType,
  ContentDetails,
  ContentType,
} from "@/lib/services/admin/admin-content-management.service";
import { ContentStatsCards } from "@/components/admin/content-management/ContentStatsCards";
import { ContentFilters } from "@/components/admin/content-management/ContentFilters";
import { ContentTable } from "@/components/admin/content-management/ContentTable";
import { ContentPagination } from "@/components/admin/content-management/ContentPagination";

export default function VerifyContentPage() {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const router = useRouter();
  const [contents, setContents] = useState<ContentListItem[]>([]);
  const [contentCounts, setContentCounts] = useState<ContentCountByType>({
    Quiz: 0,
    Article: 0,
    Assignment: 0,
    CodingProblem: 0,
    DevCodingProblem: 0,
    VideoTutorial: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<ContentType | "all">("all");
  const [selectedVerificationStatus, setSelectedVerificationStatus] = useState<
    "all" | "verified" | "unverified"
  >("all");
  const [verifyingIds, setVerifyingIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    loadContentCounts();
    loadContents();
  }, []);

  const loadContentCounts = async () => {
    try {
      setLoadingCounts(true);
      const counts = await adminContentManagementService.getContentCountByType(
        config.clientId
      );
      setContentCounts(counts);
    } catch (error: any) {
      showToast(
        error?.message || t("adminContentManagement.failedToLoadContentStatistics"),
        "error"
      );
    } finally {
      setLoadingCounts(false);
    }
  };

  const loadContents = async () => {
    try {
      setLoading(true);
      const data = await adminContentManagementService.getContents(
        config.clientId
      );
      setContents(Array.isArray(data) ? data : []);
    } catch (error: any) {
      showToast(error?.message || t("adminContentManagement.failedToLoadContents"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (contentId: number) => {
    router.push(`/admin/verify-content/${contentId}`);
  };

  const handleToggleVerification = async (
    contentId: number,
    isVerified: boolean
  ) => {
    try {
      setVerifyingIds((prev) => new Set(prev).add(contentId));
      await adminContentManagementService.verifyContent(
        config.clientId,
        contentId,
        { is_verified: isVerified }
      );

      // Update local state
      setContents((prev) =>
        prev.map((content) =>
          content.id === contentId
            ? { ...content, is_verified: isVerified }
            : content
        )
      );

      // Refresh counts
      await loadContentCounts();

      showToast(
        isVerified ? t("adminContentManagement.contentVerifiedSuccessfully") : t("adminContentManagement.contentUnverifiedSuccessfully"),
        "success"
      );
    } catch (error: any) {
      showToast(
        error?.message || t("adminContentManagement.failedToUpdateVerificationStatus"),
        "error"
      );
    } finally {
      setVerifyingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(contentId);
        return newSet;
      });
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedType("all");
    setSelectedVerificationStatus("all");
  };

  // Filter contents based on search, type, and verification status
  const filteredContents = useMemo(() => {
    return contents.filter((content) => {
      const matchesSearch =
        searchQuery === "" ||
        content.title.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === "all" || content.type === selectedType;

      const matchesVerification =
        selectedVerificationStatus === "all" ||
        (selectedVerificationStatus === "verified" && content.is_verified) ||
        (selectedVerificationStatus === "unverified" && !content.is_verified);

      return matchesSearch && matchesType && matchesVerification;
    });
  }, [contents, searchQuery, selectedType, selectedVerificationStatus]);

  // Paginate filtered contents
  const paginatedContents = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredContents.slice(startIndex, endIndex);
  }, [filteredContents, page, limit]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedType, selectedVerificationStatus]);

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "var(--font-primary)",
              fontSize: { xs: "1.5rem", sm: "2rem" },
              mb: 1,
            }}
          >
            {t("adminContentManagement.title")}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "var(--font-secondary)",
              fontSize: { xs: "0.875rem", sm: "1rem" },
            }}
          >
            {t("adminContentManagement.subtitle")}
          </Typography>
        </Box>

        {/* Statistics Cards */}
        <Box sx={{ mb: 4 }}>
          <ContentStatsCards counts={contentCounts} loading={loadingCounts} />
        </Box>

        {/* Filters */}
        <ContentFilters
          searchQuery={searchQuery}
          selectedType={selectedType}
          selectedVerificationStatus={selectedVerificationStatus}
          onSearchChange={setSearchQuery}
          onTypeChange={setSelectedType}
          onVerificationStatusChange={setSelectedVerificationStatus}
          onClearFilters={handleClearFilters}
        />

        {/* Content Table */}
        {loading ? (
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
        ) : (
          <Paper
            sx={{
              borderRadius: 2,
              boxShadow:
                "0 1px 3px color-mix(in srgb, var(--font-primary) 12%, transparent)",
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--card-bg)",
              overflow: "hidden",
            }}
          >
            <ContentTable
              contents={paginatedContents}
              onViewDetails={handleViewDetails}
              onToggleVerification={handleToggleVerification}
              verifyingIds={verifyingIds}
            />
            {filteredContents.length > 0 && (
              <ContentPagination
                totalCount={filteredContents.length}
                page={page}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={setLimit}
              />
            )}
          </Paper>
        )}

      </Box>
    </MainLayout>
  );
}
