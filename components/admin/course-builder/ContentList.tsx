"use client";

import { useState, useEffect, useCallback } from "react";
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
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import {
  adminCourseBuilderService,
  ContentData,
  ContentIdType,
} from "@/lib/services/admin/admin-course-builder.service";

interface ContentItem {
  id: number;
  title: string;
  content_type: ContentIdType;
  contentId: number;
  order: number;
  duration_in_minutes: number;
  [key: string]: any;
}

interface ContentListProps {
  courseId: number;
  submoduleId: number;
  readOnly?: boolean;
}

const CONTENT_TYPE_CONFIG: Record<
  ContentIdType,
  { label: string; icon: string; color: string; bg: string }
> = {
  video: { label: "Video", icon: "mdi:video", color: "#7c3aed", bg: "#f5f3ff" },
  article: { label: "Article", icon: "mdi:file-document", color: "#2563eb", bg: "#eff6ff" },
  quiz: { label: "Quiz", icon: "mdi:help-circle", color: "#d97706", bg: "#fffbeb" },
  assignment: { label: "Assignment", icon: "mdi:clipboard-text", color: "#059669", bg: "#ecfdf5" },
  coding_problem: { label: "Coding", icon: "mdi:code-tags", color: "#dc2626", bg: "#fef2f2" },
};

function normalizeContentType(value: string | undefined): ContentIdType {
  if (!value || typeof value !== "string") return "article";
  const v = value.toLowerCase().trim().replace(/\s+/g, "_");
  if (v === "video") return "video";
  if (v === "quiz") return "quiz";
  if (v === "assignment") return "assignment";
  if (v === "coding_problem" || v === "coding" || v === "codingproblem") return "coding_problem";
  if (v === "article") return "article";
  return "article";
}

const emptyForm: ContentData = {
  title: "",
  content_type: "article",
  contentId: 0,
  order: 1,
  duration_in_minutes: 0,
};

export function ContentList({
  courseId,
  submoduleId,
  readOnly = false,
}: ContentListProps) {
  const { showToast } = useToast();

  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ContentData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ContentItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadContents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminCourseBuilderService.getSubmoduleContent(courseId, submoduleId);
      const list = Array.isArray(data) ? data : data?.results ?? [];
      setContents(list);
    } catch (error: any) {
      showToast(error?.message || "Failed to load contents", "error");
    } finally {
      setLoading(false);
    }
  }, [courseId, submoduleId, showToast]);

  useEffect(() => {
    loadContents();
  }, [loadContents]);

  const openAdd = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, order: contents.length + 1 });
    setDialogOpen(true);
  };

  const openEdit = (item: ContentItem) => {
    setEditingId(item.id);
    setFormData({
      title: item.title ?? "",
      content_type: normalizeContentType(item.content_type),
      contentId: Number(item.contentId) || 0,
      order: Number(item.order) || 1,
      duration_in_minutes: Number(item.duration_in_minutes) || 0,
    });
    setDialogOpen(true);
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
        await adminCourseBuilderService.updateSubmoduleContent(
          courseId,
          submoduleId,
          editingId,
          formData
        );
        showToast("Content updated", "success");
      } else {
        await adminCourseBuilderService.addSubmoduleContent(courseId, submoduleId, formData);
        showToast("Content added", "success");
      }
      closeDialog();
      loadContents();
    } catch (error: any) {
      showToast(error?.message || "Failed to save content", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await adminCourseBuilderService.deleteSubmoduleContent(
        courseId,
        submoduleId,
        deleteTarget.id
      );
      showToast("Content deleted", "success");
      setDeleteTarget(null);
      loadContents();
    } catch (error: any) {
      showToast(error?.message || "Failed to delete content", "error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <LinearProgress sx={{ my: 1, height: 2, borderRadius: 1 }} />;
  }

  return (
    <Box sx={{ mt: 1 }}>
      {contents.length === 0 ? (
        <Typography variant="caption" sx={{ color: "#9ca3af" }}>
          No content items yet
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
          {contents.map((item) => {
            const cfg = CONTENT_TYPE_CONFIG[normalizeContentType(item.content_type)];
            return (
              <Box
                key={item.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 1.5,
                  py: 1,
                  borderRadius: 1,
                  bgcolor: "#fafafa",
                  border: "1px solid #f3f4f6",
                  "&:hover": { bgcolor: "#f3f4f6" },
                  transition: "background 0.15s",
                }}
              >
                <Tooltip title={cfg.label}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 28,
                      height: 28,
                      borderRadius: 1,
                      bgcolor: cfg.bg,
                      flexShrink: 0,
                    }}
                  >
                    <IconWrapper icon={cfg.icon} size={16} color={cfg.color} />
                  </Box>
                </Tooltip>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 500, color: "#111827", fontSize: "0.8rem", lineHeight: 1.3 }}
                  >
                    {item.title}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.25 }}>
                    <Chip
                      label={cfg.label}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        bgcolor: cfg.bg,
                        color: cfg.color,
                      }}
                    />
                    {item.duration_in_minutes > 0 && (
                      <Typography variant="caption" sx={{ color: "#9ca3af", fontSize: "0.65rem" }}>
                        {item.duration_in_minutes} min
                      </Typography>
                    )}
                  </Box>
                </Box>
                {!readOnly ? (
                  <Box sx={{ display: "flex", gap: 0.25, flexShrink: 0 }}>
                    <IconButton size="small" onClick={() => openEdit(item)} sx={{ color: "#6366f1", p: 0.5 }}>
                      <IconWrapper icon="mdi:pencil" size={14} />
                    </IconButton>
                    <IconButton size="small" onClick={() => setDeleteTarget(item)} sx={{ color: "#ef4444", p: 0.5 }}>
                      <IconWrapper icon="mdi:delete" size={14} />
                    </IconButton>
                  </Box>
                ) : null}
              </Box>
            );
          })}
        </Box>
      )}

      {!readOnly ? (
        <Button
          size="small"
          startIcon={<IconWrapper icon="mdi:plus" size={14} />}
          onClick={openAdd}
          sx={{ mt: 0.75, color: "#6366f1", textTransform: "none", fontWeight: 600, fontSize: "0.75rem" }}
        >
          Add Content
        </Button>
      ) : null}

      {/* Add / Edit Content Dialog */}
      <Dialog open={dialogOpen} onClose={saving ? undefined : closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingId !== null ? "Edit Content" : "Add Content"}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "16px !important" }}>
          <TextField
            label="Title"
            value={formData.title ?? ""}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            fullWidth
            required
            autoFocus
          />
          <FormControl fullWidth>
            <InputLabel>Content Type</InputLabel>
            <Select
              value={formData.content_type ?? "article"}
              onChange={(e) => setFormData({ ...formData, content_type: (e.target.value as ContentIdType) || "article" })}
              label="Content Type"
            >
              {Object.entries(CONTENT_TYPE_CONFIG).map(([key, cfg]) => (
                <MenuItem key={key} value={key}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <IconWrapper icon={cfg.icon} size={16} color={cfg.color} />
                    {cfg.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
            <TextField
              label="Content ID"
              type="number"
              value={formData.contentId ?? 0}
              onChange={(e) => setFormData({ ...formData, contentId: Number(e.target.value) || 0 })}
              fullWidth
              slotProps={{ htmlInput: { min: 0 } }}
            />
            <TextField
              label="Order"
              type="number"
              value={formData.order ?? 1}
              onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) || 1 })}
              fullWidth
              slotProps={{ htmlInput: { min: 1 } }}
            />
            <TextField
              label="Duration (min)"
              type="number"
              value={formData.duration_in_minutes ?? 0}
              onChange={(e) => setFormData({ ...formData, duration_in_minutes: Number(e.target.value) || 0 })}
              fullWidth
              slotProps={{ htmlInput: { min: 0 } }}
            />
          </Box>
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
            {saving ? "Saving..." : editingId !== null ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title="Delete Content"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </Box>
  );
}
