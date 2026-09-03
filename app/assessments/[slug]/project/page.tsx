"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Button, Paper, Typography } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { SegmentedTabs, StatusChip } from "@/components/admin/assessment/shared";
import ProjectWorkspace from "@/components/projects/ProjectWorkspace";
import {
  getMyProjects,
  type MyProjectsResponse,
} from "@/lib/services/project-workspace.service";

/**
 * The learner's project surface.
 *
 * Deliberately its own route rather than a section inside the exam player. A project is worked on
 * across days, has no countdown and no proctoring, and the learner leaves and comes back — the
 * player is built around the opposite of all four. The server agrees: a project-only paper runs
 * to its deadline instead of `duration_minutes`, and a project section switches proctoring off.
 */

function deadlineLabel(iso: string | null): string | null {
  if (!iso) return null;
  const due = new Date(iso);
  const ms = due.getTime() - Date.now();
  if (ms <= 0) return "Deadline passed";
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  if (days > 0) return `Due in ${days} day${days === 1 ? "" : "s"}`;
  if (hours > 0) return `Due in ${hours} hour${hours === 1 ? "" : "s"}`;
  return "Due within the hour";
}

export default function LearnerProjectPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params?.slug === "string" ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : "";

  const [data, setData] = useState<MyProjectsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (!slug) return;
    getMyProjects(slug)
      .then((res) => {
        setData(res);
        if (res.workspaces.length) setActiveId(String(res.workspaces[0].id));
      })
      .catch((err) => {
        setError(
          (err as { response?: { status?: number } })?.response?.status === 404
            ? "You have not started this assessment yet."
            : "Your projects could not be loaded."
        );
      });
  }, [slug]);

  const active = useMemo(
    () => data?.workspaces.find((w) => String(w.id) === activeId) ?? null,
    [data, activeId]
  );

  if (error) {
    return (
      <MainLayout>
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 2,
              textAlign: "center",
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border-subtle, var(--neutral-200))",
            }}
          >
            <Typography sx={{ mb: 2, color: "var(--font-primary)" }}>{error}</Typography>
            <Button
              variant="contained"
              onClick={() => router.push(`/assessments/${slug}`)}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              Back to the assessment
            </Button>
          </Paper>
        </Box>
      </MainLayout>
    );
  }

  if (!data) {
    return (
      <MainLayout>
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography sx={{ color: "var(--font-secondary)" }}>Opening your projects…</Typography>
        </Box>
      </MainLayout>
    );
  }

  const due = deadlineLabel(data.assessment.end_time);
  const closed = !data.submission.is_open;

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
            mb: 2.5,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: "var(--font-secondary)",
              }}
            >
              Project
            </Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: "var(--font-primary)" }}>
              {data.assessment.title}
            </Typography>
            <Typography sx={{ fontSize: 13.5, color: "var(--font-secondary)", mt: 0.5 }}>
              {closed
                ? "You have submitted this. Your work stays here to read."
                : "Your work saves as you type. Come back to it whenever you like."}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            {due && (
              <StatusChip
                label={due}
                tone={due === "Deadline passed" ? "error" : "info"}
                icon="mdi:calendar-clock-outline"
              />
            )}
            {!data.assessment.end_time && !closed && (
              <StatusChip label="No deadline" tone="neutral" icon="mdi:infinity" />
            )}
            {closed && <StatusChip label="Submitted" tone="neutral" icon="mdi:lock-outline" />}
            <Button
              startIcon={<IconWrapper icon="mdi:arrow-left" size={18} />}
              onClick={() => router.push(`/assessments/${slug}`)}
              sx={{ textTransform: "none", color: "var(--accent-indigo)" }}
            >
              Back
            </Button>
          </Box>
        </Box>

        {data.workspaces.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 2,
              textAlign: "center",
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border-subtle, var(--neutral-200))",
            }}
          >
            <Typography sx={{ color: "var(--font-secondary)" }}>
              There are no projects on this assessment.
            </Typography>
          </Paper>
        ) : (
          <>
            {data.workspaces.length > 1 && (
              <Box sx={{ mb: 2 }}>
                <SegmentedTabs
                  tabs={data.workspaces.map((w) => ({
                    value: String(w.id),
                    label: w.template.title,
                    icon: "mdi:hammer-wrench",
                  }))}
                  value={activeId}
                  onChange={setActiveId}
                />
              </Box>
            )}
            {active && (
              <ProjectWorkspace key={active.id} workspaceId={active.id} locked={closed} />
            )}
          </>
        )}
      </Box>
    </MainLayout>
  );
}
