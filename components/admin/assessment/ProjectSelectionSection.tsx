"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Checkbox, Paper, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { IconWrapper } from "@/components/common/IconWrapper";
import { AssessmentEmptyState, StatusChip } from "@/components/admin/assessment/shared";
import {
  RUNTIME_LABELS,
  listProjects,
  type AdminProjectTemplate,
} from "@/lib/services/admin/admin-projects.service";

/**
 * Pick which project briefs a section draws from.
 *
 * An auto-graded brief that has never passed its own harness is shown but cannot be selected. The
 * server refuses it too — this is the affordance, not the control — but refusing it here means an
 * author finds out while they are choosing rather than when they press Publish.
 */

interface ProjectSelectionSectionProps {
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  /** How many of the pool each learner is set. Marks scale to the draw, not the pool. */
  numberToShow?: number;
}

export function ProjectSelectionSection({
  selectedIds,
  onSelectionChange,
  numberToShow,
}: ProjectSelectionSectionProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<AdminProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    listProjects()
      .then((all) => setProjects(all.filter((p) => p.is_active)))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const usable = (p: AdminProjectTemplate) =>
    p.tier === "rubric" || p.verification?.status === "passed";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? projects.filter((p) => p.title.toLowerCase().includes(q)) : projects;
  }, [projects, query]);

  const selected = new Set(selectedIds);
  const toggle = (p: AdminProjectTemplate) => {
    if (!usable(p)) return;
    const next = new Set(selected);
    if (next.has(p.id)) next.delete(p.id);
    else next.add(p.id);
    onSelectionChange(Array.from(next));
  };

  const totalMarks = projects
    .filter((p) => selected.has(p.id))
    .reduce((sum, p) => sum + (p.max_marks || 0), 0);
  const drawSize = numberToShow && numberToShow > 0 ? Math.min(numberToShow, selectedIds.length) : selectedIds.length;

  if (loading) {
    return (
      <Typography sx={{ p: 2, fontSize: 13, color: "var(--font-secondary)" }}>
        Loading the project library…
      </Typography>
    );
  }

  if (projects.length === 0) {
    return (
      <AssessmentEmptyState
        icon="mdi:hammer-wrench"
        title="No projects in the library yet"
        description="Write a project brief first — its files, its live preview and its checks all live there. Then come back and add it to this section."
        action={
          <Box
            component="button"
            onClick={() => router.push("/admin/projects/new")}
            sx={{
              border: 0,
              cursor: "pointer",
              borderRadius: 2,
              px: 2,
              py: 1,
              fontSize: 14,
              color: "#fff",
              backgroundColor: "var(--accent-indigo)",
            }}
          >
            Create a project
          </Box>
        }
      />
    );
  }

  return (
    <Box>
      <TextField
        size="small"
        fullWidth
        placeholder="Search projects"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <Box sx={{ mr: 1, display: "flex", color: "var(--font-secondary)" }}>
              <IconWrapper icon="mdi:magnify" size={18} />
            </Box>
          ),
        }}
      />

      <Box sx={{ display: "grid", gap: 1 }}>
        {filtered.map((p) => {
          const on = selected.has(p.id);
          const blocked = !usable(p);
          return (
            <Paper
              key={p.id}
              elevation={0}
              onClick={() => toggle(p)}
              sx={{
                p: 1.75,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                borderRadius: 2,
                cursor: blocked ? "not-allowed" : "pointer",
                opacity: blocked ? 0.6 : 1,
                border: `1px solid ${
                  on ? "var(--accent-indigo)" : "var(--border-subtle, var(--neutral-200))"
                }`,
                backgroundColor: on
                  ? "color-mix(in srgb, var(--accent-indigo) 6%, var(--surface) 94%)"
                  : "var(--surface)",
              }}
            >
              <Checkbox checked={on} disabled={blocked} sx={{ p: 0.5 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600, fontSize: 14, color: "var(--font-primary)" }}>
                  {p.title}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "var(--font-secondary)" }}>
                  {RUNTIME_LABELS[p.runtime] ?? p.runtime} · {p.max_marks} marks
                </Typography>
              </Box>
              {blocked ? (
                <StatusChip label="Verify it first" tone="warning" icon="mdi:shield-off-outline" />
              ) : p.tier === "rubric" ? (
                <StatusChip label="Rubric" tone="ai" icon="mdi:account-eye-outline" />
              ) : (
                <StatusChip label="Verified" tone="success" icon="mdi:shield-check-outline" />
              )}
            </Paper>
          );
        })}
      </Box>

      {selectedIds.length > 0 && (
        <Typography sx={{ mt: 2, fontSize: 13, color: "var(--font-secondary)" }}>
          {selectedIds.length} selected
          {drawSize !== selectedIds.length && ` · each learner is set ${drawSize}`} ·{" "}
          {drawSize === selectedIds.length
            ? `${totalMarks} marks`
            : "marks scale to what each learner is actually given"}
          .
        </Typography>
      )}
    </Box>
  );
}

export default ProjectSelectionSection;
