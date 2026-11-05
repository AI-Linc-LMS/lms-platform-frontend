"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/common/PageShell";
import { instructorService } from "@/lib/services/instructor.service";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  HeaderActionButton,
  ModulePageHeader,
} from "@/components/common/ModulePageHeader";
import { AddInstructorDialog } from "@/components/admin/instructors/AddInstructorDialog";
import {
  InstructorFilterBar,
  type CourseChoice,
} from "@/components/admin/instructors/InstructorFilterBar";
import {
  InstructorBulkBar,
  type BulkAction,
  type BulkProgress,
} from "@/components/admin/instructors/InstructorBulkBar";
import {
  EMPTY_FILTERS,
  matchesFilters,
  scopeFiltersToTab,
  type InstructorFilters,
} from "@/components/admin/instructors/instructorFilters";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  adminInstructorsService,
  type InstructorListStatus,
  type InstructorRow,
} from "@/lib/services/admin/admin-instructors.service";
import { adminCourseBuilderService } from "@/lib/services/admin/admin-course-builder.service";
import { formatDate } from "@/lib/utils/date-utils";
import { PHONE } from "@/components/common/mobile/phone";
import {
  CardFact,
  PHONE_FIELD_SX,
  PhoneSheet,
  SHEET_BUTTON_SX,
  TAP,
  phoneIconButtonSx,
  useIsPhone,
} from "@/components/admin/adminPhone";

/**
 * A course offered in the assign dialog. `kind` matters because classic and adaptive courses
 * come from different tables with independent id spaces: id 14 is a different course in each.
 * Selection is therefore keyed by `courseKey`, never by the bare id.
 */
interface CourseOption {
  id: number;
  title: string;
  kind: "classic" | "adaptive";
}

const courseKey = (c: { id: number; kind: CourseOption["kind"] }) => `${c.kind}:${c.id}`;

/**
 * Everything assigned to an instructor, across both course tables, for display.
 * The adaptive half was missing entirely, so a tenant with only adaptive courses showed an
 * empty ASSIGNED COURSES column however many courses its instructors had.
 */
const assignedForDisplay = (row: InstructorRow) => [
  ...(row.assigned_courses ?? []).map((c) => ({ ...c, kind: "classic" as const })),
  ...(row.assigned_adaptive_courses ?? []).map((c) => ({ ...c, kind: "adaptive" as const })),
];

type ApiErrorShape = { response?: { data?: { detail?: string; error?: string } } };

function readApiError(err: unknown, fallback: string): string {
  const ax = err as ApiErrorShape;
  return ax.response?.data?.detail || ax.response?.data?.error || fallback;
}

const STATUS_TABS: InstructorListStatus[] = ["pending", "approved", "rejected"];

const STATUS_VISUAL: Record<
  InstructorListStatus,
  { icon: string; accent: string; tint: string }
> = {
  pending: {
    icon: "mdi:clock-outline",
    accent: "var(--accent-amber, #d97706)",
    tint: "color-mix(in srgb, #f59e0b 14%, var(--surface) 86%)",
  },
  approved: {
    icon: "mdi:check-circle-outline",
    accent: "var(--accent-emerald, #059669)",
    tint: "color-mix(in srgb, #10b981 14%, var(--surface) 86%)",
  },
  rejected: {
    icon: "mdi:close-circle-outline",
    accent: "var(--accent-rose, #dc2626)",
    tint: "color-mix(in srgb, #ef4444 12%, var(--surface) 88%)",
  },
};

function getInitials(name: string, email: string): string {
  const source = (name || email || "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarColorFor(seed: string): string {
  const palette = [
    "#6366f1",
    "#0ea5e9",
    "#10b981",
    "#f59e0b",
    "#ec4899",
    "#8b5cf6",
    "#14b8a6",
    "#f43f5e",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  return palette[Math.abs(hash) % palette.length];
}

export default function InstructorsPage() {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const isPhone = useIsPhone();

  const [activeTab, setActiveTab] = useState<InstructorListStatus>("pending");
  const [dataByStatus, setDataByStatus] = useState<
    Record<InstructorListStatus, InstructorRow[] | null>
  >({ pending: null, approved: null, rejected: null });
  const [loadingByStatus, setLoadingByStatus] = useState<
    Record<InstructorListStatus, boolean>
  >({ pending: true, approved: true, rejected: true });
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<InstructorFilters>(EMPTY_FILTERS);

  /**
   * Bulk selection, as profile ids.
   *
   * Pruned to the rows actually on screen (see the effect below), so an action can never
   * reach a row the admin cannot see. The alternative - remembering selections across a tab
   * switch or a filter change - means "Reject 12" sometimes rejects somebody who scrolled
   * out of existence three filters ago.
   */
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkProgress, setBulkProgress] = useState<BulkProgress | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState<
    null | "approve" | "reopen" | "remove"
  >(null);
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkAssignMode, setBulkAssignMode] = useState<"add" | "remove">("add");

  const [busyId, setBusyId] = useState<number | null>(null);

  const [confirmApproveRow, setConfirmApproveRow] = useState<InstructorRow | null>(null);
  const [confirmRejectRow, setConfirmRejectRow] = useState<InstructorRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmReopenRow, setConfirmReopenRow] = useState<InstructorRow | null>(null);

  const [assignRow, setAssignRow] = useState<InstructorRow | null>(null);
  const [allCourses, setAllCourses] = useState<CourseOption[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [courseSearch, setCourseSearch] = useState("");


  const [viewCoursesRow, setViewCoursesRow] = useState<InstructorRow | null>(null);

  const [menuRow, setMenuRow] = useState<InstructorRow | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  // Public instructor codes, folded into the table (was a separate duplicate directory panel).
  const [codeById, setCodeById] = useState<Record<number, string>>({});
  const [codeRow, setCodeRow] = useState<InstructorRow | null>(null);
  const [codeValue, setCodeValue] = useState("");
  const [savingCode, setSavingCode] = useState(false);
  const [removeRow, setRemoveRow] = useState<InstructorRow | null>(null);
  const [removing, setRemoving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const loadCodes = useCallback(async () => {
    try {
      const rows = await instructorService.getInstructorDirectory();
      const m: Record<number, string> = {};
      for (const r of rows) if (r.instructor_code) m[r.profile_id] = r.instructor_code;
      setCodeById(m);
    } catch {
      /* codes are supplementary; ignore load failure */
    }
  }, []);

  const loadStatus = useCallback(
    async (status: InstructorListStatus) => {
      setLoadingByStatus((s) => ({ ...s, [status]: true }));
      try {
        const data = await adminInstructorsService.listInstructors(status);
        setDataByStatus((d) => ({ ...d, [status]: data }));
      } catch (err: unknown) {
        showToast(readApiError(err, t("adminInstructors.errors.loadFailed")), "error");
        setDataByStatus((d) => ({ ...d, [status]: [] }));
      } finally {
        setLoadingByStatus((s) => ({ ...s, [status]: false }));
      }
    },
    [showToast, t]
  );

  const refreshAll = useCallback(async () => {
    await Promise.all(STATUS_TABS.map((s) => loadStatus(s)));
  }, [loadStatus]);

  useEffect(() => {
    void refreshAll();
    void loadCodes();
  }, [refreshAll, loadCodes]);

  const refreshCourses = useCallback(async () => {
    try {
      setCoursesLoading(true);
      // Two catalogues, because a tenant's courses can live in either table. Loading only
      // the classic one is what made this dialog read "no courses available yet" on the five
      // tenants that have no classic courses at all.
      const normalise = (raw: unknown, kind: CourseOption["kind"]): CourseOption[] => {
        const r = raw as { results?: unknown[]; courses?: unknown[] } | unknown[];
        const list = Array.isArray(r) ? r : r?.results ?? r?.courses ?? [];
        return (list as { id?: number; title?: string }[])
          .map((c) =>
            c && typeof c.id === "number" && typeof c.title === "string"
              ? { id: c.id, title: c.title, kind }
              : null
          )
          .filter((c): c is CourseOption => c !== null);
      };

      // One catalogue failing must not empty the other, so they settle independently.
      const [classic, adaptive] = await Promise.allSettled([
        adminCourseBuilderService.getCourses(),
        adminInstructorsService.getAssignableAdaptiveCourses(),
      ]);
      const options = [
        ...(classic.status === "fulfilled" ? normalise(classic.value, "classic") : []),
        ...(adaptive.status === "fulfilled" ? normalise(adaptive.value, "adaptive") : []),
      ];
      if (classic.status === "rejected" && adaptive.status === "rejected") {
        throw classic.reason;
      }
      options.sort((a, b) => a.title.localeCompare(b.title));
      setAllCourses(options);
    } catch (err: unknown) {
      showToast(readApiError(err, t("adminInstructors.errors.coursesLoadFailed")), "error");
      setAllCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  }, [showToast, t]);

  const counts = useMemo(
    () => ({
      pending: dataByStatus.pending?.length ?? 0,
      approved: dataByStatus.approved?.length ?? 0,
      rejected: dataByStatus.rejected?.length ?? 0,
    }),
    [dataByStatus]
  );

  const tabRows = useMemo(
    () => dataByStatus[activeTab] ?? [],
    [dataByStatus, activeTab]
  );

  const visibleRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const scoped = scopeFiltersToTab(filters, activeTab);
    const ctx = {
      codeById,
      now: Date.now(),
      assignedKeys: (r: InstructorRow) => assignedForDisplay(r).map(courseKey),
    };
    return tabRows.filter((r) => {
      if (
        q &&
        !r.full_name.toLowerCase().includes(q) &&
        !r.email.toLowerCase().includes(q)
      ) {
        return false;
      }
      return matchesFilters(r, scoped, ctx);
    });
  }, [tabRows, activeTab, searchTerm, filters, codeById]);

  const visibleIds = useMemo(() => visibleRows.map((r) => r.id), [visibleRows]);

  /**
   * Keep the selection inside the visible set.
   *
   * Returns the previous array unchanged when nothing was dropped - a fresh array every
   * time would re-run this effect forever, since `selectedIds` feeds the memo that feeds it.
   */
  useEffect(() => {
    setSelectedIds((prev) => {
      const visible = new Set(visibleIds);
      const keep = prev.filter((id) => visible.has(id));
      return keep.length === prev.length ? prev : keep;
    });
  }, [visibleIds]);

  const selectedRows = useMemo(
    () => visibleRows.filter((r) => selectedIds.includes(r.id)),
    [visibleRows, selectedIds]
  );

  const allVisibleSelected =
    visibleRows.length > 0 && selectedIds.length === visibleRows.length;
  const someVisibleSelected =
    selectedIds.length > 0 && selectedIds.length < visibleRows.length;

  const toggleAllVisible = () => {
    setSelectedIds(allVisibleSelected ? [] : visibleIds);
  };

  const toggleRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /**
   * Courses offered by the "assigned to" facet.
   *
   * Built from what the instructors on screen are ACTUALLY assigned, not from the full
   * catalogue: a dropdown of 300 courses where 290 match nobody is a worse control than a
   * short one that always returns rows.
   */
  const courseChoices = useMemo<CourseChoice[]>(() => {
    const byKey = new Map<string, string>();
    tabRows.forEach((r) =>
      assignedForDisplay(r).forEach((c) => byKey.set(courseKey(c), c.title))
    );
    return Array.from(byKey, ([key, title]) => ({ key, title })).sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  }, [tabRows]);

  /**
   * Run a per-instructor endpoint across the selection, one at a time.
   *
   * There is no bulk endpoint behind any of these actions, so this is a loop over the
   * single-profile ones. Three things it deliberately does:
   *
   *  - It acts on `selectedRows`, which is the selection intersected with what is on
   *    screen, never on ids alone.
   *  - It keeps going after a failure and names the rows that failed. A bulk action that
   *    says "Approved 20" when 3 of them 403'd is worse than one that fails outright,
   *    because the three look done.
   *  - It refreshes ONCE, after the loop. Refreshing per row is what made the course
   *    builder's bulk add feel broken: n refetches of the whole list.
   */
  const runBulk = useCallback(
    async (
      run: (row: InstructorRow) => Promise<unknown>,
      refresh: InstructorListStatus[],
      copy: { done: string; failedAll: string; partial: string }
    ) => {
      const rows = selectedRows;
      if (rows.length === 0) return;

      setBulkProgress({ done: 0, total: rows.length });
      const failures: Array<{ row: InstructorRow; message: string }> = [];

      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        try {
          await run(row);
        } catch (err: unknown) {
          failures.push({
            row,
            message: readApiError(
              err,
              t("adminInstructors.bulk.unknownError", {
                defaultValue: "the server gave no reason",
              })
            ),
          });
        }
        setBulkProgress({ done: i + 1, total: rows.length });
      }

      setBulkProgress(null);
      setSelectedIds([]);
      await Promise.all(refresh.map((st) => loadStatus(st)));
      await loadCodes();

      const ok = rows.length - failures.length;
      if (failures.length === 0) {
        showToast(`${copy.done} (${ok})`, "success");
        return;
      }

      // Name the failures. Two is enough to act on; the rest are counted so the number
      // still adds up to the selection.
      const named = failures
        .slice(0, 2)
        .map((f) => `${f.row.full_name || f.row.email}: ${f.message}`)
        .join("; ");
      const more =
        failures.length > 2 ? ` (+${failures.length - 2} more)` : "";

      if (ok === 0) {
        showToast(`${copy.failedAll} - ${named}${more}`, "error");
      } else {
        showToast(
          `${copy.partial.replace("{ok}", String(ok)).replace("{total}", String(rows.length))} - ${named}${more}`,
          "warning"
        );
      }
    },
    [selectedRows, loadStatus, loadCodes, showToast, t]
  );

  const bulkApprove = () =>
    runBulk(
      (row) => adminInstructorsService.approveInstructor(row.id),
      ["pending", "approved"],
      {
        done: t("adminInstructors.bulk.approvedAll", { defaultValue: "Instructors approved" }),
        failedAll: t("adminInstructors.bulk.approveFailed", { defaultValue: "No instructor could be approved" }),
        partial: t("adminInstructors.bulk.approvePartial", { defaultValue: "Approved {ok} of {total}" }),
      }
    );

  const bulkReject = (reason: string) =>
    runBulk(
      (row) => adminInstructorsService.rejectInstructor(row.id, reason || undefined),
      ["pending", "rejected"],
      {
        done: t("adminInstructors.bulk.rejectedAll", { defaultValue: "Instructors rejected" }),
        failedAll: t("adminInstructors.bulk.rejectFailed", { defaultValue: "No instructor could be rejected" }),
        partial: t("adminInstructors.bulk.rejectPartial", { defaultValue: "Rejected {ok} of {total}" }),
      }
    );

  const bulkReopen = () =>
    runBulk(
      (row) => adminInstructorsService.reopenInstructor(row.id),
      ["pending", "rejected"],
      {
        done: t("adminInstructors.bulk.reopenedAll", { defaultValue: "Applications reopened" }),
        failedAll: t("adminInstructors.bulk.reopenFailed", { defaultValue: "No application could be reopened" }),
        partial: t("adminInstructors.bulk.reopenPartial", { defaultValue: "Reopened {ok} of {total}" }),
      }
    );

  const bulkRemove = () =>
    runBulk(
      (row) => adminInstructorsService.removeInstructor(row.id),
      ["pending", "approved", "rejected"],
      {
        done: t("adminInstructors.bulk.removedAll", { defaultValue: "Instructors removed" }),
        failedAll: t("adminInstructors.bulk.removeFailed", { defaultValue: "No instructor could be removed" }),
        partial: t("adminInstructors.bulk.removePartial", { defaultValue: "Removed {ok} of {total}" }),
      }
    );

  /**
   * Bulk course assignment uses `add`/`remove`, NEVER `set`.
   *
   * `set` is what the per-row dialog sends, because there the admin is looking at that one
   * instructor's current list. Applied to a selection it would overwrite every assignment
   * each of them already has with whatever is ticked here - silent data loss across n
   * people from one button.
   */
  const bulkAssignCourses = (mode: "add" | "remove") => {
    const classic = allCourses
      .filter((c) => c.kind === "classic" && selectedKeys.includes(courseKey(c)))
      .map((c) => c.id);
    const adaptive = allCourses
      .filter((c) => c.kind === "adaptive" && selectedKeys.includes(courseKey(c)))
      .map((c) => c.id);

    return runBulk(
      (row) =>
        adminInstructorsService.assignCoursesToInstructor(
          row.id,
          classic,
          mode,
          adaptive
        ),
      ["approved"],
      {
        done:
          mode === "add"
            ? t("adminInstructors.bulk.coursesAdded", { defaultValue: "Courses added" })
            : t("adminInstructors.bulk.coursesRemoved", { defaultValue: "Courses removed" }),
        failedAll: t("adminInstructors.bulk.coursesFailed", { defaultValue: "No assignment could be changed" }),
        partial: t("adminInstructors.bulk.coursesPartial", { defaultValue: "Updated {ok} of {total}" }),
      }
    );
  };

  const bulkActions = useMemo<BulkAction[]>(() => {
    if (bulkProgress) return [];
    if (activeTab === "pending") {
      return [
        {
          id: "approve",
          label: t("adminInstructors.bulk.approve", { defaultValue: "Approve" }),
          icon: "mdi:check-circle-outline",
          onRun: () => setBulkConfirm("approve"),
        },
        {
          id: "reject",
          label: t("adminInstructors.bulk.reject", { defaultValue: "Reject" }),
          icon: "mdi:close-circle-outline",
          danger: true,
          onRun: () => {
            setBulkRejectReason("");
            setBulkRejectOpen(true);
          },
        },
      ];
    }
    if (activeTab === "approved") {
      return [
        {
          id: "assign",
          label: t("adminInstructors.bulk.assignCourses", { defaultValue: "Assign courses" }),
          icon: "mdi:book-plus-outline",
          onRun: () => {
            setSelectedKeys([]);
            setCourseSearch("");
            setBulkAssignMode("add");
            setBulkAssignOpen(true);
            void refreshCourses();
          },
        },
        {
          id: "remove",
          label: t("adminInstructors.bulk.removeInstructor", { defaultValue: "Remove as instructor" }),
          icon: "mdi:account-off-outline",
          danger: true,
          onRun: () => setBulkConfirm("remove"),
        },
      ];
    }
    return [
      {
        id: "reopen",
        label: t("adminInstructors.bulk.reopen", { defaultValue: "Reopen" }),
        icon: "mdi:restore",
        onRun: () => setBulkConfirm("reopen"),
      },
    ];
  }, [activeTab, bulkProgress, t, refreshCourses]);

  const openMenu = (row: InstructorRow, anchor: HTMLElement) => {
    setMenuRow(row);
    setMenuAnchor(anchor);
  };
  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuRow(null);
  };

  const handleApproveConfirmed = async () => {
    const row = confirmApproveRow;
    if (!row) return;
    try {
      setBusyId(row.id);
      const res = await adminInstructorsService.approveInstructor(row.id);
      showToast(res.detail || t("adminInstructors.toasts.approved"), "success");
      setConfirmApproveRow(null);
      await Promise.all([loadStatus("pending"), loadStatus("approved")]);
    } catch (err: unknown) {
      showToast(readApiError(err, t("adminInstructors.errors.approveFailed")), "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleRejectConfirmed = async () => {
    const row = confirmRejectRow;
    if (!row) return;
    try {
      setBusyId(row.id);
      const res = await adminInstructorsService.rejectInstructor(
        row.id,
        rejectReason || undefined
      );
      showToast(res.detail || t("adminInstructors.toasts.rejected"), "success");
      setConfirmRejectRow(null);
      setRejectReason("");
      await Promise.all([loadStatus("pending"), loadStatus("rejected")]);
    } catch (err: unknown) {
      showToast(readApiError(err, t("adminInstructors.errors.rejectFailed")), "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleReopenConfirmed = async () => {
    const row = confirmReopenRow;
    if (!row) return;
    try {
      setBusyId(row.id);
      const res = await adminInstructorsService.reopenInstructor(row.id);
      showToast(res.detail || t("adminInstructors.toasts.reopened"), "success");
      setConfirmReopenRow(null);
      await Promise.all([loadStatus("pending"), loadStatus("rejected")]);
    } catch (err: unknown) {
      showToast(readApiError(err, t("adminInstructors.errors.reopenFailed")), "error");
    } finally {
      setBusyId(null);
    }
  };

  const openAssignDialog = async (row: InstructorRow) => {
    setAssignRow(row);
    setSelectedKeys([
      ...(row.assigned_courses ?? []).map((c) => courseKey({ id: c.id, kind: "classic" })),
      ...(row.assigned_adaptive_courses ?? []).map((c) =>
        courseKey({ id: c.id, kind: "adaptive" })
      ),
    ]);
    setCourseSearch("");
    closeMenu();
    if (allCourses.length === 0) {
      await refreshCourses();
    }
  };

  const filteredAssignCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    if (!q) return allCourses;
    return allCourses.filter((c) => c.title.toLowerCase().includes(q));
  }, [allCourses, courseSearch]);

  const allFilteredSelected =
    filteredAssignCourses.length > 0 &&
    filteredAssignCourses.every((c) => selectedKeys.includes(courseKey(c)));

  const toggleAllFiltered = () => {
    if (allFilteredSelected) {
      const remove = new Set(filteredAssignCourses.map(courseKey));
      setSelectedKeys((prev) => prev.filter((k) => !remove.has(k)));
    } else {
      const add = new Set(selectedKeys);
      filteredAssignCourses.forEach((c) => add.add(courseKey(c)));
      setSelectedKeys(Array.from(add));
    }
  };

  const handleAssignSave = async () => {
    const row = assignRow;
    if (!row) return;
    try {
      setBusyId(row.id);
      // Split back into the two id spaces the API expects. Sending everything as
      // `course_ids` would be rejected as invalid ids, or worse, match the wrong course.
      const classicIds = selectedKeys
        .filter((k) => k.startsWith("classic:"))
        .map((k) => Number(k.slice("classic:".length)));
      const adaptiveIds = selectedKeys
        .filter((k) => k.startsWith("adaptive:"))
        .map((k) => Number(k.slice("adaptive:".length)));
      const res = await adminInstructorsService.assignCoursesToInstructor(
        row.id,
        classicIds,
        "set",
        adaptiveIds
      );
      showToast(res.detail || t("adminInstructors.toasts.coursesAssigned"), "success");
      setAssignRow(null);
      await loadStatus("approved");
    } catch (err: unknown) {
      showToast(readApiError(err, t("adminInstructors.errors.assignFailed")), "error");
    } finally {
      setBusyId(null);
    }
  };

  const renderActions = (row: InstructorRow) => {
    if (activeTab === "pending") {
      return (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            size="small"
            variant="contained"
            disabled={busyId === row.id}
            startIcon={<IconWrapper icon="mdi:check" size={16} />}
            onClick={() => setConfirmApproveRow(row)}
            sx={{
              textTransform: "none",
              backgroundColor: "var(--accent-indigo)",
              color: "var(--font-light)",
              boxShadow: "0 1px 4px color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
              "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
            }}
          >
            {busyId === row.id
              ? t("adminInstructors.loading.approving")
              : t("adminInstructors.actions.approve")}
          </Button>
          <Button
            size="small"
            variant="outlined"
            disabled={busyId === row.id}
            color="error"
            startIcon={<IconWrapper icon="mdi:close" size={16} />}
            onClick={() => {
              setRejectReason("");
              setConfirmRejectRow(row);
            }}
            sx={{ textTransform: "none" }}
          >
            {t("adminInstructors.actions.reject")}
          </Button>
        </Stack>
      );
    }
    if (activeTab === "approved") {
      return (
        <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
          {codeById[row.id] && (
            <Chip
              size="small"
              icon={<IconWrapper icon="mdi:shield-account-outline" size={13} />}
              label={codeById[row.id]}
              onClick={() => { setCodeValue(codeById[row.id] || ""); setCodeRow(row); }}
              sx={{ fontWeight: 800, fontFamily: "monospace", cursor: "pointer" }}
              title="Instructor code (students see this instead of the name)"
            />
          )}
          <Button
            size="small"
            variant="outlined"
            startIcon={<IconWrapper icon="mdi:book-plus-multiple-outline" size={16} />}
            onClick={() => void openAssignDialog(row)}
            sx={{ textTransform: "none" }}
          >
            {t("adminInstructors.actions.assignCourses")}
          </Button>
          <Tooltip title="More">
            <IconButton size="small" onClick={(e) => openMenu(row, e.currentTarget)}>
              <IconWrapper icon="mdi:dots-vertical" size={20} />
            </IconButton>
          </Tooltip>
        </Stack>
      );
    }
    return (
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button
          size="small"
          variant="outlined"
          disabled={busyId === row.id}
          startIcon={<IconWrapper icon="mdi:refresh" size={16} />}
          onClick={() => setConfirmReopenRow(row)}
          sx={{ textTransform: "none" }}
        >
          {t("adminInstructors.actions.reopen")}
        </Button>
        <Button
          size="small"
          variant="text"
          color="error"
          startIcon={<IconWrapper icon="mdi:account-remove-outline" size={16} />}
          onClick={() => setRemoveRow(row)}
          sx={{ textTransform: "none" }}
        >
          Remove
        </Button>
      </Stack>
    );
  };

  const columns = useMemo(() => {
    const cols = [
      t("adminInstructors.columns.fullName"),
      t("adminInstructors.columns.phone"),
      t("adminInstructors.columns.createdAt"),
      "CV",
    ];
    if (activeTab === "approved") cols.push(t("adminInstructors.columns.assignedCourses"));
    if (activeTab === "rejected") {
      cols.push(t("adminInstructors.columns.reviewedAt"));
      cols.push(t("adminInstructors.columns.rejectionReason"));
    }
    cols.push(t("adminInstructors.columns.actions"));
    return cols;
  }, [activeTab, t]);

  const loading = loadingByStatus[activeTab];

  const emptyState = (
    <Stack alignItems="center" spacing={1.5}>
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: STATUS_VISUAL[activeTab].tint,
          color: STATUS_VISUAL[activeTab].accent,
        }}
      >
        <IconWrapper icon={STATUS_VISUAL[activeTab].icon} size={32} />
      </Box>
      <Typography sx={{ color: "var(--font-secondary)" }}>
        {searchTerm
          ? t("adminInstructors.noMatch")
          : t(`adminInstructors.empty.${activeTab}`)}
      </Typography>
    </Stack>
  );

  /**
   * The row actions as full-width thumb buttons. Same handlers as `renderActions`; only the
   * shape changes, because a right-aligned row of small buttons does not fit a 358px card.
   */
  const renderPhoneActions = (row: InstructorRow) => {
    const btn = { ...SHEET_BUTTON_SX, minHeight: TAP, flex: "1 1 0", minWidth: 0 } as const;
    if (activeTab === "pending") {
      return (
        <>
          <Button
            variant="contained"
            disabled={busyId === row.id}
            startIcon={<IconWrapper icon="mdi:check" size={16} />}
            onClick={() => setConfirmApproveRow(row)}
            sx={{
              ...btn,
              backgroundColor: "var(--accent-indigo)",
              color: "var(--font-light)",
              "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
            }}
          >
            {busyId === row.id
              ? t("adminInstructors.loading.approving")
              : t("adminInstructors.actions.approve")}
          </Button>
          <Button
            variant="outlined"
            color="error"
            disabled={busyId === row.id}
            startIcon={<IconWrapper icon="mdi:close" size={16} />}
            onClick={() => {
              setRejectReason("");
              setConfirmRejectRow(row);
            }}
            sx={btn}
          >
            {t("adminInstructors.actions.reject")}
          </Button>
        </>
      );
    }
    if (activeTab === "approved") {
      return (
        <>
          <Button
            variant="outlined"
            startIcon={<IconWrapper icon="mdi:book-plus-multiple-outline" size={16} />}
            onClick={() => void openAssignDialog(row)}
            sx={btn}
          >
            {t("adminInstructors.actions.assignCourses")}
          </Button>
          <IconButton
            aria-label={t("adminPeoplePhone.moreActions", { name: row.full_name || row.email })}
            onClick={(e) => openMenu(row, e.currentTarget)}
            sx={{ width: TAP, height: TAP, flexShrink: 0, border: "1px solid var(--border-default)", borderRadius: 2 }}
          >
            <IconWrapper icon="mdi:dots-vertical" size={20} />
          </IconButton>
        </>
      );
    }
    return (
      <>
        <Button
          variant="outlined"
          disabled={busyId === row.id}
          startIcon={<IconWrapper icon="mdi:refresh" size={16} />}
          onClick={() => setConfirmReopenRow(row)}
          sx={btn}
        >
          {t("adminInstructors.actions.reopen")}
        </Button>
        <Button
          variant="text"
          color="error"
          startIcon={<IconWrapper icon="mdi:account-remove-outline" size={16} />}
          onClick={() => setRemoveRow(row)}
          sx={btn}
        >
          Remove
        </Button>
      </>
    );
  };

  const phoneCards = (
    <Stack spacing={1.25} data-testid="instructor-cards">
      {visibleRows.length > 0 && (
        <Stack direction="row" alignItems="center" sx={{ px: 0.5 }}>
          <Checkbox
            checked={allVisibleSelected}
            indeterminate={someVisibleSelected}
            onChange={toggleAllVisible}
            disabled={bulkProgress !== null}
            sx={{ width: TAP, height: TAP }}
            inputProps={{
              "aria-label": t("adminInstructors.bulk.selectAll", {
                defaultValue: "Select all instructors shown",
              }) as string,
            }}
          />
          <Typography sx={{ fontSize: "0.8125rem", color: "var(--font-secondary)" }}>
            {t("adminInstructors.bulk.selectAll", {
              defaultValue: "Select all instructors shown",
            })}
          </Typography>
        </Stack>
      )}
      {loading && (dataByStatus[activeTab]?.length ?? 0) === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      ) : visibleRows.length === 0 ? (
        <Box sx={{ py: 6 }}>{emptyState}</Box>
      ) : (
        visibleRows.map((row) => (
          <Paper
            key={row.id}
            elevation={0}
            data-testid="instructor-card"
            sx={{
              p: 1.75,
              borderRadius: 2,
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--card-bg)",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
              <Checkbox
                checked={selectedIds.includes(row.id)}
                onChange={() => toggleRow(row.id)}
                disabled={bulkProgress !== null}
                sx={{ ml: -1, width: TAP, height: TAP, flexShrink: 0 }}
                inputProps={{
                  "aria-label": t("adminInstructors.bulk.selectOne", {
                    defaultValue: `Select ${row.full_name || row.email}`,
                    name: row.full_name || row.email,
                  }) as string,
                }}
              />
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  backgroundColor: avatarColorFor(row.email || row.full_name),
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                }}
              >
                {getInitials(row.full_name, row.email)}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ color: "var(--font-primary)", fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.25, overflowWrap: "anywhere" }}>
                  {row.full_name || row.email}
                </Typography>
                <Typography sx={{ color: "var(--font-secondary)", fontSize: "0.8125rem", overflowWrap: "anywhere" }}>
                  {row.email}
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={0.75} sx={{ mt: 1.5 }}>
              <CardFact label={t("adminInstructors.columns.phone")}>{row.phone_number || "-"}</CardFact>
              <CardFact label={t("adminInstructors.columns.createdAt")}>{formatDate(row.created_at)}</CardFact>
              {activeTab === "approved" && codeById[row.id] && (
                <CardFact label={t("adminPeoplePhone.instructorCode")}>
                  <Box component="span" sx={{ fontFamily: "monospace", fontWeight: 800 }}>{codeById[row.id]}</Box>
                </CardFact>
              )}
              {activeTab === "approved" && (
                <CardFact label={t("adminInstructors.columns.assignedCourses")}>
                  {assignedForDisplay(row).length > 0 ? (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
                      {assignedForDisplay(row).slice(0, 3).map((c) => (
                        <Chip
                          key={courseKey(c)}
                          label={c.title}
                          size="small"
                          sx={{
                            backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, var(--surface) 90%)",
                            color: "var(--accent-indigo)",
                            fontWeight: 500,
                            fontSize: "0.75rem",
                            maxWidth: "100%",
                          }}
                        />
                      ))}
                      {assignedForDisplay(row).length > 3 && (
                        <Button
                          size="small"
                          onClick={() => setViewCoursesRow(row)}
                          sx={{ minHeight: TAP, textTransform: "none", fontWeight: 700 }}
                        >
                          {t("adminPeoplePhone.moreCourses", { count: assignedForDisplay(row).length - 3 })}
                        </Button>
                      )}
                    </Box>
                  ) : (
                    "-"
                  )}
                </CardFact>
              )}
              {activeTab === "rejected" && (
                <>
                  <CardFact label={t("adminInstructors.columns.reviewedAt")}>{formatDate(row.pending_reviewed_at)}</CardFact>
                  <CardFact label={t("adminInstructors.columns.rejectionReason")}>
                    {row.pending_rejection_reason?.trim() || "-"}
                  </CardFact>
                </>
              )}
            </Stack>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5 }}>
              {row.instructor_cv_url && (
                <Button
                  variant="outlined"
                  component="a"
                  href={row.instructor_cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<IconWrapper icon="mdi:file-pdf-box" size={16} />}
                  sx={{ ...SHEET_BUTTON_SX, minHeight: TAP, flex: "1 1 100%", color: "var(--accent-indigo)" }}
                >
                  View CV
                </Button>
              )}
              {renderPhoneActions(row)}
            </Box>
          </Paper>
        ))
      )}
    </Stack>
  );

  // Shared by the desktop Dialog and the phone sheet, so the two cannot drift apart.
  const saveCode = async () => {
    if (!codeRow) return;
    setSavingCode(true);
    try {
      const res = await instructorService.setInstructorCode(codeRow.id, codeValue.trim());
      setCodeById((m) => ({ ...m, [codeRow.id]: res.instructor_code }));
      showToast("Instructor code updated.", "success");
      setCodeRow(null);
    } catch (err: unknown) {
      showToast(readApiError(err, "Couldn't update the code."), "error");
    } finally {
      setSavingCode(false);
    }
  };

  const codeBody = (
    <>
      <Typography sx={{ fontSize: "0.85rem", color: "var(--font-secondary)", mb: 2 }}>
        Students see this code instead of the instructor&apos;s real name across courses and live sessions. Leave blank to clear it.
      </Typography>
      <TextField
        autoFocus fullWidth size="small" label="Instructor code"
        value={codeValue} onChange={(e) => setCodeValue(e.target.value)}
        placeholder="e.g. RM-07" inputProps={{ maxLength: 32 }}
        sx={PHONE_FIELD_SX}
      />
    </>
  );

  const approveBody = (
    <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
      {t("adminInstructors.confirm.approveBody", {
        name: confirmApproveRow?.full_name ?? "",
        email: confirmApproveRow?.email ?? "",
      })}
    </Typography>
  );

  const rejectBody = (
    <>
      <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 2 }}>
        {t("adminInstructors.confirm.rejectBody", {
          name: confirmRejectRow?.full_name ?? "",
          email: confirmRejectRow?.email ?? "",
        })}
      </Typography>
      <TextField
        label={t("adminInstructors.confirm.reasonLabel")}
        value={rejectReason}
        onChange={(e) => setRejectReason(e.target.value)}
        fullWidth
        multiline
        minRows={3}
        disabled={busyId !== null}
      />
    </>
  );

  const reopenBody = (
    <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
      {t("adminInstructors.confirm.reopenBody", {
        name: confirmReopenRow?.full_name ?? "",
        email: confirmReopenRow?.email ?? "",
      })}
    </Typography>
  );

  const removeMessage = `This removes ${removeRow?.full_name || "this person"} as an instructor — their role goes back to student, their instructor code is cleared, and all their course/cohort/live-session assignments are removed. Their account and learning data are kept.`;

  const removeInstructor = async () => {
    if (!removeRow) return;
    setRemoving(true);
    try {
      await adminInstructorsService.removeInstructor(removeRow.id);
      showToast(`${removeRow.full_name || "Instructor"} is no longer an instructor.`, "success");
      setRemoveRow(null);
      await refreshAll();
      await loadCodes();
    } catch (err: unknown) {
      showToast(readApiError(err, "Couldn't remove this instructor."), "error");
    } finally {
      setRemoving(false);
    }
  };

  const assignPicker = (intro: ReactNode) => (
    <>
    <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 2 }}>
      {intro}
    </Typography>

    {coursesLoading ? (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    ) : allCourses.length === 0 ? (
      <Stack alignItems="center" spacing={1.5} sx={{ py: 4 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor:
              "color-mix(in srgb, var(--accent-indigo) 8%, var(--surface) 92%)",
            color: "var(--accent-indigo)",
          }}
        >
          <IconWrapper icon="mdi:book-off-outline" size={28} />
        </Box>
        <Typography sx={{ color: "var(--font-secondary)" }}>
          {t("adminInstructors.assignDialog.noCourses")}
        </Typography>
      </Stack>
    ) : (
      <>
        <TextField
          size="small"
          fullWidth
          placeholder={
            t("adminInstructors.assignDialog.searchPlaceholder") as string
          }
          value={courseSearch}
          onChange={(e) => setCourseSearch(e.target.value)}
          sx={{ mb: 1.5, ...PHONE_FIELD_SX }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconWrapper icon="mdi:magnify" size={18} />
              </InputAdornment>
            ),
          }}
        />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 0.5,
            pb: 0.5,
          }}
        >
          <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
            {t("adminInstructors.assignDialog.selectedCount", {
              count: selectedKeys.length,
            })}
          </Typography>
          <Button
            size="small"
            onClick={toggleAllFiltered}
            sx={{ textTransform: "none", [PHONE]: { minHeight: TAP } }}
          >
            {allFilteredSelected
              ? t("adminInstructors.assignDialog.clearAll")
              : t("adminInstructors.assignDialog.selectAll")}
          </Button>
        </Box>
        <Divider sx={{ mb: 1 }} />
        <Stack
          sx={{
            maxHeight: 320,
            overflowY: "auto",
            "& .MuiFormControlLabel-root": {
              m: 0,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              "&:hover": {
                backgroundColor:
                  "color-mix(in srgb, var(--accent-indigo) 6%, var(--surface) 94%)",
              },
            },
          }}
        >
          {filteredAssignCourses.length === 0 ? (
            <Typography
              sx={{
                color: "var(--font-secondary)",
                textAlign: "center",
                py: 3,
              }}
            >
              {t("adminInstructors.noMatch")}
            </Typography>
          ) : (
            filteredAssignCourses.map((c) => {
              const key = courseKey(c);
              const checked = selectedKeys.includes(key);
              return (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox
                      checked={checked}
                      onChange={(_, v) => {
                        setSelectedKeys((prev) =>
                          v ? [...prev, key] : prev.filter((k) => k !== key)
                        );
                      }}
                    />
                  }
                  label={
                    <ListItemText
                      primary={c.title}
                      primaryTypographyProps={{
                        sx: { color: "var(--font-primary)" },
                      }}
                    />
                  }
                />
              );
            })
          )}
        </Stack>
      </>
    )}
    </>
  );

  const viewBody = (
    <>
    {viewCoursesRow && assignedForDisplay(viewCoursesRow).length > 0 ? (
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ rowGap: 0.5 }}>
        {assignedForDisplay(viewCoursesRow).map((c) => (
          <Chip
            key={courseKey(c)}
            label={c.title}
            size="small"
            sx={{
              backgroundColor:
                "color-mix(in srgb, var(--accent-indigo) 10%, var(--surface) 90%)",
              color: "var(--accent-indigo)",
              fontWeight: 500,
            }}
          />
        ))}
      </Stack>
    ) : (
      <Stack alignItems="center" spacing={1.5} sx={{ py: 3 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor:
              "color-mix(in srgb, var(--accent-indigo) 8%, var(--surface) 92%)",
            color: "var(--accent-indigo)",
          }}
        >
          <IconWrapper icon="mdi:book-off-outline" size={28} />
        </Box>
        <Typography sx={{ color: "var(--font-secondary)" }}>
          {t("adminInstructors.viewCourses.noCourses")}
        </Typography>
      </Stack>
    )}
    </>
  );

  return (
    <PageShell maxWidth={1200}>
      <ModulePageHeader
        eyebrow="People"
        title="Instructors"
        description="Add instructors and manage their access."
        accent="indigo"
        icon="mdi:account-tie"
        action={
          <HeaderActionButton icon="mdi:account-plus-outline" onClick={() => setAddOpen(true)}>
            Add instructor
          </HeaderActionButton>
        }
      />

      <AddInstructorDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        // A newly created instructor lands approved, so refresh that tab rather than the one the
        // admin happens to be looking at.
        onSuccess={() => {
          setActiveTab("approved");
          void loadStatus("approved");
        }}
      />

      {/* Status quick-stats (click to switch tab) */}
      <Box
        data-tour-id="instructors-stats"
        sx={{
          display: "flex",
          justifyContent: { xs: "stretch", md: "flex-end" },
          mb: 2.5,
        }}
      >
            <Stack
              direction="row"
              spacing={1.25}
              sx={{
                width: { xs: "100%", md: "auto" },
                flexShrink: 0,
              }}
            >
              {STATUS_TABS.map((s) => {
                const v = STATUS_VISUAL[s];
                return (
                  <Paper
                    key={s}
                    elevation={0}
                    onClick={() => setActiveTab(s)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActiveTab(s);
                      }
                    }}
                    sx={{
                      flex: { xs: 1, md: "0 0 auto" },
                      minWidth: { md: 116 },
                      px: 1.5,
                      py: 1.25,
                      borderRadius: 2,
                      cursor: "pointer",
                      border: `1px solid ${
                        activeTab === s ? v.accent : "var(--border-default)"
                      }`,
                      backgroundColor:
                        activeTab === s ? v.tint : "var(--surface)",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        backgroundColor: v.tint,
                        borderColor: v.accent,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        color: v.accent,
                        mb: 0.25,
                      }}
                    >
                      <IconWrapper icon={v.icon} size={16} />
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 600, fontSize: "0.7rem", [PHONE]: { fontSize: "0.75rem" } }}
                      >
                        {t(`adminInstructors.stats.${s}`)}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        color: "var(--font-primary)",
                        fontWeight: 700,
                        fontSize: "1.25rem",
                        lineHeight: 1.1,
                      }}
                    >
                      {loadingByStatus[s] && dataByStatus[s] === null
                        ? "-"
                        : counts[s]}
                    </Typography>
                  </Paper>
                );
              })}
            </Stack>
      </Box>

        {/* Tabs */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            gap: 1.5,
            mb: 1.5,
          }}
        >
          <Tabs
            data-tour-id="instructors-tabs"
            value={activeTab}
            onChange={(_, v: InstructorListStatus) => {
              setActiveTab(v);
              setSearchTerm("");
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 40,
              "& .MuiTab-root": {
                textTransform: "none",
                minHeight: 40,
                fontWeight: 600,
                color: "var(--font-secondary)",
                "&.Mui-selected": { color: "var(--accent-indigo)" },
                [PHONE]: { minHeight: 48 },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "var(--accent-indigo)",
                height: 3,
                borderRadius: 2,
              },
            }}
          >
            {STATUS_TABS.map((s) => (
              <Tab
                key={s}
                value={s}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {t(`adminInstructors.tabs.${s}`)}
                    <Badge
                      badgeContent={
                        loadingByStatus[s] && dataByStatus[s] === null
                          ? 0
                          : counts[s]
                      }
                      showZero
                      sx={{
                        "& .MuiBadge-badge": {
                          position: "static",
                          transform: "none",
                          backgroundColor:
                            activeTab === s
                              ? "color-mix(in srgb, var(--accent-indigo) 16%, var(--surface) 84%)"
                              : "var(--surface)",
                          color:
                            activeTab === s
                              ? "var(--accent-indigo)"
                              : "var(--font-secondary)",
                          border: "1px solid var(--border-default)",
                          minWidth: 22,
                          height: 20,
                          fontWeight: 700,
                          fontSize: "0.7rem",
                          [PHONE]: { fontSize: "0.75rem" },
                        },
                      }}
                    />
                  </Box>
                }
              />
            ))}
          </Tabs>

          <TextField
            data-tour-id="instructors-search"
            size="small"
            placeholder={t("adminInstructors.searchPlaceholder") as string}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              minWidth: { xs: "100%", sm: 280 },
              "& .MuiInputBase-root": {
                backgroundColor: "var(--card-bg)",
                borderRadius: 2,
              },
              [PHONE]: { "& .MuiInputBase-root": { minHeight: 48 } },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconWrapper icon="mdi:magnify" size={20} />
                </InputAdornment>
              ),
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm("")} sx={phoneIconButtonSx}>
                    <IconWrapper icon="mdi:close" size={16} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <InstructorFilterBar
            tab={activeTab}
            filters={filters}
            onChange={setFilters}
            courseChoices={courseChoices}
            shownCount={visibleRows.length}
            totalCount={tabRows.length}
          />
        </Box>

        <InstructorBulkBar
          count={selectedIds.length}
          actions={bulkActions}
          onClear={() => setSelectedIds([])}
          progress={bulkProgress}
        />

        {/* Table on desktop; one card per instructor on a phone. */}
        {isPhone ? phoneCards : (
        <TableContainer
          data-tour-id="instructors-table"
          component={Paper}
          elevation={0}
          sx={{
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--card-bg)",
            borderRadius: 2,
          }}
        >
          <Table size="small">
            <TableHead
              sx={{
                backgroundColor:
                  "color-mix(in srgb, var(--surface) 70%, var(--card-bg) 30%)",
              }}
            >
              <TableRow>
                <TableCell
                  padding="checkbox"
                  sx={{ borderColor: "var(--border-default)" }}
                >
                  {/* Selects the FILTERED rows, not the whole tab. "Reject all" after
                      narrowing to 3 must mean those 3. */}
                  <Checkbox
                    size="small"
                    checked={allVisibleSelected}
                    indeterminate={someVisibleSelected}
                    onChange={toggleAllVisible}
                    disabled={visibleRows.length === 0 || bulkProgress !== null}
                    inputProps={{
                      "aria-label": t("adminInstructors.bulk.selectAll", {
                        defaultValue: "Select all instructors shown",
                      }) as string,
                    }}
                  />
                </TableCell>
                {columns.map((c, i) => (
                  <TableCell
                    key={c + i}
                    align={i === columns.length - 1 ? "right" : "left"}
                    sx={{
                      color: "var(--font-secondary)",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      borderColor: "var(--border-default)",
                    }}
                  >
                    {c}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (dataByStatus[activeTab]?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : visibleRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 8 }}>
                    {emptyState}
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    selected={selectedIds.includes(row.id)}
                    sx={{
                      "& td": { borderColor: "var(--border-default)" },
                      "&:hover": {
                        backgroundColor:
                          "color-mix(in srgb, var(--surface) 70%, var(--card-bg) 30%)",
                      },
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => toggleRow(row.id)}
                        disabled={bulkProgress !== null}
                        inputProps={{
                          "aria-label": t("adminInstructors.bulk.selectOne", {
                            defaultValue: `Select ${row.full_name || row.email}`,
                            name: row.full_name || row.email,
                          }) as string,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            backgroundColor: avatarColorFor(row.email || row.full_name),
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "0.8125rem",
                          }}
                        >
                          {getInitials(row.full_name, row.email)}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              color: "var(--font-primary)",
                              fontWeight: 600,
                              fontSize: "0.875rem",
                              lineHeight: 1.2,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {row.full_name || row.email}
                          </Typography>
                          <Typography
                            sx={{
                              color: "var(--font-secondary)",
                              fontSize: "0.75rem",
                              lineHeight: 1.3,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {row.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ color: "var(--font-secondary)" }}>
                      {row.phone_number || "-"}
                    </TableCell>
                    <TableCell sx={{ color: "var(--font-secondary)" }}>
                      {formatDate(row.created_at)}
                    </TableCell>
                    <TableCell>
                      {row.instructor_cv_url ? (
                        <Button
                          size="small"
                          variant="outlined"
                          component="a"
                          href={row.instructor_cv_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          startIcon={
                            <IconWrapper icon="mdi:file-pdf-box" size={16} />
                          }
                          sx={{
                            textTransform: "none",
                            color: "var(--accent-indigo)",
                            borderColor:
                              "color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
                            "&:hover": {
                              borderColor: "var(--accent-indigo)",
                              backgroundColor:
                                "color-mix(in srgb, var(--accent-indigo) 8%, transparent)",
                            },
                          }}
                        >
                          View CV
                        </Button>
                      ) : (
                        <Typography
                          sx={{
                            color: "var(--font-secondary)",
                            fontSize: "0.8125rem",
                          }}
                        >
                          -
                        </Typography>
                      )}
                    </TableCell>
                    {activeTab === "approved" && (
                      <TableCell>
                        {assignedForDisplay(row).length > 0 ? (
                          <Stack
                            direction="row"
                            spacing={0.5}
                            flexWrap="wrap"
                            useFlexGap
                            sx={{ rowGap: 0.5 }}
                          >
                            {assignedForDisplay(row).slice(0, 3).map((c) => (
                              <Chip
                                key={courseKey(c)}
                                label={c.title}
                                size="small"
                                sx={{
                                  backgroundColor:
                                    "color-mix(in srgb, var(--accent-indigo) 10%, var(--surface) 90%)",
                                  color: "var(--accent-indigo)",
                                  fontWeight: 500,
                                  maxWidth: 200,
                                }}
                              />
                            ))}
                            {assignedForDisplay(row).length > 3 && (
                              <Chip
                                size="small"
                                variant="outlined"
                                label={`+${assignedForDisplay(row).length - 3}`}
                                onClick={() => setViewCoursesRow(row)}
                                sx={{ cursor: "pointer" }}
                              />
                            )}
                          </Stack>
                        ) : (
                          <Typography sx={{ color: "var(--font-secondary)", fontSize: "0.8125rem" }}>
                            -
                          </Typography>
                        )}
                      </TableCell>
                    )}
                    {activeTab === "rejected" && (
                      <>
                        <TableCell sx={{ color: "var(--font-secondary)" }}>
                          {formatDate(row.pending_reviewed_at)}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: "var(--font-secondary)",
                            maxWidth: 260,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Tooltip title={row.pending_rejection_reason || ""}>
                            <span>{row.pending_rejection_reason?.trim() || "-"}</span>
                          </Tooltip>
                        </TableCell>
                      </>
                    )}
                    <TableCell align="right">{renderActions(row)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        )}

        {/* Approved-row actions menu */}
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
          <MenuItem
            onClick={() => {
              if (menuRow) setViewCoursesRow(menuRow);
              closeMenu();
            }}
          >
            <IconWrapper icon="mdi:book-open-variant" size={18} />
            <Box sx={{ ml: 1 }}>{t("adminInstructors.actions.viewCourses")}</Box>
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (menuRow) { setCodeValue(codeById[menuRow.id] || ""); setCodeRow(menuRow); }
              closeMenu();
            }}
          >
            <IconWrapper icon="mdi:shield-key-outline" size={18} />
            <Box sx={{ ml: 1 }}>Set instructor code</Box>
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (menuRow) setRemoveRow(menuRow);
              closeMenu();
            }}
            sx={{ color: "#ef4444" }}
          >
            <IconWrapper icon="mdi:account-remove-outline" size={18} />
            <Box sx={{ ml: 1 }}>Remove as instructor</Box>
          </MenuItem>
        </Menu>

        {/* Set instructor code */}
        {isPhone ? (
          <PhoneSheet
            open={!!codeRow}
            onClose={() => setCodeRow(null)}
            busy={savingCode}
            title="Set instructor code"
            cancelLabel="Cancel"
            confirmLabel={savingCode ? "Saving…" : "Save code"}
            onConfirm={() => void saveCode()}
          >
            {codeBody}
          </PhoneSheet>
        ) : (
        <Dialog open={!!codeRow} onClose={() => (savingCode ? undefined : setCodeRow(null))} fullWidth maxWidth="xs">
          <DialogTitle sx={{ fontWeight: 800 }}>Set instructor code</DialogTitle>
          <DialogContent>
            {codeBody}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setCodeRow(null)} disabled={savingCode} sx={{ textTransform: "none", fontWeight: 700 }}>Cancel</Button>
            <Button
              variant="contained" disabled={savingCode}
              onClick={saveCode}
              sx={{ textTransform: "none", fontWeight: 800 }}
            >
              {savingCode ? "Saving…" : "Save code"}
            </Button>
          </DialogActions>
        </Dialog>
        )}

        {/* Remove instructor (demote) */}
        {isPhone ? (
          <PhoneSheet
            open={!!removeRow}
            onClose={() => setRemoveRow(null)}
            busy={removing}
            title="Remove as instructor?"
            cancelLabel="Cancel"
            confirmLabel={removing ? "Removing…" : "Remove instructor"}
            confirmColor="error"
            onConfirm={() => void removeInstructor()}
          >
            <Typography sx={{ color: "var(--font-secondary)", lineHeight: 1.6, fontSize: "0.95rem" }}>
              {removeMessage}
            </Typography>
          </PhoneSheet>
        ) : (
        <ConfirmDialog
          open={!!removeRow}
          title="Remove as instructor?"
          message={removeMessage}
          confirmText={removing ? "Removing…" : "Remove instructor"}
          cancelText="Cancel"
          confirmColor="error"
          onCancel={() => (removing ? undefined : setRemoveRow(null))}
          onConfirm={removeInstructor}
        />
        )}

        {/* Approve dialog */}
        {isPhone ? (
          <PhoneSheet
            open={Boolean(confirmApproveRow)}
            onClose={() => setConfirmApproveRow(null)}
            busy={busyId !== null}
            title={t("adminInstructors.confirm.approveTitle")}
            cancelLabel={t("adminInstructors.confirm.cancel")}
            confirmLabel={busyId !== null ? t("adminInstructors.loading.approving") : t("adminInstructors.confirm.approveCta")}
            onConfirm={() => void handleApproveConfirmed()}
          >
            {approveBody}
          </PhoneSheet>
        ) : (
        <Dialog
          open={Boolean(confirmApproveRow)}
          onClose={() => busyId === null && setConfirmApproveRow(null)}
          PaperProps={{
            sx: { backgroundColor: "var(--card-bg)", borderRadius: 3 },
          }}
        >
          <DialogTitle
            sx={{ display: "flex", alignItems: "center", gap: 1.5, pr: 6 }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: STATUS_VISUAL.approved.tint,
                color: STATUS_VISUAL.approved.accent,
              }}
            >
              <IconWrapper icon="mdi:check-circle-outline" size={22} />
            </Box>
            {t("adminInstructors.confirm.approveTitle")}
          </DialogTitle>
          <DialogContent>
            {approveBody}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setConfirmApproveRow(null)}
              disabled={busyId !== null}
              sx={{ color: "var(--font-secondary)", textTransform: "none" }}
            >
              {t("adminInstructors.confirm.cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={() => void handleApproveConfirmed()}
              disabled={busyId !== null}
              sx={{
                backgroundColor: "var(--accent-indigo)",
                color: "var(--font-light)",
                textTransform: "none",
                "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
              }}
            >
              {busyId !== null
                ? t("adminInstructors.loading.approving")
                : t("adminInstructors.confirm.approveCta")}
            </Button>
          </DialogActions>
        </Dialog>
        )}

        {/* Reject dialog */}
        {isPhone ? (
          <PhoneSheet
            open={Boolean(confirmRejectRow)}
            onClose={() => setConfirmRejectRow(null)}
            busy={busyId !== null}
            title={t("adminInstructors.confirm.rejectTitle")}
            cancelLabel={t("adminInstructors.confirm.cancel")}
            confirmLabel={busyId !== null ? t("adminInstructors.loading.rejecting") : t("adminInstructors.confirm.rejectCta")}
            confirmColor="error"
            onConfirm={() => void handleRejectConfirmed()}
          >
            {rejectBody}
          </PhoneSheet>
        ) : (
        <Dialog
          open={Boolean(confirmRejectRow)}
          onClose={() => busyId === null && setConfirmRejectRow(null)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: { backgroundColor: "var(--card-bg)", borderRadius: 3 },
          }}
        >
          <DialogTitle
            sx={{ display: "flex", alignItems: "center", gap: 1.5, pr: 6 }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: STATUS_VISUAL.rejected.tint,
                color: STATUS_VISUAL.rejected.accent,
              }}
            >
              <IconWrapper icon="mdi:close-circle-outline" size={22} />
            </Box>
            {t("adminInstructors.confirm.rejectTitle")}
          </DialogTitle>
          <DialogContent>
            {rejectBody}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setConfirmRejectRow(null)}
              disabled={busyId !== null}
              sx={{ color: "var(--font-secondary)", textTransform: "none" }}
            >
              {t("adminInstructors.confirm.cancel")}
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => void handleRejectConfirmed()}
              disabled={busyId !== null}
              sx={{ textTransform: "none" }}
            >
              {busyId !== null
                ? t("adminInstructors.loading.rejecting")
                : t("adminInstructors.confirm.rejectCta")}
            </Button>
          </DialogActions>
        </Dialog>
        )}

        {/* Reopen dialog */}
        {isPhone ? (
          <PhoneSheet
            open={Boolean(confirmReopenRow)}
            onClose={() => setConfirmReopenRow(null)}
            busy={busyId !== null}
            title={t("adminInstructors.confirm.reopenTitle")}
            cancelLabel={t("adminInstructors.confirm.cancel")}
            confirmLabel={busyId !== null ? t("adminInstructors.loading.reopening") : t("adminInstructors.confirm.reopenCta")}
            onConfirm={() => void handleReopenConfirmed()}
          >
            {reopenBody}
          </PhoneSheet>
        ) : (
        <Dialog
          open={Boolean(confirmReopenRow)}
          onClose={() => busyId === null && setConfirmReopenRow(null)}
          PaperProps={{
            sx: { backgroundColor: "var(--card-bg)", borderRadius: 3 },
          }}
        >
          <DialogTitle
            sx={{ display: "flex", alignItems: "center", gap: 1.5, pr: 6 }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: STATUS_VISUAL.pending.tint,
                color: STATUS_VISUAL.pending.accent,
              }}
            >
              <IconWrapper icon="mdi:refresh" size={22} />
            </Box>
            {t("adminInstructors.confirm.reopenTitle")}
          </DialogTitle>
          <DialogContent>
            {reopenBody}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setConfirmReopenRow(null)}
              disabled={busyId !== null}
              sx={{ color: "var(--font-secondary)", textTransform: "none" }}
            >
              {t("adminInstructors.confirm.cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={() => void handleReopenConfirmed()}
              disabled={busyId !== null}
              sx={{ textTransform: "none" }}
            >
              {busyId !== null
                ? t("adminInstructors.loading.reopening")
                : t("adminInstructors.confirm.reopenCta")}
            </Button>
          </DialogActions>
        </Dialog>
        )}

        {/* Assign courses dialog */}
        {isPhone ? (
          <PhoneSheet
            open={Boolean(assignRow)}
            onClose={() => setAssignRow(null)}
            busy={busyId !== null}
            title={t("adminInstructors.assignDialog.title", { name: assignRow?.full_name ?? "" })}
            cancelLabel={t("adminInstructors.confirm.cancel")}
            confirmLabel={busyId !== null ? t("adminInstructors.loading.assigning") : t("adminInstructors.assignDialog.save")}
            confirmDisabled={coursesLoading}
            onConfirm={() => void handleAssignSave()}
          >
            {assignPicker(t("adminInstructors.assignDialog.body"))}
          </PhoneSheet>
        ) : (
        <Dialog
          open={Boolean(assignRow)}
          onClose={() => busyId === null && setAssignRow(null)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: { backgroundColor: "var(--card-bg)", borderRadius: 3 },
          }}
        >
          <DialogTitle
            sx={{ display: "flex", alignItems: "center", gap: 1.5, pr: 6 }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor:
                  "color-mix(in srgb, var(--accent-indigo) 16%, var(--surface) 84%)",
                color: "var(--accent-indigo)",
              }}
            >
              <IconWrapper icon="mdi:book-plus-multiple-outline" size={22} />
            </Box>
            {t("adminInstructors.assignDialog.title", { name: assignRow?.full_name ?? "" })}
          </DialogTitle>
          <DialogContent>
            {assignPicker(t("adminInstructors.assignDialog.body"))}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setAssignRow(null)}
              disabled={busyId !== null}
              sx={{ color: "var(--font-secondary)", textTransform: "none" }}
            >
              {t("adminInstructors.confirm.cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={() => void handleAssignSave()}
              disabled={busyId !== null || coursesLoading}
              sx={{
                backgroundColor: "var(--accent-indigo)",
                color: "var(--font-light)",
                textTransform: "none",
                "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
              }}
            >
              {busyId !== null
                ? t("adminInstructors.loading.assigning")
                : t("adminInstructors.assignDialog.save")}
            </Button>
          </DialogActions>
        </Dialog>
        )}

        {/* View courses dialog */}
        {isPhone ? (
          <PhoneSheet
            open={Boolean(viewCoursesRow)}
            onClose={() => setViewCoursesRow(null)}
            busy={false}
            title={t("adminInstructors.viewCourses.title", { name: viewCoursesRow?.full_name ?? "" })}
            cancelLabel={t("adminInstructors.confirm.cancel")}
          >
            {viewBody}
          </PhoneSheet>
        ) : (
        <Dialog
          open={Boolean(viewCoursesRow)}
          onClose={() => setViewCoursesRow(null)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: { backgroundColor: "var(--card-bg)", borderRadius: 3 },
          }}
        >
          <DialogTitle
            sx={{ display: "flex", alignItems: "center", gap: 1.5, pr: 6 }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor:
                  "color-mix(in srgb, var(--accent-indigo) 16%, var(--surface) 84%)",
                color: "var(--accent-indigo)",
              }}
            >
              <IconWrapper icon="mdi:book-open-variant" size={22} />
            </Box>
            {t("adminInstructors.viewCourses.title", {
              name: viewCoursesRow?.full_name ?? "",
            })}
          </DialogTitle>
          <DialogContent>
            {viewBody}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setViewCoursesRow(null)}
              sx={{ textTransform: "none" }}
            >
              {t("adminInstructors.confirm.cancel")}
            </Button>
          </DialogActions>
        </Dialog>
        )}

        {/* ---- Bulk confirmations -------------------------------------------------
            One ConfirmDialog for the three actions that need nothing but a yes, each
            naming the count, because "Approve" on a toolbar is the one place an admin
            cannot see how many rows they are about to change. */}
        <ConfirmDialog
          open={bulkConfirm !== null}
          title={
            bulkConfirm === "approve"
              ? t("adminInstructors.bulk.confirmApproveTitle", {
                  defaultValue: `Approve ${selectedIds.length} instructors?`,
                  n: selectedIds.length,
                })
              : bulkConfirm === "reopen"
                ? t("adminInstructors.bulk.confirmReopenTitle", {
                    defaultValue: `Reopen ${selectedIds.length} applications?`,
                    n: selectedIds.length,
                  })
                : t("adminInstructors.bulk.confirmRemoveTitle", {
                    defaultValue: `Remove ${selectedIds.length} instructors?`,
                    n: selectedIds.length,
                  })
          }
          message={
            bulkConfirm === "approve"
              ? t("adminInstructors.bulk.confirmApproveBody", {
                  defaultValue:
                    "They will be able to sign in and will appear to students as instructors.",
                })
              : bulkConfirm === "reopen"
                ? t("adminInstructors.bulk.confirmReopenBody", {
                    defaultValue:
                      "Each application goes back to the pending queue for review.",
                  })
                : t("adminInstructors.bulk.confirmRemoveBody", {
                    defaultValue:
                      "Each one becomes a student again and loses their instructor code and every course assignment. Their account is not deleted.",
                  })
          }
          confirmText={
            bulkConfirm === "approve"
              ? t("adminInstructors.bulk.approve", { defaultValue: "Approve" })
              : bulkConfirm === "reopen"
                ? t("adminInstructors.bulk.reopen", { defaultValue: "Reopen" })
                : t("adminInstructors.bulk.removeInstructor", {
                    defaultValue: "Remove as instructor",
                  })
          }
          cancelText={t("adminInstructors.confirm.cancel")}
          confirmColor={bulkConfirm === "remove" ? "error" : "primary"}
          busy={bulkProgress !== null}
          onCancel={() => setBulkConfirm(null)}
          onConfirm={() => {
            const which = bulkConfirm;
            setBulkConfirm(null);
            if (which === "approve") void bulkApprove();
            else if (which === "reopen") void bulkReopen();
            else if (which === "remove") void bulkRemove();
          }}
        />

        {/* ---- Bulk reject, which carries one shared reason --------------------- */}
        <Dialog
          open={bulkRejectOpen}
          onClose={() => setBulkRejectOpen(false)}
          fullWidth
          maxWidth="xs"
          PaperProps={{ sx: { backgroundColor: "var(--card-bg)", borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>
            {t("adminInstructors.bulk.confirmRejectTitle", {
              defaultValue: `Reject ${selectedIds.length} instructors?`,
              n: selectedIds.length,
            })}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 2 }}>
              {t("adminInstructors.bulk.confirmRejectBody", {
                defaultValue:
                  "The same reason is recorded against every one of them, so keep it general.",
              })}
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              value={bulkRejectReason}
              onChange={(e) => setBulkRejectReason(e.target.value)}
              placeholder={
                t("adminInstructors.confirm.rejectReasonPlaceholder", {
                  defaultValue: "Reason (optional)",
                }) as string
              }
              sx={PHONE_FIELD_SX}
              inputProps={{ "data-testid": "bulk-reject-reason" }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setBulkRejectOpen(false)}
              sx={{ color: "var(--font-secondary)", textTransform: "none" }}
            >
              {t("adminInstructors.confirm.cancel")}
            </Button>
            <Button
              variant="contained"
              color="error"
              data-testid="bulk-reject-confirm"
              onClick={() => {
                const reason = bulkRejectReason.trim();
                setBulkRejectOpen(false);
                void bulkReject(reason);
              }}
              sx={{ textTransform: "none" }}
            >
              {t("adminInstructors.bulk.reject", { defaultValue: "Reject" })}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ---- Bulk course assignment ------------------------------------------
            Add or remove, never replace. The mode is a visible choice rather than a
            hidden default, because "Assign courses" over a selection is ambiguous in
            exactly the way that loses data. */}
        <Dialog
          open={bulkAssignOpen}
          onClose={() => setBulkAssignOpen(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{ sx: { backgroundColor: "var(--card-bg)", borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>
            {t("adminInstructors.bulk.assignTitle", {
              defaultValue: `Courses for ${selectedIds.length} instructors`,
              n: selectedIds.length,
            })}
          </DialogTitle>
          <DialogContent>
            <TextField
              select
              fullWidth
              size="small"
              label={t("adminInstructors.bulk.mode", { defaultValue: "What to do" })}
              value={bulkAssignMode}
              onChange={(e) => setBulkAssignMode(e.target.value as "add" | "remove")}
              sx={{ mb: 2, ...PHONE_FIELD_SX }}
              inputProps={{ "data-testid": "bulk-assign-mode" }}
            >
              <MenuItem value="add">
                {t("adminInstructors.bulk.modeAdd", {
                  defaultValue: "Add these courses (keeps what they already have)",
                })}
              </MenuItem>
              <MenuItem value="remove">
                {t("adminInstructors.bulk.modeRemove", {
                  defaultValue: "Remove these courses",
                })}
              </MenuItem>
            </TextField>
            {assignPicker(
              bulkAssignMode === "add"
                ? t("adminInstructors.bulk.assignBodyAdd", {
                    defaultValue:
                      "Every instructor selected gets these courses on top of their current assignments. Nothing is taken away.",
                  })
                : t("adminInstructors.bulk.assignBodyRemove", {
                    defaultValue:
                      "These courses are taken off every instructor selected. Their other assignments are left alone.",
                  })
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setBulkAssignOpen(false)}
              sx={{ color: "var(--font-secondary)", textTransform: "none" }}
            >
              {t("adminInstructors.confirm.cancel")}
            </Button>
            <Button
              variant="contained"
              color={bulkAssignMode === "remove" ? "error" : "primary"}
              disabled={selectedKeys.length === 0}
              data-testid="bulk-assign-confirm"
              onClick={() => {
                const mode = bulkAssignMode;
                setBulkAssignOpen(false);
                void bulkAssignCourses(mode);
              }}
              sx={{ textTransform: "none" }}
            >
              {bulkAssignMode === "add"
                ? t("adminInstructors.bulk.applyAdd", {
                    defaultValue: `Add to ${selectedIds.length}`,
                    n: selectedIds.length,
                  })
                : t("adminInstructors.bulk.applyRemove", {
                    defaultValue: `Remove from ${selectedIds.length}`,
                    n: selectedIds.length,
                  })}
            </Button>
          </DialogActions>
        </Dialog>
    </PageShell>
  );
}
