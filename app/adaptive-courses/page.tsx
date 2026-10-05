"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Icon } from "@iconify/react";
import {
  adaptiveCourseService,
  type AdaptiveCourseListItem,
} from "@/lib/services/adaptive-course.service";
import { useClientInfo, useIsAdaptiveQuizEnabled } from "@/lib/contexts/ClientInfoContext";
import {
  countByOrigin,
  filterByOrigin,
  shouldOfferOriginFilter,
  type CourseOrigin,
} from "@/lib/hooks/adaptiveCourseOrigin";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import { ViewToggle, SearchFilterBar, type ListView } from "@/components/common/list";
import { Reveal } from "@/components/scorecard/shared";
import { AdaptiveCourseCard } from "@/components/courses/AdaptiveCourseCard";
import { AdaptiveCourseListSkeleton } from "@/components/courses/CourseSkeletons";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { PhoneCourseControls, type SortOption } from "@/components/courses/PhoneCourseControls";
import { PHONE } from "@/components/common/mobile/phone";
import { CourseProgressMeter } from "@/components/courses/CourseProgressMeter";

type SortKey = "recent" | "title" | "content";

const SORT_OPTIONS: SortOption<SortKey>[] = [
  { value: "recent", label: "Recently updated" },
  { value: "title", label: "Title (A–Z)" },
  { value: "content", label: "Most content" },
];

/** Phone-only sizing for the small pill actions (Clear search): 44px to hit, not 32. */
const PHONE_CHIP = { [PHONE]: { height: 44, px: 1, fontSize: "0.9rem", borderRadius: 999 } };

export default function AdaptiveCourseListPage() {
  const { push, prefetch } = useInstantNavigation();
  const featureOn = useIsAdaptiveQuizEnabled();
  const { clientInfo } = useClientInfo();
  /**
   * Which half of the list to show. This endpoint merges the tenant's published catalog with
   * the learner's own roadmap-built courses and sorts them together by date, so without this
   * a learner with 39 of their own and 12 of their institution's has no way to find either.
   */
  const [origin, setOrigin] = useState<CourseOrigin>("all");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AdaptiveCourseListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [viewMode, setViewMode] = useState<ListView>("cards");
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    if (!featureOn) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await adaptiveCourseService.listCourses();
        if (!cancelled) setItems(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load adaptive courses.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [featureOn]);

  const originCounts = useMemo(() => countByOrigin(items), [items]);
  const offerOriginFilter = useMemo(() => shouldOfferOriginFilter(items), [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = filterByOrigin(items, origin).filter((c) => {
      const matchesQuery =
        !q ||
        c.title.toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q) ||
        (c.target_audience || "").toLowerCase().includes(q);
      return matchesQuery;
    });
    const contentScore = (c: AdaptiveCourseListItem) =>
      c.module_count + c.quiz_count + c.article_count + (c.coding_count ?? 0) + (c.video_count ?? 0);
    return [...filtered].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "content") return contentScore(b) - contentScore(a);
      return (b.updated_at || "").localeCompare(a.updated_at || "");
    });
  }, [items, origin, query, sort]);

  if (!featureOn) {
    return (
      <PageShell>
        <Container sx={{ py: 8, textAlign: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {"Adaptive Course isn't enabled for this organisation."}
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 1 }}>
            {'Ask your administrator to switch on the "Adaptive Quiz" feature.'}
          </Typography>
        </Container>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Learn"
        title="Adaptive Courses"
        description="AI-personalised courses that adapt to your level in real time - practice, get instant feedback, and level up."
        accent="purple"
        icon="mdi:book-education-outline"
        action={
          // `display: contents` keeps this wrapper out of the layout; it only carries the
          // phone-only 44px height for a pill that is 38px tall.
          <Box sx={{ display: "contents", [PHONE]: { "& .MuiButtonBase-root": { minHeight: 44 } } }}>
            <HeaderActionButton icon="mdi:compass-outline" onClick={() => push("/adaptive-courses/catalog")}>
              Browse courses
            </HeaderActionButton>
          </Box>
        }
      />

          {loading && <AdaptiveCourseListSkeleton />}

          {error && (
            <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>
              {error}
            </Typography>
          )}

          {!loading && !error && items.length === 0 && (
            <EmptyState onBrowse={() => push("/adaptive-courses/catalog")} />
          )}

          {!loading && !error && offerOriginFilter && (
            <OriginTabs
              value={origin}
              onChange={setOrigin}
              counts={originCounts}
              clientName={clientInfo?.name}
            />
          )}

          {!loading && !error && items.length > 0 && (
            <Box sx={{ mb: 2.5 }}>
              <Box data-tour-id="adaptive-search">
              {isPhone ? (
                <PhoneCourseControls
                  search={query}
                  onSearchChange={setQuery}
                  placeholder="Search your courses"
                  sort={sort}
                  sortOptions={SORT_OPTIONS}
                  onSortChange={setSort}
                  view={viewMode}
                  onViewChange={setViewMode}
                />
              ) : (
              <SearchFilterBar
                search={query}
                onSearchChange={setQuery}
                searchPlaceholder="Search adaptive courses…"
                rightSlot={
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <TextField
                      select
                      size="small"
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortKey)}
                      label="Sort"
                      sx={{
                        width: { xs: "100%", sm: 190 },
                        "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "var(--surface)" },
                      }}
                    >
                      {SORT_OPTIONS.map((o) => (
                        <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                      ))}
                    </TextField>
                    <ViewToggle value={viewMode} onChange={setViewMode} />
                  </Stack>
                }
              />
              )}
              </Box>
            </Box>
          )}

          {!loading && !error && items.length > 0 && visible.length === 0 && (
            <Box sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, textAlign: "center", bgcolor: "color-mix(in srgb, var(--card-bg) 60%, transparent)", border: "1px dashed color-mix(in srgb, var(--border-default) 90%, transparent)" }}>
              <Icon icon="mdi:magnify-close" width={44} style={{ color: "#a855f7" }} />
              <Typography sx={{ fontWeight: 800, mt: 1.5, fontSize: "1.05rem" }}>
                {origin === "all"
                  ? "No adaptive courses match your search."
                  : "Nothing here matches. Try the other courses, or clear the search."}
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1.75 }}>
                {query ? (
                  <Chip
                    label="Clear search"
                    onClick={() => setQuery("")}
                    sx={{ fontWeight: 700, cursor: "pointer", ...PHONE_CHIP }}
                  />
                ) : null}
                {origin !== "all" ? (
                  <Chip
                    label="Show all courses"
                    onClick={() => setOrigin("all")}
                    sx={{ fontWeight: 700, cursor: "pointer", ...PHONE_CHIP }}
                  />
                ) : null}
              </Stack>
            </Box>
          )}

          {!loading && visible.length > 0 && viewMode === "cards" && (
            <Box
              data-tour-id="adaptive-grid"
              sx={{
                display: "grid",
                // minmax(0, 1fr), not 1fr: a bare 1fr track has an `auto` minimum, so the widest
                // card's content sets the column width and a phone slides sideways.
                gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
                gap: 2,
                alignItems: "stretch",
                [PHONE]: { gap: 1.5, "& > *": { minWidth: 0 } },
              }}
            >
              {visible.map((course, idx) => (
                <Reveal key={course.id} delay={Math.min(idx, 8) * 0.06}>
                  <AdaptiveCourseCard
                    course={course}
                    onOpen={() => push(`/adaptive-courses/${course.id}`)}
                    onHover={() => prefetch(`/adaptive-courses/${course.id}`)}
                  />
                </Reveal>
              ))}
            </Box>
          )}

          {!loading && visible.length > 0 && viewMode === "list" && (
            <Stack spacing={1.25} sx={{ [PHONE]: { "& > *": { minWidth: 0 } } }}>
              {visible.map((course) => (
                <AdaptiveCourseRow
                  key={course.id}
                  course={course}
                  onOpen={() => push(`/adaptive-courses/${course.id}`)}
                  onHover={() => prefetch(`/adaptive-courses/${course.id}`)}
                />
              ))}
            </Stack>
          )}
    </PageShell>
  );
}

function AdaptiveCourseRow({
  course,
  onOpen,
  onHover,
}: {
  course: AdaptiveCourseListItem;
  onOpen: () => void;
  onHover: () => void;
}) {
  return (
    <Box
      onClick={onOpen}
      onMouseEnter={onHover}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 2,
        borderRadius: 2,
        cursor: "pointer",
        bgcolor: "var(--card-bg)",
        border: "1px solid var(--border-default)",
        transition: "all .15s",
        "&:hover": { borderColor: "#a855f7", boxShadow: "0 6px 16px -8px rgba(124,58,237,0.35)" },
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          background: "linear-gradient(135deg,#6366f1,#a855f7)",
          color: "#fff",
        }}
      >
        <Icon icon="mdi:book-education-outline" width={22} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "0.98rem" }} noWrap>
          {course.title}
        </Typography>
        <Typography sx={{ color: "var(--font-secondary)", fontSize: "0.82rem" }} noWrap>
          {course.description || course.target_audience || "Adaptive course"}
        </Typography>
        {/* The list view is the same list as the cards, so it has to answer the same
            question. Capped rather than full-width: a bar spanning a 1700px row reads as a
            page-loading indicator, not this course's progress. */}
        {course.progress && (
          <Box sx={{ mt: 0.75, maxWidth: 260 }}>
            <CourseProgressMeter progress={course.progress} compact />
          </Box>
        )}
      </Box>
      <Stack direction="row" spacing={2.5} sx={{ flexShrink: 0, display: { xs: "none", md: "flex" } }}>
        {[
          { icon: "mdi:cube-outline", value: course.module_count, label: "modules" },
          { icon: "mdi:help-circle-outline", value: course.quiz_count, label: "quizzes" },
          { icon: "mdi:file-document-outline", value: course.article_count, label: "articles" },
        ].map((m) => (
          <Stack key={m.label} alignItems="center">
            <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--font-primary)" }}>
              {m.value}
            </Typography>
            <Typography sx={{ fontSize: "0.68rem", color: "var(--font-tertiary)" }}>{m.label}</Typography>
          </Stack>
        ))}
      </Stack>
      <Icon icon="mdi:chevron-right" width={22} style={{ color: "var(--font-tertiary)", flexShrink: 0 }} />
    </Box>
  );
}

/**
 * Which half of the list to show.
 *
 * Two kinds of course arrive in one array from `GET /courses/`: the ones this learner built
 * themselves from a roadmap topic, and the ones their institution published. They look
 * identical on the card and are interleaved by date. Named rather than numbered, because
 * "mine" and "the institution's" is the distinction a learner actually holds in their head.
 *
 * Only rendered when the list contains both - see `shouldOfferOriginFilter`.
 */
function OriginTabs({
  value,
  onChange,
  counts,
  clientName,
}: {
  value: CourseOrigin;
  onChange: (next: CourseOrigin) => void;
  counts: { mine: number; client: number };
  clientName?: string;
}) {
  const tabs: { key: CourseOrigin; label: string; count: number; icon: string }[] = [
    { key: "all", label: "All", count: counts.mine + counts.client, icon: "mdi:view-grid-outline" },
    { key: "mine", label: "Built by me", count: counts.mine, icon: "mdi:map-marker-path" },
    {
      // The tenant's own name when we have it. "From my institution" is the honest fallback:
      // a blank where a name should be reads as a bug.
      key: "client",
      label: clientName ? `From ${clientName}` : "From my institution",
      count: counts.client,
      icon: "mdi:school-outline",
    },
  ];
  return (
    <Stack
      direction="row"
      spacing={1}
      role="tablist"
      aria-label="Filter courses by who made them"
      sx={{ mb: 2, flexWrap: "wrap", rowGap: 1 }}
    >
      {tabs.map((tab) => {
        const selected = tab.key === value;
        return (
          <Box
            key={tab.key}
            component="button"
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.key)}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              cursor: "pointer",
              borderRadius: 999,
              px: 1.75,
              py: 0.85,
              fontWeight: 700,
              fontSize: "0.875rem",
              fontFamily: "inherit",
              color: selected ? "#fff" : "var(--font-secondary)",
              background: selected
                ? "linear-gradient(135deg, #a855f7, #7c3aed)"
                : "color-mix(in srgb, var(--card-bg) 70%, transparent)",
              border: "1px solid",
              borderColor: selected
                ? "transparent"
                : "color-mix(in srgb, var(--border-default) 90%, transparent)",
              [PHONE]: { minHeight: 44 },
              "&:hover": { borderColor: selected ? "transparent" : "#a855f7" },
              "&:focus-visible": { outline: "2px solid #a855f7", outlineOffset: 2 },
            }}
          >
            <Icon icon={tab.icon} width={17} />
            {tab.label}
            <Box
              component="span"
              sx={{
                fontSize: "0.78rem",
                fontWeight: 800,
                px: 0.7,
                borderRadius: 999,
                bgcolor: selected
                  ? "rgba(255,255,255,0.22)"
                  : "color-mix(in srgb, var(--font-secondary) 12%, transparent)",
              }}
            >
              {tab.count}
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}


function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <Box
      sx={{
        p: { xs: 3, md: 5 },
        borderRadius: 4,
        textAlign: "center",
        bgcolor: "color-mix(in srgb, var(--card-bg) 60%, transparent)",
        border: "1px dashed color-mix(in srgb, var(--border-default) 90%, transparent)",
      }}
    >
      <Icon icon="mdi:book-off-outline" width={48} style={{ color: "#a855f7" }} />
      <Typography sx={{ fontWeight: 800, mt: 1.5, fontSize: "1.1rem" }}>
        {"You're not enrolled in any adaptive course yet."}
      </Typography>
      <Typography sx={{ color: "text.secondary", mt: 0.75, maxWidth: 520, mx: "auto", lineHeight: 1.5 }}>
        {"Browse the courses your organisation has opened for you to join - or check back once your instructor enrolls you."}
      </Typography>
      <Chip
        label="Browse courses"
        icon={<Icon icon="mdi:compass-outline" width={18} />}
        onClick={onBrowse}
        sx={{ mt: 2, fontWeight: 700, cursor: "pointer", px: 0.5, [PHONE]: { width: "100%", height: 48, fontSize: "0.95rem", borderRadius: 3 } }}
      />
    </Box>
  );
}
