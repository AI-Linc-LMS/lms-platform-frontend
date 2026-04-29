"use client";

import { useState, useCallback } from "react";
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
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { SubmoduleList } from "./SubmoduleList";
import {
  adminCourseBuilderService,
  ModuleData,
} from "@/lib/services/admin/admin-course-builder.service";

interface Module {
  id: number;
  title: string;
  weekno: number;
  description?: string;
  submodules?: any[];
  [key: string]: any;
}

interface ModuleListProps {
  courseId: number;
  modules: Module[];
  onModulesChanged: () => void;
  readOnly?: boolean;
}

const emptyForm: ModuleData = { title: "", weekno: 1, description: "" };

export function ModuleList({
  courseId,
  modules,
  onModulesChanged,
  readOnly = false,
}: ModuleListProps) {
  const { showToast } = useToast();
  const { t } = useTranslation("common");

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [submoduleMap, setSubmoduleMap] = useState<Record<number, any[]>>({});
  const [loadingSubs, setLoadingSubs] = useState<Record<number, boolean>>({});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ModuleData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Module | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadSubmodules = useCallback(
    async (moduleId: number) => {
      setLoadingSubs((prev) => ({ ...prev, [moduleId]: true }));
      try {
        const data = await adminCourseBuilderService.getCourseSubmodules(courseId, moduleId);
        const subs = Array.isArray(data) ? data : data?.results ?? [];
        setSubmoduleMap((prev) => ({ ...prev, [moduleId]: subs }));
      } catch (error: any) {
        showToast(error?.message || t("adminCourseBuilder.failedToLoadSubmodules"), "error");
      } finally {
        setLoadingSubs((prev) => ({ ...prev, [moduleId]: false }));
      }
    },
    [courseId, showToast]
  );

  const handleAccordionChange = (moduleId: number) => {
    if (expandedId === moduleId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(moduleId);
    if (!submoduleMap[moduleId]) {
      loadSubmodules(moduleId);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, weekno: modules.length + 1 });
    setDialogOpen(true);
  };

  const openEdit = (mod: Module) => {
    setEditingId(mod.id);
    setFormData({ title: mod.title, weekno: mod.weekno, description: mod.description || "" });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setFormData({ ...emptyForm });
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      showToast(t("adminCourseBuilder.titleRequired"), "error");
      return;
    }
    try {
      setSaving(true);
      if (editingId !== null) {
        await adminCourseBuilderService.updateCourseModule(courseId, editingId, formData);
        showToast(t("adminCourseBuilder.moduleUpdated"), "success");
      } else {
        await adminCourseBuilderService.createCourseModule(courseId, formData);
        showToast(t("adminCourseBuilder.moduleCreated"), "success");
      }
      closeDialog();
      onModulesChanged();
    } catch (error: any) {
      showToast(error?.message || t("adminCourseBuilder.failedToSaveModule"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await adminCourseBuilderService.deleteCourseModule(courseId, deleteTarget.id);
      showToast(t("adminCourseBuilder.moduleDeleted"), "success");
      setDeleteTarget(null);
      if (expandedId === deleteTarget.id) setExpandedId(null);
      onModulesChanged();
    } catch (error: any) {
      showToast(error?.message || t("adminCourseBuilder.failedToDeleteModule"), "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      {modules.length === 0 ? (
        <Typography variant="body2" sx={{ color: "var(--font-tertiary)", py: 2 }}>
          {t("adminCourseBuilder.noModulesYet")}
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {modules.map((mod) => (
            <Accordion
              key={mod.id}
              expanded={expandedId === mod.id}
              onChange={() => handleAccordionChange(mod.id)}
              disableGutters
              sx={{
                border: "1px solid var(--border-default)",
                borderRadius: "8px !important",
                boxShadow: "none",
                "&::before": { display: "none" },
                overflow: "hidden",
              }}
            >
              <AccordionSummary
                expandIcon={
                  <IconWrapper
                    icon="mdi:chevron-down"
                    size={22}
                    color="var(--accent-indigo)"
                    style={{
                      transform: expandedId === mod.id ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
                  />
                }
                sx={{
                  px: 2,
                  py: 0.5,
                  minHeight: 56,
                  "&.Mui-expanded": { minHeight: 56 },
                  "& .MuiAccordionSummary-content": { alignItems: "center", gap: 2, my: 1.5 },
                }}
              >
                {/* Week number - first and prominent */}
                <Box
                  sx={{
                    flexShrink: 0,
                    minWidth: 72,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 1.5,
                    bgcolor: "var(--accent-indigo)",
                    color: "var(--font-light)",
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.875rem" }}>
                    Week {mod.weekno}
                  </Typography>
                </Box>

                {/* Title and description */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "var(--font-primary)", lineHeight: 1.3 }}>
                    {mod.title}
                  </Typography>
                  {mod.description && (
                    <Typography
                      variant="caption"
                      sx={{ color: "var(--font-secondary)", display: "block", mt: 0.25 }}
                      noWrap
                    >
                      {mod.description}
                    </Typography>
                  )}
                </Box>

                {/* Edit & Delete - prevent expand on click */}
                {!readOnly ? (
                  <Box
                    component="span"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip title={t("adminCourseBuilder.editModuleTooltip")}>
                      <IconButton
                        component="span"
                        size="small"
                        onClick={() => openEdit(mod)}
                        sx={{
                          color: "var(--accent-indigo)",
                          bgcolor:
                            "color-mix(in srgb, var(--accent-indigo) 14%, var(--surface) 86%)",
                          "&:hover": {
                            bgcolor:
                              "color-mix(in srgb, var(--accent-indigo) 20%, var(--surface) 80%)",
                          },
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openEdit(mod);
                          }
                        }}
                      >
                        <IconWrapper icon="mdi:pencil" size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t("adminCourseBuilder.deleteModuleTooltip")}>
                      <IconButton
                        component="span"
                        size="small"
                        onClick={() => setDeleteTarget(mod)}
                        sx={{
                          color: "var(--error-500)",
                          bgcolor:
                            "color-mix(in srgb, var(--error-500) 14%, var(--surface) 86%)",
                          "&:hover": {
                            bgcolor:
                              "color-mix(in srgb, var(--error-500) 20%, var(--surface) 80%)",
                          },
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setDeleteTarget(mod);
                          }
                        }}
                      >
                        <IconWrapper icon="mdi:delete" size={18} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ) : null}
              </AccordionSummary>
              <AccordionDetails
                sx={{ px: 2, pb: 2, pt: 0, borderTop: "1px solid var(--border-default)" }}
              >
                {loadingSubs[mod.id] ? (
                  <LinearProgress sx={{ my: 2, height: 2, borderRadius: 1 }} />
                ) : (
                  <SubmoduleList
                    courseId={courseId}
                    moduleId={mod.id}
                    submodules={submoduleMap[mod.id] || []}
                    onSubmodulesChanged={() => loadSubmodules(mod.id)}
                    readOnly={readOnly}
                  />
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {!readOnly ? (
        <Button
          variant="outlined"
          startIcon={<IconWrapper icon="mdi:plus" size={18} />}
          onClick={openAdd}
          sx={{
            mt: 2,
            textTransform: "none",
            fontWeight: 600,
            borderColor: "var(--accent-indigo)",
            color: "var(--accent-indigo)",
            "&:hover": {
              borderColor: "var(--accent-indigo-dark)",
              bgcolor:
                "color-mix(in srgb, var(--accent-indigo) 14%, var(--surface) 86%)",
            },
          }}
        >
          {t("adminCourseBuilder.addModule")}
        </Button>
      ) : null}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={saving ? undefined : closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingId !== null ? t("adminCourseBuilder.editModule") : t("adminCourseBuilder.addModule")}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "16px !important" }}>
          <TextField
            label={t("adminCourseBuilder.moduleTitle")}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            fullWidth
            required
            autoFocus
          />
          <TextField
            label={t("adminCourseBuilder.weekNumber")}
            type="number"
            value={formData.weekno}
            onChange={(e) => setFormData({ ...formData, weekno: Number(e.target.value) })}
            fullWidth
            slotProps={{ htmlInput: { min: 1 } }}
          />
          <TextField
            label={t("adminCourseBuilder.description")}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeDialog} disabled={saving} sx={{ color: "var(--font-secondary)" }}>
            {t("adminCourseBuilder.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !formData.title.trim()}
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              bgcolor: "var(--accent-indigo)",
              color: "var(--font-light)",
              "&:hover": { bgcolor: "var(--accent-indigo-dark)" },
              "&.Mui-disabled": {
                color: "var(--font-secondary)",
                backgroundColor:
                  "color-mix(in srgb, var(--accent-indigo) 24%, var(--surface) 76%)",
              },
            }}
          >
            {saving ? t("adminCourseBuilder.saving") : editingId !== null ? t("adminCourseBuilder.update") : t("adminCourseBuilder.create")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title={t("adminCourseBuilder.deleteModuleTitle")}
        message={deleteTarget ? t("adminCourseBuilder.deleteModuleMessage", { title: deleteTarget.title }) : ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </Box>
  );
}
