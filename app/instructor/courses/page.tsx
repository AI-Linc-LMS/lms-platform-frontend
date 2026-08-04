"use client";

import { useEffect, useState } from "react";
import { Box, Chip, Stack, Tooltip, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { Reveal } from "@/components/scorecard/shared";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { instructorService, type InstructorCourse } from "@/lib/services/instructor.service";
import { ManualCourseDialog } from "@/components/admin/adaptive-course/ManualCourseDialog";
import { HeaderActionButton } from "@/components/common/ModulePageHeader";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";

export default function InstructorCoursesPage() {
  const { push, prefetch } = useInstantNavigation();
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buildOpen, setBuildOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await instructorService.getCourses();
        if (!cancelled) setCourses(list);
      } catch (e) {
        if (!cancelled) setError(getAxiosErrorDetail(e, "Couldn't load your courses."));
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
        action={
          // An instructor can build their own course. It stays theirs — full edit rights over
          // every part of it — and goes to an admin for review before any student sees it.
          <HeaderActionButton icon="mdi:plus" onClick={() => setBuildOpen(true)}>
            Build a course
          </HeaderActionButton>
        }
      />
      {error && <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>{error}</Typography>}
      {!error && !loading && courses.length === 0 && (
        <Box sx={{ p: 4, textAlign: "center", borderRadius: 3, border: "1px dashed var(--border-default)" }}>
          <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Nothing here yet</Typography>
          <Typography sx={{ color: "text.secondary", maxWidth: 520, mx: "auto", lineHeight: 1.6 }}>
            Courses you are assigned to teach appear here. You can also{" "}
            <strong>build one of your own</strong> — you keep full control of it, and an admin
            reviews it before students see it.
          </Typography>
        </Box>
      )}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }, gap: 2 }}>
        {courses.map((c, i) => {
          // A course you BUILT opens in the builder; a course you were assigned to teach opens on
          // its roster. Both used to go to the roster, so the card that said "Yours to build.
          // Send it for review when it is ready" led to a list of students — with no way from
          // there to add a single piece of content, which is the one thing it was asking for.
          //
          // Only adaptive courses have either view. Classic ids come from a different table, so
          // sending one there would open an unrelated course that happens to share the number.
          const href =
            c.kind !== "adaptive"
              ? null
              : c.authored_by_me
                ? `/admin/adaptive-courses/${c.id}`
                : `/instructor/courses/${c.id}`;
          const open = () => { if (href) push(href); };
          return (
            <Reveal key={`${c.kind}-${c.id}`} delay={Math.min(i, 8) * 0.05}>
              <Box
                onClick={open}
                onMouseEnter={() => { if (href) prefetch(href); }}
                {...(href ? { role: "button", tabIndex: 0 } : {})}
                onKeyDown={(e) => { if (href && e.key === "Enter") open(); }}
                sx={{ cursor: href ? "pointer" : "default", p: 2.25, borderRadius: 3, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)",
                  transition: "transform .14s, box-shadow .14s, border-color .14s",
                  ...(href ? { "&:hover": { transform: "translateY(-3px)", borderColor: "color-mix(in srgb, #a855f7 40%, transparent)", boxShadow: "0 20px 40px -26px rgba(168,85,247,0.45)" } } : {}) }}
              >
                <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2.5, display: "grid", placeItems: "center", color: "#fff", flexShrink: 0,
                    background: c.kind === "adaptive" ? "linear-gradient(135deg,#6366f1,#a855f7)" : "linear-gradient(135deg,#0ea5e9,#14b8a6)" }}>
                    <Icon icon={c.kind === "adaptive" ? "mdi:book-education" : "mdi:book-open-variant"} width={20} />
                  </Box>
                  <Chip size="small" label={c.is_published ? "published" : "draft"}
                    sx={{ fontWeight: 700, color: c.is_published ? "#10b981" : "#f59e0b",
                      bgcolor: `color-mix(in srgb, ${c.is_published ? "#10b981" : "#f59e0b"} 14%, transparent)` }} />
                  {c.kind === "classic" && (
                    <Tooltip title="A classic course. Its content is managed in the admin course area — the instructor course view is adaptive-only for now.">
                      <Chip size="small" label="classic"
                        sx={{ fontWeight: 700, color: "#0ea5e9", bgcolor: "color-mix(in srgb, #0ea5e9 14%, transparent)" }} />
                    </Tooltip>
                  )}
                </Stack>
                <Typography sx={{ fontWeight: 800, fontSize: "1rem" }} noWrap>{c.title}</Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.84rem", mt: 0.5 }}>
                  {c.student_count} student{c.student_count === 1 ? "" : "s"}
                </Typography>
                {c.authored_by_me && <AuthoredStatus course={c} />}
                {/* Says where the card goes. Everything here was clickable and nothing was
                    labelled, so "build your course" and "see who is on it" looked identical. */}
                {href && (
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.5}
                    sx={{ mt: 1.5, fontSize: "0.82rem", fontWeight: 800, color: "#6366f1" }}
                  >
                    <Icon
                      icon={c.authored_by_me ? "mdi:hammer-wrench" : "mdi:account-group-outline"}
                      width={16}
                    />
                    {c.authored_by_me ? "Open the builder" : "View students"}
                    <Icon icon="mdi:arrow-right" width={15} />
                  </Stack>
                )}
              </Box>
            </Reveal>
          );
        })}
      </Box>

      <ManualCourseDialog
        open={buildOpen}
        onClose={() => setBuildOpen(false)}
        onCreated={(courseId) => {
          setBuildOpen(false);
          // Straight into the builder: an empty course in a list of populated ones is
          // indistinguishable from a failed create.
          push(`/admin/adaptive-courses/${courseId}`);
        }}
      />
    </PageShell>
  );
}

/** Where an instructor's own course stands, and — on a rejection — what to do about it. */
function AuthoredStatus({ course }: { course: InstructorCourse }) {
  const map: Record<string, { label: string; tone: string; hint: string }> = {
    draft: {
      label: "Your draft",
      tone: "#6366f1",
      // Names the destination. "Send it for review when it is ready" described a button that
      // lives on a page the card never took you to, so it read as an instruction with no verb.
      hint: "Open it to add weeks, topics and content — then send it for review from there.",
    },
    pending_review: {
      label: "Waiting for review",
      tone: "#f59e0b",
      hint: "An admin is reviewing it. Students cannot see it yet.",
    },
    approved: {
      label: "Approved",
      tone: "#10b981",
      hint: "An admin approved it. They assign students to make it live.",
    },
    rejected: {
      label: "Sent back",
      tone: "#ef4444",
      // The reason itself replaces this — see below. This is only the fallback for a
      // rejection with no note, which the API refuses but old rows might carry.
      hint: "An admin sent this back for changes.",
    },
  };
  const state = map[course.review_status];
  if (!state) return null;

  return (
    <Box sx={{ mt: 1.25 }}>
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
        <Chip
          size="small"
          label={state.label}
          sx={{
            fontWeight: 800,
            color: state.tone,
            bgcolor: `color-mix(in srgb, ${state.tone} 14%, transparent)`,
          }}
        />
        <Chip
          size="small"
          label="built by you"
          sx={{ fontWeight: 700, color: "text.secondary", bgcolor: "color-mix(in srgb, var(--border-default) 60%, transparent)" }}
        />
      </Stack>
      <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", lineHeight: 1.45 }}>
        {/* The admin's own words, verbatim: a rejection with no reason attached tells the
            instructor nothing about what to change, and the same course comes back unchanged. */}
        {course.review_status === "rejected" && course.review_note
          ? course.review_note
          : state.hint}
      </Typography>
    </Box>
  );
}
