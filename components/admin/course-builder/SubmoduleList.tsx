"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  Collapse,
  Tooltip,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { ContentList } from "./ContentList";
import {
  adminCourseBuilderService,
  SubmoduleData,
} from "@/lib/services/admin/admin-course-builder.service";

interface Submodule {
  id: number;
  title: string;
  description: string;
  order: number;
  video_count?: number;
  quiz_count?: number;
  article_count?: number;
  coding_problem_count?: number;
  assignment_count?: number;
  [key: string]: unknown;
}

interface SubmoduleListProps {
  courseId: number;
  moduleId: number;
  submodules: Submodule[];
  onSubmodulesChanged: () => void;
  readOnly?: boolean;
}

const emptyForm: SubmoduleData = { title: "", description: "", order: 1 };

const STAT_BADGES: { key: string; icon: string; color: string; label: string }[] = [
  { key: "video_count", icon: "mdi:video", color: "#7c3aed", label: "Videos" },
  { key: "article_count", icon: "mdi:file-document", color: "#2563eb", label: "Articles" },
  { key: "quiz_count", icon: "mdi:help-circle", color: "#d97706", label: "Quizzes" },
  { key: "coding_problem_count", icon: "mdi:code-tags", color: "#dc2626", label: "Coding" },
  { key: "assignment_count", icon: "mdi:clipboard-text", color: "#059669", label: "Assignments" },
];

export function SubmoduleList({
  courseId,
  moduleId,
  submodules,
  onSubmodulesChanged,
  readOnly = false,
}: SubmoduleListProps) {
  const { showToast } = useToast();

  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<SubmoduleData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Submodule | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, order: submodules.length + 1 });
    setDialogOpen(true);
  };

  const openEdit = (sub: Submodule) => {
    setEditingId(sub.id);
    setFormData({ title: sub.title, description: sub.description || "", order: sub.order });
    setDialogOpen(true);
  };

    const openSubmoduleEditor = (sub: Submodule) => {
    setExpandedId(sub.id);
    openEdit(sub);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setFormData({ ...emptyForm });
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      showToast("Title is required", "error");
      return;
    }
    try {
      setSaving(true);
      if (editingId !== null) {
        await adminCourseBuilderService.updateCourseSubmodule(
          courseId,
          moduleId,
          editingId,
          formData
        );
        setExpandedId(editingId);
        showToast("Submodule updated", "success");
      } else {
        const created = await adminCourseBuilderService.createCourseSubmodule(
          courseId,
          moduleId,
          formData
        );
        if (created?.id) {
          setExpandedId(Number(created.id));
        }
        showToast("Submodule created", "success");
      }
      closeDialog();
      onSubmodulesChanged();
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : "Failed to save submodule",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await adminCourseBuilderService.deleteCourseSubmodule(courseId, moduleId, deleteTarget.id);
      showToast("Submodule deleted", "success");
      setDeleteTarget(null);
      if (expandedId === deleteTarget.id) setExpandedId(null);
      onSubmodulesChanged();
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : "Failed to delete submodule",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  const getTotalCount = (sub: Submodule) =>
    (sub.video_count || 0) +
    (sub.article_count || 0) +
    (sub.quiz_count || 0) +
    (sub.coding_problem_count || 0) +
    (sub.assignment_count || 0);

  return (
    <Box sx={{ pl: 2, pt: 1 }}>
      {submodules.length === 0 ? (
        <Typography variant="body2" sx={{ color: "#9ca3af", py: 1 }}>
          No submodules yet
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {submodules.map((sub) => {
            const isExpanded = expandedId === sub.id;
            const total = getTotalCount(sub);
            return (
              <Box
                key={sub.id}
                sx={{
                  borderRadius: 1.5,
                  border: "1px solid",
                  borderColor: isExpanded ? "#c7d2fe" : "#e5e7eb",
                  overflow: "hidden",
                  transition: "border-color 0.2s",
                }}
              >
                {/* Submodule Header */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 1.5,
                    cursor: "pointer",
                    bgcolor: isExpanded ? "#fafafe" : "transparent",
                    "&:hover": { bgcolor: "#f9fafb" },
                    transition: "background 0.15s",
                  }}
                  onClick={() => toggleExpand(sub.id)}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <IconWrapper
                        icon={isExpanded ? "mdi:chevron-down" : "mdi:chevron-right"}
                        size={18}
                        color="#9ca3af"
                      />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#111827" }}>
                        {sub.order}. {sub.title}
                      </Typography>
                      {total > 0 && (
                        <Chip
                          label={`${total} item${total !== 1 ? "s" : ""}`}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.65rem",
                            fontWeight: 600,
                            bgcolor: "#f3f4f6",
                            color: "#6b7280",
                          }}
                        />
                      )}
                    </Box>
                    {/* Content count badges */}
                    {total > 0 && (
                      <Box sx={{ display: "flex", gap: 0.75, mt: 0.5, ml: 3.5, flexWrap: "wrap" }}>
                        {STAT_BADGES.map((badge) => {
                          const count = Number(sub[badge.key] ?? 0);
                          if (count === 0) return null;
                          return (
                            <Tooltip key={badge.key} title={badge.label}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.25,
                                  px: 0.5,
                                  py: 0.125,
                                  borderRadius: 0.5,
                                  bgcolor: "#f9fafb",
                                }}
                              >
                                <IconWrapper icon={badge.icon} size={12} color={badge.color} />
                                <Typography sx={{ fontSize: "0.625rem", fontWeight: 600, color: badge.color }}>
                                  {count}
                                </Typography>
                              </Box>
                            </Tooltip>
                          );
                        })}
                      </Box>
                    )}
                    {sub.description && (
                      <Typography
                        variant="caption"
                        sx={{ color: "#6b7280", display: "block", mt: 0.25, ml: 3.5 }}
                      >
                        {sub.description}
                      </Typography>
                    )}
                  </Box>
                  {!readOnly ? (
                    <Box
                      sx={{ display: "flex", gap: 0.5, ml: 1, flexShrink: 0 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tooltip title="Edit submodule (title, description, order)">
                        <IconButton
                          size="small"
                          onClick={() => openSubmoduleEditor(sub)}
                          sx={{ color: "#4f46e5" }}
                        >
                          <IconWrapper icon="mdi:pencil" size={16} />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={() => setDeleteTarget(sub)}
                        sx={{ color: "#ef4444" }}
                      >
                        <IconWrapper icon="mdi:delete" size={16} />
                      </IconButton>
                    </Box>
                  ) : null}
                </Box>

                {/* Expanded Content */}
                <Collapse in={isExpanded}>
                  <Box sx={{ px: 2, pb: 1.5, borderTop: "1px solid #f3f4f6" }}>
                    <ContentList
                      courseId={courseId}
                      submoduleId={sub.id}
                      readOnly={readOnly}
                    />
                  </Box>
                </Collapse>
              </Box>
            );
          })}
        </Box>
      )}

      {!readOnly ? (
        <Button
          size="small"
          startIcon={<IconWrapper icon="mdi:plus" size={16} />}
          onClick={openAdd}
          sx={{ mt: 1, color: "#6366f1", textTransform: "none", fontWeight: 600 }}
        >
          Add Submodule
        </Button>
      ) : null}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={saving ? undefined : closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingId !== null ? "Edit Submodule" : "Add Submodule"}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "16px !important" }}>
          <TextField
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            fullWidth
            required
            autoFocus
          />
          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
            multiline
            rows={3}
          />
          <TextField
            label="Order"
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
            fullWidth
            slotProps={{ htmlInput: { min: 1 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeDialog} disabled={saving} sx={{ color: "#6b7280" }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !formData.title.trim()}
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ bgcolor: "#6366f1" }}
          >
            {saving ? "Saving..." : editingId !== null ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title="Delete Submodule"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </Box>
  );
}
