"use client";

import { useState, useMemo } from "react";
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
  Alert,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

export interface Section {
  id: string;
  type: "quiz" | "coding";
  title: string;
  description: string;
  order: number;
  // Score configuration for MCQs
  easyScore?: number;
  mediumScore?: number;
  hardScore?: number;
  // For coding sections
  codingScore?: number;
  // Number of questions to show (if section has 10 MCQs, but only 5 should be shown)
  number_of_questions_to_show?: number;
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
    easyScore: 1,
    mediumScore: 2,
    hardScore: 3,
    codingScore: 5,
  });

  // Validate duplicate orders
  const orderErrors = useMemo(() => {
    const orderMap = new Map<number, string[]>();
    sections.forEach((section) => {
      if (!orderMap.has(section.order)) {
        orderMap.set(section.order, []);
      }
      orderMap.get(section.order)!.push(section.id);
    });
    const errors: Record<string, string> = {};
    orderMap.forEach((ids, order) => {
      if (ids.length > 1) {
        ids.forEach((id) => {
          errors[id] = `Order ${order} is already used by another section`;
        });
      }
    });
    return errors;
  }, [sections]);

  const handleAddSection = () => {
    if (!newSection.title.trim()) return;

    // Check for duplicate order
    const orderExists = sections.some((s) => s.order === newSection.order);
    if (orderExists) {
      return; // Error will be shown via orderErrors
    }

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
      easyScore: 1,
      mediumScore: 2,
      hardScore: 3,
      codingScore: 5,
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
              error={sections.some((s) => s.order === newSection.order)}
            />
          </Box>
          {sections.some((s) => s.order === newSection.order) && (
            <Alert severity="error" sx={{ mt: 1 }}>
              This order number is already used by another section. Please choose a different order.
            </Alert>
          )}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
              gap: 2,
            }}
          >
            {newSection.type === "quiz" ? (
              <>
                <TextField
                  label="Easy Score"
                  type="number"
                  value={newSection.easyScore || 1}
                  onChange={(e) =>
                    setNewSection({
                      ...newSection,
                      easyScore: Number(e.target.value),
                    })
                  }
                  fullWidth
                  inputProps={{ min: 0, step: 0.5 }}
                  helperText="Points for Easy questions"
                />
                <TextField
                  label="Medium Score"
                  type="number"
                  value={newSection.mediumScore || 2}
                  onChange={(e) =>
                    setNewSection({
                      ...newSection,
                      mediumScore: Number(e.target.value),
                    })
                  }
                  fullWidth
                  inputProps={{ min: 0, step: 0.5 }}
                  helperText="Points for Medium questions"
                />
                <TextField
                  label="Hard Score"
                  type="number"
                  value={newSection.hardScore || 3}
                  onChange={(e) =>
                    setNewSection({
                      ...newSection,
                      hardScore: Number(e.target.value),
                    })
                  }
                  fullWidth
                  inputProps={{ min: 0, step: 0.5 }}
                  helperText="Points for Hard questions"
                />
              </>
            ) : (
              <TextField
                label="Coding Score"
                type="number"
                value={newSection.codingScore || 5}
                onChange={(e) =>
                  setNewSection({
                    ...newSection,
                    codingScore: Number(e.target.value),
                  })
                }
                fullWidth
                inputProps={{ min: 0, step: 0.5 }}
                helperText="Points for coding problems"
              />
            )}
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
          <TextField
            label="Number of Questions to Show"
            type="number"
            value={newSection.number_of_questions_to_show || ""}
            onChange={(e) =>
              setNewSection({
                ...newSection,
                number_of_questions_to_show: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              })
            }
            fullWidth
            inputProps={{ min: 1 }}
            helperText="If you have 10 questions but only want to show 5, enter 5 here. Leave empty to show all questions."
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
                    orderError={orderErrors[section.id]}
                    allSections={sections}
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
                    orderError={orderErrors[section.id]}
                    allSections={sections}
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
  orderError?: string;
  allSections: Section[];
}

function SectionCard({
  section,
  onUpdate,
  onDelete,
  orderError,
  allSections,
}: SectionCardProps) {
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
              error={
                allSections.some(
                  (s) => s.id !== section.id && s.order === editData.order
                ) || !!orderError
              }
              helperText={
                allSections.some(
                  (s) => s.id !== section.id && s.order === editData.order
                )
                  ? "This order is already used"
                  : undefined
              }
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
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
              gap: 2,
            }}
          >
            {editData.type === "quiz" ? (
              <>
                <TextField
                  label="Easy Score"
                  type="number"
                  value={editData.easyScore || 1}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      easyScore: Number(e.target.value),
                    })
                  }
                  fullWidth
                  inputProps={{ min: 0, step: 0.5 }}
                />
                <TextField
                  label="Medium Score"
                  type="number"
                  value={editData.mediumScore || 2}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      mediumScore: Number(e.target.value),
                    })
                  }
                  fullWidth
                  inputProps={{ min: 0, step: 0.5 }}
                />
                <TextField
                  label="Hard Score"
                  type="number"
                  value={editData.hardScore || 3}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      hardScore: Number(e.target.value),
                    })
                  }
                  fullWidth
                  inputProps={{ min: 0, step: 0.5 }}
                />
              </>
            ) : (
              <TextField
                label="Coding Score"
                type="number"
                value={editData.codingScore || 5}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    codingScore: Number(e.target.value),
                  })
                }
                fullWidth
                inputProps={{ min: 0, step: 0.5 }}
              />
            )}
          </Box>
          <TextField
            label="Number of Questions to Show"
            type="number"
            value={editData.number_of_questions_to_show || ""}
            onChange={(e) =>
              setEditData({
                ...editData,
                number_of_questions_to_show: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              })
            }
            fullWidth
            inputProps={{ min: 1 }}
            helperText="If you have 10 questions but only want to show 5, enter 5 here. Leave empty to show all questions."
          />
          {allSections.some(
            (s) => s.id !== section.id && s.order === editData.order
          ) && (
            <Alert severity="error">
              This order number is already used by another section. Please
              choose a different order.
            </Alert>
          )}
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
              {section.type === "quiz" && (
                <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip
                    label={`Easy: ${section.easyScore || 1} pts`}
                    size="small"
                    sx={{ bgcolor: "#d1fae5", color: "#065f46" }}
                  />
                  <Chip
                    label={`Medium: ${section.mediumScore || 2} pts`}
                    size="small"
                    sx={{ bgcolor: "#fef3c7", color: "#92400e" }}
                  />
                  <Chip
                    label={`Hard: ${section.hardScore || 3} pts`}
                    size="small"
                    sx={{ bgcolor: "#fee2e2", color: "#991b1b" }}
                  />
                </Box>
              )}
              {section.type === "coding" && (
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={`Score: ${section.codingScore || 5} pts`}
                    size="small"
                    sx={{ bgcolor: "#d1fae5", color: "#065f46" }}
                  />
                </Box>
              )}
              {section.number_of_questions_to_show && (
                <Typography variant="body2" sx={{ color: "#6366f1", mt: 0.5 }}>
                  Showing {section.number_of_questions_to_show} out of total
                  questions
                </Typography>
              )}
              {orderError && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {orderError}
                </Alert>
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


