"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Box, Paper, Typography, Button, TextField, Checkbox, FormControlLabel, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { UserProfile, Experience } from "@/lib/services/profile.service";

interface ExperienceSectionProps {
  profile: UserProfile;
  onSave: (updatedProfile: Partial<UserProfile>) => Promise<void>;
  onRemoveSection?: () => void;
}

export function ExperienceSection({
  profile,
  onSave,
  onRemoveSection,
}: ExperienceSectionProps) {
  const { t } = useTranslation("common");
  const [experiences, setExperiences] = useState<Experience[]>(profile.experience || []);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Experience>({
    id: "",
    company: "",
    position: "",
    location: "",
    start_date: "",
    end_date: "",
    current: false,
    description: "",
  });

  useEffect(() => {
    if (!editing && editingIndex === null) setExperiences(profile.experience || []);
  }, [profile.experience, editing, editingIndex]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const dataToSave: Partial<UserProfile> = {
        experience: experiences.map((exp): Experience => ({
          id: exp.id,
          company: exp.company,
          position: exp.position,
          current: exp.current,
          start_date: exp.start_date ?? "",
          end_date: exp.end_date || undefined,
          location: exp.location || undefined,
          description: exp.description || undefined,
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
    setExperiences(profile.experience || []);
    setEditing(false);
    setDialogOpen(false);
    setEditingIndex(null);
  };

  const handleAddNew = () => {
    setFormData({
      id: "",
      company: "",
      position: "",
      location: "",
      start_date: "",
      end_date: "",
      current: false,
      description: "",
    });
    setEditingIndex(null);
    setDialogOpen(true);
  };

  const handleEdit = (index: number) => {
    setFormData(experiences[index]);
    setEditingIndex(index);
    setDialogOpen(true);
  };

  const handleDelete = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  const toISODate = (val: string): string => {
    if (!val) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toISOString().split("T")[0];
  };

  const handleDialogSave = async () => {
    const newExperience: Experience = {
      ...formData,
      id: formData.id || Date.now().toString(),
      start_date: toISODate(formData.start_date ?? ""),
      end_date: formData.end_date ? toISODate(formData.end_date) : undefined,
    };

    let updated: Experience[];
    if (editingIndex !== null) {
      updated = [...experiences];
      updated[editingIndex] = newExperience;
    } else {
      updated = [...experiences, newExperience];
    }
    setExperiences(updated);
    setDialogOpen(false);
    setEditingIndex(null);

    if (editingIndex === null && experiences.length === 0) {
      try {
        setSaving(true);
        await onSave({
          experience: updated.map((exp) => ({
            id: exp.id,
            company: exp.company,
            position: exp.position,
            current: exp.current,
            start_date: exp.start_date ?? "",
            end_date: exp.end_date || undefined,
            location: exp.location || undefined,
            description: exp.description || undefined,
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
          border: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
          borderRadius: { xs: 1, sm: 2 },
          mb: { xs: 2, sm: 3 },
          boxShadow: "0 0 0 1px color-mix(in srgb, var(--font-primary) 10%, transparent), 0 2px 4px color-mix(in srgb, var(--font-primary) 10%, transparent)",
          transition: "box-shadow 0.2s ease",
          "&:hover": {
            boxShadow: "0 0 0 1px color-mix(in srgb, var(--font-primary) 10%, transparent), 0 4px 8px color-mix(in srgb, var(--font-primary) 14%, transparent)",
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
            {t("profile.experience")}
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
                "&:hover": { backgroundColor: "color-mix(in srgb, var(--error-500) 10%, transparent)", color: "var(--error-500)" },
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
                fontSize: "0.9375rem",
                "&:hover": {
                  backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                },
                transition: "all 0.2s ease",
              }}
            >
              Edit
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
                  borderColor: "var(--accent-indigo)",
                  color: "var(--accent-indigo)",
                  borderRadius: "24px",
                  "&:hover": {
                    borderColor: "var(--accent-indigo-dark)",
                    backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                  },
                  transition: "all 0.2s ease",
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
                    backgroundColor: "var(--surface)",
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
                borderRadius: "24px",
                px: 2,
                "&:hover": {
                  backgroundColor: "var(--accent-indigo-dark)",
                },
                transition: "all 0.2s ease",
                }}
              >
                {saving ? t("profile.saving") : t("profile.save")}
              </Button>
            </Box>
          )}
          </Box>
        </Box>

        {experiences.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {experiences.map((exp, index) => (
              <Box
                key={exp.id || index}
                sx={{
                  p: 2,
                  border: "1px solid var(--border-default)",
                  borderRadius: 1.5,
                  backgroundColor: "var(--surface)",
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
                      {exp.position}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "var(--accent-indigo)",
                        fontWeight: 600,
                        mb: 0.5,
                      }}
                    >
                      {exp.company}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "var(--font-secondary)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {formatDate(exp.start_date)} - {exp.current ? "Present" : formatDate(exp.end_date || "")}
                      {exp.location && ` • ${exp.location}`}
                    </Typography>
                    {exp.description && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "var(--font-primary)",
                          mt: 1,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {exp.description}
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
              border: "1px dashed color-mix(in srgb, var(--font-primary) 14%, transparent)",
              borderRadius: 2,
              backgroundColor: "var(--surface)",
            }}
          >
            <IconWrapper icon="mdi:briefcase" size={48} color="var(--font-tertiary)" />
            <Typography
              variant="body2"
              sx={{
                color: "var(--font-secondary)",
                mt: 2,
                fontSize: "0.9375rem",
                fontWeight: 500,
              }}
            >
              {t("profile.noExperienceYet")}
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
              {t("profile.clickEditToAddExperience")}
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
              {t("profile.add")} {t("profile.experience")}
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
            borderBottom: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
            display: "flex",
            alignItems: "center",
            gap: { xs: 1, sm: 1.5 },
          }}
        >
          <IconWrapper 
            icon="mdi:briefcase" 
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
            {editingIndex !== null ? t("profile.editExperience") : t("profile.addExperience")}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, pb: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: { xs: 3, sm: 3.5 } }}>
            <TextField
              label="Position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
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
              label="Company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
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
              label="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                disabled={formData.current}
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    fontSize: "0.9375rem",
                  },
                }}
              />
            </Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.current}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      current: e.target.checked,
                      end_date: e.target.checked ? "" : formData.end_date,
                    });
                  }}
                  sx={{
                    color: "var(--accent-indigo)",
                    "&.Mui-checked": {
                      color: "var(--accent-indigo)",
                    },
                  }}
                />
              }
              label="I currently work here"
              sx={{
                "& .MuiFormControlLabel-label": {
                  fontSize: "0.9375rem",
                  color: "var(--font-primary)",
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
              placeholder="Describe your role and achievements..."
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
            borderTop: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
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
            disabled={!formData.position || !formData.company || !formData.start_date}
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
                backgroundColor: "var(--border-default)",
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
