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
  easyScore?: number;
  mediumScore?: number;
  hardScore?: number;
  number_of_questions_to_show?: number;
  /** Per-section time cap in minutes (API: `time_limit_minutes`) */
  timeLimitMinutes?: number;
  /** Minimum marks to clear this section */
  sectionCutoffMarks?: string;
}

/** Inline error when a section cap exceeds the assessment-wide duration (step 0). */
export function sectionTimeLimitExceedsOverallMessage(
  overallDurationMinutes: number | undefined,
  sectionTimeLimitMinutes: number | undefined
): string | null {
  const overall =
    overallDurationMinutes != null &&
    Number.isFinite(overallDurationMinutes) &&
    overallDurationMinutes > 0
      ? overallDurationMinutes
      : null;
  if (overall == null) return null;
  const limit =
    sectionTimeLimitMinutes != null &&
    Number.isFinite(sectionTimeLimitMinutes) &&
    sectionTimeLimitMinutes > 0
      ? sectionTimeLimitMinutes
      : null;
  if (limit == null) return null;
  if (limit > overall) {
    return `Cannot exceed overall assessment duration (${overall} min).`;
  }
  return null;
}

interface MultipleSectionsSectionProps {
  sections: Section[];
  onSectionsChange: (sections: Section[]) => void;
  /** Assessment-wide duration (minutes). When set, section time caps are validated against it. */
  overallDurationMinutes?: number;
}

const helperFormProps = {
  sx: {
    fontSize: "0.8125rem",
    lineHeight: 1.45,
    color: "var(--font-secondary)",
    mt: 0.5,
  },
};

const groupTitleSx = {
  fontSize: "0.7rem",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  color: "var(--font-secondary)",
  mb: 0.25,
};

function FieldGroup({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Typography component="h4" variant="subtitle2" sx={groupTitleSx}>
        {title}
      </Typography>
      {hint ? (
        <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mb: 1.25 }}>
          {hint}
        </Typography>
      ) : (
        <Box sx={{ mb: 1 }} />
      )}
      {children}
    </Box>
  );
}

export function MultipleSectionsSection({
  sections,
  onSectionsChange,
  overallDurationMinutes,
}: MultipleSectionsSectionProps) {
  const [newSection, setNewSection] = useState<Omit<Section, "id">>({
    type: "quiz",
    title: "",
    description: "",
    order: sections.length + 1,
    easyScore: 1,
    mediumScore: 2,
    hardScore: 3,
    sectionCutoffMarks: "",
  });

  const newSectionTimeLimitError = useMemo(
    () =>
      sectionTimeLimitExceedsOverallMessage(
        overallDurationMinutes,
        newSection.timeLimitMinutes
      ),
    [overallDurationMinutes, newSection.timeLimitMinutes]
  );

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
    if (newSectionTimeLimitError) return;
    const orderExists = sections.some((s) => s.order === newSection.order);
    if (orderExists) {
      return;
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
      sectionCutoffMarks: "",
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

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const ordered = [...sections].sort((a, b) => a.order - b.order);
      const [removed] = ordered.splice(result.source.index, 1);
      ordered.splice(result.destination.index, 0, removed);
      const updated = ordered.map((s, i) => ({ ...s, order: i + 1 }));
      onSectionsChange(updated);
    },
    [sections, onSectionsChange]
  );

  const orderedSections = useMemo(
    () => [...sections].sort((a, b) => a.order - b.order),
    [sections]
  );

  const scoreHelper =
    newSection.type === "quiz"
      ? "Points awarded per difficulty for MCQs in this block."
      : "Points per difficulty for coding problems in this block.";

  return (
    <Box component="section" aria-labelledby="assessment-sections-heading">
      <Typography
        id="assessment-sections-heading"
        variant="h6"
        sx={{
          fontWeight: 700,
          color: "var(--font-primary)",
          mb: 1,
        }}
      >
        Assessment Sections
      </Typography>
      <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 3, maxWidth: 640 }}>
        Build the structure of the assessment. Each block becomes an entry in{" "}
        <Typography component="span" variant="body2" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
          quizSection
        </Typography>{" "}
        or{" "}
        <Typography component="span" variant="body2" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
          codingProblemSection
        </Typography>{" "}
        on save. You will attach questions in the next step.
      </Typography>

      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 2,
          border: "1px solid",
          borderColor:
            "color-mix(in srgb, var(--accent-indigo) 30%, var(--border-default) 70%)",
          overflow: "hidden",
          boxShadow:
            "0 1px 3px color-mix(in srgb, var(--font-primary) 10%, transparent)",
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--accent-indigo) 8%, var(--surface) 92%) 0%, var(--card-bg) 56px)",
        }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 2,
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
            borderBottom: "1px solid",
            borderColor:
              "color-mix(in srgb, var(--accent-indigo) 20%, var(--border-default) 80%)",
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor:
                "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
              border:
                "1px solid color-mix(in srgb, var(--accent-indigo) 30%, var(--border-default) 70%)",
              flexShrink: 0,
            }}
          >
            <IconWrapper icon="mdi:layers-plus" size={24} color="var(--accent-indigo)" />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
              Add new section
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--font-secondary)", mt: 0.5, lineHeight: 1.5 }}>
              Groups below follow the same order as your API: layout → scoring → copy → pool size → limits.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 2.5, display: "flex", flexDirection: "column", gap: 3 }}>
          <FieldGroup
            title="Layout & order"
            hint="Pick block type and where it appears in the assessment flow."
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <FormControl fullWidth>
                <InputLabel id="new-section-type-label">Section type</InputLabel>
                <Select
                  labelId="new-section-type-label"
                  value={newSection.type}
                  onChange={(e) =>
                    setNewSection({
                      ...newSection,
                      type: e.target.value as "quiz" | "coding",
                    })
                  }
                  label="Section type"
                >
                  <MenuItem value="quiz">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                      <IconWrapper icon="mdi:help-circle-outline" size={20} color="var(--accent-indigo)" />
                      Quiz (MCQ block)
                    </Box>
                  </MenuItem>
                  <MenuItem value="coding">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                      <IconWrapper icon="mdi:code-tags" size={20} color="var(--success-500)" />
                      Coding problems
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Section order"
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
                FormHelperTextProps={helperFormProps}
                helperText="Lower numbers appear first. Must be unique across sections."
                error={sections.some((s) => s.order === newSection.order)}
              />
            </Box>
          </FieldGroup>

          <Divider sx={{ borderColor: "var(--border-default)" }} />

          <FieldGroup title="Difficulty scoring" hint={scoreHelper}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                gap: 2,
              }}
            >
              <TextField
                label="Easy"
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
                FormHelperTextProps={helperFormProps}
                helperText="easy_score"
              />
              <TextField
                label="Medium"
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
                FormHelperTextProps={helperFormProps}
                helperText="medium_score"
              />
              <TextField
                label="Hard"
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
                FormHelperTextProps={helperFormProps}
                helperText="hard_score"
              />
            </Box>
          </FieldGroup>

          <Divider sx={{ borderColor: "var(--border-default)" }} />

          <FieldGroup
            title="Titles & description"
            hint="Shown to admins and often to learners as the section heading."
          >
            <TextField
              label="Section title"
              value={newSection.title}
              onChange={(e) =>
                setNewSection({ ...newSection, title: e.target.value })
              }
              fullWidth
              required
              inputProps={{ maxLength: 255 }}
              FormHelperTextProps={helperFormProps}
              helperText="Required. Maps to title in the payload."
            />
            <TextField
              label="Section description"
              value={newSection.description}
              onChange={(e) =>
                setNewSection({ ...newSection, description: e.target.value })
              }
              fullWidth
              multiline
              minRows={2}
              FormHelperTextProps={helperFormProps}
              helperText="Optional. Shown as description on the section."
            />
          </FieldGroup>

          <Divider sx={{ borderColor: "var(--border-default)" }} />

          <FieldGroup
            title="Question pool"
            hint="Limit how many items are drawn from the pool you attach in the next step."
          >
            <TextField
              label="Number of questions to show"
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
              FormHelperTextProps={helperFormProps}
              helperText="Leave empty to use every attached question. Otherwise caps the count (random or server-defined selection)."
            />
          </FieldGroup>

          <Divider sx={{ borderColor: "var(--border-default)" }} />

          <FieldGroup
            title="Time & cutoff"
            hint="Optional limits sent as time_limit_minutes and section_cutoff_marks."
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <TextField
                label="Time limit (minutes)"
                type="number"
                value={
                  newSection.timeLimitMinutes === undefined
                    ? ""
                    : newSection.timeLimitMinutes
                }
                onChange={(e) => {
                  const v = e.target.value;
                  setNewSection({
                    ...newSection,
                    timeLimitMinutes:
                      v === "" ? undefined : Math.max(0, Math.round(Number(v))),
                  });
                }}
                fullWidth
                inputProps={{ min: 0 }}
                error={Boolean(newSectionTimeLimitError)}
                helperText={
                  newSectionTimeLimitError ??
                  "Cap time for this block only. Omit by leaving empty."
                }
                FormHelperTextProps={
                  newSectionTimeLimitError
                    ? { sx: { fontSize: "0.8125rem", lineHeight: 1.45, mt: 0.5 } }
                    : helperFormProps
                }
              />
              <TextField
                label="Section cutoff marks"
                value={newSection.sectionCutoffMarks ?? ""}
                onChange={(e) =>
                  setNewSection({
                    ...newSection,
                    sectionCutoffMarks: e.target.value,
                  })
                }
                fullWidth
                FormHelperTextProps={helperFormProps}
                helperText="Minimum marks to clear this section. Omit if not used."
              />
            </Box>
          </FieldGroup>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 2,
              pt: 0.5,
            }}
          >
            <Typography variant="caption" sx={{ color: "var(--font-tertiary)", mr: "auto" }}>
              Title is required before adding.
            </Typography>
            <Button
              variant="contained"
              onClick={handleAddSection}
              disabled={!newSection.title.trim() || Boolean(newSectionTimeLimitError)}
              startIcon={<IconWrapper icon="mdi:plus" size={18} />}
              sx={{
                bgcolor: "var(--accent-indigo)",
                px: 2.5,
                fontWeight: 600,
                "&:hover": { bgcolor: "var(--accent-indigo-dark)" },
              }}
            >
              Add section
            </Button>
          </Box>
        </Box>
      </Paper>

      {sections.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconWrapper icon="mdi:drag-vertical-variant" size={22} color="var(--font-secondary)" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
              Your sections
            </Typography>
            <Chip label={`${sections.length} total`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
          </Box>
          <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mb: 0.5 }}>
            Drag the handle to reorder. Order values update automatically.
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
                          {...provided.dragHandleProps}
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
                            overallDurationMinutes={overallDurationMinutes}
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
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: 2,
            border: "2px dashed",
            borderColor:
              "color-mix(in srgb, var(--font-secondary) 40%, var(--border-default) 60%)",
            bgcolor: "color-mix(in srgb, var(--surface) 80%, var(--card-bg) 20%)",
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              bgcolor:
                "color-mix(in srgb, var(--accent-indigo) 10%, var(--surface) 90%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <IconWrapper icon="mdi:layers-outline" size={32} color="var(--accent-indigo)" />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "var(--font-primary)", mb: 0.5 }}>
            No sections yet
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--font-secondary)", maxWidth: 360, mx: "auto" }}>
            Add at least one quiz or coding block above. You will map MCQs and problems to each block in the next step.
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
  overallDurationMinutes?: number;
  dragHandleProps?: Record<string, unknown>;
  isDragging?: boolean;
}

function SectionCard({
  section,
  onUpdate,
  onDelete,
  orderError,
  allSections,
  overallDurationMinutes,
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

  const accent = section.type === "quiz" ? "var(--accent-indigo)" : "var(--success-500)";
  const accentSoft =
    section.type === "quiz"
      ? "color-mix(in srgb, var(--accent-indigo) 8%, transparent)"
      : "color-mix(in srgb, var(--success-500) 8%, transparent)";

  const editTimeLimitError = sectionTimeLimitExceedsOverallMessage(
    overallDurationMinutes,
    editData.timeLimitMinutes
  );
  const savedTimeLimitError = sectionTimeLimitExceedsOverallMessage(
    overallDurationMinutes,
    section.timeLimitMinutes
  );

  return (
    <Paper
      elevation={0}
      sx={{
        p: 0,
        overflow: "hidden",
        border: "1px solid",
        borderColor: isDragging ? accent : "var(--border-default)",
        borderLeft: `4px solid ${accent}`,
        borderRadius: 2,
        boxShadow: isDragging
          ? "0 8px 24px color-mix(in srgb, var(--font-primary) 20%, transparent)"
          : "0 1px 2px color-mix(in srgb, var(--font-primary) 10%, transparent)",
        opacity: isDragging ? 0.92 : 1,
        transition: "box-shadow 0.2s ease, border-color 0.2s ease, opacity 0.2s ease",
        "&:hover": {
          boxShadow:
            "0 4px 14px color-mix(in srgb, var(--font-primary) 16%, transparent)",
        },
      }}
    >
      {isEditing ? (
        <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2.5 }}>
          <FieldGroup title="Layout" hint="Type and display order.">
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <FormControl fullWidth>
                <InputLabel>Section type</InputLabel>
                <Select
                  value={editData.type}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      type: e.target.value as "quiz" | "coding",
                    })
                  }
                  label="Section type"
                >
                  <MenuItem value="quiz">Quiz (MCQ)</MenuItem>
                  <MenuItem value="coding">Coding</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </FieldGroup>
          <TextField
            label="Title"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            fullWidth
            required
            FormHelperTextProps={helperFormProps}
            helperText="Section title"
          />
          <TextField
            label="Description"
            value={editData.description}
            onChange={(e) =>
              setEditData({ ...editData, description: e.target.value })
            }
            fullWidth
            multiline
            minRows={2}
            FormHelperTextProps={helperFormProps}
            helperText="Optional"
          />
          <FieldGroup title="Scoring">
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                gap: 2,
              }}
            >
              <TextField
                label="Easy"
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
                FormHelperTextProps={helperFormProps}
                helperText="easy_score"
              />
              <TextField
                label="Medium"
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
                FormHelperTextProps={helperFormProps}
                helperText="medium_score"
              />
              <TextField
                label="Hard"
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
                FormHelperTextProps={helperFormProps}
                helperText="hard_score"
              />
            </Box>
          </FieldGroup>
          <TextField
            label="Number of questions to show"
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
            FormHelperTextProps={helperFormProps}
            helperText="Leave empty for all attached items."
          />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              label="Time limit (minutes)"
              type="number"
              value={
                editData.timeLimitMinutes === undefined
                  ? ""
                  : editData.timeLimitMinutes
              }
              onChange={(e) => {
                const v = e.target.value;
                setEditData({
                  ...editData,
                  timeLimitMinutes:
                    v === "" ? undefined : Math.max(0, Math.round(Number(v))),
                });
              }}
              fullWidth
              inputProps={{ min: 0 }}
              error={Boolean(editTimeLimitError)}
              helperText={editTimeLimitError ?? "time_limit_minutes"}
              FormHelperTextProps={
                editTimeLimitError
                  ? { sx: { fontSize: "0.8125rem", lineHeight: 1.45, mt: 0.5 } }
                  : helperFormProps
              }
            />
            <TextField
              label="Section cutoff marks"
              value={editData.sectionCutoffMarks ?? ""}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  sectionCutoffMarks: e.target.value,
                })
              }
              fullWidth
              FormHelperTextProps={helperFormProps}
              helperText="section_cutoff_marks"
            />
          </Box>
          {allSections.some(
            (s) => s.id !== section.id && s.order === editData.order
          ) && (
            <Alert severity="error">
              This order number is already used by another section. Please choose
              a different order.
            </Alert>
          )}
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button variant="outlined" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!editData.title.trim() || Boolean(editTimeLimitError)}
              sx={{
                bgcolor: "var(--accent-indigo)",
                color: "var(--font-light)",
                fontWeight: 600,
                "&:hover": { bgcolor: "var(--accent-indigo-dark)" },
                "&.Mui-disabled": {
                  bgcolor:
                    "color-mix(in srgb, var(--accent-indigo) 24%, var(--surface) 76%)",
                  color:
                    "color-mix(in srgb, var(--font-light) 65%, var(--font-tertiary) 35%)",
                  WebkitTextFillColor:
                    "color-mix(in srgb, var(--font-light) 65%, var(--font-tertiary) 35%)",
                },
              }}
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
              px: 2,
              py: 1.75,
              bgcolor: accentSoft,
              borderBottom: "1px solid var(--border-default)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <IconWrapper
                icon={section.type === "quiz" ? "mdi:help-circle-outline" : "mdi:code-tags"}
                size={22}
                color={accent}
              />
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Chip
                    label={section.type === "quiz" ? "Quiz" : "Coding"}
                    size="small"
                    sx={{
                      bgcolor:
                        section.type === "quiz"
                          ? "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)"
                          : "color-mix(in srgb, var(--success-500) 12%, var(--surface) 88%)",
                      color: accent,
                      fontWeight: 700,
                      height: 24,
                    }}
                  />
                  <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontWeight: 600 }}>
                    Order {section.order}
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5, color: "var(--font-primary)" }}>
                  {section.title}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              <IconButton
                size="small"
                {...dragHandleProps}
                sx={{
                  color: "var(--font-tertiary)",
                  cursor: "grab",
                  "&:hover": {
                    color: "var(--accent-indigo)",
                    bgcolor:
                      "color-mix(in srgb, var(--accent-indigo) 8%, transparent)",
                  },
                }}
                aria-label="Drag to reorder"
              >
                <IconWrapper icon="mdi:drag" size={22} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setIsEditing(true)}
                sx={{ color: "var(--accent-indigo)" }}
                aria-label="Edit section"
              >
                <IconWrapper icon="mdi:pencil" size={20} />
              </IconButton>
              <IconButton
                size="small"
                onClick={onDelete}
                sx={{ color: "var(--error-500)" }}
                aria-label="Delete section"
              >
                <IconWrapper icon="mdi:delete-outline" size={20} />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ px: 2, py: 2 }}>
            {section.description ? (
              <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 1.5 }}>
                {section.description}
              </Typography>
            ) : null}
            {section.type === "quiz" && (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                <Chip
                  label={`Easy ${section.easyScore ?? 1} pts`}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor:
                      "color-mix(in srgb, var(--success-500) 38%, var(--border-default) 62%)",
                    color: "var(--success-500)",
                  }}
                />
                <Chip
                  label={`Medium ${section.mediumScore ?? 2} pts`}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor:
                      "color-mix(in srgb, var(--warning-500) 38%, var(--border-default) 62%)",
                    color: "var(--warning-500)",
                  }}
                />
                <Chip
                  label={`Hard ${section.hardScore ?? 3} pts`}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor:
                      "color-mix(in srgb, var(--error-500) 38%, var(--border-default) 62%)",
                    color: "var(--error-500)",
                  }}
                />
              </Box>
            )}
            {section.type === "coding" && (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                <Chip
                  label={`Easy ${section.easyScore ?? 1} pts`}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor:
                      "color-mix(in srgb, var(--success-500) 38%, var(--border-default) 62%)",
                    color: "var(--success-500)",
                  }}
                />
                <Chip
                  label={`Medium ${section.mediumScore ?? 2} pts`}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor:
                      "color-mix(in srgb, var(--warning-500) 38%, var(--border-default) 62%)",
                    color: "var(--warning-500)",
                  }}
                />
                <Chip
                  label={`Hard ${section.hardScore ?? 3} pts`}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor:
                      "color-mix(in srgb, var(--error-500) 38%, var(--border-default) 62%)",
                    color: "var(--error-500)",
                  }}
                />
              </Box>
            )}
            {section.number_of_questions_to_show ? (
              <Typography variant="body2" sx={{ color: "var(--accent-indigo)", fontWeight: 600, mb: 1 }}>
                Pool: show up to {section.number_of_questions_to_show} question(s)
              </Typography>
            ) : null}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {section.timeLimitMinutes != null && section.timeLimitMinutes > 0 && (
                <Chip
                  icon={<IconWrapper icon="mdi:timer-outline" size={16} />}
                  label={`${section.timeLimitMinutes} min cap`}
                  size="small"
                  sx={{ bgcolor: "var(--surface)" }}
                />
              )}
              {section.sectionCutoffMarks != null &&
                String(section.sectionCutoffMarks).trim() !== "" && (
                  <Chip
                    icon={<IconWrapper icon="mdi:chart-bell-curve" size={16} />}
                    label={`Cutoff ${section.sectionCutoffMarks}`}
                    size="small"
                    sx={{ bgcolor: "var(--surface)" }}
                  />
                )}
            </Box>
            {orderError && (
              <Alert severity="error" sx={{ mt: 1.5 }}>
                {orderError}
              </Alert>
            )}
            {savedTimeLimitError && (
              <Alert severity="error" sx={{ mt: 1.5 }}>
                {savedTimeLimitError}
              </Alert>
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
}
