"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { config } from "@/lib/config";
import { useToast } from "@/components/common/Toast";
import {
  adminCohortsService,
  type CohortArtifact,
  type CohortArtifactType,
} from "@/lib/services/admin/admin-cohorts.service";
import { adminAdaptiveCourseService } from "@/lib/services/admin/admin-adaptive-course.service";
import { getAssessments } from "@/lib/services/admin/admin-assessment.service";

const TYPE_META: Record<
  CohortArtifactType,
  { label: string; icon: string; color: string; blurb: string }
> = {
  adaptive_course: {
    label: "Adaptive course", icon: "mdi:robot-outline", color: "#6366f1",
    blurb: "Enrols every active student in this batch, and anyone who joins later.",
  },
  live_series: {
    label: "Live session series", icon: "mdi:video-outline", color: "#ec4899",
    blurb: "Links a recurring live class to this batch so its students see it.",
  },
  classic_course: {
    label: "Classic course (legacy)", icon: "mdi:book-open-variant", color: "#0ea5e9",
    blurb: "The older course format. Use an adaptive course for anything new.",
  },
  assessment: {
    label: "Assessment", icon: "mdi:clipboard-text-outline", color: "#a855f7",
    blurb: "Makes this test available to the batch, and only the batch.",
  },
  mock_interview: {
    label: "Mock interview", icon: "mdi:account-voice", color: "#f59e0b",
    blurb: "Gives the batch access to this AI interview template.",
  },
  job_posting: {
    label: "Job posting", icon: "mdi:briefcase-outline", color: "#10b981",
    blurb: "Shows this job opening to the batch's students.",
  },
};

const ASSIGNABLE: CohortArtifactType[] = [
  "adaptive_course",
  "assessment",
  "mock_interview",
  "live_series",
  "classic_course",
  "job_posting",
];

// Types with a built-in target picker; others use a numeric id field.
const PICKER_TYPES = new Set<CohortArtifactType>(["adaptive_course", "assessment"]);

export function CohortAssignmentsTab({
  cohortId,
  artifacts,
  onChanged,
}: {
  cohortId: number;
  artifacts: CohortArtifact[];
  onChanged: () => void;
}) {
  const { showToast } = useToast();
  const [addOpen, setAddOpen] = useState(false);

  async function remove(a: CohortArtifact) {
    if (!window.confirm("Remove this assignment from the cohort?")) return;
    try {
      await adminCohortsService.removeArtifact(cohortId, a.id);
      showToast("Assignment removed.", "success");
      onChanged();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't remove.", "error");
    }
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.05rem" }}>
          Assignments <span style={{ color: "#a855f7" }}>{artifacts.length}</span>
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          onClick={() => setAddOpen(true)}
          variant="contained"
          startIcon={<Icon icon="mdi:plus" width={16} />}
          sx={{ textTransform: "none", borderRadius: 999, fontWeight: 700 }}
        >
          Add assignment
        </Button>
      </Box>

      {artifacts.length === 0 && (
        <Box sx={{ p: 4, borderRadius: 4, textAlign: "center", border: "1px dashed var(--border-default)" }}>
          <Typography sx={{ color: "text.secondary" }}>
            Nothing assigned yet - map an adaptive course, assessment, interview, live series or job to this cohort.
          </Typography>
        </Box>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        {artifacts.map((a) => {
          const meta = TYPE_META[a.artifact_type];
          return (
            <Box
              key={a.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 1.25,
                borderRadius: 3,
                bgcolor: "var(--card-bg)",
                border: "1px solid var(--border-default)",
              }}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  color: meta.color,
                  bgcolor: `color-mix(in srgb, ${meta.color} 14%, transparent)`,
                }}
              >
                <Icon icon={meta.icon} width={18} />
              </Box>
              <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }} noWrap>
                  {a.target?.label || `#${a.target?.id ?? "?"}`}
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.78rem" }}>
                  {meta.label} · {a.role}
                  {a.is_required ? " · required" : ""}
                </Typography>
              </Box>
              <ButtonBase
                onClick={() => void remove(a)}
                sx={{ p: 0.75, borderRadius: 2, color: "text.secondary", "&:hover": { color: "#ef4444" } }}
                aria-label="Remove assignment"
              >
                <Icon icon="mdi:close" width={18} />
              </ButtonBase>
            </Box>
          );
        })}
      </Box>

      <AssignArtifactDialog
        open={addOpen}
        cohortId={cohortId}
        onClose={() => setAddOpen(false)}
        onAssigned={() => {
          setAddOpen(false);
          onChanged();
        }}
      />
    </Box>
  );
}

interface TargetOption {
  id: number;
  label: string;
}

function AssignArtifactDialog({
  open,
  cohortId,
  onClose,
  onAssigned,
}: {
  open: boolean;
  cohortId: number;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const { showToast } = useToast();
  const [type, setType] = useState<CohortArtifactType>("assessment");
  const [role, setRole] = useState<"primary" | "supplemental">("supplemental");
  const [targetId, setTargetId] = useState<string>("");
  const [options, setOptions] = useState<TargetOption[]>([]);
  const [loadingOpts, setLoadingOpts] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setType("assessment");
      setRole("supplemental");
      setTargetId("");
    }
  }, [open]);

  useEffect(() => {
    if (!open || !PICKER_TYPES.has(type)) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    setLoadingOpts(true);
    setTargetId("");
    (async () => {
      try {
        let opts: TargetOption[] = [];
        if (type === "adaptive_course") {
          const courses = await adminAdaptiveCourseService.listCourses();
          opts = courses.map((c) => ({ id: c.id, label: c.title }));
        } else if (type === "assessment") {
          const assessments = await getAssessments(config.clientId);
          opts = (assessments as Array<{ id: number; title: string }>).map((a) => ({
            id: a.id,
            label: a.title,
          }));
        }
        if (!cancelled) setOptions(opts);
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoadingOpts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type, open]);

  async function submit() {
    const id = Number(targetId);
    if (!id) {
      showToast("Pick a target.", "error");
      return;
    }
    setSaving(true);
    try {
      const art = await adminCohortsService.assignArtifact(cohortId, {
        artifact_type: type,
        target_id: id,
        role,
      });
      // Assigning an adaptive course also enrolls the cohort's active students (BE).
      const enrolled = art.enrolled ?? 0;
      showToast(
        type === "adaptive_course" && enrolled > 0
          ? `Assigned. ${enrolled} student${enrolled === 1 ? "" : "s"} enrolled.`
          : "Assigned.",
        "success",
      );
      onAssigned();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't assign - already mapped, or wrong tenant.", "error");
    } finally {
      setSaving(false);
    }
  }

  const usePicker = PICKER_TYPES.has(type);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, pb: 0.5 }}>
        Give this batch something
        <Typography sx={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--font-secondary)", mt: 0.5 }}>
          Pick what the students in this cohort should get. They receive it immediately, and anyone
          who joins the cohort later gets it automatically.
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <TextField
          select
          label="What do you want to give them?"
          value={type}
          onChange={(e) => setType(e.target.value as CohortArtifactType)}
          helperText={TYPE_META[type].blurb}
        >
          {ASSIGNABLE.map((t) => (
            <MenuItem key={t} value={t}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Icon icon={TYPE_META[t].icon} width={18} style={{ color: TYPE_META[t].color }} />
                {TYPE_META[t].label}
              </Box>
            </MenuItem>
          ))}
        </TextField>

        {usePicker ? (
          <TextField
            select
            label={loadingOpts ? "Loading…" : "Which one?"}
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            disabled={loadingOpts}
          >
            {options.length === 0 && (
              <MenuItem value="" disabled>
                {loadingOpts ? "Loading…" : "None available"}
              </MenuItem>
            )}
            {options.map((o) => (
              <MenuItem key={o.id} value={String(o.id)}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        ) : (
          <TextField
            label="Which one? (paste its ID)"
            type="number"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            helperText={"You will find the ID in the URL of its own admin page."}
          />
        )}

        <TextField
          select
          label="Is this the batch's main course?"
          value={role}
          onChange={(e) => setRole(e.target.value as "primary" | "supplemental")}
          helperText={
            role === "primary"
              ? "Main: this is the course the batch is built around. Only one batch can claim a given course as its main one."
              : "Additional: extra material alongside the batch's main course. Choose this if you are unsure."
          }
        >
          <MenuItem value="supplemental">No — additional material</MenuItem>
          <MenuItem value="primary">Yes — this is the main course</MenuItem>
        </TextField>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          onClick={() => void submit()}
          disabled={saving}
          variant="contained"
          sx={{ textTransform: "none", borderRadius: 999, fontWeight: 700 }}
        >
          {saving ? "Assigning…" : "Assign"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
