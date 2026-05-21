"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Box, Paper, Typography, Button, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { UserProfile, Achievement } from "@/lib/services/profile.service";

interface AchievementsSectionProps {
  profile: UserProfile;
  onSave: (updatedProfile: Partial<UserProfile>) => Promise<void>;
  onRemoveSection?: () => void;
}

export function AchievementsSection({
  profile,
  onSave,
  onRemoveSection,
}: AchievementsSectionProps) {
  const { t } = useTranslation("common");
  const [achievements, setAchievements] = useState<Achievement[]>(profile.achievements || []);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Achievement>({
    id: "",
    title: "",
    description: "",
    date: "",
    organization: "",
  });

  useEffect(() => {
    if (!editing && editingIndex === null) setAchievements(profile.achievements || []);
  }, [profile.achievements, editing, editingIndex]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const dataToSave: Partial<UserProfile> = {
        achievements: achievements.map((ach): Achievement => ({
          id: ach.id,
          title: ach.title,
          description: ach.description || undefined,
          date: ach.date || undefined,
          organization: ach.organization || undefined,
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
    setAchievements(profile.achievements || []);
    setEditing(false);
    setDialogOpen(false);
    setEditingIndex(null);
  };

  const handleAddNew = () => {
    setFormData({
      id: "",
      title: "",
      description: "",
      date: "",
      organization: "",
    });
    setEditingIndex(null);
    setDialogOpen(true);
  };

  const handleEdit = (index: number) => {
    setFormData(achievements[index]);
    setEditingIndex(index);
    setDialogOpen(true);
  };

  const handleDelete = (index: number) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const toISODate = (val: string): string => {
    if (!val) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toISOString().split("T")[0];
  };

  const handleDialogSave = async () => {
    const newAchievement: Achievement = {
      ...formData,
      id: formData.id || Date.now().toString(),
      date: toISODate(formData.date || ""),
    };

    let updated: Achievement[];
    if (editingIndex !== null) {
      updated = [...achievements];
      updated[editingIndex] = newAchievement;
    } else {
      updated = [...achievements, newAchievement];
    }
    setAchievements(updated);
    setDialogOpen(false);
    setEditingIndex(null);

    try {
      setSaving(true);
      await onSave({
        achievements: updated.map((ach) => ({
          id: ach.id,
          title: ach.title,
          description: ach.description || undefined,
          date: ach.date || undefined,
          organization: ach.organization || undefined,
        })),
      });
    } catch {
      // handled by parent
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
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
            {t("profile.achievements")}
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
                  backgroundColor: "var(--accent-purple)",
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

        {achievements.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {achievements.map((achievement, index) => (
              <Box
                key={achievement.id || index}
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
                      {achievement.title}
                    </Typography>
                    {achievement.organization && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "var(--accent-indigo)",
                          fontWeight: 600,
                          mb: 0.5,
                        }}
                      >
                        {achievement.organization}
                      </Typography>
                    )}
                    {achievement.date && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "var(--font-secondary)",
                          fontSize: "0.875rem",
                          mb: 1,
                        }}
                      >
                        {formatDate(achievement.date)}
                      </Typography>
                    )}
                    {achievement.description && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "var(--font-primary)",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {achievement.description}
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
            <IconWrapper icon="mdi:trophy" size={48} color="var(--font-tertiary)" />
            <Typography
              variant="body2"
              sx={{
                color: "var(--font-secondary)",
                mt: 2,
                fontSize: "0.9375rem",
                fontWeight: 500,
              }}
            >
              {t("profile.noAchievementsYet")}
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
              {t("profile.clickEditToAddAchievements")}
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
              {t("profile.add")} {t("profile.achievements")}
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
            icon="mdi:trophy" 
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
            {editingIndex !== null ? t("profile.editAchievement") : t("profile.addAchievement")}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, pb: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: { xs: 3, sm: 3.5 } }}>
            <TextField
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
              label="Organization / Event"
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              fullWidth
              size="small"
              placeholder="e.g., Hackathon 2024, University Competition"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  fontSize: "0.9375rem",
                },
              }}
            />
            <TextField
              label="Date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={4}
              size="small"
              placeholder="Describe your achievement and its significance..."
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
            disabled={!formData.title}
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
