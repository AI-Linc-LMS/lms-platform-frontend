"use client";

import { useState, useEffect, useCallback } from "react";
import { Box, Button } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import adminMockInterviewService, {
  type DashboardResponse,
  type ListInterviewsResponse,
  type ListStudentsResponse,
  type TopicsResponse,
} from "@/lib/services/admin/admin-mock-interview.service";
import {
  MockInterviewHeader,
  MockInterviewOverview,
  MockInterviewTable,
  MockInterviewFilters,
  MockInterviewStudentsFilters,
  MockInterviewStudentTable,
  MockInterviewTopicsView,
  type InterviewFiltersState,
} from "@/components/admin/mock-interview";

type TabValue = "overview" | "interviews" | "students" | "topics";

const DEFAULT_FILTERS: InterviewFiltersState = {
  status: "",
  difficulty: "",
  topic: "",
  search: "",
  date_from: "",
  date_to: "",
  sort_by: "created_at",
  sort_order: "desc",
};

export default function AdminMockInterviewPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<TabValue>("overview");
  const [days, setDays] = useState(30);

  // Dashboard data
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Interviews tab
  const [interviewsData, setInterviewsData] = useState<ListInterviewsResponse | null>(null);
  const [interviewsLoading, setInterviewsLoading] = useState(false);
  const [interviewFilters, setInterviewFilters] = useState<InterviewFiltersState>(DEFAULT_FILTERS);
  const [interviewPage, setInterviewPage] = useState(1);
  const [interviewLimit, setInterviewLimit] = useState(10);
  const [exporting, setExporting] = useState(false);

  // Students tab
  const [studentsData, setStudentsData] = useState<ListStudentsResponse | null>(null);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentSortBy, setStudentSortBy] = useState("total_interviews");
  const [studentSortOrder, setStudentSortOrder] = useState<"asc" | "desc">("desc");
  const [studentPage, setStudentPage] = useState(1);
  const [studentLimit, setStudentLimit] = useState(10);

  // Topics tab
  const [topicsData, setTopicsData] = useState<TopicsResponse | null>(null);
  const [topicsLoading, setTopicsLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const data = await adminMockInterviewService.getDashboard(days);
      setDashboardData(data);
    } catch (err: unknown) {
      showToast(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          "Failed to load dashboard",
        "error"
      );
    } finally {
      setDashboardLoading(false);
    }
  }, [days, showToast]);

  const loadInterviews = useCallback(async () => {
    setInterviewsLoading(true);
    try {
      const params: Record<string, string | number | undefined> = {
        page: interviewPage,
        limit: interviewLimit,
        sort_by: interviewFilters.sort_by,
        sort_order: interviewFilters.sort_order,
      };
      if (interviewFilters.status) params.status = interviewFilters.status;
      if (interviewFilters.difficulty) params.difficulty = interviewFilters.difficulty;
      if (interviewFilters.topic) params.topic = interviewFilters.topic;
      if (interviewFilters.search) params.search = interviewFilters.search;
      if (interviewFilters.date_from) params.date_from = interviewFilters.date_from;
      if (interviewFilters.date_to) params.date_to = interviewFilters.date_to;

      const data = await adminMockInterviewService.listInterviews(params);
      setInterviewsData(data);
    } catch (err: unknown) {
      showToast(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          "Failed to load interviews",
        "error"
      );
    } finally {
      setInterviewsLoading(false);
    }
  }, [
    interviewPage,
    interviewLimit,
    interviewFilters,
    showToast,
  ]);

  const loadStudents = useCallback(async () => {
    setStudentsLoading(true);
    try {
      const data = await adminMockInterviewService.listStudents({
        search: studentSearch || undefined,
        sort_by: studentSortBy,
        sort_order: studentSortOrder,
        page: studentPage,
        limit: studentLimit,
      });
      setStudentsData(data);
    } catch (err: unknown) {
      showToast(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          "Failed to load students",
        "error"
      );
    } finally {
      setStudentsLoading(false);
    }
  }, [
    studentSearch,
    studentSortBy,
    studentSortOrder,
    studentPage,
    studentLimit,
    showToast,
  ]);

  const loadTopics = useCallback(async () => {
    setTopicsLoading(true);
    try {
      const data = await adminMockInterviewService.getTopics();
      setTopicsData(data);
    } catch (err: unknown) {
      showToast(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          "Failed to load topics",
        "error"
      );
    } finally {
      setTopicsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (tab === "overview") loadDashboard();
  }, [tab, loadDashboard]);

  useEffect(() => {
    if (tab === "interviews") loadInterviews();
  }, [tab, loadInterviews]);

  useEffect(() => {
    if (tab === "students") loadStudents();
  }, [tab, loadStudents]);

  useEffect(() => {
    if (tab === "topics") loadTopics();
  }, [tab, loadTopics]);

  const handleFilterChange = useCallback((key: keyof InterviewFiltersState, value: string) => {
    setInterviewFilters((prev) => ({ ...prev, [key]: value }));
    setInterviewPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setInterviewFilters(DEFAULT_FILTERS);
    setInterviewPage(1);
  }, []);

  const handleExportCSV = useCallback(async () => {
    setExporting(true);
    try {
      const params: Record<string, string | number | undefined> = {};
      if (interviewFilters.status) params.status = interviewFilters.status;
      if (interviewFilters.difficulty) params.difficulty = interviewFilters.difficulty;
      if (interviewFilters.date_from) params.date_from = interviewFilters.date_from;
      if (interviewFilters.date_to) params.date_to = interviewFilters.date_to;

      const blob = await adminMockInterviewService.exportCSV(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mock_interviews_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Export completed", "success");
    } catch (err: unknown) {
      showToast(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          "Export failed",
        "error"
      );
    } finally {
      setExporting(false);
    }
  }, [interviewFilters, showToast]);

  const tabItems: { value: TabValue; label: string; icon: string }[] = [
    { value: "overview", label: "Overview", icon: "mdi:view-dashboard" },
    { value: "interviews", label: "Interviews", icon: "mdi:clipboard-list" },
    { value: "students", label: "Students", icon: "mdi:account-group" },
    { value: "topics", label: "Topics", icon: "mdi:book-open-variant" },
  ];

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <MockInterviewHeader
          totalInterviews={dashboardData?.overview?.total_interviews}
          activeTab={tab}
        />

        <Box
          component="nav"
          aria-label="Section navigation"
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            mb: 4,
          }}
        >
          {tabItems.map((item) => {
            const isActive = tab === item.value;
            return (
              <Button
                key={item.value}
                variant={isActive ? "contained" : "outlined"}
                onClick={() => setTab(item.value)}
                startIcon={
                  <IconWrapper
                    icon={item.icon}
                    size={20}
                    color={isActive ? "#ffffff" : "#6366f1"}
                  />
                }
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  px: 2.5,
                  py: 1.5,
                  borderRadius: 2,
                  boxShadow: isActive
                    ? "0 2px 8px rgba(99, 102, 241, 0.35)"
                    : "none",
                  backgroundColor: isActive ? "#6366f1" : "transparent",
                  borderColor: "#6366f1",
                  color: isActive ? "#ffffff" : "#6366f1",
                  "&:hover": {
                    backgroundColor: isActive ? "#4f46e5" : "#eef2ff",
                    borderColor: "#4f46e5",
                    color: isActive ? "#ffffff" : "#4f46e5",
                    boxShadow: isActive
                      ? "0 4px 12px rgba(99, 102, 241, 0.4)"
                      : "0 2px 6px rgba(99, 102, 241, 0.2)",
                  },
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Box>

        {tab === "overview" && (
          <Box>
            <Box
              component="div"
              role="group"
              aria-label="Time range"
              sx={{
                display: "flex",
                gap: 0.5,
                mb: 3,
                p: 0.5,
                borderRadius: 2,
                backgroundColor: "#f9fafb",
                width: "fit-content",
                border: "1px solid #e5e7eb",
              }}
            >
              {[7, 14, 30, 90].map((d) => (
                <Box
                  key={d}
                  role="button"
                  tabIndex={0}
                  aria-pressed={days === d}
                  onClick={() => setDays(d)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setDays(d);
                    }
                  }}
                  sx={{
                    px: 2.5,
                    py: 1.25,
                    borderRadius: 1.5,
                    cursor: "pointer",
                    userSelect: "none",
                    backgroundColor: days === d ? "#6366f1" : "transparent",
                    color: days === d ? "#ffffff" : "#6b7280",
                    fontWeight: days === d ? 600 : 500,
                    fontSize: "0.875rem",
                    border: `1px solid ${days === d ? "#6366f1" : "transparent"}`,
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      backgroundColor: days === d ? "#4f46e5" : "#e5e7eb",
                      color: days === d ? "#ffffff" : "#374151",
                    },
                    "&:active": {
                      transform: "scale(0.98)",
                    },
                    "&:focus-visible": {
                      outline: "none",
                      boxShadow: "0 0 0 2px rgba(99, 102, 241, 0.5)",
                    },
                  }}
                >
                  {d} days
                </Box>
              ))}
            </Box>
            <MockInterviewOverview
              data={dashboardData}
              loading={dashboardLoading}
              days={days}
            />
          </Box>
        )}

        {tab === "interviews" && (
          <Box>
            <MockInterviewFilters
              filters={interviewFilters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
            <MockInterviewTable
              interviews={interviewsData?.interviews ?? []}
              loading={interviewsLoading}
              pagination={{
                current_page: interviewPage,
                total_pages: interviewsData?.pagination?.total_pages ?? 1,
                total_interviews: interviewsData?.pagination?.total_interviews ?? 0,
                limit: interviewLimit,
              }}
              onPageChange={setInterviewPage}
              onLimitChange={setInterviewLimit}
              onExport={handleExportCSV}
              exporting={exporting}
            />
          </Box>
        )}

        {tab === "students" && (
          <Box>
            <MockInterviewStudentsFilters
              search={studentSearch}
              sortBy={studentSortBy}
              sortOrder={studentSortOrder}
              onSearchChange={(v) => {
                setStudentSearch(v);
                setStudentPage(1);
              }}
              onSortByChange={setStudentSortBy}
              onSortOrderChange={setStudentSortOrder}
              totalCount={studentsData?.pagination?.total_students}
            />
            <MockInterviewStudentTable
              students={studentsData?.students ?? []}
              loading={studentsLoading}
              pagination={{
                current_page: studentPage,
                total_pages: studentsData?.pagination?.total_pages ?? 1,
                total_students: studentsData?.pagination?.total_students ?? 0,
                limit: studentLimit,
              }}
              onPageChange={setStudentPage}
              onLimitChange={(v) => {
                setStudentLimit(v);
                setStudentPage(1);
              }}
            />
          </Box>
        )}

        {tab === "topics" && (
          <MockInterviewTopicsView
            data={topicsData}
            loading={topicsLoading}
          />
        )}
      </Box>
    </MainLayout>
  );
}
