"use client";

import { useEffect, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { Reveal } from "@/components/scorecard/shared";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { instructorService, type InstructorCourse } from "@/lib/services/instructor.service";

export default function InstructorCoursesPage() {
  const { push, prefetch } = useInstantNavigation();
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await instructorService.getCourses();
        if (!cancelled) setCourses(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Couldn't load your courses.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Teach"
        title="Course Content"
        description="The course material you teach. A course is the content; a batch is the group of students studying it — open My Batches to work with a specific class."
        accent="purple"
        icon="mdi:book-education"
      />
      {error && <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>{error}</Typography>}
      {!error && !loading && courses.length === 0 && (
        <Box sx={{ p: 4, textAlign: "center", borderRadius: 3, border: "1px dashed var(--border-default)" }}>
          <Typography sx={{ color: "text.secondary" }}>No courses assigned yet.</Typography>
        </Box>
      )}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }, gap: 2 }}>
        {courses.map((c, i) => (
          <Reveal key={c.id} delay={Math.min(i, 8) * 0.05}>
            <Box
              onClick={() => push(`/instructor/courses/${c.id}`)}
              onMouseEnter={() => prefetch(`/instructor/courses/${c.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") push(`/instructor/courses/${c.id}`); }}
              sx={{ cursor: "pointer", p: 2.25, borderRadius: 3, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)",
                transition: "transform .14s, box-shadow .14s, border-color .14s",
                "&:hover": { transform: "translateY(-3px)", borderColor: "color-mix(in srgb, #a855f7 40%, transparent)", boxShadow: "0 20px 40px -26px rgba(168,85,247,0.45)" } }}
            >
              <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2.5, display: "grid", placeItems: "center", color: "#fff", flexShrink: 0, background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
                  <Icon icon="mdi:book-education" width={20} />
                </Box>
                <Chip size="small" label={c.is_published ? "published" : "draft"}
                  sx={{ fontWeight: 700, color: c.is_published ? "#10b981" : "#f59e0b",
                    bgcolor: `color-mix(in srgb, ${c.is_published ? "#10b981" : "#f59e0b"} 14%, transparent)` }} />
              </Stack>
              <Typography sx={{ fontWeight: 800, fontSize: "1rem" }} noWrap>{c.title}</Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.84rem", mt: 0.5 }}>
                {c.student_count} student{c.student_count === 1 ? "" : "s"}
              </Typography>
            </Box>
          </Reveal>
        ))}
      </Box>
    </PageShell>
  );
}
