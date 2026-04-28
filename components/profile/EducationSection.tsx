"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Box, Paper, Typography, Button, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { UserProfile, Education } from "@/lib/services/profile.service";

interface EducationSectionProps {
  profile: UserProfile;
  onSave: (updatedProfile: Partial<UserProfile>) => Promise<void>;
  onRemoveSection?: () => void;
}

export function EducationSection({
  profile,
  onSave,
  onRemoveSection,
}: EducationSectionProps) {
  const { t } = useTranslation("common");
  const [educations, setEducations] = useState<Education[]>(profile.education || []);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Education>({
    id: "",
    institution: "",
    degree: "",
    field_of_study: "",
    start_date: "",
    end_date: "",
    gpa: "",
    description: "",
  });

  useEffect(() => {
    if (!editing && editingIndex === null) setEducations(profile.education || []);
  }, [profile.education, editing, editingIndex]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const dataToSave: Partial<UserProfile> = {
        education: educations.map((edu): Education => ({
          id: edu.id,
          institution: edu.institution,
          degree: edu.degree,
          field_of_study: edu.field_of_study || undefined,
          start_date: edu.start_date || undefined,
          end_date: edu.end_date || undefined,
          gpa: edu.gpa || undefined,
          description: edu.description || undefined,
        })),
      };
      await onSave(dataToSave);
      setEditing(false);
    } catch (error) {
      // Silently handle profile save error
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEducations(profile.education || []);
    setEditing(false);
    setDialogOpen(false);
    setEditingIndex(null);
  };

  const handleAddNew = () => {
    setFormData({
      id: "",
      institution: "",
      degree: "",
      field_of_study: "",
      start_date: "",
      end_date: "",
      gpa: "",
      description: "",
    });
    setEditingIndex(null);
    setDialogOpen(true);
  };

  const handleEdit = (index: number) => {
    setFormData(educations[index]);
    setEditingIndex(index);
    setDialogOpen(true);
  };

  const handleDelete = (index: number) => {
    setEducations(educations.filter((_, i) => i !== index));
  };

  const toISODate = (val: string): string => {
    if (!val) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toISOString().split("T")[0];
  };

  const handleDialogSave = async () => {
    const newEducation: Education = {
      ...formData,
      id: formData.id || Date.now().toString(),
      start_date: toISODate(formData.start_date || ""),
      end_date: toISODate(formData.end_date || ""),
    };

    let updated: Education[];
    if (editingIndex !== null) {
      updated = [...educations];
      updated[editingIndex] = newEducation;
    } else {
      updated = [...educations, newEducation];
    }
    setEducations(updated);
    setDialogOpen(false);
    setEditingIndex(null);

    if (editingIndex === null && educations.length === 0) {
      try {
        setSaving(true);
        await onSave({
          education: updated.map((edu) => ({
            id: edu.id,
            institution: edu.institution,
            degree: edu.degree,
            field_of_study: edu.field_of_study || undefined,
            start_date: edu.start_date || undefined,
            end_date: edu.end_date || undefined,
            gpa: edu.gpa || undefined,
            description: edu.description || undefined,
          })),
        });
      } catch {
        // handled by parent
      } finally {
        setSaving(false);
      }
    }
  };

  const formatDate = (date: string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          border: "1px solid var(--border-default)",
          borderRadius: { xs: 1, sm: 2 },
          mb: { xs: 2, sm: 3 },
          boxShadow:
            "0 0 0 1px color-mix(in srgb, var(--border-default) 85%, transparent), 0 2px 4px color-mix(in srgb, var(--font-primary) 10%, transparent)",
          transition: "box-shadow 0.2s ease",
          "&:hover": {
            boxShadow:
              "0 0 0 1px color-mix(in srgb, var(--border-default) 85%, transparent), 0 4px 8px color-mix(in srgb, var(--font-primary) 14%, transparent)",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2.5,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "var(--font-primary)",
              fontSize: "1.25rem",
            }}
          >
            {t("profile.education")}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {onRemoveSection && (
            <Button
              variant="text"
              size="small"
              startIcon={<IconWrapper icon="mdi:close" size={16} />}
              onClick={onRemoveSection}
              sx={{
                textTransform: "none",
                color: "var(--font-secondary)",
                fontWeight: 500,
                fontSize: "0.8125rem",
                "&:hover": {
                  backgroundColor: "color-mix(in srgb, var(--error-500) 10%, transparent)",
                  color: "var(--error-500)",
                },
              }}
            >
              Remove
            </Button>
          )}
          {!editing ? (
            <Button
              variant="text"
              size="small"
              startIcon={<IconWrapper icon="mdi:pencil" size={16} />}
              onClick={() => setEditing(true)}
              sx={{
                textTransform: "none",
                color: "var(--accent-indigo)",
                fontWeight: 600,
                "&:hover": {
                  backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                },
              }}
            >
              {t("profile.edit")}
            </Button>
          ) : (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<IconWrapper icon="mdi:plus" size={16} />}
                onClick={handleAddNew}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "var(--accent-purple)",
                  color: "var(--accent-indigo)",
                  borderRadius: 1.5,
                  "&:hover": {
                    borderColor: "var(--accent-indigo-dark)",
                    backgroundColor: "color-mix(in srgb, var(--accent-purple) 10%, transparent)",
                  },
                }}
              >
                {t("profile.add")}
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleCancel}
                disabled={saving}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "var(--border-default)",
                  color: "var(--font-secondary)",
                  borderRadius: 1.5,
                  "&:hover": {
                    borderColor: "color-mix(in srgb, var(--border-default) 85%, var(--font-secondary))",
                    backgroundColor: "color-mix(in srgb, var(--surface) 80%, var(--background))",
                  },
                }}
              >
                {t("profile.cancel")}
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleSave}
                disabled={saving}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  backgroundColor: "var(--accent-indigo)",
                  borderRadius: 1.5,
                  "&:hover": {
                    backgroundColor: "var(--accent-indigo-dark)",
                  },
                }}
              >
                {saving ? t("profile.saving") : t("profile.save")}
              </Button>
            </Box>
          )}
          </Box>
        </Box>

        {educations.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {educations.map((edu, index) => (
              <Box
                key={edu.id || index}
                sx={{
                  p: 2,
                  border: "1px solid var(--border-default)",
                  borderRadius: 1.5,
                  backgroundColor: "color-mix(in srgb, var(--surface) 82%, var(--background))",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: "var(--font-primary)",
                        mb: 0.5,
                      }}
                    >
                      {edu.degree}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "var(--accent-indigo)",
                        fontWeight: 600,
                        mb: 0.5,
                      }}
                    >
                      {edu.institution}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "var(--font-secondary)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {formatDate(edu.start_date || "")} - {formatDate(edu.end_date || "")}
                      {edu.field_of_study && ` • ${edu.field_of_study}`}
                      {edu.gpa && ` • GPA: ${edu.gpa}`}
                    </Typography>
                    {edu.description && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "var(--font-primary)",
                          mt: 1,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {edu.description}
                      </Typography>
                    )}
                  </Box>
                  {editing && (
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(index)}
                        sx={{
                          color: "var(--accent-indigo)",
                          "&:hover": {
                            backgroundColor: "color-mix(in srgb, var(--accent-purple) 10%, transparent)",
                          },
                        }}
                      >
                        <IconWrapper icon="mdi:pencil" size={18} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(index)}
                        sx={{
                          color: "var(--error-500)",
                          "&:hover": {
                            backgroundColor: "color-mix(in srgb, var(--error-500) 10%, transparent)",
                          },
                        }}
                      >
                        <IconWrapper icon="mdi:delete" size={18} />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              textAlign: "center",
              py: 4,
              px: 2,
              border: "1px dashed color-mix(in srgb, var(--border-default) 80%, var(--font-secondary))",
              borderRadius: 2,
              backgroundColor: "color-mix(in srgb, var(--surface) 80%, var(--background))",
            }}
          >
            <IconWrapper icon="mdi:school" size={48} color="var(--font-tertiary)" />
            <Typography
              variant="body2"
              sx={{
                color: "var(--font-secondary)",
                mt: 2,
                fontSize: "0.9375rem",
                fontWeight: 500,
              }}
            >
              {t("profile.noEducationYet")}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "var(--font-tertiary)",
                mt: 0.5,
                fontSize: "0.8125rem",
                display: "block",
              }}
            >
              {t("profile.clickEditToAddEducation")}
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<IconWrapper icon="mdi:plus" size={18} />}
              onClick={handleAddNew}
              sx={{
                mt: 2,
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: "var(--accent-indigo)",
                borderRadius: 2,
                px: 2.5,
                py: 1,
                "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
              }}
            >
              {t("profile.add")} {t("profile.education")}
            </Button>
          </Box>
        )}
      </Paper>

      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 2 },
            boxShadow: "0 4px 16px color-mix(in srgb, var(--font-primary) 14%, transparent)",
            m: { xs: 0, sm: 2 },
            maxHeight: { xs: "100vh", sm: "90vh" },
          },
        }}
      >
        <DialogTitle
          component="div"
          sx={{
            pb: { xs: 1.5, sm: 1 },
            px: { xs: 2, sm: 3 },
            pt: { xs: 2, sm: 3 },
            borderBottom: "1px solid var(--border-default)",
            display: "flex",
            alignItems: "center",
            gap: { xs: 1, sm: 1.5 },
          }}
        >
          <IconWrapper 
            icon="mdi:school" 
            size={20} 
            color="var(--accent-indigo)"
          />
          <Typography
            component="span"
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "var(--font-primary)",
              fontSize: { xs: "1.125rem", sm: "1.25rem" },
            }}
          >
            {editingIndex !== null ? t("profile.editEducation") : t("profile.addEducation")}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, pb: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: { xs: 3, sm: 3.5 } }}>
            <TextField
              label="Institution"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              fullWidth
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  fontSize: "0.9375rem",
                },
              }}
            />
            <TextField
              label="Degree"
              value={formData.degree}
              onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
              fullWidth
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  fontSize: "0.9375rem",
                },
              }}
            />
            <TextField
              label="Field of Study"
              value={formData.field_of_study}
              onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })}
              fullWidth
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  fontSize: "0.9375rem",
                },
              }}
            />
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <TextField
                label="Start Date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                type="date"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    fontSize: "0.9375rem",
                  },
                }}
              />
              <TextField
                label="End Date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                type="date"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    fontSize: "0.9375rem",
                  },
                }}
              />
            </Box>
            <TextField
              label="GPA"
              value={formData.gpa}
              onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
              fullWidth
              size="small"
              placeholder="e.g., 3.8/4.0"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  fontSize: "0.9375rem",
                },
              }}
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={4}
              size="small"
              placeholder="Describe your education, achievements, or coursework..."
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  fontSize: "0.9375rem",
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            py: { xs: 1.5, sm: 2 },
            borderTop: "1px solid var(--border-default)",
            gap: { xs: 0.75, sm: 1 },
            flexDirection: { xs: "column-reverse", sm: "row" },
          }}
        >
          <Button 
            onClick={() => setDialogOpen(false)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "var(--font-secondary)",
              borderRadius: { xs: 1.5, sm: 1.5 },
              px: { xs: 2, sm: 2 },
              py: { xs: 1, sm: 0.75 },
              width: { xs: "100%", sm: "auto" },
              "&:hover": {
                backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--background))",
              },
            }}
          >
            {t("profile.cancel")}
          </Button>
          <Button
            onClick={handleDialogSave}
            variant="contained"
            disabled={!formData.institution || !formData.degree}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: "var(--accent-indigo)",
              borderRadius: "24px",
              px: { xs: 3, sm: 3 },
              py: { xs: 1, sm: 0.75 },
              width: { xs: "100%", sm: "auto" },
              "&:hover": {
                backgroundColor: "var(--accent-indigo-dark)",
              },
              "&:disabled": {
                backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--border-default))",
                color: "var(--font-tertiary)",
              },
              transition: "all 0.2s ease",
            }}
          >
            {t("profile.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
