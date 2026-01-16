"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

export interface Section {
  id: string;
  type: "quiz" | "coding";
  title: string;
  description: string;
  order: number;
}

interface MultipleSectionsSectionProps {
  sections: Section[];
  onSectionsChange: (sections: Section[]) => void;
}

export function MultipleSectionsSection({
  sections,
  onSectionsChange,
}: MultipleSectionsSectionProps) {
  const [newSection, setNewSection] = useState<Omit<Section, "id">>({
    type: "quiz",
    title: "",
    description: "",
    order: sections.length + 1,
  });

  const handleAddSection = () => {
    if (!newSection.title.trim()) return;

    const section: Section = {
      id: `section-${Date.now()}`,
      ...newSection,
    };

    onSectionsChange([...sections, section]);
    setNewSection({
      type: "quiz",
      title: "",
      description: "",
      order: sections.length + 2,
    });
  };

  const handleDeleteSection = (id: string) => {
    onSectionsChange(sections.filter((s) => s.id !== id));
  };

  const handleUpdateSection = (id: string, updates: Partial<Section>) => {
    onSectionsChange(
      sections.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const quizSections = sections.filter((s) => s.type === "quiz");
  const codingSections = sections.filter((s) => s.type === "coding");

  return (
    <Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: "#111827",
          mb: 1,
        }}
      >
        Assessment Sections
      </Typography>
      <Typography variant="body2" sx={{ color: "#6b7280", mb: 3 }}>
        Create multiple quiz and coding sections. Questions will be assigned to
        these sections in the next step.
      </Typography>

      {/* Add New Section Form */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: "#f9fafb" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Add New Section
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <FormControl fullWidth>
              <InputLabel>Section Type</InputLabel>
              <Select
                value={newSection.type}
                onChange={(e) =>
                  setNewSection({
                    ...newSection,
                    type: e.target.value as "quiz" | "coding",
                  })
                }
                label="Section Type"
              >
                <MenuItem value="quiz">Quiz Section</MenuItem>
                <MenuItem value="coding">Coding Section</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Section Order"
              type="number"
              value={newSection.order}
              onChange={(e) =>
                setNewSection({
                  ...newSection,
                  order: Number(e.target.value),
                })
              }
              fullWidth
              inputProps={{ min: 1 }}
              helperText="Display order"
            />
          </Box>
          <TextField
            label="Section Title"
            value={newSection.title}
            onChange={(e) =>
              setNewSection({ ...newSection, title: e.target.value })
            }
            fullWidth
            required
            inputProps={{ maxLength: 255 }}
          />
          <TextField
            label="Section Description"
            value={newSection.description}
            onChange={(e) =>
              setNewSection({ ...newSection, description: e.target.value })
            }
            fullWidth
            multiline
            rows={2}
            helperText="Optional description for this section"
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={handleAddSection}
              disabled={!newSection.title.trim()}
              startIcon={<IconWrapper icon="mdi:plus" size={18} />}
              sx={{ bgcolor: "#6366f1" }}
            >
              Add Section
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Existing Sections */}
      {sections.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {quizSections.length > 0 && (
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 2, color: "#6366f1" }}
              >
                Quiz Sections ({quizSections.length})
              </Typography>
              {quizSections
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    onUpdate={(updates) =>
                      handleUpdateSection(section.id, updates)
                    }
                    onDelete={() => handleDeleteSection(section.id)}
                  />
                ))}
            </Box>
          )}

          {codingSections.length > 0 && (
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 2, color: "#10b981" }}
              >
                Coding Sections ({codingSections.length})
              </Typography>
              {codingSections
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    onUpdate={(updates) =>
                      handleUpdateSection(section.id, updates)
                    }
                    onDelete={() => handleDeleteSection(section.id)}
                  />
                ))}
            </Box>
          )}
        </Box>
      )}

      {sections.length === 0 && (
        <Paper sx={{ p: 3, textAlign: "center", bgcolor: "#f9fafb" }}>
          <Typography variant="body2" color="text.secondary">
            No sections added yet. Add your first section above.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

interface SectionCardProps {
  section: Section;
  onUpdate: (updates: Partial<Section>) => void;
  onDelete: () => void;
}

function SectionCard({ section, onUpdate, onDelete }: SectionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(section);

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(section);
    setIsEditing(false);
  };

  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        border: "1px solid #e5e7eb",
        borderLeft: `4px solid ${
          section.type === "quiz" ? "#6366f1" : "#10b981"
        }`,
      }}
    >
      {isEditing ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <FormControl fullWidth>
              <InputLabel>Section Type</InputLabel>
              <Select
                value={editData.type}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    type: e.target.value as "quiz" | "coding",
                  })
                }
                label="Section Type"
              >
                <MenuItem value="quiz">Quiz Section</MenuItem>
                <MenuItem value="coding">Coding Section</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Order"
              type="number"
              value={editData.order}
              onChange={(e) =>
                setEditData({ ...editData, order: Number(e.target.value) })
              }
              fullWidth
              inputProps={{ min: 1 }}
            />
          </Box>
          <TextField
            label="Title"
            value={editData.title}
            onChange={(e) =>
              setEditData({ ...editData, title: e.target.value })
            }
            fullWidth
            required
          />
          <TextField
            label="Description"
            value={editData.description}
            onChange={(e) =>
              setEditData({ ...editData, description: e.target.value })
            }
            fullWidth
            multiline
            rows={2}
          />
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button variant="outlined" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!editData.title.trim()}
              sx={{ bgcolor: "#6366f1" }}
            >
              Save
            </Button>
          </Box>
        </Box>
      ) : (
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 1,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Chip
                  label={section.type === "quiz" ? "Quiz" : "Coding"}
                  size="small"
                  sx={{
                    bgcolor:
                      section.type === "quiz" ? "#eef2ff" : "#d1fae5",
                    color: section.type === "quiz" ? "#6366f1" : "#10b981",
                    fontWeight: 600,
                  }}
                />
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  Order: {section.order}
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                {section.title}
              </Typography>
              {section.description && (
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  {section.description}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <IconButton
                size="small"
                onClick={() => setIsEditing(true)}
                sx={{ color: "#6366f1" }}
              >
                <IconWrapper icon="mdi:pencil" size={16} />
              </IconButton>
              <IconButton
                size="small"
                onClick={onDelete}
                sx={{ color: "#ef4444" }}
              >
                <IconWrapper icon="mdi:delete" size={16} />
              </IconButton>
            </Box>
          </Box>
        </Box>
      )}
    </Paper>
  );
}


