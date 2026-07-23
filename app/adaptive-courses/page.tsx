"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  Container,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import {
  adaptiveCourseService,
  type AdaptiveCourseListItem,
} from "@/lib/services/adaptive-course.service";
import { useIsAdaptiveQuizEnabled } from "@/lib/contexts/ClientInfoContext";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { ViewToggle, type ListView } from "@/components/common/list";
import { KpiRail, Reveal } from "@/components/scorecard/shared";
import { AdaptiveCourseCard } from "@/components/courses/AdaptiveCourseCard";
import { AdaptiveCourseListSkeleton } from "@/components/courses/CourseSkeletons";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";

export default function AdaptiveCourseListPage() {
  const { push, prefetch } = useInstantNavigation();
  const featureOn = useIsAdaptiveQuizEnabled();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AdaptiveCourseListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [sort, setSort] = useState<"recent" | "title" | "content">("recent");
  const [viewMode, setViewMode] = useState<ListView>("cards");

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

  const stats = useMemo(() => {
    let modules = 0;
    let quizzes = 0;
    let articles = 0;
    for (const c of items) {
      modules += c.module_count;
      quizzes += c.quiz_count;
      articles += c.article_count;
    }
    return { courses: items.length, modules, quizzes, articles };
  }, [items]);

  // Difficulty chips are derived from whatever the catalog actually uses.
  const difficultyOptions = useMemo(() => {
    const s = new Set<string>();
    items.forEach((c) => (c.difficulty_levels || []).forEach((d) => d && s.add(d)));
    return Array.from(s);
  }, [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.filter((c) => {
      const matchesQuery =
        !q ||
        c.title.toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q) ||
        (c.target_audience || "").toLowerCase().includes(q);
      const matchesDifficulty =
        difficulty === "all" || (c.difficulty_levels || []).includes(difficulty);
      return matchesQuery && matchesDifficulty;
    });
    const contentScore = (c: AdaptiveCourseListItem) =>
      c.module_count + c.quiz_count + c.article_count + (c.coding_count ?? 0) + (c.video_count ?? 0);
    return [...filtered].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "content") return contentScore(b) - contentScore(a);
      return (b.updated_at || "").localeCompare(a.updated_at || "");
    });
  }, [items, query, difficulty, sort]);

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
        description="AI-personalised courses that adapt to your level in real time — practice, get instant feedback, and level up."
        accent="purple"
        icon="mdi:book-education-outline"
      />

      {items.length > 0 && (
            <KpiRail
              items={[
                { value: stats.courses, label: "Courses available", accent: "#6366f1" },
                { value: stats.modules, label: "Modules", accent: "#a855f7" },
                { value: stats.articles, label: "Adaptive articles", accent: "#10b981" },
                { value: stats.quizzes, label: "Adaptive quizzes", accent: "#ec4899" },
              ]}
            />
          )}

          {loading && <AdaptiveCourseListSkeleton />}

          {error && (
            <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>
              {error}
            </Typography>
          )}

          {!loading && !error && items.length === 0 && <EmptyState />}

          {!loading && !error && items.length > 0 && (
            <Box sx={{ mb: 2.5 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
                <TextField
                  size="small"
                  placeholder="Search adaptive courses…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Icon icon="mdi:magnify" width={18} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ flex: 1, minWidth: { xs: "100%", md: 280 }, bgcolor: "var(--card-bg, #fff)", borderRadius: 2 }}
                />
                <Select
                  size="small"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as "recent" | "title" | "content")}
                  sx={{ minWidth: 190, bgcolor: "var(--card-bg, #fff)" }}
                >
                  <MenuItem value="recent">Recently updated</MenuItem>
                  <MenuItem value="title">Title (A–Z)</MenuItem>
                  <MenuItem value="content">Most content</MenuItem>
                </Select>
                <ViewToggle value={viewMode} onChange={setViewMode} />
              </Stack>

              {difficultyOptions.length > 0 && (
                <Stack direction="row" sx={{ mt: 1.5, flexWrap: "wrap", gap: 1 }}>
                  {[{ key: "all", label: "All levels" }, ...difficultyOptions.map((d) => ({ key: d, label: d }))].map((opt) => {
                    const selected = difficulty === opt.key;
                    return (
                      <Chip
                        key={opt.key}
                        label={opt.label}
                        onClick={() => setDifficulty(opt.key)}
                        sx={{
                          fontWeight: 700,
                          color: selected ? "white" : "text.primary",
                          background: selected ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" : "transparent",
                          border: selected ? "1px solid transparent" : "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                          "&:hover": { background: selected ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" : "color-mix(in srgb, #6366f1 8%, transparent)" },
                        }}
                      />
                    );
                  })}
                </Stack>
              )}
            </Box>
          )}

          {!loading && !error && items.length > 0 && visible.length === 0 && (
            <Box sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, textAlign: "center", bgcolor: "color-mix(in srgb, var(--card-bg) 60%, transparent)", border: "1px dashed color-mix(in srgb, var(--border-default) 90%, transparent)" }}>
              <Icon icon="mdi:magnify-close" width={44} style={{ color: "#a855f7" }} />
              <Typography sx={{ fontWeight: 800, mt: 1.5, fontSize: "1.05rem" }}>No adaptive courses match your search.</Typography>
              <Chip
                label="Clear search & filters"
                onClick={() => {
                  setQuery("");
                  setDifficulty("all");
                }}
                sx={{ mt: 1.75, fontWeight: 700, cursor: "pointer" }}
              />
            </Box>
          )}

          {!loading && visible.length > 0 && viewMode === "cards" && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
                gap: 2,
                alignItems: "stretch",
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
            <Stack spacing={1.25}>
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

function EmptyState() {
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
        {"Adaptive courses appear here once your instructor enrolls you. Check back soon — or reach out to your instructor if you're expecting access."}
      </Typography>
    </Box>
  );
}
