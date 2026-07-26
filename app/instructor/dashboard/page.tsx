"use client";

import { useEffect, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { KpiRail, Reveal } from "@/components/scorecard/shared";
import { StudentDetailDrawer } from "@/components/instructor/StudentDetailDrawer";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import {
  instructorService,
  type InstructorDashboard,
  type InstructorStatStudent,
  type InstructorCohort,
  type InstructorCourse,
} from "@/lib/services/instructor.service";

export default function InstructorDashboardPage() {
  const { push, prefetch } = useInstantNavigation();
  const [dash, setDash] = useState<InstructorDashboard | null>(null);
  const [cohorts, setCohorts] = useState<InstructorCohort[]>([]);
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [d, ch, co] = await Promise.all([
          instructorService.getDashboard(),
          instructorService.getCohorts(),
          instructorService.getCourses(),
        ]);
        if (cancelled) return;
        setDash(d);
        setCohorts(ch);
        setCourses(co);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load your dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = (dash?.instructor_name || "").trim().split(/\s+/)[0] || "Instructor";

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Teach"
        title={`Welcome, ${firstName}`}
        description={
          dash?.is_admin_view
            ? "Admin preview — every batch, course, and student in your organisation."
            : "You see the courses & cohorts you're assigned to, and the students in them."
        }
        accent="indigo"
        icon="mdi:teach"
      />

      {error && (
        <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>{error}</Typography>
      )}

      {!error && (
        <>
          <KpiRail
            items={[
              { value: dash?.batches ?? 0, label: "My batches", accent: "#6366f1" },
              { value: dash?.courses ?? 0, label: "My courses", accent: "#a855f7" },
              { value: dash?.students ?? 0, label: "Students", accent: "#10b981" },
              { value: dash?.active_students ?? 0, label: "Active (7d)", accent: "#06b6d4" },
              { value: `${dash?.avg_progress ?? 0}%`, label: "Avg progress", accent: "#f59e0b" },
              { value: dash?.upcoming_sessions ?? 0, label: "Upcoming sessions", accent: "#ec4899" },
            ]}
          />

          {/* Student statistics — at-risk + top performers side by side */}
          <Box
            sx={{
              mt: 3.5,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            }}
          >
            <StudentStatList
              title="Needs attention"
              icon="mdi:alert-outline"
              accent="#ef4444"
              emptyText={loading ? "Loading…" : "No at-risk students — great job!"}
              students={dash?.at_risk ?? []}
              onOpen={setSelectedStudent}
            />
            <StudentStatList
              title="Top performers"
              icon="mdi:trophy-outline"
              accent="#10b981"
              emptyText={loading ? "Loading…" : "No student progress yet."}
              students={dash?.top_performers ?? []}
              onOpen={setSelectedStudent}
            />
          </Box>

          <Section title="My batches" icon="mdi:account-group-outline" empty={!loading && cohorts.length === 0}
            emptyText="No batches assigned yet. An admin can assign you to a cohort.">
            <CardGrid>
              {cohorts.map((c, i) => (
                <Reveal key={c.id} delay={Math.min(i, 8) * 0.05}>
                  <EntityCard
                    icon="mdi:account-group"
                    title={c.name}
                    subtitle={`${c.member_count} student${c.member_count === 1 ? "" : "s"} · ${c.artifact_count} item${c.artifact_count === 1 ? "" : "s"}`}
                    chip={c.status}
                    onOpen={() => push(`/instructor/cohorts/${c.id}`)}
                    onHover={() => prefetch(`/instructor/cohorts/${c.id}`)}
                  />
                </Reveal>
              ))}
            </CardGrid>
          </Section>

          <Section title="My courses" icon="mdi:book-education-outline" empty={!loading && courses.length === 0}
            emptyText="No courses assigned yet.">
            <CardGrid>
              {courses.map((c, i) => (
                <Reveal key={c.id} delay={Math.min(i, 8) * 0.05}>
                  <EntityCard
                    icon="mdi:book-education"
                    title={c.title}
                    subtitle={`${c.student_count} student${c.student_count === 1 ? "" : "s"}`}
                    chip={c.is_published ? "published" : "draft"}
                    chipColor={c.is_published ? "#10b981" : "#f59e0b"}
                    onOpen={() => push(`/instructor/courses/${c.id}`)}
                    onHover={() => prefetch(`/instructor/courses/${c.id}`)}
                  />
                </Reveal>
              ))}
            </CardGrid>
          </Section>
        </>
      )}

      <StudentDetailDrawer
        studentId={selectedStudent}
        open={selectedStudent != null}
        onClose={() => setSelectedStudent(null)}
      />
    </PageShell>
  );
}

function StudentStatList({
  title,
  icon,
  accent,
  students,
  emptyText,
  onOpen,
}: {
  title: string;
  icon: string;
  accent: string;
  students: InstructorStatStudent[];
  emptyText: string;
  onOpen: (id: number) => void;
}) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        bgcolor: "var(--card-bg, #fff)",
        border: "1px solid var(--border-default, #ececf1)",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <Icon icon={icon} width={20} style={{ color: accent }} />
        <Typography sx={{ fontWeight: 800, fontSize: "1rem" }}>{title}</Typography>
      </Stack>
      {students.length === 0 ? (
        <Typography sx={{ color: "text.secondary", fontSize: "0.85rem", py: 1 }}>{emptyText}</Typography>
      ) : (
        <Stack spacing={0.75}>
          {students.map((s) => (
            <Box
              key={s.student_id}
              onClick={() => onOpen(s.student_id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpen(s.student_id);
                }
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                p: 1,
                borderRadius: 2,
                cursor: "pointer",
                "&:hover": { bgcolor: "color-mix(in srgb, var(--card-bg) 40%, transparent)" },
                "&:focus-visible": { outline: `2px solid ${accent}`, outlineOffset: 1 },
              }}
            >
              <Box sx={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, display: "grid",
                placeItems: "center", color: "#fff", fontWeight: 800, fontSize: "0.8rem",
                background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
                {(s.name || s.email || "?").slice(0, 1).toUpperCase()}
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.86rem" }} noWrap>{s.name || s.email}</Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.76rem" }} noWrap>{s.email}</Typography>
              </Box>
              <Chip
                size="small"
                label={`${Math.round(s.progress)}%`}
                sx={{ fontWeight: 800, color: accent, bgcolor: `color-mix(in srgb, ${accent} 14%, transparent)` }}
              />
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}

function Section({
  title,
  icon,
  children,
  empty,
  emptyText,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  empty: boolean;
  emptyText: string;
}) {
  return (
    <Box sx={{ mt: 3.5 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <Icon icon={icon} width={20} style={{ color: "#6366f1" }} />
        <Typography sx={{ fontWeight: 800, fontSize: "1.05rem" }}>{title}</Typography>
      </Stack>
      {empty ? (
        <Box
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            textAlign: "center",
            bgcolor: "color-mix(in srgb, var(--card-bg) 60%, transparent)",
            border: "1px dashed color-mix(in srgb, var(--border-default) 90%, transparent)",
          }}
        >
          <Typography sx={{ color: "text.secondary" }}>{emptyText}</Typography>
        </Box>
      ) : (
        children
      )}
    </Box>
  );
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
        gap: 2,
      }}
    >
      {children}
    </Box>
  );
}

function EntityCard({
  icon,
  title,
  subtitle,
  chip,
  chipColor = "#6366f1",
  onOpen,
  onHover,
}: {
  icon: string;
  title: string;
  subtitle: string;
  chip: string;
  chipColor?: string;
  onOpen: () => void;
  onHover?: () => void;
}) {
  return (
    <Box
      onClick={onOpen}
      onMouseEnter={onHover}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      sx={{
        cursor: "pointer",
        p: 2.25,
        borderRadius: 3,
        bgcolor: "var(--card-bg, #fff)",
        border: "1px solid var(--border-default, #ececf1)",
        transition: "transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease",
        "&:hover": {
          transform: "translateY(-3px)",
          borderColor: "color-mix(in srgb, #6366f1 40%, transparent)",
          boxShadow: "0 20px 40px -26px rgba(99,102,241,0.45)",
        },
        "&:focus-visible": { outline: "2px solid #6366f1", outlineOffset: 2 },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2.5,
            display: "grid",
            placeItems: "center",
            color: "#fff",
            flexShrink: 0,
            background: "linear-gradient(135deg,#6366f1,#a855f7)",
          }}
        >
          <Icon icon={icon} width={20} />
        </Box>
        <Box
          component="span"
          sx={{
            px: 1,
            py: 0.3,
            borderRadius: 999,
            fontSize: "0.62rem",
            fontWeight: 800,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            color: chipColor,
            bgcolor: `color-mix(in srgb, ${chipColor} 14%, transparent)`,
          }}
        >
          {chip}
        </Box>
      </Stack>
      <Typography sx={{ fontWeight: 800, fontSize: "1rem", lineHeight: 1.3 }} noWrap>
        {title}
      </Typography>
      <Typography sx={{ color: "text.secondary", fontSize: "0.84rem", mt: 0.5 }}>{subtitle}</Typography>
    </Box>
  );
}
