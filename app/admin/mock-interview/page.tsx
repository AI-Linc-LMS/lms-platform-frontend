"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
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
  MockInterviewOverview,
  MockInterviewTable,
  MockInterviewFilters,
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
  const [interviewLimit, setInterviewLimit] = useState(20);
  const [exporting, setExporting] = useState(false);

  // Students tab
  const [studentsData, setStudentsData] = useState<ListStudentsResponse | null>(null);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentSortBy, setStudentSortBy] = useState("total_interviews");
  const [studentSortOrder, setStudentSortOrder] = useState<"asc" | "desc">("desc");
  const [studentPage, setStudentPage] = useState(1);
  const [studentLimit, setStudentLimit] = useState(20);

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

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827" }}>
            Mock Interview Admin
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.5 }}>
            Monitor and analyze student mock interview performance
          </Typography>
        </Box>

        <Tabs
          value={tab}
          onChange={(_, v: TabValue) => setTab(v)}
          sx={{
            mb: 3,
            borderBottom: "1px solid #e5e7eb",
            "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
          }}
        >
          <Tab
            value="overview"
            label="Overview"
            icon={<IconWrapper icon="mdi:view-dashboard" size={18} />}
            iconPosition="start"
          />
          <Tab
            value="interviews"
            label="Interviews"
            icon={<IconWrapper icon="mdi:clipboard-list" size={18} />}
            iconPosition="start"
          />
          <Tab
            value="students"
            label="Students"
            icon={<IconWrapper icon="mdi:account-group" size={18} />}
            iconPosition="start"
          />
          <Tab
            value="topics"
            label="Topics"
            icon={<IconWrapper icon="mdi:book-open-variant" size={18} />}
            iconPosition="start"
          />
        </Tabs>

        {tab === "overview" && (
          <Box>
            <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Days</InputLabel>
                <Select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  label="Days"
                >
                  <MenuItem value={7}>7 days</MenuItem>
                  <MenuItem value={14}>14 days</MenuItem>
                  <MenuItem value={30}>30 days</MenuItem>
                  <MenuItem value={90}>90 days</MenuItem>
                </Select>
              </FormControl>
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
            <MockInterviewFilters filters={interviewFilters} onFilterChange={handleFilterChange} />
            <MockInterviewTable
              interviews={interviewsData?.interviews ?? []}
              loading={interviewsLoading}
              pagination={{
                current_page: interviewsData?.pagination?.current_page ?? 1,
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
            <Box sx={{ mb: 2 }}>
              <TextField
                size="small"
                placeholder="Search by name or email..."
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  setStudentPage(1);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") loadStudents();
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconWrapper icon="mdi:magnify" size={20} color="#6b7280" />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 280, mr: 2 }}
              />
              <FormControl size="small" sx={{ minWidth: 140, mr: 1 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={studentSortBy}
                  onChange={(e) => setStudentSortBy(e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="total_interviews">Total Interviews</MenuItem>
                  <MenuItem value="average_score">Average Score</MenuItem>
                  <MenuItem value="completion_rate">Completion Rate</MenuItem>
                  <MenuItem value="student_name">Name</MenuItem>
                  <MenuItem value="completed_interviews">Completed</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Order</InputLabel>
                <Select
                  value={studentSortOrder}
                  onChange={(e) =>
                    setStudentSortOrder(e.target.value as "asc" | "desc")
                  }
                  label="Order"
                >
                  <MenuItem value="asc">Asc</MenuItem>
                  <MenuItem value="desc">Desc</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <MockInterviewStudentTable
              students={studentsData?.students ?? []}
              loading={studentsLoading}
              pagination={{
                current_page: studentsData?.pagination?.current_page ?? 1,
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
