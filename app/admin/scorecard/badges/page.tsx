"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  adminBadgesService,
  type Badge,
  type BadgeCriteriaType,
} from "@/lib/services/admin/admin-badges.service";

const CRITERIA_TYPES: Array<{
  value: BadgeCriteriaType;
  label: string;
  fields: Array<{ name: string; label: string; type: "number"; placeholder?: string }>;
  helperText: string;
}> = [
  {
    value: "streak",
    label: "Active-day streak",
    fields: [{ name: "days", label: "Days", type: "number", placeholder: "e.g. 7" }],
    helperText: "Awards when the learner has a current daily streak ≥ days.",
  },
  {
    value: "assessments_completed",
    label: "Assessments completed",
    fields: [{ name: "count", label: "Count", type: "number", placeholder: "e.g. 5" }],
    helperText: "Awards when the learner has submitted ≥ count assessments.",
  },
  {
    value: "mock_interviews",
    label: "Mock interviews completed",
    fields: [{ name: "count", label: "Count", type: "number", placeholder: "e.g. 1" }],
    helperText: "Awards when the learner has completed ≥ count mock interviews.",
  },
  {
    value: "skill_score",
    label: "Skill proficiency",
    fields: [
      { name: "skill_id", label: "Skill ID", type: "number" },
      { name: "min", label: "Min %", type: "number", placeholder: "0-100" },
    ],
    helperText: "Awards when the learner's proficiency on this specific skill ≥ min %.",
  },
  {
    value: "course_complete",
    label: "Course completion",
    fields: [{ name: "course_id", label: "Course ID", type: "number" }],
    helperText: "Awards when the learner has a passed activity on every Content row in the course.",
  },
  {
    value: "first_submission",
    label: "First assessment submission",
    fields: [],
    helperText: "Awards on the learner's first assessment submission. No parameters.",
  },
  {
    value: "overall_score",
    label: "Overall performance",
    fields: [{ name: "min", label: "Min %", type: "number", placeholder: "0-100" }],
    helperText: "Awards when the learner's overall performance score ≥ min %.",
  },
];

type CriteriaForm = { type: BadgeCriteriaType; values: Record<string, string> };

const DEFAULT_CRITERIA: CriteriaForm = {
  type: "first_submission",
  values: {},
};

function buildCriteriaJson(form: CriteriaForm): Record<string, unknown> {
  const out: Record<string, unknown> = { type: form.type };
  for (const [k, v] of Object.entries(form.values)) {
    if (v === "") continue;
    const n = Number(v);
    if (!Number.isFinite(n)) continue;
    out[k] = n;
  }
  return out;
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Box
      sx={{
        px: 1.75,
        py: 0.75,
        borderRadius: 2,
        bgcolor: "color-mix(in srgb, var(--border-default) 30%, transparent)",
        display: "flex",
        flexDirection: "column",
        minWidth: 88,
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase", fontSize: "0.65rem" }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontWeight: 800,
          color,
          fontSize: "1.05rem",
          lineHeight: 1.2,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default function AdminScorecardBadgesPage() {
  const { showToast } = useToast();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Badge | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconSlug, setIconSlug] = useState("mdi:trophy-outline");
  const [points, setPoints] = useState<string>("10");
  const [criteriaForm, setCriteriaForm] = useState<CriteriaForm>(DEFAULT_CRITERIA);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminBadgesService.listBadges(false);
      setBadges(data);
    } catch (error: any) {
      console.warn("Failed to load badges:", error);
      showToast(error?.message || "Failed to load badges", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => {
    const total = badges.length;
    const totalAwarded = badges.reduce((acc, b) => acc + b.awardedCount, 0);
    const totalPoints = badges.reduce((acc, b) => acc + b.points, 0);
    return { total, totalAwarded, totalPoints };
  }, [badges]);

  const resetForm = useCallback(() => {
    setName("");
    setDescription("");
    setIconSlug("mdi:trophy-outline");
    setPoints("10");
    setCriteriaForm(DEFAULT_CRITERIA);
    setEditing(null);
  }, []);

  const openNew = useCallback(() => {
    resetForm();
    setEditorOpen(true);
  }, [resetForm]);

  const openEdit = useCallback((badge: Badge) => {
    setEditing(badge);
    setName(badge.name);
    setDescription(badge.description);
    setIconSlug(badge.iconSlug);
    setPoints(String(badge.points));
    const criteria = (badge.criteriaJson || {}) as { type?: BadgeCriteriaType } & Record<string, unknown>;
    if (criteria.type && CRITERIA_TYPES.some((c) => c.value === criteria.type)) {
      const values: Record<string, string> = {};
      const spec = CRITERIA_TYPES.find((c) => c.value === criteria.type);
      spec?.fields.forEach((f) => {
        const v = criteria[f.name];
        if (typeof v === "number") values[f.name] = String(v);
      });
      setCriteriaForm({ type: criteria.type, values });
    } else {
      setCriteriaForm(DEFAULT_CRITERIA);
    }
    setEditorOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    if (saving) return;
    setEditorOpen(false);
    resetForm();
  }, [saving, resetForm]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      showToast("Name is required.", "warning");
      return;
    }
    const input = {
      name: name.trim(),
      description: description.trim(),
      iconSlug: iconSlug.trim() || "mdi:trophy-outline",
      points: Math.max(0, Number(points) || 0),
      criteriaJson: buildCriteriaJson(criteriaForm),
    };
    setSaving(true);
    try {
      if (editing) {
        const updated = await adminBadgesService.updateBadge(editing.id, input);
        setBadges((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        showToast(`Badge "${updated.name}" updated.`, "success");
      } else {
        const created = await adminBadgesService.createBadge(input);
        setBadges((prev) => [...prev, created]);
        showToast(`Badge "${created.name}" created.`, "success");
      }
      setEditorOpen(false);
      resetForm();
    } catch (error: any) {
      const msg = error?.response?.data?.error || "Could not save badge.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  }, [editing, name, description, iconSlug, points, criteriaForm, showToast, resetForm]);

  const handleDelete = useCallback(
    async (badge: Badge) => {
      if (!confirm(`Deactivate "${badge.name}"? Already-earned awards are preserved.`)) return;
      try {
        await adminBadgesService.deleteBadge(badge.id);
        setBadges((prev) => prev.filter((b) => b.id !== badge.id));
        showToast(`"${badge.name}" deactivated.`, "success");
      } catch (error: any) {
        showToast(error?.message || "Failed to deactivate badge", "error");
      }
    },
    [showToast],
  );

  const criteriaSpec = useMemo(
    () => CRITERIA_TYPES.find((c) => c.value === criteriaForm.type),
    [criteriaForm.type],
  );

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                background: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow:
                  "0 12px 24px -12px color-mix(in srgb, #fbbf24 60%, transparent)",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              <IconWrapper icon="mdi:trophy-award" size={22} color="#fff" />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: "var(--font-primary)",
                  fontSize: { xs: "1.1rem", sm: "1.3rem" },
                  lineHeight: 1.25,
                }}
              >
                Achievement Badges
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Author badges with the criteria DSL. Learners auto-earn them via post-save signals (5-min throttled).
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            size="small"
            startIcon={<IconWrapper icon="mdi:plus" size={16} />}
            onClick={openNew}
            sx={{
              textTransform: "none",
              bgcolor: "#f59e0b",
              "&:hover": { bgcolor: "#d97706" },
            }}
          >
            New badge
          </Button>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, auto)" },
            gap: { xs: 1, sm: 1.5 },
            mb: 3,
          }}
        >
          <StatChip label="Badges" value={summary.total} color="#f59e0b" />
          <StatChip label="Awards given" value={summary.totalAwarded} color="#10b981" />
          <StatChip label="Total points" value={summary.totalPoints} color="var(--accent-indigo-dark)" />
        </Box>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            overflow: "hidden",
          }}
        >
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : badges.length === 0 ? (
            <Box sx={{ p: { xs: 4, sm: 6 }, textAlign: "center", color: "var(--font-secondary)" }}>
              <IconWrapper icon="mdi:trophy-broken" size={40} color="var(--font-secondary)" />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                No badges yet. The Phase 8 seed migration adds 6 defaults — run <code>python manage.py migrate scorecard</code> if you don&apos;t see them.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: "var(--surface)" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Badge</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Criteria</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Points</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Awarded</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 120 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {badges.map((b) => {
                    const criteria = (b.criteriaJson || {}) as { type?: string } & Record<string, unknown>;
                    const spec = CRITERIA_TYPES.find((c) => c.value === criteria.type);
                    const summaryStr =
                      spec?.fields.length
                        ? `${spec.label} · ${spec.fields
                            .map((f) => `${f.label}=${criteria[f.name] ?? "?"}`)
                            .join(", ")}`
                        : spec?.label ?? String(criteria.type ?? "—");
                    return (
                      <TableRow
                        key={b.id}
                        hover
                        sx={{
                          "&:nth-of-type(even)": {
                            bgcolor: "color-mix(in srgb, var(--font-secondary) 6%, transparent)",
                          },
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                            <Box
                              sx={{
                                width: 30,
                                height: 30,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: "color-mix(in srgb, #fbbf24 16%, transparent)",
                                color: "#d97706",
                              }}
                            >
                              <IconWrapper icon={b.iconSlug || "mdi:trophy-outline"} size={16} />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
                                {b.name}
                              </Typography>
                              {b.description && (
                                <Typography variant="caption" color="text.secondary">
                                  {b.description}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={JSON.stringify(b.criteriaJson)} arrow>
                            <Chip
                              size="small"
                              label={summaryStr}
                              sx={{
                                fontWeight: 600,
                                fontSize: "0.7rem",
                                bgcolor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                                color: "var(--accent-indigo-dark)",
                                maxWidth: 320,
                              }}
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ textAlign: "right", fontWeight: 700, color: "#f59e0b", fontVariantNumeric: "tabular-nums" }}>
                          {b.points}
                        </TableCell>
                        <TableCell sx={{ textAlign: "right" }}>
                          <Chip
                            size="small"
                            label={b.awardedCount}
                            color={b.awardedCount > 0 ? "success" : "default"}
                            variant={b.awardedCount > 0 ? "filled" : "outlined"}
                            sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 0.25 }}>
                            <Tooltip title="Edit" arrow>
                              <IconButton
                                size="small"
                                onClick={() => openEdit(b)}
                                sx={{ color: "var(--font-secondary)", "&:hover": { color: "var(--accent-indigo-dark)" } }}
                                aria-label={`Edit ${b.name}`}
                              >
                                <IconWrapper icon="mdi:pencil-outline" size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Deactivate (keeps history)" arrow>
                              <IconButton
                                size="small"
                                onClick={() => void handleDelete(b)}
                                sx={{
                                  color: "var(--font-secondary)",
                                  "&:hover": { color: "#ef4444", bgcolor: "color-mix(in srgb, #ef4444 8%, transparent)" },
                                }}
                                aria-label={`Deactivate ${b.name}`}
                              >
                                <IconWrapper icon="mdi:archive-outline" size={16} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Editor dialog */}
        <Dialog
          open={editorOpen}
          onClose={closeEditor}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 800 }}>
            {editing ? `Edit ${editing.name}` : "Create new badge"}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: "grid", gap: 2, pt: 1 }}>
              <TextField
                autoFocus
                label="Name"
                size="small"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 7-Day Streak"
              />
              <TextField
                label="Description"
                size="small"
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What the learner did to earn this"
              />
              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "2fr 1fr" }}>
                <TextField
                  label="Icon slug"
                  size="small"
                  fullWidth
                  value={iconSlug}
                  onChange={(e) => setIconSlug(e.target.value)}
                  placeholder="mdi:trophy-outline"
                  helperText="MDI / Iconify slug"
                />
                <TextField
                  label="Points"
                  size="small"
                  type="number"
                  inputProps={{ min: 0 }}
                  fullWidth
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                />
              </Box>

              <Box>
                <FormControl size="small" fullWidth>
                  <InputLabel id="criteria-type-label">Criteria type</InputLabel>
                  <Select
                    labelId="criteria-type-label"
                    label="Criteria type"
                    value={criteriaForm.type}
                    onChange={(e) =>
                      setCriteriaForm({
                        type: e.target.value as BadgeCriteriaType,
                        values: {},
                      })
                    }
                  >
                    {CRITERIA_TYPES.map((c) => (
                      <MenuItem key={c.value} value={c.value}>
                        {c.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {criteriaSpec?.helperText && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                    {criteriaSpec.helperText}
                  </Typography>
                )}
              </Box>

              {criteriaSpec?.fields.length ? (
                <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: criteriaSpec.fields.length === 1 ? "1fr" : "1fr 1fr" }}>
                  {criteriaSpec.fields.map((f) => (
                    <TextField
                      key={f.name}
                      label={f.label}
                      size="small"
                      type={f.type}
                      fullWidth
                      placeholder={f.placeholder}
                      value={criteriaForm.values[f.name] ?? ""}
                      onChange={(e) =>
                        setCriteriaForm((prev) => ({
                          ...prev,
                          values: { ...prev.values, [f.name]: e.target.value },
                        }))
                      }
                    />
                  ))}
                </Box>
              ) : null}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeEditor} disabled={saving} sx={{ textTransform: "none" }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => void handleSave()}
              disabled={saving || !name.trim()}
              startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
              sx={{
                textTransform: "none",
                bgcolor: "#f59e0b",
                "&:hover": { bgcolor: "#d97706" },
              }}
            >
              {editing ? "Save changes" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
}
