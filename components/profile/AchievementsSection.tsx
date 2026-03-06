"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Box, Paper, Typography, Button, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { UserProfile, Achievement } from "@/lib/services/profile.service";

interface AchievementsSectionProps {
  profile: UserProfile;
  onSave: (updatedProfile: Partial<UserProfile>) => Promise<void>;
}

export function AchievementsSection({
  profile,
  onSave,
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

  const handleDialogSave = () => {
    const newAchievement: Achievement = {
      ...formData,
      id: formData.id || Date.now().toString(),
      date: toISODate(formData.date || ""),
    };

    if (editingIndex !== null) {
      const updated = [...achievements];
      updated[editingIndex] = newAchievement;
      setAchievements(updated);
    } else {
      setAchievements([...achievements, newAchievement]);
    }

    setDialogOpen(false);
    setEditingIndex(null);
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
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: { xs: 1, sm: 2 },
          mb: { xs: 2, sm: 3 },
          boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.08)",
          transition: "box-shadow 0.2s ease",
          "&:hover": {
            boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.12)",
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
              color: "#000000",
              fontSize: "1.25rem",
            }}
          >
            {t("profile.achievements")}
          </Typography>
          {!editing ? (
            <Button
              variant="text"
              size="small"
              startIcon={<IconWrapper icon="mdi:pencil" size={16} />}
              onClick={() => setEditing(true)}
              sx={{
                textTransform: "none",
                color: "#0a66c2",
                fontWeight: 600,
                "&:hover": {
                  backgroundColor: "rgba(99, 102, 241, 0.08)",
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
                  borderColor: "#6366f1",
                  color: "#0a66c2",
                  borderRadius: 1.5,
                  "&:hover": {
                    borderColor: "#4f46e5",
                    backgroundColor: "rgba(99, 102, 241, 0.08)",
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
                  borderColor: "#e5e7eb",
                  color: "#6b7280",
                  borderRadius: 1.5,
                  "&:hover": {
                    borderColor: "#d1d5db",
                    backgroundColor: "#f9fafb",
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
                  backgroundColor: "#6366f1",
                  borderRadius: 1.5,
                  "&:hover": {
                    backgroundColor: "#4f46e5",
                  },
                }}
              >
                {saving ? t("profile.saving") : t("profile.save")}
              </Button>
            </Box>
          )}
        </Box>

        {achievements.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {achievements.map((achievement, index) => (
              <Box
                key={achievement.id || index}
                sx={{
                  p: 2,
                  border: "1px solid #e5e7eb",
                  borderRadius: 1.5,
                  backgroundColor: "#f9fafb",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: "#1f2937",
                        mb: 0.5,
                      }}
                    >
                      {achievement.title}
                    </Typography>
                    {achievement.organization && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#0a66c2",
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
                          color: "#6b7280",
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
                          color: "#1f2937",
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
                          color: "#0a66c2",
                          "&:hover": {
                            backgroundColor: "rgba(99, 102, 241, 0.08)",
                          },
                        }}
                      >
                        <IconWrapper icon="mdi:pencil" size={18} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(index)}
                        sx={{
                          color: "#ef4444",
                          "&:hover": {
                            backgroundColor: "rgba(239, 68, 68, 0.08)",
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
              border: "1px dashed rgba(0,0,0,0.12)",
              borderRadius: 2,
              backgroundColor: "#f9fafb",
            }}
          >
            <IconWrapper icon="mdi:trophy" size={48} color="#9ca3af" />
            <Typography
              variant="body2"
              sx={{
                color: "#666666",
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
                color: "#9ca3af",
                mt: 0.5,
                fontSize: "0.8125rem",
              }}
            >
              {t("profile.clickEditToAddAchievements")}
            </Typography>
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
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
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
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "center",
            gap: { xs: 1, sm: 1.5 },
          }}
        >
          <IconWrapper 
            icon="mdi:trophy" 
            size={20} 
            color="#0a66c2" 
          />
          <Typography
            component="span"
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#000000",
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
            borderTop: "1px solid rgba(0,0,0,0.08)",
            gap: { xs: 0.75, sm: 1 },
            flexDirection: { xs: "column-reverse", sm: "row" },
          }}
        >
          <Button 
            onClick={() => setDialogOpen(false)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "#666666",
              borderRadius: { xs: 1.5, sm: 1.5 },
              px: { xs: 2, sm: 2 },
              py: { xs: 1, sm: 0.75 },
              width: { xs: "100%", sm: "auto" },
              "&:hover": {
                backgroundColor: "#f3f2ef",
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
              backgroundColor: "#0a66c2",
              borderRadius: "24px",
              px: { xs: 3, sm: 3 },
              py: { xs: 1, sm: 0.75 },
              width: { xs: "100%", sm: "auto" },
              "&:hover": {
                backgroundColor: "#004182",
              },
              "&:disabled": {
                backgroundColor: "#e5e7eb",
                color: "#9ca3af",
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
