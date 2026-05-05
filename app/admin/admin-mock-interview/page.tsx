"use client";

import { useState, useEffect, useCallback } from "react";
import { Box, Button, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { adminCoursesService } from "@/lib/services/admin/admin-courses.service";
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
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [tab, setTab] = useState<TabValue>("overview");
  const [days, setDays] = useState(30);

  // Course filter (shared across all tabs)
  const [courses, setCourses] = useState<Array<{ id: number; title: string }>>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

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

  // Load courses for shared filter
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const coursesData = await adminCoursesService.getCourses();
        const normalizedCourses = Array.isArray(coursesData)
          ? coursesData
          : Array.isArray((coursesData as { results?: unknown[] })?.results)
            ? ((coursesData as { results: unknown[] }).results as unknown[])
            : [];
        setCourses(
          normalizedCourses
            .map((c) => {
              const course = c as { id?: number; title?: string };
              if (typeof course.id !== "number" || !course.title) return null;
              return { id: course.id, title: course.title };
            })
            .filter((c): c is { id: number; title: string } => Boolean(c))
        );
      } catch {
        // Silently fail - course filter is optional
      }
    };
    loadCourses();
  }, []);

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const data = await adminMockInterviewService.getDashboard(
        days,
        selectedCourseId ? Number(selectedCourseId) : undefined
      );
      setDashboardData(data);
    } catch (err: unknown) {
      showToast(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          t("adminMockInterview.failedToLoadDashboard"),
        "error"
      );
    } finally {
      setDashboardLoading(false);
    }
  }, [days, selectedCourseId, showToast, t]);

  const loadInterviews = useCallback(async () => {
    setInterviewsLoading(true);
    try {
      const params: Record<string, string | number | undefined> = {
        page: interviewPage,
        limit: interviewLimit,
        sort_by: interviewFilters.sort_by,
        sort_order: interviewFilters.sort_order,
      };
      if (selectedCourseId) params.course_id = Number(selectedCourseId);
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
          t("adminMockInterview.failedToLoadInterviews"),
        "error"
      );
    } finally {
      setInterviewsLoading(false);
    }
  }, [
    interviewPage,
    interviewLimit,
    interviewFilters,
    selectedCourseId,
    showToast,
    t,
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
        course_id: selectedCourseId ? Number(selectedCourseId) : undefined,
      });
      setStudentsData(data);
    } catch (err: unknown) {
      showToast(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          t("adminMockInterview.failedToLoadStudents"),
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
    selectedCourseId,
    showToast,
    t,
  ]);

  const loadTopics = useCallback(async () => {
    setTopicsLoading(true);
    try {
      const data = await adminMockInterviewService.getTopics({
        course_id: selectedCourseId ? Number(selectedCourseId) : undefined,
      });
      setTopicsData(data);
    } catch (err: unknown) {
      showToast(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          t("adminMockInterview.failedToLoadTopics"),
        "error"
      );
    } finally {
      setTopicsLoading(false);
    }
  }, [selectedCourseId, showToast, t]);

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
      if (selectedCourseId) params.course_id = Number(selectedCourseId);

      const blob = await adminMockInterviewService.exportCSV(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mock_interviews_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(t("adminMockInterview.exportCompleted"), "success");
    } catch (err: unknown) {
      showToast(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          t("adminMockInterview.exportFailed"),
        "error"
      );
    } finally {
      setExporting(false);
    }
  }, [interviewFilters, selectedCourseId, showToast, t]);

  const tabItems: { value: TabValue; label: string; icon: string }[] = [
    { value: "overview", label: t("adminMockInterview.tabOverview"), icon: "mdi:view-dashboard" },
    { value: "interviews", label: t("adminMockInterview.tabInterviews"), icon: "mdi:clipboard-list" },
    { value: "students", label: t("adminMockInterview.tabStudents"), icon: "mdi:account-group" },
    { value: "topics", label: t("adminMockInterview.tabTopics"), icon: "mdi:book-open-variant" },
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
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            mb: 4,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
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
                      color={isActive ? "var(--font-light)" : "var(--accent-indigo)"}
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
                      ? "0 2px 8px color-mix(in srgb, var(--accent-indigo) 35%, transparent)"
                      : "none",
                    backgroundColor: isActive ? "var(--accent-indigo)" : "transparent",
                    borderColor: "var(--accent-indigo)",
                    color: isActive ? "var(--font-light)" : "var(--accent-indigo)",
                    "&:hover": {
                      backgroundColor: isActive
                        ? "var(--accent-indigo-dark)"
                        : "color-mix(in srgb, var(--accent-indigo) 10%, var(--surface) 90%)",
                      borderColor: "var(--accent-indigo-dark)",
                      color: isActive ? "var(--font-light)" : "var(--accent-indigo-dark)",
                      boxShadow: isActive
                        ? "0 4px 12px color-mix(in srgb, var(--accent-indigo) 40%, transparent)"
                        : "0 2px 6px color-mix(in srgb, var(--accent-indigo) 20%, transparent)",
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "flex-end",
              gap: 2,
              alignItems: "center",
            }}
          >
            <FormControl
              size="small"
              sx={{ minWidth: 220 }}
            >
              <InputLabel id="mock-interview-course-filter-label">
                {t("adminManageStudents.filterByCourse")}
              </InputLabel>
              <Select
                labelId="mock-interview-course-filter-label"
                value={selectedCourseId}
                label={t("adminManageStudents.filterByCourse")}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  // Reset pagination when course changes
                  setInterviewPage(1);
                  setStudentPage(1);
                }}
              >
                <MenuItem value="">
                  {t("adminManageStudents.allCourses")}
                </MenuItem>
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id.toString()}>
                    {course.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
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
                backgroundColor: "var(--surface)",
                width: "fit-content",
                border: "1px solid var(--border-default)",
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
                    backgroundColor: days === d ? "var(--accent-indigo)" : "transparent",
                    color: days === d ? "var(--font-light)" : "var(--font-secondary)",
                    fontWeight: days === d ? 600 : 500,
                    fontSize: "0.875rem",
                    border: `1px solid ${days === d ? "var(--accent-indigo)" : "transparent"}`,
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      backgroundColor: days === d
                        ? "var(--accent-indigo-dark)"
                        : "color-mix(in srgb, var(--font-secondary) 14%, var(--surface) 86%)",
                      color: days === d ? "var(--font-light)" : "var(--font-primary)",
                    },
                    "&:active": {
                      transform: "scale(0.98)",
                    },
                    "&:focus-visible": {
                      outline: "none",
                      boxShadow:
                        "0 0 0 2px color-mix(in srgb, var(--accent-indigo) 50%, transparent)",
                    },
                  }}
                >
                  {t("adminMockInterview.daysLabel", { n: d })}
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
