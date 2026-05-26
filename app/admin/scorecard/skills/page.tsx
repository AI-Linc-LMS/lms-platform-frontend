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
  IconButton,
  InputAdornment,
  Paper,
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
  adminSkillsService,
  type Skill,
  type SkillContentType,
} from "@/lib/services/admin/admin-skills.service";
import { SkillMappingDialog } from "@/components/admin/skill-mapping/SkillMappingDialog";

const CONTENT_TYPE_OPTIONS: Array<{ value: SkillContentType; label: string; icon: string }> = [
  { value: "mcq", label: "MCQ", icon: "mdi:format-list-checks" },
  { value: "coding_problem", label: "Coding Problem", icon: "mdi:code-braces" },
  { value: "video", label: "Video", icon: "mdi:play-circle-outline" },
  { value: "article", label: "Article", icon: "mdi:file-document-outline" },
  { value: "course_subjective_question", label: "Course Subjective", icon: "mdi:text-box-outline" },
  { value: "assessment", label: "Assessment", icon: "mdi:clipboard-check-outline" },
  { value: "assessment_subjective_question", label: "Assessment Subjective", icon: "mdi:text-box-outline" },
  { value: "interview_template", label: "Interview Template", icon: "mdi:account-voice" },
];

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

export default function AdminScorecardSkillsPage() {
  const { showToast } = useToast();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createCategory, setCreateCategory] = useState("");
  const [creating, setCreating] = useState(false);
  const [taggerOpen, setTaggerOpen] = useState(false);
  const [taggerContentType, setTaggerContentType] = useState<SkillContentType>("mcq");
  const [taggerContentId, setTaggerContentId] = useState<string>("");

  const loadSkills = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminSkillsService.listSkills({ includeInactive: false });
      setSkills(data);
    } catch (error: any) {
      console.warn("Failed to load skills:", error);
      showToast(error?.message || "Failed to load skills", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadSkills();
  }, [loadSkills]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const s of skills) {
      if (s.category) set.add(s.category);
    }
    return Array.from(set).sort();
  }, [skills]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return skills.filter((s) => {
      if (categoryFilter !== "all" && (s.category || "") !== categoryFilter) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || (s.category || "").toLowerCase().includes(q);
    });
  }, [skills, search, categoryFilter]);

  const summary = useMemo(() => {
    const total = skills.length;
    const totalMappings = skills.reduce((acc, s) => acc + (s.mapping_count || 0), 0);
    const untagged = skills.filter((s) => (s.mapping_count || 0) === 0).length;
    return { total, totalMappings, untagged, categories: categories.length };
  }, [skills, categories]);

  const handleCreate = useCallback(async () => {
    const name = createName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const created = await adminSkillsService.createSkill({
        name,
        category: createCategory.trim(),
      });
      setSkills((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      showToast(`Skill "${created.name}" created.`, "success");
      setCreateName("");
      setCreateCategory("");
      setCreateOpen(false);
    } catch (error: any) {
      const msg = error?.response?.data?.error || "Could not create skill.";
      showToast(msg, "error");
    } finally {
      setCreating(false);
    }
  }, [createName, createCategory, showToast]);

  const handleDelete = useCallback(
    async (skill: Skill) => {
      if (!confirm(`Soft-delete "${skill.name}"? Existing mappings are kept; the skill is hidden from learners and admins.`)) {
        return;
      }
      try {
        await adminSkillsService.deleteSkill(skill.id);
        setSkills((prev) => prev.filter((s) => s.id !== skill.id));
        showToast(`"${skill.name}" deactivated.`, "success");
      } catch (error: any) {
        showToast(error?.message || "Failed to deactivate skill", "error");
      }
    },
    [showToast],
  );

  const openTagger = useCallback(() => {
    setTaggerOpen(true);
  }, []);

  const handleTaggerSaved = useCallback(() => {
    // Refresh counts since mapping counts may have changed.
    void loadSkills();
  }, [loadSkills]);

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
                background:
                  "linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-indigo-dark) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow:
                  "0 12px 24px -12px color-mix(in srgb, var(--accent-indigo) 60%, transparent)",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              <IconWrapper icon="mdi:label-multiple-outline" size={22} color="#fff" />
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
                Skill Catalog
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage skills + tag content. Tagged content feeds the Skill Scorecard, Weak Areas, and Action Panel.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<IconWrapper icon="mdi:tag-text-outline" size={16} />}
              onClick={openTagger}
              sx={{ textTransform: "none" }}
            >
              Tag content
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<IconWrapper icon="mdi:plus" size={16} />}
              onClick={() => setCreateOpen(true)}
              sx={{
                textTransform: "none",
                bgcolor: "var(--accent-indigo)",
                "&:hover": { bgcolor: "var(--accent-indigo-dark)" },
              }}
            >
              New skill
            </Button>
          </Box>
        </Box>

        {/* Summary stats */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, auto)" },
            gap: { xs: 1, sm: 1.5 },
            mb: 3,
          }}
        >
          <StatChip label="Skills" value={summary.total} color="var(--accent-indigo-dark)" />
          <StatChip label="Categories" value={summary.categories} color="#10b981" />
          <StatChip label="Total mappings" value={summary.totalMappings} color="var(--accent-cyan, #0891b2)" />
          <StatChip label="Untagged" value={summary.untagged} color={summary.untagged > 0 ? "#f59e0b" : "var(--font-secondary)"} />
        </Box>

        {/* Filters */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            display: "flex",
            flexWrap: "wrap",
            gap: 1.5,
            alignItems: "center",
          }}
        >
          <TextField
            size="small"
            placeholder="Search skills by name or category"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 240 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconWrapper icon="mdi:magnify" size={18} />
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
            <Chip
              label="All categories"
              size="small"
              onClick={() => setCategoryFilter("all")}
              sx={{
                fontWeight: 700,
                bgcolor:
                  categoryFilter === "all"
                    ? "var(--accent-indigo)"
                    : "color-mix(in srgb, var(--border-default) 35%, transparent)",
                color: categoryFilter === "all" ? "#fff" : "var(--font-secondary)",
              }}
            />
            {categories.map((cat) => (
              <Chip
                key={cat}
                size="small"
                label={cat}
                onClick={() => setCategoryFilter(cat)}
                sx={{
                  fontWeight: 600,
                  bgcolor:
                    categoryFilter === cat
                      ? "var(--accent-indigo)"
                      : "color-mix(in srgb, var(--border-default) 35%, transparent)",
                  color: categoryFilter === cat ? "#fff" : "var(--font-secondary)",
                }}
              />
            ))}
          </Box>
        </Paper>

        {/* Skills table */}
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
          ) : filtered.length === 0 ? (
            <Box sx={{ p: { xs: 4, sm: 6 }, textAlign: "center", color: "var(--font-secondary)" }}>
              <IconWrapper icon="mdi:label-off-outline" size={40} color="var(--font-secondary)" />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                {skills.length === 0
                  ? "No skills yet. Click \"New skill\" to add the first one — or run the backfill migration to seed from existing MCQ.skills / CodingProblem.tags."
                  : "No skills match your filters."}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: "var(--surface)" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Mappings</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Updated</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 110 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow
                      key={s.id}
                      hover
                      sx={{
                        "&:nth-of-type(even)": {
                          bgcolor: "color-mix(in srgb, var(--font-secondary) 6%, transparent)",
                        },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
                          {s.name}
                        </Typography>
                        {s.description && (
                          <Typography variant="caption" color="text.secondary">
                            {s.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {s.category ? (
                          <Chip
                            size="small"
                            label={s.category}
                            sx={{
                              fontWeight: 600,
                              fontSize: "0.7rem",
                              bgcolor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                              color: "var(--accent-indigo-dark)",
                            }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ textAlign: "right" }}>
                        <Tooltip title="Number of content rows tagged with this skill" arrow>
                          <Chip
                            size="small"
                            label={s.mapping_count ?? 0}
                            color={s.mapping_count > 0 ? "primary" : "default"}
                            variant={s.mapping_count > 0 ? "filled" : "outlined"}
                            sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {s.updated_at
                            ? new Date(s.updated_at).toLocaleDateString(undefined, {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Deactivate skill (soft delete — keeps history)" arrow>
                          <IconButton
                            size="small"
                            onClick={() => void handleDelete(s)}
                            sx={{
                              color: "var(--font-secondary)",
                              "&:hover": { color: "#ef4444", bgcolor: "color-mix(in srgb, #ef4444 8%, transparent)" },
                            }}
                            aria-label={`Deactivate ${s.name}`}
                          >
                            <IconWrapper icon="mdi:archive-outline" size={16} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Create dialog */}
        <Dialog
          open={createOpen}
          onClose={creating ? undefined : () => setCreateOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 800 }}>Create new skill</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "grid", gap: 2, pt: 1 }}>
              <TextField
                autoFocus
                label="Name"
                size="small"
                fullWidth
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleCreate();
                }}
                placeholder="e.g. React Hooks"
              />
              <TextField
                label="Category (optional)"
                size="small"
                fullWidth
                value={createCategory}
                onChange={(e) => setCreateCategory(e.target.value)}
                placeholder="e.g. Frontend, DSA, Behavioral"
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setCreateOpen(false)}
              disabled={creating}
              sx={{ textTransform: "none" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => void handleCreate()}
              disabled={creating || !createName.trim()}
              startIcon={creating ? <CircularProgress size={14} color="inherit" /> : null}
              sx={{
                textTransform: "none",
                bgcolor: "var(--accent-indigo)",
                "&:hover": { bgcolor: "var(--accent-indigo-dark)" },
              }}
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* Content tagger launcher dialog */}
        <Dialog
          open={taggerOpen}
          onClose={() => setTaggerOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 800 }}>Tag a content row</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1, display: "grid", gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--font-secondary)", textTransform: "uppercase", letterSpacing: 0.4, fontSize: "0.7rem" }}>
                  Content type
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.75 }}>
                  {CONTENT_TYPE_OPTIONS.map((opt) => (
                    <Chip
                      key={opt.value}
                      icon={<IconWrapper icon={opt.icon} size={14} />}
                      label={opt.label}
                      onClick={() => setTaggerContentType(opt.value)}
                      sx={{
                        fontWeight: 600,
                        bgcolor:
                          taggerContentType === opt.value
                            ? "var(--accent-indigo)"
                            : "color-mix(in srgb, var(--border-default) 35%, transparent)",
                        color: taggerContentType === opt.value ? "#fff" : "var(--font-secondary)",
                      }}
                    />
                  ))}
                </Box>
              </Box>
              <TextField
                label="Content ID"
                size="small"
                fullWidth
                value={taggerContentId}
                onChange={(e) => setTaggerContentId(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Numeric ID of the content row"
                helperText="Find content IDs in Django admin or the relevant editor page."
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setTaggerOpen(false)} sx={{ textTransform: "none" }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={!taggerContentId || Number.isNaN(Number(taggerContentId))}
              onClick={() => {
                setTaggerOpen(false);
                // Open the mapping dialog via the floating SkillMappingDialog below.
                setMappingDialogOpen(true);
              }}
              sx={{
                textTransform: "none",
                bgcolor: "var(--accent-indigo)",
                "&:hover": { bgcolor: "var(--accent-indigo-dark)" },
              }}
            >
              Open tagger
            </Button>
          </DialogActions>
        </Dialog>

        {/* SkillMappingDialog driver. Sits as a sibling so admin can open it from the tagger launcher above. */}
        <MappingDialogHost
          contentType={taggerContentType}
          contentId={Number(taggerContentId) || 0}
          onSaved={handleTaggerSaved}
        />
      </Box>
    </MainLayout>
  );
}

// --- Local driver for SkillMappingDialog ----------------------------------
// Wraps the dialog so we can drive its open state from outside the form
// without leaking that state up to the parent's render-tree (the launcher
// dialog above resolves the form, then triggers this).
let setMappingDialogOpenFn: ((v: boolean) => void) | null = null;
function setMappingDialogOpen(v: boolean) {
  setMappingDialogOpenFn?.(v);
}

function MappingDialogHost({
  contentType,
  contentId,
  onSaved,
}: {
  contentType: SkillContentType;
  contentId: number;
  onSaved?: (ids: number[]) => void;
}) {
  const [open, setOpen] = useState(false);
  // Register the local setter so the launcher dialog can pop us open.
  // useEffect-less assignment is intentional — we want it to update on every
  // render so the latest closure is always called.
  setMappingDialogOpenFn = setOpen;
  if (!contentId) return null;
  return (
    <SkillMappingDialog
      open={open}
      onClose={() => setOpen(false)}
      contentType={contentType}
      contentId={contentId}
      contentTitle={`${contentType} #${contentId}`}
      onSaved={(ids) => {
        setOpen(false);
        onSaved?.(ids);
      }}
    />
  );
}
