"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Chip, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  adminStudentService,
  Student,
  CourseCompletionStats,
  ManageStudentsResponse,
} from "@/lib/services/admin/admin-student.service";
import { adminCoursesService } from "@/lib/services/admin/admin-courses.service";
import { adminAdaptiveCourseService } from "@/lib/services/admin/admin-adaptive-course.service";
import { adminCohortsService } from "@/lib/services/admin/admin-cohorts.service";
import { useAuth } from "@/lib/auth/auth-context";
import {
  isClientOrgAdminRole,
  isScopedAdminRole,
} from "@/lib/auth/role-utils";
import { StudentsFilters } from "../../../components/admin/manage-students/StudentsFilters";
import { StudentsTable } from "../../../components/admin/manage-students/StudentsTable";
import { StudentsPagination } from "../../../components/admin/manage-students/StudentsPagination";
import { BulkEnrollmentDialog } from "../../../components/admin/manage-students/BulkEnrollmentDialog";
import { QuickEnrollStudentDialog } from "../../../components/admin/manage-students/QuickEnrollStudentDialog";
import { EnrollmentJobHistory } from "../../../components/admin/manage-students/EnrollmentJobHistory";
import { BulkActionToolbar } from "../../../components/admin/manage-students/BulkActionToolbar";
import {
  completionStatsFor,
  matchesSegment,
  segmentCounts,
  STUDENT_SIGNALS,
  type SegmentKey,
} from "@/lib/utils/student-risk";
import { InfoButton, RiskCriteriaContent } from "@/components/common/InfoPopover";
import { PHONE } from "@/components/common/mobile/phone";
import { PhoneStudentSegments } from "../../../components/admin/manage-students/PhoneStudentSegments";
import {
  ResponsiveConfirm,
  useIsPhone,
} from "../../../components/admin/manage-students/mobile";

type SortOption =
  | "name"
  | "marks"
  | "last_activity"
  | "time_spent"
  | "streak"
  | "completion_pct"
  | "attendance_pct"
  | "saved_resume";
type SortOrder = "asc" | "desc";

const SORT_OPTIONS: SortOption[] = [
  "name",
  "marks",
  "last_activity",
  "time_spent",
  "streak",
  "completion_pct",
  "attendance_pct",
  "saved_resume",
];

/**
 * Snapshot of every filter / sort / pagination control. Persisted to the URL
 * query string so the directory survives navigation (open a student → Back),
 * refresh, and link sharing. Fixes the "filters reset on any operation" bug.
 */
type DirectoryState = {
  selectedCourses: string[];
  status: string;
  resumeFilter: "all" | "yes" | "no";
  segment: SegmentKey;
  /**
   * ADAPTIVE course the at-risk rule is evaluated for. Set by the dashboard's "View all" when
   * its course filter is on, so this directory lists exactly the dashboard's set.
   */
  riskCourse: number | null;
  searchTerm: string;
  page: number;
  limit: number;
  sortBy: SortOption;
  sortOrder: SortOrder;
};

const DEFAULT_DIRECTORY_STATE: DirectoryState = {
  selectedCourses: [],
  status: "all",
  resumeFilter: "all",
  segment: "all",
  riskCourse: null,
  searchTerm: "",
  page: 1,
  limit: 10,
  sortBy: "name",
  sortOrder: "asc",
};

/** Every documented signal is a legal `?segment=` value - the table is the only list. */
const SEGMENT_KEYS: SegmentKey[] = [
  "all",
  ...STUDENT_SIGNALS.map((s) => s.key),
];

function parseDirectoryState(
  params: URLSearchParams | null
): DirectoryState {
  if (!params) return { ...DEFAULT_DIRECTORY_STATE };
  const num = (key: string, fallback: number) => {
    const raw = params.get(key);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  };
  const coursesRaw = params.get("courses");
  const status = params.get("status") || DEFAULT_DIRECTORY_STATE.status;
  const resume = params.get("resume");
  const segmentRaw = params.get("segment") as SegmentKey | null;
  const riskCourseRaw = Number(params.get("riskCourse"));
  const sortByRaw = params.get("sortBy") as SortOption | null;
  const sortOrderRaw = params.get("sortOrder");
  return {
    selectedCourses: coursesRaw
      ? coursesRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
    status: ["all", "active", "inactive"].includes(status) ? status : "all",
    resumeFilter:
      resume === "yes" || resume === "no" ? resume : "all",
    segment:
      segmentRaw && SEGMENT_KEYS.includes(segmentRaw) ? segmentRaw : "all",
    riskCourse:
      Number.isInteger(riskCourseRaw) && riskCourseRaw > 0 ? riskCourseRaw : null,
    searchTerm: params.get("q") || "",
    page: num("page", DEFAULT_DIRECTORY_STATE.page),
    limit: num("limit", DEFAULT_DIRECTORY_STATE.limit),
    sortBy:
      sortByRaw && SORT_OPTIONS.includes(sortByRaw)
        ? sortByRaw
        : DEFAULT_DIRECTORY_STATE.sortBy,
    sortOrder: sortOrderRaw === "desc" ? "desc" : "asc",
  };
}

/** Serialize state to a query string, omitting default values to keep URLs clean. */
function serializeDirectoryState(state: DirectoryState): string {
  const params = new URLSearchParams();
  if (state.selectedCourses.length > 0)
    params.set("courses", state.selectedCourses.join(","));
  if (state.status !== DEFAULT_DIRECTORY_STATE.status)
    params.set("status", state.status);
  if (state.resumeFilter !== DEFAULT_DIRECTORY_STATE.resumeFilter)
    params.set("resume", state.resumeFilter);
  if (state.segment !== DEFAULT_DIRECTORY_STATE.segment)
    params.set("segment", state.segment);
  if (state.riskCourse != null) params.set("riskCourse", String(state.riskCourse));
  if (state.searchTerm.trim()) params.set("q", state.searchTerm.trim());
  if (state.page !== DEFAULT_DIRECTORY_STATE.page)
    params.set("page", String(state.page));
  if (state.limit !== DEFAULT_DIRECTORY_STATE.limit)
    params.set("limit", String(state.limit));
  if (state.sortBy !== DEFAULT_DIRECTORY_STATE.sortBy)
    params.set("sortBy", state.sortBy);
  if (state.sortOrder !== DEFAULT_DIRECTORY_STATE.sortOrder)
    params.set("sortOrder", state.sortOrder);
  return params.toString();
}

function apiErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const data = (error as { response?: { data?: { detail?: unknown; error?: unknown } } })
    .response?.data;
  if (!data) return null;
  if (typeof data.detail === "string") return data.detail;
  if (typeof data.error === "string") return data.error;
  return null;
}

function statsMapFromCompletionRows(
  rows: CourseCompletionStats[]
): Record<number, CourseCompletionStats> {
  const statsMap: Record<number, CourseCompletionStats> = {};
  for (const row of rows) {
    statsMap[row.student_id] = row;
  }
  return statsMap;
}

export default function ManageStudentsPage() {
  const { showToast } = useToast();
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Snapshot the URL once on mount to seed initial filter state. Subsequent URL
  // writes are driven by state (one-way state -> URL) to avoid feedback loops.
  const initialDirectoryState = useRef<DirectoryState>(
    parseDirectoryState(
      searchParams ? new URLSearchParams(searchParams.toString()) : null
    )
  );
  const courseManagerUser = isScopedAdminRole(user?.role);
  // Bulk enrollment and job history are available to org admins AND scoped admins
  // (instructor / course_manager). Backend validates that target courses are in
  // the user's scope, so this only exposes the UI.
  const showOrgAdminEnrollmentTools =
    isClientOrgAdminRole(user?.role) || courseManagerUser;
  const canDeleteStudents = isClientOrgAdminRole(user?.role);
  const isPhone = useIsPhone();

  // Permanent-delete confirm state.
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  // State - Original data from API
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [completionStats, setCompletionStats] = useState<
    Record<number, CourseCompletionStats>
  >({});
  const [courses, setCourses] = useState<Array<{ id: number; title: string }>>(
    []
  );
  // Batches the caller may bulk-enrol into. Empty when the tenant has no Cohort Builder (the
  // endpoint 403s) or when a scoped role staffs none — either way, no batch picker.
  const [batches, setBatches] = useState<Array<{ id: number; name: string }>>([]);
  const [adaptiveCourses, setAdaptiveCourses] = useState<Array<{ id: number; title: string }>>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  // Filters (seeded from the URL so navigation/refresh preserves them)
  const [selectedCourses, setSelectedCourses] = useState<string[]>(
    initialDirectoryState.current.selectedCourses
  );
  const [status, setStatus] = useState<string>(
    initialDirectoryState.current.status
  );
  /** all | yes | no - filter by has_saved_resume */
  const [resumeFilter, setResumeFilter] = useState<"all" | "yes" | "no">(
    initialDirectoryState.current.resumeFilter
  );
  /** Engagement-health quick-filter segment (at-risk, inactive, etc.) */
  const [segment, setSegment] = useState<SegmentKey>(
    initialDirectoryState.current.segment
  );
  const [riskCourse, setRiskCourse] = useState<number | null>(
    initialDirectoryState.current.riskCourse
  );
  const [searchTerm, setSearchTerm] = useState<string>(
    initialDirectoryState.current.searchTerm
  );

  // Pagination & Sorting
  const [page, setPage] = useState(initialDirectoryState.current.page);
  const [limit, setLimit] = useState(initialDirectoryState.current.limit);
  const [sortBy, setSortBy] = useState<SortOption>(
    initialDirectoryState.current.sortBy
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    initialDirectoryState.current.sortOrder
  );

  // Bulk Enrollment
  const [bulkEnrollDialogOpen, setBulkEnrollDialogOpen] = useState(false);
  const [quickEnrollDialogOpen, setQuickEnrollDialogOpen] = useState(false);
  const enrollmentJobSectionRef = useRef<HTMLDivElement | null>(null);
  const loadStudentsSeqRef = useRef(0);

  // Row selection for bulk course actions on existing students
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Load courses for filter
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
        // Silently fail - courses filter is optional
      }
    };
    const loadAdaptiveCourses = async () => {
      try {
        const list = await adminAdaptiveCourseService.listCourses();
        setAdaptiveCourses(list.map((c) => ({ id: c.id, title: c.title })));
      } catch {
        // Optional - tenant may not have the adaptive feature.
      }
    };
    const loadBatches = async () => {
      try {
        const list = await adminCohortsService.listCohorts();
        setBatches(
          list
            .filter((b) => !b.is_template && b.status !== "archived")
            .map((b) => ({ id: b.id, name: b.name }))
        );
      } catch {
        // Optional - the tenant may not have the Cohort Builder turned on.
      }
    };
    loadCourses();
    loadAdaptiveCourses();
    loadBatches();
  }, []);

  // Load students from API - only when course filter changes or initial load
  // All filtering, sorting, and pagination is done client-side to reduce API calls
  const loadStudents = useCallback(async () => {
    const seq = ++loadStudentsSeqRef.current;
    const courseManager = courseManagerUser;

    // Empty course selection = all courses (load full student list; API scopes by role).
    if (selectedCourses.length === 0) {
      try {
        setLoading(true);
        const response = await adminStudentService.getManageStudents({
          page: 1,
          limit: 10000,
          sort_by: "name",
          sort_order: "asc",
          risk_course_id: riskCourse ?? undefined,
        });
        if (seq !== loadStudentsSeqRef.current) return;
        setAllStudents(response?.students ?? []);

        setLoadingStats(true);
        try {
          const statsRows = await adminStudentService.getCourseCompletionStats();
          if (seq !== loadStudentsSeqRef.current) return;
          setCompletionStats(
            statsMapFromCompletionRows(Array.isArray(statsRows) ? statsRows : [])
          );
        } catch {
          if (seq === loadStudentsSeqRef.current) {
            setCompletionStats({});
          }
        } finally {
          if (seq === loadStudentsSeqRef.current) {
            setLoadingStats(false);
          }
        }
      } catch (error: unknown) {
        if (seq !== loadStudentsSeqRef.current) return;
        showToast(
          apiErrorMessage(error) || t("adminManageStudents.failedToLoadStudents"),
          "error"
        );
        setAllStudents([]);
        setCompletionStats({});
      } finally {
        if (seq === loadStudentsSeqRef.current) {
          setLoading(false);
        }
      }
      return;
    }

    try {
      setLoading(true);
      const selectedCourseIds = selectedCourses.map(Number).filter(Number.isFinite);

      const mergeStudentResponsesIntoMap = (
        responses: Array<{ students?: Student[] } | undefined>
      ) => {
        const studentMap = new Map<number, Student>();
        responses.forEach((response) => {
          (response?.students ?? []).forEach((student) => {
            const key = student.user_id || student.id;
            const existing = studentMap.get(key);
            if (!existing) {
              studentMap.set(key, student);
            } else {
              studentMap.set(key, {
                ...existing,
                enrollment_count: Math.max(
                  existing.enrollment_count ?? 0,
                  student.enrollment_count ?? 0
                ),
                has_saved_resume: Boolean(
                  existing.has_saved_resume || student.has_saved_resume
                ),
              });
            }
          });
        });
        return studentMap;
      };

      const aggregateStatsFromRows = (stats: CourseCompletionStats[]) => {
        const statsMap: Record<number, CourseCompletionStats> = {};
        const studentStatsMap: Record<
          number,
          {
            total_completed: number;
            total_total: number;
            total_attended: number;
            total_attendance_activities: number;
          }
        > = {};

        stats.forEach((stat) => {
          if (!studentStatsMap[stat.student_id]) {
            studentStatsMap[stat.student_id] = {
              total_completed: 0,
              total_total: 0,
              total_attended: 0,
              total_attendance_activities: 0,
            };
          }
          studentStatsMap[stat.student_id].total_completed += stat.completed_contents;
          studentStatsMap[stat.student_id].total_total += stat.total_contents;
          studentStatsMap[stat.student_id].total_attended += stat.attended_activities;
          studentStatsMap[stat.student_id].total_attendance_activities +=
            stat.total_attendance_activities;
        });

        Object.entries(studentStatsMap).forEach(([studentId, aggregated]) => {
          const completionPercentage =
            aggregated.total_total > 0
              ? (aggregated.total_completed / aggregated.total_total) * 100
              : 0;
          const attendancePercentage =
            aggregated.total_attendance_activities > 0
              ? (aggregated.total_attended /
                  aggregated.total_attendance_activities) *
                100
              : 0;

          const firstStat = stats.find((s) => s.student_id === Number(studentId));
          if (firstStat) {
            const mappedStat: CourseCompletionStats = {
              ...firstStat,
              completed_contents: aggregated.total_completed,
              total_contents: aggregated.total_total,
              completion_percentage: completionPercentage,
              attended_activities: aggregated.total_attended,
              total_attendance_activities: aggregated.total_attendance_activities,
              attendance_percentage: attendancePercentage,
            };
            statsMap[Number(studentId)] = mappedStat;
          }
        });

        setCompletionStats(statsMap);
      };

      if (courseManager) {
        const studentSettled = await Promise.allSettled(
          selectedCourseIds.map((courseId) =>
            adminStudentService.getManageStudents({
              course_id: courseId,
              page: 1,
              limit: 10000,
              sort_by: "name",
              sort_order: "asc",
              risk_course_id: riskCourse ?? undefined,
            })
          )
        );

        if (seq !== loadStudentsSeqRef.current) return;

        const studentFailures = studentSettled.filter(
          (r): r is PromiseRejectedResult => r.status === "rejected"
        );
        const allStudentRequestsFailed =
          studentSettled.length > 0 &&
          studentFailures.length === studentSettled.length;

        if (allStudentRequestsFailed) {
          const detail = apiErrorMessage(studentFailures[0].reason);
          showToast(
            detail || t("adminManageStudents.failedToLoadStudents"),
            "error"
          );
          setAllStudents([]);
          setCompletionStats({});
        } else {
          const fulfilledResponses = studentSettled
            .filter(
              (r): r is PromiseFulfilledResult<ManageStudentsResponse> =>
                r.status === "fulfilled"
            )
            .map((r) => r.value);
          setAllStudents(
            Array.from(mergeStudentResponsesIntoMap(fulfilledResponses).values())
          );

          setLoadingStats(true);
          try {
            const statsSettled = await Promise.allSettled(
              selectedCourseIds.map((courseId) =>
                adminStudentService.getCourseCompletionStats(courseId)
              )
            );
            if (seq !== loadStudentsSeqRef.current) return;
            const stats = statsSettled.flatMap((r) =>
              r.status === "fulfilled" ? r.value : []
            );
            aggregateStatsFromRows(stats);
          } catch {
          } finally {
            if (seq === loadStudentsSeqRef.current) {
              setLoadingStats(false);
            }
          }
        }
      } else {
        const studentResponses = await Promise.all(
          selectedCourseIds.map((courseId) =>
            adminStudentService.getManageStudents({
              course_id: courseId,
              page: 1,
              limit: 10000,
              sort_by: "name",
              sort_order: "asc",
              risk_course_id: riskCourse ?? undefined,
            })
          )
        );

        if (seq !== loadStudentsSeqRef.current) return;

        setAllStudents(
          Array.from(mergeStudentResponsesIntoMap(studentResponses).values())
        );

        setLoadingStats(true);
        try {
          const statsResults = await Promise.all(
            selectedCourseIds.map((courseId) =>
              adminStudentService.getCourseCompletionStats(courseId)
            )
          );
          if (seq !== loadStudentsSeqRef.current) return;
          aggregateStatsFromRows(statsResults.flat());
        } catch {
        } finally {
          if (seq === loadStudentsSeqRef.current) {
            setLoadingStats(false);
          }
        }
      }
    } catch (error: unknown) {
      if (seq !== loadStudentsSeqRef.current) return;
      showToast(
        apiErrorMessage(error) || t("adminManageStudents.failedToLoadStudents"),
        "error"
      );
      setAllStudents([]);
    } finally {
      if (seq === loadStudentsSeqRef.current) {
        setLoading(false);
      }
    }
  }, [selectedCourses, showToast, t, courseManagerUser, riskCourse]);

  // Load students when course filter changes or on mount
  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Persist filter/sort/pagination state to the URL (replace, so we don't spam
  // browser history). This is what makes filters survive an open-student → Back
  // round-trip and page refresh.
  useEffect(() => {
    const query = serializeDirectoryState({
      selectedCourses,
      status,
      resumeFilter,
      segment,
      riskCourse,
      searchTerm,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    const current = searchParams?.toString() ?? "";
    if (query !== current) {
      router.replace(query ? `?${query}` : "?", { scroll: false });
    }
    // searchParams intentionally omitted: this effect is the writer, reading it
    // here would re-fire on our own writes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedCourses,
    status,
    resumeFilter,
    segment,
    riskCourse,
    searchTerm,
    page,
    limit,
    sortBy,
    sortOrder,
    router,
  ]);

  // Client-side filtering, sorting, and pagination
  // This runs entirely in the browser - no API calls for search, status, sort, or pagination changes
  const hasFilter = Boolean(
    selectedCourses.length > 0 ||
      status !== "all" ||
      resumeFilter !== "all" ||
      segment !== "all" ||
      (searchTerm && searchTerm.trim())
  );
  const {
    filteredStudents,
    paginatedStudents,
    totalCount,
    totalPages,
    chipCounts,
  } = useMemo(() => {
      // Step 1: Filter by search term (name or email)
      let filtered = allStudents;
      if (searchTerm && searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        filtered = allStudents.filter(
          (student) =>
            (student.name || "").toLowerCase().includes(searchLower) ||
            (student.email || "").toLowerCase().includes(searchLower)
        );
      }

      // Step 2: Filter by status
      if (status === "active") {
        filtered = filtered.filter((s) => s.is_active);
      } else if (status === "inactive") {
        filtered = filtered.filter((s) => !s.is_active);
      }

      // Step 2b: Filter by saved resume
      if (resumeFilter === "yes") {
        filtered = filtered.filter((s) => s.has_saved_resume === true);
      } else if (resumeFilter === "no") {
        filtered = filtered.filter((s) => !s.has_saved_resume);
      }

      // Step 2c: the chip counts, taken BEFORE the segment is applied and from the same
      // predicate the filter below uses. That is what makes a chip's number equal the number of
      // rows it opens: same population, same rule, one definition.
      const counts = segmentCounts(filtered, (s) =>
        completionStatsFor(completionStats, s)
      );

      // Step 2d: Engagement-health segment. One segment at a time - the chips are a single
      // choice, so there is no AND/OR across overlapping signals to get wrong.
      if (segment !== "all") {
        filtered = filtered.filter((s) =>
          matchesSegment(segment, s, completionStatsFor(completionStats, s))
        );
      }

      // Step 3: Sort (completion_pct and attendance_pct use completionStats)
      const sorted = [...filtered].sort((a, b) => {
        let aValue: string | number = 0;
        let bValue: string | number = 0;

        switch (sortBy) {
          case "name":
            aValue = (a.name || "").toLowerCase();
            bValue = (b.name || "").toLowerCase();
            break;
          case "marks":
            aValue = a.total_marks;
            bValue = b.total_marks;
            break;
          case "last_activity":
            aValue = a.last_activity_date
              ? new Date(a.last_activity_date).getTime()
              : 0;
            bValue = b.last_activity_date
              ? new Date(b.last_activity_date).getTime()
              : 0;
            break;
          case "time_spent":
            aValue = a.total_time_spent?.value || 0;
            bValue = b.total_time_spent?.value || 0;
            break;
          case "streak":
            aValue = a.current_streak;
            bValue = b.current_streak;
            break;
          case "completion_pct": {
            const statsA = completionStatsFor(completionStats, a);
            const statsB = completionStatsFor(completionStats, b);
            aValue = statsA?.completion_percentage ?? 0;
            bValue = statsB?.completion_percentage ?? 0;
            break;
          }
          case "attendance_pct": {
            const statsA = completionStatsFor(completionStats, a);
            const statsB = completionStatsFor(completionStats, b);
            aValue = statsA?.attendance_percentage ?? 0;
            bValue = statsB?.attendance_percentage ?? 0;
            break;
          }
          case "saved_resume":
            aValue = a.has_saved_resume ? 1 : 0;
            bValue = b.has_saved_resume ? 1 : 0;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });

      // Step 4: Paginate
      const total = sorted.length;
      const totalPagesCount = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginated = sorted.slice(startIndex, endIndex);

      return {
        filteredStudents: sorted,
        paginatedStudents: paginated,
        totalCount: total,
        totalPages: totalPagesCount,
        chipCounts: counts,
      };
    }, [
      allStudents,
      completionStats,
      searchTerm,
      status,
      resumeFilter,
      segment,
      sortBy,
      sortOrder,
      page,
      limit,
    ]);

  const handleSort = (field: SortOption) => {
    const isPctColumn =
      field === "completion_pct" || field === "attendance_pct" || field === "saved_resume";
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      // When any filter is selected and sorting by completion/attendance %, default to DESC
      if (isPctColumn && hasFilter) {
        setSortOrder("desc");
      } else {
        setSortOrder("asc");
      }
    }
    setPage(1);
  };

  const handleCourseChange = (values: string[]) => {
    setSelectedCourses(values);
    setPage(1);
    // This will trigger API call via useEffect
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
    // Client-side filter, no API call
  };

  const handleResumeFilterChange = (value: "all" | "yes" | "no") => {
    setResumeFilter(value);
    setPage(1);
  };

  const handleSegmentChange = (value: SegmentKey) => {
    setSegment((prev) => (prev === value ? "all" : value));
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
    // Client-side filter, no API call
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Client-side pagination - no API call
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    // Client-side pagination - no API call
  };

  const handleBulkEnrollSuccess = () => {
    loadStudents();
    requestAnimationFrame(() => {
      enrollmentJobSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const handleQuickEnrollSuccess = () => {
    loadStudents();
  };

  // ── Row selection for bulk course actions ──────────────────────────────
  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedStudents = useMemo(
    () => filteredStudents.filter((s) => selectedIds.has(s.id)),
    [filteredStudents, selectedIds]
  );

  // The toolbar renders only for enrollment-tool roles and only while a selected student is in
  // the filtered set; the spacer follows exactly that condition, on a phone.
  const showBulkBarSpacer = isPhone && showOrgAdminEnrollmentTools && selectedStudents.length > 0;
  const [bulkBarHeight, setBulkBarHeight] = useState(0);
  useEffect(() => {
    if (!showBulkBarSpacer) return;
    // Measured from the rendered toolbar, not derived from its padding: its height changes with
    // font size, wrapping and the safe-area inset. The toolbar is position:fixed, so the spacer
    // cannot change what it measures - there is no feedback loop.
    const bar = document.querySelector<HTMLElement>('[data-testid="phone-bulk-toolbar"]');
    if (!bar) return;
    const update = () => setBulkBarHeight(Math.ceil(bar.getBoundingClientRect().height));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [showBulkBarSpacer]);
  const allFilteredSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedIds.has(s.id));
  const someFilteredSelected = filteredStudents.some((s) =>
    selectedIds.has(s.id)
  );

  const handleToggleSelectAll = () => {
    setSelectedIds((prev) => {
      // If everything in the filtered set is already selected, clear those;
      // otherwise add every filtered student id (select-all-filtered).
      if (allFilteredSelected) {
        const next = new Set(prev);
        filteredStudents.forEach((s) => next.delete(s.id));
        return next;
      }
      const next = new Set(prev);
      filteredStudents.forEach((s) => next.add(s.id));
      return next;
    });
  };

  const handleClearSelection = () => setSelectedIds(new Set());

  const handleBulkActionDone = () => {
    setSelectedIds(new Set());
    loadStudents();
  };

  const escapeCsvValue = (value: string | number): string => {
    const str = String(value ?? "");
    if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleDownloadCsv = () => {
    const headers = [
      t("adminManageStudents.csvHeaderName"),
      t("adminManageStudents.csvHeaderEmail"),
      t("adminManageStudents.csvHeaderStatus"),
      t("adminManageStudents.csvHeaderEnrollmentCount"),
      t("adminManageStudents.csvHeaderMostActiveCourse"),
      t("adminManageStudents.csvHeaderCompletionPct"),
      t("adminManageStudents.csvHeaderAttendancePct"),
      t("adminManageStudents.csvHeaderSavedResume"),
    ];
    const rows = filteredStudents.map((student) => {
      const stats = completionStatsFor(completionStats, student);
      return [
        escapeCsvValue(student.name ?? ""),
        escapeCsvValue(student.email ?? ""),
        student.is_active ? t("adminManageStudents.active") : t("adminManageStudents.inactive"),
        escapeCsvValue(student.enrollment_count ?? 0),
        escapeCsvValue(student.most_active_course ?? t("adminManageStudents.noActivity")),
        stats ? escapeCsvValue(stats.completion_percentage.toFixed(1)) : t("adminManageStudents.na"),
        // Same rule as the table cell: a tenant with no roll-call activities has no attendance
        // figure, and exporting "0.0" reads as a fact about the student rather than about us.
        stats && stats.total_attendance_activities > 0
          ? escapeCsvValue(stats.attendance_percentage.toFixed(1))
          : t("adminManageStudents.na"),
        student.has_saved_resume
          ? t("adminManageStudents.resumeYes")
          : t("adminManageStudents.resumeNo"),
      ];
    });
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `students${
      selectedCourses.length > 0 ? `-courses-${selectedCourses.join("-")}` : ""
    }.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="People"
        title="Manage Students"
        description="View, add, and manage student accounts and enrolments."
        accent="indigo"
        icon="mdi:account-group"
        action={
          showOrgAdminEnrollmentTools ? (
            <HeaderActionButton
              icon="mdi:plus"
              onClick={() => setQuickEnrollDialogOpen(true)}
            >
              Add student
            </HeaderActionButton>
          ) : undefined
        }
      />

        <Box data-tour-id="students-filters">
          <StudentsFilters
            courses={courses}
            selectedCourses={selectedCourses}
            emptySelectionMeansAllCourses
            status={status}
            resumeFilter={resumeFilter}
            searchTerm={searchTerm}
            onCourseChange={handleCourseChange}
            onStatusChange={handleStatusChange}
            onResumeFilterChange={handleResumeFilterChange}
            onSearchChange={handleSearchChange}
          />
        </Box>

        {/* Engagement-health quick segments - set the (URL-persisted) filters */}
        {isPhone ? (
          <PhoneStudentSegments
            segment={segment}
            // No number until the data behind it is in: a chip that says 0 and then 127 is the
            // same broken promise as a chip whose number never matched its list.
            counts={loading || loadingStats ? undefined : chipCounts}
            onSegmentChange={handleSegmentChange}
          />
        ) : (
        <Box data-tour-id="students-segments" sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, mr: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--font-secondary)",
              }}
            >
              {t("studentSegments.heading", "Segments")}
            </Typography>
            <InfoButton
              ariaLabel={t("studentSegments.infoAriaLabel", "How segments are calculated")}
            >
              <RiskCriteriaContent />
            </InfoButton>
          </Box>
          {STUDENT_SIGNALS.map((seg) => {
            const active = segment === seg.key;
            // See the phone row: no number until the data behind it has arrived.
            const count = loading || loadingStats ? undefined : chipCounts[seg.key];
            return (
              <Box
                key={seg.key}
                component="button"
                type="button"
                aria-pressed={active}
                data-testid={`segment-chip-${seg.key}`}
                onClick={() => handleSegmentChange(seg.key)}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 1.5,
                  py: 0.6,
                  borderRadius: 999,
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  border: "1px solid",
                  borderColor: active ? seg.color : "var(--border-default)",
                  color: active ? "#fff" : "var(--font-secondary)",
                  background: active
                    ? seg.color
                    : "color-mix(in srgb, var(--card-bg) 70%, transparent)",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    borderColor: seg.color,
                    color: active ? "#fff" : seg.color,
                  },
                }}
              >
                <IconWrapper icon={seg.icon} size={16} />
                {t(seg.labelKey, seg.label)}
                {count != null && (
                  <Box
                    component="span"
                    data-testid={`segment-count-${seg.key}`}
                    aria-label={t("studentSegments.countAria", {
                      defaultValue: "{{count}} students",
                      count,
                    })}
                    sx={{
                      px: 0.75,
                      borderRadius: 999,
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      background: active
                        ? "rgba(255,255,255,0.24)"
                        : "color-mix(in srgb, var(--font-secondary) 14%, transparent)",
                    }}
                  >
                    {count}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
        )}

        {/* The dashboard's "View all" for a course-filtered "Needs attention" list lands here:
            at-risk is then judged for that adaptive course only, so both lists are one set. */}
        {riskCourse != null && (
          <Box sx={{ mb: 2 }}>
            <Chip
              data-testid="risk-course-chip"
              icon={<IconWrapper icon="mdi:alert-circle-outline" size={16} />}
              label={`At risk judged for: ${
                adaptiveCourses.find((c) => c.id === riskCourse)?.title ?? `course #${riskCourse}`
              }`}
              onDelete={() => {
                setRiskCourse(null);
                setPage(1);
              }}
              sx={{ fontWeight: 700, maxWidth: "100%" }}
            />
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 2,
            mb: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: 2,
              flexShrink: 0,
              backgroundColor:
                "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
              color: "var(--accent-indigo)",
            }}
            aria-hidden
          >
            <IconWrapper icon="mdi:view-list-outline" size={24} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              component="h2"
              sx={{ fontWeight: 700, color: "var(--font-primary)" }}
            >
              {t("adminManageStudents.studentDirectoryTitle")}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "var(--font-secondary)",
                mt: 0.5,
                maxWidth: 640,
                lineHeight: 1.5,
              }}
            >
              {t("adminManageStudents.studentDirectoryHint")}
            </Typography>
          </Box>
        </Box>

        {showOrgAdminEnrollmentTools && (
          <BulkActionToolbar
            selected={selectedStudents}
            courses={courses}
            adaptiveCourses={adaptiveCourses}
            batches={batches}
            onClear={handleClearSelection}
            onDone={handleBulkActionDone}
          />
        )}

        <Paper
          data-tour-id="students-table"
          elevation={0}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            border: "1px solid var(--border-default)",
            boxShadow:
              "0 4px 24px color-mix(in srgb, var(--font-primary) 7%, transparent)",
            backgroundColor: "var(--card-bg)",
            mb: 2,
            // On a phone each student is its own card, so the table's card around them goes.
            [PHONE]: {
              border: "none",
              boxShadow: "none",
              backgroundColor: "transparent",
              overflow: "visible",
              borderRadius: 0,
            },
          }}
        >
          <StudentsTable
            students={paginatedStudents}
            completionStats={completionStats}
            loading={loading}
            loadingStats={loadingStats}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            wrapInPaper={false}
            selectable={showOrgAdminEnrollmentTools}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            allSelected={allFilteredSelected}
            someSelected={someFilteredSelected}
            onDelete={canDeleteStudents ? (s) => setDeleteTarget(s) : undefined}
          />
          <StudentsPagination
            totalPages={totalPages}
            page={page}
            totalCount={totalCount}
            limit={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </Paper>

        {showOrgAdminEnrollmentTools ? (
          <Box
            ref={enrollmentJobSectionRef}
            data-tour-id="students-enrollment-jobs"
            id="enrollment-job-history-section"
            component="section"
            aria-labelledby="enrollment-job-history-heading"
            sx={{ mt: { xs: 4, sm: 5 } }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 2,
                mb: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  flexShrink: 0,
                  backgroundColor:
                    "color-mix(in srgb, var(--accent-indigo) 14%, var(--surface) 86%)",
                  color: "var(--accent-indigo)",
                }}
                aria-hidden
              >
                <IconWrapper icon="mdi:clipboard-flow-outline" size={24} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  id="enrollment-job-history-heading"
                  variant="subtitle1"
                  component="h2"
                  sx={{ fontWeight: 700, color: "var(--font-primary)" }}
                >
                  {t("adminManageStudents.enrollmentJobHistory")}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--font-secondary)",
                    mt: 0.5,
                    maxWidth: 640,
                    lineHeight: 1.5,
                  }}
                >
                  {t("adminManageStudents.enrollmentJobHistorySubtitle")}
                </Typography>
              </Box>
            </Box>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                overflow: "hidden",
                border: "1px solid var(--border-default)",
                boxShadow:
                  "0 4px 24px color-mix(in srgb, var(--font-primary) 7%, transparent)",
                backgroundColor: "var(--card-bg)",
                p: { xs: 1.5, sm: 2 },
                // Each job is its own card on a phone; a card around them is a card in a card.
                [PHONE]: {
                  p: 0,
                  border: "none",
                  boxShadow: "none",
                  backgroundColor: "transparent",
                  overflow: "visible",
                },
              }}
            >
              <EnrollmentJobHistory embedded />
            </Paper>
          </Box>
        ) : null}

        {/* On a phone the bulk toolbar is pinned over the bottom of the page while students are
            selected, and it is taller than the room the layout keeps free above the dock. This
            spacer adds the toolbar's own measured height, so the last job card and the
            pagination can still be scrolled clear of it. */}
        {showBulkBarSpacer && (
          <Box aria-hidden data-testid="phone-bulk-bar-spacer" sx={{ height: bulkBarHeight + 8, flexShrink: 0 }} />
        )}

        <BulkEnrollmentDialog
          open={bulkEnrollDialogOpen}
          onClose={() => setBulkEnrollDialogOpen(false)}
          onSuccess={handleBulkEnrollSuccess}
        />

        <QuickEnrollStudentDialog
          open={quickEnrollDialogOpen}
          onClose={() => setQuickEnrollDialogOpen(false)}
          onSuccess={handleQuickEnrollSuccess}
        />

        <ResponsiveConfirm
          busy={deleting}
          open={!!deleteTarget}
          title="Delete student permanently?"
          message={
            `This permanently removes ${deleteTarget?.name || "this student"} from your organization — their enrollments, submissions, community posts, progress and payment records here are erased. This can't be undone. (If they belong to another organization, their login there is unaffected.)`
          }
          confirmText={deleting ? "Deleting…" : "Delete permanently"}
          cancelText="Cancel"
          confirmColor="error"
          onCancel={() => (deleting ? undefined : setDeleteTarget(null))}
          onConfirm={async () => {
            if (!deleteTarget) return;
            setDeleting(true);
            try {
              await adminStudentService.deleteStudent(deleteTarget.id);
              showToast(`${deleteTarget.name || "Student"} removed from your organization.`, "success");
              setDeleteTarget(null);
              await loadStudents();
            } catch {
              showToast("Couldn't delete this student.", "error");
            } finally {
              setDeleting(false);
            }
          }}
        />
    </PageShell>
  );
}
