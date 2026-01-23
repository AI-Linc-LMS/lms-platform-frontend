"use client";

import { Box, Paper, Typography, Button, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useState } from "react";
import { UserProfile, Education } from "@/lib/services/profile.service";

interface EducationSectionProps {
  profile: UserProfile;
  onSave: (updatedProfile: Partial<UserProfile>) => Promise<void>;
}

export function EducationSection({
  profile,
  onSave,
}: EducationSectionProps) {
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

  const handleSave = async () => {
    try {
      setSaving(true);
      const dataToSave = {
        education: educations,
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

  const handleDialogSave = () => {
    const newEducation: Education = {
      ...formData,
      id: formData.id || Date.now().toString(),
    };

    if (editingIndex !== null) {
      const updated = [...educations];
      updated[editingIndex] = newEducation;
      setEducations(updated);
    } else {
      setEducations([...educations, newEducation]);
    }

    setDialogOpen(false);
    setEditingIndex(null);
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
            Education
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
                  borderColor: "#6366f1",
                  color: "#0a66c2",
                  borderRadius: 1.5,
                  "&:hover": {
                    borderColor: "#4f46e5",
                    backgroundColor: "rgba(99, 102, 241, 0.08)",
                  },
                }}
              >
                Add
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
                Cancel
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleSave}
                disabled={saving}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  backgroundColor: "#0a66c2",
                  borderRadius: 1.5,
                  "&:hover": {
                    backgroundColor: "#4f46e5",
                  },
                }}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </Box>
          )}
        </Box>

        {educations.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {educations.map((edu, index) => (
              <Box
                key={edu.id || index}
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
                      {edu.degree}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#0a66c2",
                        fontWeight: 600,
                        mb: 0.5,
                      }}
                    >
                      {edu.institution}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#6b7280",
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
                          color: "#1f2937",
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
            <IconWrapper icon="mdi:school" size={48} color="#9ca3af" />
            <Typography
              variant="body2"
              sx={{
                color: "#666666",
                mt: 2,
                fontSize: "0.9375rem",
                fontWeight: 500,
              }}
            >
              No education added yet
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#9ca3af",
                mt: 0.5,
                fontSize: "0.8125rem",
              }}
            >
              Click Edit to add your education
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
            icon="mdi:school" 
            size={20} 
            color="#0a66c2" 
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#000000",
              fontSize: { xs: "1.125rem", sm: "1.25rem" },
            }}
          >
            {editingIndex !== null ? "Edit Education" : "Add Education"}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Institution *"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              fullWidth
              size="small"
              required
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  fontSize: "0.9375rem",
                },
              }}
            />
            <TextField
              label="Degree *"
              value={formData.degree}
              onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
              fullWidth
              size="small"
              required
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
                type="month"
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
                type="month"
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
            Cancel
          </Button>
          <Button
            onClick={handleDialogSave}
            variant="contained"
            disabled={!formData.institution || !formData.degree}
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
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
