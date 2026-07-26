"use client";

import { useEffect, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { KpiRail, Reveal } from "@/components/scorecard/shared";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import {
  instructorService,
  type InstructorOverview,
  type InstructorCohort,
  type InstructorCourse,
} from "@/lib/services/instructor.service";

export default function InstructorDashboardPage() {
  const { push, prefetch } = useInstantNavigation();
  const [overview, setOverview] = useState<InstructorOverview | null>(null);
  const [cohorts, setCohorts] = useState<InstructorCohort[]>([]);
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [o, ch, co] = await Promise.all([
          instructorService.getOverview(),
          instructorService.getCohorts(),
          instructorService.getCourses(),
        ]);
        if (cancelled) return;
        setOverview(o);
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

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Teach"
        title="Instructor dashboard"
        description={
          overview?.is_admin_view
            ? "Admin view — every batch and course in your organisation."
            : "Your assigned batches and courses, and the students in them."
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
              { value: overview?.cohorts ?? 0, label: "My batches", accent: "#6366f1" },
              { value: overview?.courses ?? 0, label: "My courses", accent: "#a855f7" },
              { value: overview?.students ?? 0, label: "Students", accent: "#10b981" },
            ]}
          />

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
    </PageShell>
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
