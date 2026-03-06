"use client";

import { useState, useMemo, useCallback } from "react";
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
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

export interface Section {
  id: string;
  type: "quiz" | "coding";
  title: string;
  description: string;
  order: number;
  // Score configuration for MCQs and coding problems
  easyScore?: number;
  mediumScore?: number;
  hardScore?: number;
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
      order: newSection.order || sections.length + 1,
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

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const ordered = [...sections].sort((a, b) => a.order - b.order);
    const [removed] = ordered.splice(result.source.index, 1);
    ordered.splice(result.destination.index, 0, removed);
    const updated = ordered.map((s, i) => ({ ...s, order: i + 1 }));
    onSectionsChange(updated);
  }, [sections, onSectionsChange]);

  const orderedSections = useMemo(
    () => [...sections].sort((a, b) => a.order - b.order),
    [sections]
  );

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
              value={newSection.order === 0 ? "" : newSection.order}
              onChange={(e) => {
                const v = e.target.value;
                setNewSection({
                  ...newSection,
                  order: v === "" ? 0 : Number(v),
                });
              }}
              fullWidth
              inputProps={{ min: 0 }}
              helperText="Display order"
              error={sections.some((s) => s.order === newSection.order)}
            />
          </Box>
          
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
              gap: 2,
            }}
          >
            <>
              <TextField
                label="Easy Score"
                type="number"
                value={newSection.easyScore === undefined ? "" : newSection.easyScore}
                onChange={(e) => {
                  const v = e.target.value;
                  setNewSection({
                    ...newSection,
                    easyScore: v === "" ? undefined : Number(v),
                  });
                }}
                fullWidth
                inputProps={{ min: 0, step: 0.5 }}
                helperText={newSection.type === "quiz" ? "Points for Easy questions" : "Points for Easy problems"}
              />
              <TextField
                label="Medium Score"
                type="number"
                value={newSection.mediumScore === undefined ? "" : newSection.mediumScore}
                onChange={(e) => {
                  const v = e.target.value;
                  setNewSection({
                    ...newSection,
                    mediumScore: v === "" ? undefined : Number(v),
                  });
                }}
                fullWidth
                inputProps={{ min: 0, step: 0.5 }}
                helperText={newSection.type === "quiz" ? "Points for Medium questions" : "Points for Medium problems"}
              />
              <TextField
                label="Hard Score"
                type="number"
                value={newSection.hardScore === undefined ? "" : newSection.hardScore}
                onChange={(e) => {
                  const v = e.target.value;
                  setNewSection({
                    ...newSection,
                    hardScore: v === "" ? undefined : Number(v),
                  });
                }}
                fullWidth
                inputProps={{ min: 0, step: 0.5 }}
                helperText={newSection.type === "quiz" ? "Points for Hard questions" : "Points for Hard problems"}
              />
            </>
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
            value={newSection.number_of_questions_to_show ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setNewSection({
                ...newSection,
                number_of_questions_to_show: v === "" ? undefined : Number(v),
              });
            }}
            fullWidth
            inputProps={{ min: 0 }}
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

      {/* Existing Sections - Drag to reorder */}
      {sections.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: "#111827" }}>
            Sections (drag to reorder)
          </Typography>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sections">
              {(provided) => (
                <Box ref={provided.innerRef} {...provided.droppableProps}>
                  {orderedSections.map((section, index) => (
                    <Draggable
                      key={section.id}
                      draggableId={section.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          sx={{ mb: 2 }}
                        >
                          <SectionCard
                            section={section}
                            onUpdate={(updates) =>
                              handleUpdateSection(section.id, updates)
                            }
                            onDelete={() => handleDeleteSection(section.id)}
                            orderError={orderErrors[section.id]}
                            allSections={sections}
                            dragHandleProps={provided.dragHandleProps as any}
                            isDragging={snapshot.isDragging}
                          />
                        </Box>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>
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
  dragHandleProps?: Record<string, unknown>;
  isDragging?: boolean;
}

function SectionCard({
  section,
  onUpdate,
  onDelete,
  orderError,
  allSections,
  dragHandleProps,
  isDragging,
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
            <>
              <TextField
                label="Easy Score"
                type="number"
                value={editData.easyScore === undefined ? "" : editData.easyScore}
                onChange={(e) => {
                  const v = e.target.value;
                  setEditData({
                    ...editData,
                    easyScore: v === "" ? undefined : Number(v),
                  });
                }}
                fullWidth
                inputProps={{ min: 0, step: 0.5 }}
              />
              <TextField
                label="Medium Score"
                type="number"
                value={editData.mediumScore === undefined ? "" : editData.mediumScore}
                onChange={(e) => {
                  const v = e.target.value;
                  setEditData({
                    ...editData,
                    mediumScore: v === "" ? undefined : Number(v),
                  });
                }}
                fullWidth
                inputProps={{ min: 0, step: 0.5 }}
              />
              <TextField
                label="Hard Score"
                type="number"
                value={editData.hardScore === undefined ? "" : editData.hardScore}
                onChange={(e) => {
                  const v = e.target.value;
                  setEditData({
                    ...editData,
                    hardScore: v === "" ? undefined : Number(v),
                  });
                }}
                fullWidth
                inputProps={{ min: 0, step: 0.5 }}
              />
            </>
          </Box>
          <TextField
            label="Number of Questions to Show"
            type="number"
            value={editData.number_of_questions_to_show ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setEditData({
                ...editData,
                number_of_questions_to_show: v === "" ? undefined : Number(v),
              });
            }}
            fullWidth
            inputProps={{ min: 0 }}
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
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <IconButton
                size="small"
                {...dragHandleProps}
                sx={{ color: "#9ca3af", cursor: "grab", "&:hover": { color: "#6b7280" } }}
                aria-label="Drag to reorder"
              >
                <IconWrapper icon="mdi:drag" size={20} />
              </IconButton>
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


