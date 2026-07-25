"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import {
  adaptiveCourseService,
  type AdaptiveCourseListItem,
} from "@/lib/services/adaptive-course.service";
import { useIsAdaptiveQuizEnabled } from "@/lib/contexts/ClientInfoContext";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import { SearchFilterBar } from "@/components/common/list";
import { Reveal } from "@/components/scorecard/shared";
import { CatalogCourseCard } from "@/components/courses/CatalogCourseCard";
import { AdaptiveCourseListSkeleton } from "@/components/courses/CourseSkeletons";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { useToast } from "@/components/common/Toast";

export default function AdaptiveCourseCatalogPage() {
  const { push } = useInstantNavigation();
  const { showToast } = useToast();
  const featureOn = useIsAdaptiveQuizEnabled();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AdaptiveCourseListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [enrollingId, setEnrollingId] = useState<number | null>(null);

  useEffect(() => {
    if (!featureOn) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await adaptiveCourseService.getCatalog();
        if (!cancelled) setItems(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load the course catalog.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [featureOn]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q) ||
        (c.target_audience || "").toLowerCase().includes(q),
    );
  }, [items, query]);

  async function handleEnroll(course: AdaptiveCourseListItem) {
    if (enrollingId !== null) return;
    setEnrollingId(course.id);
    try {
      await adaptiveCourseService.selfEnroll(course.id);
      // Drop it from the catalog (it now lives in "My courses") and route the learner in.
      setItems((prev) => prev.filter((c) => c.id !== course.id));
      showToast(`You're enrolled in "${course.title}".`, "success");
      push(`/adaptive-courses/${course.id}`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't enroll in that course.", "error");
    } finally {
      setEnrollingId(null);
    }
  }

  if (!featureOn) {
    return (
      <PageShell>
        <Box sx={{ py: 8, textAlign: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {"Adaptive Course isn't enabled for this organisation."}
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 1 }}>
            {'Ask your administrator to switch on the "Adaptive Quiz" feature.'}
          </Typography>
        </Box>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Learn"
        title="Browse courses"
        description="Courses your organisation has opened for you to join. Enroll in one and it moves into My courses instantly."
        accent="purple"
        icon="mdi:compass-outline"
        action={
          <HeaderActionButton icon="mdi:book-education-outline" variant="ghost" onClick={() => push("/adaptive-courses")}>
            My courses
          </HeaderActionButton>
        }
      />

      {loading && <AdaptiveCourseListSkeleton />}

      {error && (
        <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>
          {error}
        </Typography>
      )}

      {!loading && !error && items.length === 0 && <CatalogEmptyState onBack={() => push("/adaptive-courses")} />}

      {!loading && !error && items.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <SearchFilterBar
            search={query}
            onSearchChange={setQuery}
            searchPlaceholder="Search available courses…"
          />
        </Box>
      )}

      {!loading && !error && items.length > 0 && visible.length === 0 && (
        <Box
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            textAlign: "center",
            bgcolor: "color-mix(in srgb, var(--card-bg) 60%, transparent)",
            border: "1px dashed color-mix(in srgb, var(--border-default) 90%, transparent)",
          }}
        >
          <Icon icon="mdi:magnify-close" width={44} style={{ color: "#a855f7" }} />
          <Typography sx={{ fontWeight: 800, mt: 1.5, fontSize: "1.05rem" }}>No courses match your search.</Typography>
          <Chip label="Clear search" onClick={() => setQuery("")} sx={{ mt: 1.75, fontWeight: 700, cursor: "pointer" }} />
        </Box>
      )}

      {!loading && visible.length > 0 && (
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
              <CatalogCourseCard
                course={course}
                enrolling={enrollingId === course.id}
                disabled={enrollingId !== null && enrollingId !== course.id}
                onEnroll={() => void handleEnroll(course)}
              />
            </Reveal>
          ))}
        </Box>
      )}
    </PageShell>
  );
}

function CatalogEmptyState({ onBack }: { onBack: () => void }) {
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
      <Icon icon="mdi:compass-off-outline" width={48} style={{ color: "#a855f7" }} />
      <Typography sx={{ fontWeight: 800, mt: 1.5, fontSize: "1.1rem" }}>
        No courses are open to join right now.
      </Typography>
      <Typography sx={{ color: "text.secondary", mt: 0.75, maxWidth: 520, mx: "auto", lineHeight: 1.5 }}>
        {"When your organisation opens a course for self-enrollment, it'll show up here. You may already be enrolled in others."}
      </Typography>
      <Chip label="Back to my courses" onClick={onBack} sx={{ mt: 2, fontWeight: 700, cursor: "pointer" }} />
    </Box>
  );
}
