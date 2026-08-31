"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NextLink from "next/link";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { jobsV2Service, type JobApplicationV2 } from "@/lib/services/jobs-v2.service";
import { formatDate, relativeTime } from "@/lib/jobs-v2/format";
import { resolveAppStatus } from "@/lib/jobs-v2/status";
import { useSeq } from "@/lib/jobs-v2/useSeq";
import {
  AppliedListSkeleton,
  APP_STATUS,
  APP_STATUS_ORDER,
  CompanyLogo,
  CountPill,
  EmptyState,
  ErrorState,
  HairlineStrip,
  JButton,
  JCard,
  JPagination,
  JSelect,
  SectionHeader,
  StatusPill,
  J,
  R,
  TYPE,
  lineClamp,
  type AppStatus,
  type StripItem,
} from "@/components/jobs-v2/ui";
import { EmptyJobsIllustration } from "@/components/jobs-v2/illustrations";
import { PlacementBanner } from "./PlacementBanner";
import { stretchedLink } from "./JobCardV2";

/**
 * The Applied pane.
 *
 * Replaces `components/jobs-v2/AppliedJobsSection.tsx`, which held the module's only
 * `CircularProgress` page loader, a second status map, a fourth `formatDate`, five
 * non-clickable stat tiles beside six clickable filter chips that said the same thing, a raw
 * unstyled native `<select>`, and **zero** `t(` calls. It also rendered "No applications yet"
 * for a failed fetch, which is the most alarming false negative in the module.
 */

const PAGE_SIZE = 20;

type SortOption = "newest" | "oldest" | "company";

/**
 * A compact six-segment rail over `APP_STATUS_ORDER`, filled through the furthest stage the
 * record reached. It is decorative on its own, so the whole thing carries one `aria-label`
 * naming the stage in words.
 */
function PipelineRail({ status }: { status: string }) {
  const { t } = useTranslation("common");
  const tone = resolveAppStatus(status);
  const index = APP_STATUS_ORDER.indexOf(status as AppStatus);
  const reached = index === -1 ? 0 : index + 1;

  return (
    <Box
      role="img"
      aria-label={
        t("jobsV2.applied.railLabel", {
          current: reached,
          total: APP_STATUS_ORDER.length,
          stage: t(tone.labelKey),
          defaultValue: "Stage {{current}} of {{total}}: {{stage}}",
        }) as string
      }
      sx={{ display: "flex", gap: 0.5, width: { xs: 96, sm: 120 }, flexShrink: 0 }}
    >
      {APP_STATUS_ORDER.map((_, i) => (
        <Box
          key={i}
          sx={{
            flex: 1,
            height: 3,
            borderRadius: R.pill,
            bgcolor: i < reached ? tone.fg : J.hairline,
          }}
        />
      ))}
    </Box>
  );
}

export interface AppliedPanelProps {
  /** Flips the board back to Browse. */
  onBrowseJobs?: () => void;
  /** The `status` key of the board's URL state, so an Applied view is shareable. */
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
}

export function AppliedPanel({
  onBrowseJobs,
  statusFilter: statusFilterProp,
  onStatusFilterChange,
}: AppliedPanelProps) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const seq = useSeq();

  const [applications, setApplications] = useState<JobApplicationV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [, setClock] = useState(0);
  const loadedOnceRef = useRef(false);

  const [localStatus, setLocalStatus] = useState("");
  const statusFilter = statusFilterProp ?? localStatus;
  const setStatusFilter = onStatusFilterChange ?? setLocalStatus;

  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);
  /** Records the learner said they did NOT complete. There is no cancel endpoint (spec 10.5). */
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const fetchApplications = useCallback(async () => {
    const token = seq.next();
    if (loadedOnceRef.current) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);
    try {
      const res = await jobsV2Service.getMyApplications();
      if (!seq.isCurrent(token)) return;
      setApplications(res.results ?? []);
      setLoadedAt(new Date());
    } catch (err) {
      if (!seq.isCurrent(token)) return;
      // NEVER `setApplications([])`: rendering "No applications yet" for a server fault tells
      // a learner their history is gone.
      setLoadError(
        (err as Error)?.message ??
          (t("jobsV2.error.applicationsTitle", {
            defaultValue: "We could not load your applications",
          }) as string),
      );
    } finally {
      if (seq.isCurrent(token)) {
        loadedOnceRef.current = true;
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [seq, t]);

  useEffect(() => {
    void fetchApplications();
  }, [fetchApplications]);

  // "Updated 2m ago" has to keep being true, so the label re-renders once a minute.
  useEffect(() => {
    const id = setInterval(() => setClock((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  /* ---- derived ---------------------------------------------------------- */

  const selectedApplications = useMemo(
    () => applications.filter((a) => a.status === "selected"),
    [applications],
  );

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const app of applications) counts.set(app.status, (counts.get(app.status) ?? 0) + 1);
    return counts;
  }, [applications]);

  const filtered = useMemo(() => {
    const base = statusFilter ? applications.filter((a) => a.status === statusFilter) : applications;
    const byTime = (value: string) => new Date(value).getTime() || 0;
    return [...base].sort((a, b) => {
      if (sortBy === "newest") return byTime(b.applied_at) - byTime(a.applied_at);
      if (sortBy === "oldest") return byTime(a.applied_at) - byTime(b.applied_at);
      return (a.company_name || "").localeCompare(b.company_name || "");
    });
  }, [applications, statusFilter, sortBy]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const pageItems = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  /**
   * The strip IS the filter. Five non-clickable tiles plus six clickable chips saying the same
   * thing collapse into one interactive row, and because the cells come from
   * `APP_STATUS_ORDER`, `applying` is cell one and the counts sum to the stated total.
   */
  const stripItems = useMemo<StripItem[]>(
    () =>
      APP_STATUS_ORDER.map((status) => ({
        key: status,
        label: t(APP_STATUS[status].labelKey) as string,
        value: statusCounts.get(status) ?? 0,
        icon: APP_STATUS[status].icon,
        tone: (statusCounts.get(status) ?? 0) > 0 ? APP_STATUS[status].fg : J.ink4,
        active: statusFilter === status,
        onClick: () => {
          setStatusFilter(statusFilter === status ? "" : status);
          setPage(1);
        },
      })),
    [statusCounts, statusFilter, setStatusFilter, t],
  );

  /* ---- the `applying` correction path ----------------------------------- */

  const confirmApplied = useCallback(
    async (app: JobApplicationV2) => {
      setConfirmingId(app.id);
      try {
        const updated = await jobsV2Service.confirmApplied(app.id);
        setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, ...updated } : a)));
        showToast(
          t("jobsV2.applied.confirmed", { defaultValue: "Marked as applied" }) as string,
          "success",
        );
      } catch (err) {
        showToast(
          (err as Error)?.message ??
            (t("jobsV2.applied.confirmFailed", {
              defaultValue: "We could not update that application",
            }) as string),
          "error",
        );
      } finally {
        setConfirmingId(null);
      }
    },
    [showToast, t],
  );

  const hideApplication = useCallback((id: number) => {
    setHiddenIds((prev) => new Set(prev).add(id));
  }, []);

  const unhideApplication = useCallback((id: number) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  /* ---- states ----------------------------------------------------------- */

  if (loading) return <AppliedListSkeleton count={4} />;

  if (loadError) {
    return (
      <ErrorState
        title={
          t("jobsV2.error.applicationsTitle", {
            defaultValue: "We could not load your applications",
          }) as string
        }
        error={loadError}
        onRetry={() => void fetchApplications()}
        busy={refreshing}
        variant="page"
      />
    );
  }

  if (applications.length === 0) {
    return (
      <EmptyState
        variant="page"
        illustration={<EmptyJobsIllustration width={180} height={140} />}
        title={
          t("jobsV2.empty.noApplicationsTitle", {
            defaultValue: "You have not applied to anything yet",
          }) as string
        }
        body={
          t("jobsV2.empty.noApplicationsBody", {
            defaultValue: "Applications you send appear here with their live status.",
          }) as string
        }
        primaryAction={
          <JButton
            variant="primary"
            endIcon="mdi:arrow-right"
            onClick={onBrowseJobs}
            href={onBrowseJobs ? undefined : "/jobs-v2"}
          >
            {t("jobsV2.empty.browseJobs", { defaultValue: "Browse jobs" })}
          </JButton>
        }
      />
    );
  }

  const updatedLabel = loadedAt ? relativeTime(loadedAt) : null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <PlacementBanner applications={selectedApplications} />

      <HairlineStrip
        items={stripItems}
        ariaLabel={
          t("jobsV2.applied.stripLabel", {
            defaultValue: "Filter your applications by status",
          }) as string
        }
        sx={{ mb: 3 }}
      />

      <SectionHeader
        icon="mdi:send-check-outline"
        title={t("jobsV2.applied.title", { defaultValue: "Your applications" }) as string}
        action={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <CountPill value={applications.length} tone="azure" />
            <JSelect
              value={sortBy}
              onChange={(value) => {
                setSortBy(value as SortOption);
                setPage(1);
              }}
              dense
              fullWidth={false}
              sx={{ width: 176 }}
              aria-label={t("jobsV2.applied.sortLabel", { defaultValue: "Sort applications" }) as string}
              options={[
                {
                  value: "newest",
                  label: t("jobsV2.applied.sortNewest", { defaultValue: "Newest first" }) as string,
                },
                {
                  value: "oldest",
                  label: t("jobsV2.applied.sortOldest", { defaultValue: "Oldest first" }) as string,
                },
                {
                  value: "company",
                  label: t("jobsV2.applied.sortCompany", { defaultValue: "Company A-Z" }) as string,
                },
              ]}
            />
            <JButton
              variant="ghost"
              startIcon="mdi:refresh"
              loading={refreshing}
              onClick={() => void fetchApplications()}
            >
              {t("jobsV2.applied.refresh", { defaultValue: "Refresh" })}
            </JButton>
            {updatedLabel && (
              <Typography sx={{ ...TYPE.micro, whiteSpace: "nowrap" }} aria-live="polite">
                {t("jobsV2.applied.updatedAgo", {
                  when: updatedLabel,
                  defaultValue: "Updated {{when}}",
                })}
              </Typography>
            )}
          </Box>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          variant="panel"
          icon="mdi:filter-remove-outline"
          title={
            t("jobsV2.applied.noMatchTitle", {
              status: t(resolveAppStatus(statusFilter).labelKey),
              defaultValue: 'No applications with status "{{status}}"',
            }) as string
          }
          body={
            t("jobsV2.applied.noMatchBody", {
              defaultValue: "Nothing sits at that stage right now.",
            }) as string
          }
          primaryAction={
            <JButton
              variant="secondary"
              onClick={() => {
                setStatusFilter("");
                setPage(1);
              }}
            >
              {t("jobsV2.applied.showAll", {
                count: applications.length,
                defaultValue: "Show all ({{count}})",
              })}
            </JButton>
          }
        />
      ) : (
        <Box
          sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
          aria-busy={refreshing || undefined}
          style={refreshing ? { opacity: 0.55, pointerEvents: "none" } : undefined}
        >
          {pageItems.map((app) => {
            const tone = resolveAppStatus(app.status);
            const hidden = hiddenIds.has(app.id);

            if (hidden) {
              return (
                <JCard key={app.id} dashed elevated={false}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      flexWrap: "wrap",
                      minWidth: 0,
                    }}
                  >
                    <Box aria-hidden sx={{ color: J.ink3, display: "inline-flex" }}>
                      <IconWrapper icon="mdi:eye-off-outline" size={18} />
                    </Box>
                    <Typography sx={{ ...TYPE.small, flex: 1, minWidth: 0 }}>
                      {t("jobsV2.applied.hiddenNotice", {
                        title: app.job_title,
                        defaultValue:
                          "{{title}} is hidden. It will reappear if the employer confirms it.",
                      })}
                    </Typography>
                    <JButton variant="quiet" size="sm" onClick={() => unhideApplication(app.id)}>
                      {t("jobsV2.applied.markApplied", { defaultValue: "Mark as applied" })}
                    </JButton>
                  </Box>
                </JCard>
              );
            }

            return (
              <JCard key={app.id} interactive sx={{ position: "relative" }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: { xs: "flex-start", sm: "center" },
                    gap: { xs: 1.5, md: 2 },
                    minWidth: 0,
                  }}
                >
                  <CompanyLogo src={undefined} name={app.company_name} size={40} />

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      component={NextLink}
                      href={`/jobs-v2/applications/${app.id}`}
                      title={app.job_title}
                      sx={{ ...TYPE.h4, ...lineClamp(1), ...stretchedLink }}
                    >
                      {app.job_title}
                    </Typography>
                    <Typography
                      sx={{
                        ...TYPE.small,
                        mt: 0.25,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {app.company_name}
                    </Typography>
                    <Typography sx={{ ...TYPE.micro, mt: 0.5 }}>
                      {t("jobsV2.applied.appliedOn", {
                        date: formatDate(app.applied_at),
                        defaultValue: "Applied {{date}}",
                      })}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "row", sm: "column" },
                      alignItems: { xs: "center", sm: "flex-end" },
                      gap: 1,
                      flexShrink: 0,
                    }}
                  >
                    <StatusPill kind="application" value={app.status} />
                    <PipelineRail status={app.status} />
                  </Box>

                  <Box
                    aria-hidden
                    sx={{
                      display: { xs: "none", sm: "inline-flex" },
                      color: J.ink4,
                      flexShrink: 0,
                      '[dir="rtl"] &': { transform: "scaleX(-1)" },
                    }}
                  >
                    <IconWrapper icon="mdi:chevron-right" size={18} />
                  </Box>
                </Box>

                {app.status === "applying" && (
                  <Box
                    sx={{
                      position: "relative",
                      zIndex: 1,
                      mt: 1.75,
                      pt: 1.5,
                      borderTop: `1px solid ${J.hairlineSoft}`,
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    <Typography sx={{ ...TYPE.bodyStrong, color: tone.fg, flex: 1, minWidth: 200 }}>
                      {t("jobsV2.applied.didYouApply", {
                        defaultValue: "Did you complete this application?",
                      })}
                    </Typography>
                    <JButton
                      variant="secondary"
                      size="sm"
                      tone="azure"
                      loading={confirmingId === app.id}
                      onClick={() => void confirmApplied(app)}
                    >
                      {t("jobsV2.questions.yes", { defaultValue: "Yes" })}
                    </JButton>
                    <JButton variant="quiet" size="sm" onClick={() => hideApplication(app.id)}>
                      {t("jobsV2.applied.didNotApply", { defaultValue: "No, I did not" })}
                    </JButton>
                  </Box>
                )}
              </JCard>
            );
          })}
        </Box>
      )}

      <JPagination
        page={safePage}
        pageCount={pageCount}
        total={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={(next) => {
          setPage(next);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        sizes={[PAGE_SIZE]}
      />

      <Box sx={{ display: "flex", justifyContent: "center", pt: 2 }}>
        <JButton
          variant="secondary"
          endIcon="mdi:arrow-right"
          onClick={onBrowseJobs}
          href={onBrowseJobs ? undefined : "/jobs-v2"}
        >
          {t("jobsV2.applied.browseMore", { defaultValue: "Browse more jobs" })}
        </JButton>
      </Box>
    </Box>
  );
}
