"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Checkbox, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { adminStudentService, type Student } from "@/lib/services/admin/admin-student.service";
import { useSeq } from "@/lib/jobs-v2/useSeq";
import {
  CountPill,
  EmptyState,
  ErrorState,
  J,
  JAvatar,
  JButton,
  JModal,
  JPagination,
  JSelect,
  MOTION,
  R,
  SearchInput,
  TYPE,
  focusRing,
} from "@/components/jobs-v2/ui";
import { AudienceSummary } from "./form/AudienceSummary";

const PAGE_SIZES = [20, 50, 100];

/** The shape the job form keeps for each curated learner. */
export interface SelectedStudent {
  id: number;
  name: string;
  email: string;
}

export interface SelectStudentsDialogProps {
  open: boolean;
  /** Currently curated students; pre-checked and preserved across searches. */
  initialSelected: SelectedStudent[];
  /** Ids already saved on the server, so a "New" pill can mark genuine additions. */
  alreadyAssignedIds?: number[];
  /**
   * The rest of the job's targeting, so this dialog renders the SAME audience sentence as
   * step 4. The two used to contradict each other seconds apart: "Leave empty for all
   * students" under courses vs "Only the students you pick will see this opening" here.
   */
  audience?: {
    courseTitles: string[];
    adaptiveTitles: string[];
    collegeNames: string[];
    published?: boolean;
  };
  onClose: () => void;
  onConfirm: (students: SelectedStudent[]) => void;
}

/**
 * Search the tenant's learners and pick one or many to curate a job for.
 *
 * Selection is a Map, not a Set of ids: a student picked on page 1 must survive a search that
 * pages them out of view, and we still need their name and email to render the chip afterwards.
 * The dialog returns the selection; the job form owns the write.
 */
export function SelectStudentsDialog({
  open,
  initialSelected,
  alreadyAssignedIds = [],
  audience,
  onClose,
  onConfirm,
}: SelectStudentsDialogProps) {
  const { t } = useTranslation("common");
  const seq = useSeq();

  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Map<number, SelectedStudent>>(new Map());
  const listRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(
    async (q: string, p: number, size: number) => {
      const token = seq.next();
      setLoading(true);
      setLoadError(null);
      try {
        const res = await adminStudentService.getManageStudents({
          search: q || undefined,
          role: "student",
          page: p,
          limit: size,
        });
        // The scraped queue's stale-response guard, extracted. Fast paging can otherwise
        // render an older page over a newer one.
        if (!seq.isCurrent(token)) return;
        setStudents(res.students ?? []);
        setTotalPages(res.pagination?.total_pages || 1);
        setTotal(res.pagination?.total_students ?? res.students?.length ?? 0);
      } catch (err) {
        if (!seq.isCurrent(token)) return;
        // Empty and error are SEPARATE. `No students match ""` used to render for an empty
        // query, for a tenant with zero students, and after a failed load alike.
        setLoadError((err as Error)?.message ?? (t("jobsV2.error.body") as string));
      } finally {
        if (seq.isCurrent(token)) setLoading(false);
      }
    },
    [seq, t],
  );

  // Seed from the form each time the dialog opens, so Cancel truly discards. ONE load: the
  // shipped version fired a seeding request and a debounced request 350ms apart.
  useEffect(() => {
    if (!open) return;
    setSearchInput("");
    setQuery("");
    setPage(1);
    setSelected(new Map(initialSelected.map((s) => [s.id, s])));
    void load("", 1, pageSize);
    // Re-seeding on `pageSize` or `load` would fight the operator mid-session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialSelected]);

  const runSearch = useCallback(
    (value: string) => {
      setQuery(value);
      setPage(1);
      void load(value, 1, pageSize);
    },
    [load, pageSize],
  );

  const goToPage = useCallback(
    (next: number) => {
      setPage(next);
      void load(query, next, pageSize);
    },
    [load, pageSize, query],
  );

  const changePageSize = useCallback(
    (size: number) => {
      setPageSize(size);
      setPage(1);
      void load(query, 1, size);
    },
    [load, query],
  );

  const toggle = useCallback((student: Student) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(student.id)) next.delete(student.id);
      else {
        next.set(student.id, {
          id: student.id,
          name: student.name || student.email,
          email: student.email,
        });
      }
      return next;
    });
  }, []);

  const chosen = useMemo(() => Array.from(selected.values()), [selected]);
  const assigned = useMemo(() => new Set(alreadyAssignedIds), [alreadyAssignedIds]);
  const newCount = useMemo(
    () => chosen.filter((s) => !assigned.has(s.id)).length,
    [assigned, chosen],
  );

  const pageIds = students.map((s) => s.id);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someOnPageSelected = pageIds.some((id) => selected.has(id)) && !allOnPageSelected;

  const toggleAllOnPage = () => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (allOnPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        students.forEach((s) =>
          next.set(s.id, { id: s.id, name: s.name || s.email, email: s.email }),
        );
      }
      return next;
    });
  };

  /** Roving focus inside the listbox: arrow keys move, Space and Enter toggle. */
  const onListKeyDown = (event: React.KeyboardEvent) => {
    const options = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [],
    );
    if (!options.length) return;
    const index = options.indexOf(document.activeElement as HTMLElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      options[Math.min(index + 1, options.length - 1)]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      options[Math.max(index - 1, 0)]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      options[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      options[options.length - 1]?.focus();
    }
  };

  const dirty = useMemo(() => {
    const before = new Set(initialSelected.map((s) => s.id));
    if (before.size !== selected.size) return true;
    for (const id of selected.keys()) if (!before.has(id)) return true;
    return false;
  }, [initialSelected, selected]);

  return (
    <JModal
      open={open}
      onClose={onClose}
      dirty={dirty}
      size="md"
      mobile="fullscreen"
      icon="mdi:account-multiple-plus-outline"
      eyebrow={t("jobsV2.form.targeting", "Targeting")}
      title={t("jobsV2.students.title", "Assign to specific students")}
      description={t(
        "jobsV2.students.description",
        "These learners see the job in addition to everyone your other targeting already reaches.",
      )}
      footer={
        <>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
            <JButton variant="ghost" onClick={onClose}>
              {t("jobsV2.modal.cancel")}
            </JButton>
            <Typography sx={{ ...TYPE.micro, minWidth: 0 }}>
              {newCount > 0
                ? t(
                    "jobsV2.students.emailNotice",
                    "{{count}} new student(s) will be emailed when this job is published.",
                    { count: newCount },
                  )
                : t("jobsV2.students.noNew", "No new students added.")}
            </Typography>
          </Box>
          <JButton variant="primary" onClick={() => onConfirm(chosen)}>
            {t("jobsV2.students.confirm", "Use these {{count}} student(s)", {
              count: chosen.length,
            })}
          </JButton>
        </>
      }
    >
      {audience && (
        <Box sx={{ mb: 2 }}>
          <AudienceSummary
            variant="inline"
            courseTitles={audience.courseTitles}
            adaptiveTitles={audience.adaptiveTitles}
            collegeNames={audience.collegeNames}
            studentCount={chosen.length}
            newStudentCount={newCount}
            published={audience.published}
          />
        </Box>
      )}

      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.25, mb: 2 }}>
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          onSubmit={runSearch}
          loading={loading}
          ariaLabel={t("jobsV2.students.search", "Search students by name or email")}
          placeholder={t("jobsV2.students.search", "Search students by name or email")}
          maxWidth={320}
        />
        <JSelect
          id="students-page-size"
          value={String(pageSize)}
          onChange={(value) => changePageSize(Number(value))}
          fullWidth={false}
          options={PAGE_SIZES.map((size) => ({
            value: String(size),
            label: t("jobsV2.students.perPage", "{{size}} per page", { size }),
          }))}
          sx={{ minWidth: 160 }}
        />
        <CountPill value={total} tone="azure" />
      </Box>

      {chosen.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ ...TYPE.label, mb: 0.75 }}>
            {t("jobsV2.students.selectedHeading", "Selected")}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {chosen.map((student) => {
              const isNew = !assigned.has(student.id);
              return (
                <Box
                  key={student.id}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    pl: 1,
                    pr: 0.5,
                    py: 0.5,
                    borderRadius: R.ctl,
                    border: `1px solid ${isNew ? J.azureBorder : J.hairline}`,
                    bgcolor: isNew ? J.azureSoft : J.surface2,
                    maxWidth: "100%",
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ ...TYPE.micro, color: J.ink, fontWeight: 700 }}>
                      {student.name}
                    </Typography>
                    {/* The email is a second LINE, not a `title` attribute: two students with
                        the same display name were indistinguishable without hovering. */}
                    <Typography sx={{ ...TYPE.mono, fontSize: "0.6875rem" }}>
                      {student.email}
                    </Typography>
                  </Box>
                  {isNew && (
                    <Typography
                      component="span"
                      sx={{
                        ...TYPE.eyebrow,
                        fontSize: "0.625rem",
                        px: 0.75,
                        py: 0.25,
                        borderRadius: R.pill,
                        color: J.azureDeep,
                        border: `1px solid ${J.azureBorder}`,
                      }}
                    >
                      {t("jobsV2.students.new", "New")}
                    </Typography>
                  )}
                  <Box
                    component="button"
                    type="button"
                    aria-label={t("jobsV2.students.remove", "Remove {{name}}", {
                      name: student.name,
                    })}
                    onClick={() =>
                      setSelected((prev) => {
                        const next = new Map(prev);
                        next.delete(student.id);
                        return next;
                      })
                    }
                    sx={{
                      display: "inline-grid",
                      placeItems: "center",
                      width: 24,
                      height: 24,
                      border: "none",
                      p: 0,
                      cursor: "pointer",
                      borderRadius: R.pill,
                      bgcolor: "transparent",
                      color: J.ink3,
                      "&:hover": { bgcolor: J.surface3, color: J.ink },
                      ...focusRing,
                    }}
                  >
                    <IconWrapper icon="mdi:close" size={14} />
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {loadError ? (
        <ErrorState
          variant="panel"
          error={loadError}
          title={t("jobsV2.students.errorTitle", "We could not load your students")}
          onRetry={() => void load(query, page, pageSize)}
        />
      ) : loading && students.length === 0 ? (
        <Box
          aria-busy="true"
          aria-live="polite"
          sx={{ display: "flex", flexDirection: "column", gap: 1 }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Box key={i} sx={{ height: 56, borderRadius: R.ctl, bgcolor: J.surface2 }} />
          ))}
        </Box>
      ) : students.length === 0 ? (
        query.trim() ? (
          <EmptyState
            variant="panel"
            icon="mdi:account-search-outline"
            title={t("jobsV2.students.noMatchTitle", 'No students match "{{query}}"', { query })}
            body={t("jobsV2.students.noMatchBody", "Try a different name, or clear the search.")}
            primaryAction={
              <JButton
                variant="secondary"
                onClick={() => {
                  setSearchInput("");
                  runSearch("");
                }}
              >
                {t("jobsV2.search.clear")}
              </JButton>
            }
          />
        ) : (
          <EmptyState
            variant="panel"
            icon="mdi:account-group-outline"
            title={t("jobsV2.students.noneTitle", "No students on this account yet")}
            body={t(
              "jobsV2.students.noneBody",
              "Once learners are enrolled they appear here and can be assigned individually.",
            )}
          />
        )
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              pb: 1,
              borderBottom: `1px solid ${J.hairline}`,
            }}
          >
            <Checkbox
              checked={allOnPageSelected}
              indeterminate={someOnPageSelected}
              onChange={toggleAllOnPage}
              inputProps={{
                "aria-label": t(
                  "jobsV2.students.selectAllOnPage",
                  "Select all {{count}} students on this page",
                  { count: students.length },
                ) as string,
              }}
              sx={{ color: J.hairlineStrong, "&.Mui-checked": { color: J.azure }, ...focusRing }}
            />
            <Typography sx={TYPE.small}>
              {t("jobsV2.students.selectAllOnPage", "Select all {{count}} students on this page", {
                count: students.length,
              })}
            </Typography>
          </Box>

          <Box
            ref={listRef}
            role="listbox"
            aria-multiselectable
            aria-label={t("jobsV2.students.listLabel", "Students") as string}
            aria-busy={loading || undefined}
            onKeyDown={onListKeyDown}
            sx={{
              opacity: loading ? 0.55 : 1,
              transition: `opacity ${MOTION.ctl}ms ${MOTION.ease}`,
            }}
          >
            {students.map((student) => {
              const checked = selected.has(student.id);
              const isAssigned = assigned.has(student.id);
              return (
                <Box
                  key={student.id}
                  role="option"
                  aria-selected={checked}
                  tabIndex={0}
                  onClick={() => toggle(student)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggle(student);
                    }
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    px: 1,
                    py: 1,
                    borderRadius: R.ctl,
                    cursor: "pointer",
                    transition: `background-color ${MOTION.micro}ms ${MOTION.ease}`,
                    "&:hover": { bgcolor: J.surface2 },
                    ...(checked ? { bgcolor: J.azureSoft } : null),
                    ...focusRing,
                  }}
                >
                  <Checkbox
                    checked={checked}
                    tabIndex={-1}
                    onClick={(event) => event.stopPropagation()}
                    onChange={() => toggle(student)}
                    inputProps={{ "aria-hidden": true }}
                    sx={{ p: 0.5, color: J.hairlineStrong, "&.Mui-checked": { color: J.azure } }}
                  />
                  <JAvatar
                    src={student.profile_pic_url ?? undefined}
                    name={student.name || student.email}
                    size={32}
                  />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ ...TYPE.h4 }} title={student.name || student.email}>
                      {student.name || student.email}
                    </Typography>
                    <Typography sx={{ ...TYPE.mono, fontSize: "0.75rem" }}>
                      {student.email}
                    </Typography>
                  </Box>
                  {isAssigned && (
                    <Typography sx={{ ...TYPE.micro, color: J.ink3, flexShrink: 0 }}>
                      {t("jobsV2.students.alreadyAssigned", "Already assigned")}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>

          <JPagination
            page={page}
            pageCount={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={goToPage}
            disabled={loading}
            sx={{ mt: 1.5 }}
          />
        </>
      )}
    </JModal>
  );
}
