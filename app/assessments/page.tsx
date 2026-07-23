"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Box, Typography, Skeleton, TextField, MenuItem } from "@mui/material";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import {
  assessmentService,
  Assessment,
} from "@/lib/services/assessment.service";
import { useToast } from "@/components/common/Toast";
import { AssessmentsGrid } from "@/components/assessment/AssessmentsGrid";
import { IconWrapper } from "@/components/common/IconWrapper";
import { LoadingButton } from "@/components/common/LoadingButton";
import { isPsychometricAssessment } from "@/lib/utils/psychometric-utils";
import { stripHtmlTags } from "@/lib/utils/html-utils";
import {
  canViewLearnerAssessmentResults,
  isLearnerAssessmentSubmittedForCatalog,
  isLearnerAssessmentSubmittedUnderReview,
  normalizeLearnerAssessmentStatus,
} from "@/lib/utils/assessment-learner-status";
import {
  StatStrip,
  SegmentedTabs,
  AssessmentEmptyState,
  AssessmentFilterBar,
} from "@/components/admin/assessment/shared";

const ITEMS_PER_PAGE = 12;

type FilterType = "all" | "available" | "under_review" | "completed" | "expired";
type SortType = "recent" | "oldest" | "title";

/** Assessment is past its end_time and the learner did not submit before it ended. */
function isLearnerAssessmentExpired(a: Assessment): boolean {
  if (!a.end_time) return false;
  if (new Date(a.end_time).getTime() > Date.now()) return false;
  return !isLearnerAssessmentSubmittedForCatalog(a);
}

/** Available = still takeable (not submitted, not expired, and within the open window). */
function isLearnerAssessmentAvailable(a: Assessment): boolean {
  if (isLearnerAssessmentSubmittedForCatalog(a)) return false;
  if (isLearnerAssessmentExpired(a)) return false;
  if (a.start_time && new Date(a.start_time).getTime() > Date.now()) return false;
  if (a.status === "not_started" || a.status === "in_progress") return true;
  if (a.status === undefined || a.status === null) {
    return !a.is_attempted && !a.has_attempted;
  }
  return false;
}

export default function AssessmentsPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("recent");
  const [nextLoading, setNextLoading] = useState(false);
  const { showToast } = useToast();
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    (async () => {
      try {
        setLoading(true);
        const data = await assessmentService.getActiveAssessments();
        setAssessments(data);
      } catch {
        showToast(t("assessments.failedToLoad"), "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast, t]);

  // ---- Counts (real learner-status derivation, preserved from the prior hub) ----
  const counts = useMemo(() => {
    const totalCount = assessments.length;
    const availableCount = assessments.filter(isLearnerAssessmentAvailable).length;
    const completedCount = assessments.filter(canViewLearnerAssessmentResults).length;
    const underReviewCount = assessments.filter(isLearnerAssessmentSubmittedUnderReview).length;
    const expiredCount = assessments.filter(isLearnerAssessmentExpired).length;
    return { totalCount, availableCount, completedCount, underReviewCount, expiredCount };
  }, [assessments]);

  // ---- Smart band: the single most-urgent thing to do right now (REAL data) ----
  // Prefer an in-progress attempt, else the soonest-closing available assessment.
  const nextUp = useMemo(() => {
    const inProgress = assessments.find(
      (a) => normalizeLearnerAssessmentStatus(a) === "in_progress" && !isLearnerAssessmentExpired(a),
    );
    if (inProgress) return { assessment: inProgress, mode: "resume" as const };
    const available = assessments
      .filter(isLearnerAssessmentAvailable)
      .sort((a, b) => {
        const ea = a.end_time ? new Date(a.end_time).getTime() : Infinity;
        const eb = b.end_time ? new Date(b.end_time).getTime() : Infinity;
        return ea - eb;
      });
    return available[0] ? { assessment: available[0], mode: "start" as const } : null;
  }, [assessments]);

  const nextHint = useMemo(() => {
    if (!nextUp) return "";
    if (nextUp.mode === "resume") return t("assessments.resumeHint", { defaultValue: "You have an attempt in progress — pick up where you left off." });
    const end = nextUp.assessment.end_time ? new Date(nextUp.assessment.end_time) : null;
    if (end) {
      const days = Math.ceil((end.getTime() - Date.now()) / 86400000);
      if (days <= 0) return t("assessments.dueToday", { defaultValue: "Due today — don't miss it." });
      if (days <= 2) return t("assessments.dueSoonHint", { count: days, defaultValue: `Due in ${days} day(s) — worth starting soon.` });
      return t("assessments.openNowHint", { count: days, defaultValue: `Open now · ${days} days left to submit.` });
    }
    return t("assessments.readyWhenYouAre", { defaultValue: "Ready whenever you are." });
  }, [nextUp, t]);

  // ---- Filter + search + sort ----
  const filteredAssessments = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let result = assessments.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.description || "").toLowerCase().includes(q),
    );
    if (filter === "completed") result = result.filter(canViewLearnerAssessmentResults);
    else if (filter === "under_review") result = result.filter(isLearnerAssessmentSubmittedUnderReview);
    else if (filter === "expired") result = result.filter(isLearnerAssessmentExpired);
    else if (filter === "available") result = result.filter(isLearnerAssessmentAvailable);

    return result.sort((a, b) => {
      if (sortBy === "recent") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return 0;
    });
  }, [assessments, searchQuery, filter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAssessments.length / ITEMS_PER_PAGE));
  const paginatedAssessments = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredAssessments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAssessments, page]);

  const goToNext = () => {
    if (!nextUp) return;
    setNextLoading(true);
    router.push(`/assessments/${nextUp.assessment.slug}`);
  };

  const statItems = [
    { label: t("assessments.available", { defaultValue: "Available now" }), value: counts.availableCount, icon: "mdi:lightning-bolt", tone: "var(--success-500)" },
    { label: t("assessments.submittedUnderReview", { defaultValue: "Under review" }), value: counts.underReviewCount, icon: "mdi:progress-clock", tone: "var(--warning-500)" },
    { label: t("assessments.completed", { defaultValue: "Completed" }), value: counts.completedCount, icon: "mdi:check-circle", tone: "var(--accent-indigo)" },
    { label: t("assessments.totalAssessments", { defaultValue: "Total" }), value: counts.totalCount, icon: "mdi:clipboard-text", tone: "var(--ai-violet)" },
  ];

  const tabs = [
    { value: "all" as FilterType, label: t("assessments.all", { defaultValue: "All" }), count: counts.totalCount },
    { value: "available" as FilterType, label: t("assessments.available", { defaultValue: "Available" }), count: counts.availableCount },
    { value: "under_review" as FilterType, label: t("assessments.submittedUnderReview", { defaultValue: "Under review" }), count: counts.underReviewCount },
    { value: "completed" as FilterType, label: t("assessments.completed", { defaultValue: "Completed" }), count: counts.completedCount },
    { value: "expired" as FilterType, label: t("assessments.expired", { defaultValue: "Expired" }), count: counts.expiredCount },
  ];

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Learn"
        title="Assessments"
        description="Take your assigned quizzes and tests, then review your scores and feedback in one place."
        accent="indigo"
        icon="mdi:file-document-edit"
      />

      <Box>
        {/* Smart band — always shown (matches management's hero band). Real next-up
            data + a working CTA when there's something to do; a welcoming variant
            otherwise. No fabricated metrics. */}
        <Box
          sx={{
            mb: 3,
            position: "relative",
            overflow: "hidden",
            borderRadius: "18px",
            p: { xs: 2.5, md: 3 },
            color: "var(--font-primary)",
            background:
              "linear-gradient(115deg, color-mix(in srgb, var(--accent-purple) 8%, var(--card-bg)) 0%, var(--card-bg) 62%)",
            border: "1px solid var(--border-default)",
            boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
          }}
        >
          {/* Decorative glow — presentation only */}
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              top: -90,
              right: -70,
              width: 300,
              height: 300,
              borderRadius: "50%",
              background: "radial-gradient(circle, color-mix(in srgb, var(--accent-purple) 12%, transparent) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "flex-start", md: "center" },
              justifyContent: "space-between",
              gap: 3,
            }}
          >
            {nextUp ? (
              <>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.75,
                      px: 1.25,
                      py: 0.5,
                      borderRadius: 999,
                      background: "var(--gradient-ai)",
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      mb: 1.5,
                    }}
                  >
                    <IconWrapper icon="mdi:star-four-points" size={14} color="#fff" />
                    {nextUp.mode === "resume"
                      ? t("assessments.inProgressLabel", { defaultValue: "IN PROGRESS" })
                      : t("assessments.nextUpLabel", { defaultValue: "NEXT UP" })}
                  </Box>
                  <Typography
                    sx={{
                      fontFamily: "var(--font-jakarta)",
                      fontWeight: 800,
                      fontSize: { xs: "1.5rem", md: "2rem" },
                      lineHeight: 1.15,
                      mb: 1,
                    }}
                  >
                    {stripHtmlTags(nextUp.assessment.title || "").trim() || nextUp.assessment.title}
                  </Typography>
                  <Typography sx={{ color: "var(--font-secondary)", fontSize: { xs: "0.9rem", md: "0.95rem" } }}>
                    {nextHint}
                  </Typography>
                </Box>
                <LoadingButton
                  onClick={goToNext}
                  loading={nextLoading}
                  endIcon={<IconWrapper icon="mdi:arrow-right" size={18} color="currentColor" />}
                  sx={{
                    flexShrink: 0,
                    background: "var(--gradient-ai)",
                    color: "#fff",
                    fontWeight: 800,
                    textTransform: "none",
                    px: 3,
                    py: 1.15,
                    borderRadius: 999,
                    boxShadow: "0 12px 24px -12px rgba(124,58,237,0.5)",
                    "&:hover": { filter: "brightness(1.05)", transform: "translateY(-1px)" },
                  }}
                >
                  {nextUp.mode === "resume"
                    ? t("assessments.resume", { defaultValue: "Resume" })
                    : t("assessments.takeItNow", { defaultValue: "Take it now" })}
                </LoadingButton>
              </>
            ) : (
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: 1.25,
                    py: 0.5,
                    borderRadius: 999,
                    background: "var(--gradient-ai)",
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    mb: 1.5,
                  }}
                >
                  <IconWrapper icon="mdi:star-four-points" size={14} color="#fff" />
                  {t("assessments.centerLabel", { defaultValue: "ASSESSMENT CENTER" })}
                </Box>
                <Typography
                  sx={{
                    fontFamily: "var(--font-jakarta)",
                    fontWeight: 800,
                    fontSize: { xs: "1.5rem", md: "2rem" },
                    lineHeight: 1.15,
                    mb: 1,
                  }}
                >
                  {t("assessments.centerTitle", { defaultValue: "Your assessment center" })}
                </Typography>
                <Typography sx={{ color: "var(--font-secondary)", fontSize: { xs: "0.9rem", md: "0.95rem" } }}>
                  {t("assessments.subtitle", { defaultValue: "Everything scheduled across your courses, in one place." })}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Stat strip */}
        <Box sx={{ mt: 3 }}>
          <StatStrip items={statItems} />
        </Box>

        {/* Tabs */}
        <Box sx={{ mt: 3 }}>
          <SegmentedTabs
            tabs={tabs}
            value={filter}
            onChange={(v) => {
              setFilter(v as FilterType);
              setPage(1);
            }}
          />
        </Box>

        {/* Search + sort */}
        <Box sx={{ mt: 2 }}>
          <AssessmentFilterBar
            search={searchQuery}
            onSearchChange={(v) => {
              setSearchQuery(v);
              setPage(1);
            }}
            searchPlaceholder={t("assessments.searchPlaceholder", { defaultValue: "Search assessments…" })}
            rightSlot={
              <TextField
                select
                size="small"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                label={t("courses.sortBy", { defaultValue: "Sort" })}
                sx={{
                  width: { xs: "100%", sm: 180 },
                  "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "var(--surface)" },
                }}
              >
                <MenuItem value="recent">{t("courses.mostRecent", { defaultValue: "Most recent" })}</MenuItem>
                <MenuItem value="oldest">{t("courses.oldestFirst", { defaultValue: "Oldest first" })}</MenuItem>
                <MenuItem value="title">{t("courses.titleAZ", { defaultValue: "Title A–Z" })}</MenuItem>
              </TextField>
            }
          />
        </Box>

        {/* Grid / loading / empty */}
        <Box sx={{ mt: 3 }}>
          {loading ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
                gap: { xs: 2, sm: 2.5 },
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  height={300}
                  sx={{ borderRadius: "var(--radius-card)", bgcolor: "color-mix(in srgb, var(--surface) 88%, var(--ai-violet) 12%)" }}
                />
              ))}
            </Box>
          ) : filteredAssessments.length > 0 ? (
            <AssessmentsGrid assessments={paginatedAssessments} searchQuery={searchQuery} />
          ) : (
            <AssessmentEmptyState
              icon={searchQuery ? "mdi:file-search-outline" : "mdi:clipboard-text-outline"}
              title={t("assessments.noAssessmentsFound", { defaultValue: "No assessments found" })}
              description={
                searchQuery
                  ? t("assessments.adjustSearchFilter", { defaultValue: "Try adjusting your search or filter." })
                  : t("assessments.checkBackLater", { defaultValue: "Nothing here yet — check back later." })
              }
            />
          )}
        </Box>

        {/* Pagination */}
        {!loading && filteredAssessments.length > ITEMS_PER_PAGE && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 4, flexWrap: "wrap", gap: 2 }}>
            <Typography sx={{ fontSize: "0.8125rem", color: "var(--font-secondary)" }}>
              {t("assessments.pageRange", {
                start: (page - 1) * ITEMS_PER_PAGE + 1,
                end: Math.min(page * ITEMS_PER_PAGE, filteredAssessments.length),
                total: filteredAssessments.length,
                defaultValue: `${(page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(page * ITEMS_PER_PAGE, filteredAssessments.length)} of ${filteredAssessments.length}`,
              })}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <LoadingButton
                onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                disabled={page === 1}
                sx={{ minWidth: 0, px: 2, py: 0.75, borderRadius: 2, border: "1px solid var(--border-default)", color: "var(--font-secondary)", textTransform: "none" }}
              >
                {t("assessments.previous", { defaultValue: "Previous" })}
              </LoadingButton>
              <Typography sx={{ fontSize: "0.8125rem", color: "var(--font-secondary)", px: 1, fontFamily: "var(--font-mono)" }}>
                {page} / {totalPages}
              </Typography>
              <LoadingButton
                onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                disabled={page >= totalPages}
                sx={{ minWidth: 0, px: 2, py: 0.75, borderRadius: 2, border: "1px solid var(--border-default)", color: "var(--font-secondary)", textTransform: "none" }}
              >
                {t("assessments.next", { defaultValue: "Next" })}
              </LoadingButton>
            </Box>
          </Box>
        )}
      </Box>
    </PageShell>
  );
}
