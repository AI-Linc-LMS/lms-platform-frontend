"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Box,
  Stack,
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
  Alert,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { StatusChip } from "@/components/admin/assessment/shared";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

export interface Section {
  id: string;
  type: "quiz" | "coding" | "subjective";
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
    lineHeight: 1.5,
    color: "var(--font-secondary)",
    mt: 0.75,
    /** Keeps helper copy clear of the next field’s outline / floating label */
    mb: 0.25,
    display: "block",
  },
};

/** Section kicker label (redesign): tiny, heavy, uppercase, tertiary. */
const kickerSx = {
  fontSize: "0.72rem",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "var(--font-tertiary)",
};

const groupTitleSx = {
  ...kickerSx,
  mb: 0.25,
};

/** Card recipe from the shipped hub design. */
const cardShellSx = {
  bgcolor: "var(--card-bg)",
  borderRadius: "16px",
  border: "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)",
  boxShadow: "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.08)",
};

/** Primary action: AI gradient, white text, no uppercase. */
const primaryButtonSx = {
  background: "var(--gradient-ai)",
  color: "#fff",
  fontWeight: 700,
  textTransform: "none" as const,
  borderRadius: 2,
  px: 2.5,
  boxShadow: "none",
  "&:hover": {
    background: "var(--gradient-ai)",
    filter: "brightness(0.94)",
    boxShadow: "none",
  },
  "&.Mui-disabled": {
    background:
      "color-mix(in srgb, var(--ai-violet) 24%, var(--surface) 76%)",
    color: "color-mix(in srgb, #fff 72%, transparent)",
    WebkitTextFillColor: "color-mix(in srgb, #fff 72%, transparent)",
  },
};

/** Secondary action: quiet outline that warms to indigo. */
const secondaryButtonSx = {
  textTransform: "none" as const,
  fontWeight: 700,
  borderRadius: 2,
  color: "var(--font-secondary)",
  borderColor: "var(--border-default)",
  "&:hover": {
    borderColor: "var(--accent-indigo)",
    color: "var(--accent-indigo)",
    bgcolor: "transparent",
  },
};

/** Small square icon-button used for the per-card order/edit/delete controls. */
const cardActionButtonSx = {
  width: 30,
  height: 30,
  borderRadius: "8px",
  border: "1px solid var(--border-default)",
  color: "var(--font-tertiary)",
};

/** Token-driven error alert (replaces the MUI default look). */
const errorAlertSx = {
  borderRadius: "10px",
  bgcolor: "color-mix(in srgb, var(--error-500) 9%, var(--card-bg) 91%)",
  border: "1px solid color-mix(in srgb, var(--error-500) 30%, transparent)",
  color: "var(--error-500)",
  "& .MuiAlert-icon": { color: "var(--error-500)" },
};

/** Indigo icon tile (rounded square) that brands each section-type row. */
function TypeIconTile({ icon, size = 40 }: { icon: string; size?: number }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: 2,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor:
          "color-mix(in srgb, var(--accent-indigo) 12%, var(--card-bg) 88%)",
      }}
    >
      <IconWrapper
        icon={icon}
        size={Math.round(size * 0.55)}
        color="var(--accent-indigo)"
      />
    </Box>
  );
}

/** Mono stat cell for the per-card difficulty points band. */
function PointsStat({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <Box sx={{ textAlign: "center", flex: 1, minWidth: 0 }}>
      <Typography
        sx={{
          fontFamily: "var(--font-mono)",
          fontWeight: 700,
          fontSize: "1.05rem",
          lineHeight: 1.2,
          color,
        }}
      >
        {value}
      </Typography>
      <Typography
        variant="caption"
        sx={{ color: "var(--font-tertiary)", fontSize: "0.72rem" }}
      >
        {label}
      </Typography>
    </Box>
  );
}

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
      <Stack spacing={2.75} sx={{ width: "100%" }}>
        {children}
      </Stack>
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
      <Typography sx={{ ...kickerSx, mb: 0.5 }}>Section builder</Typography>
      <Typography
        id="assessment-sections-heading"
        variant="h6"
        sx={{
          fontFamily: "var(--font-jakarta)",
          fontWeight: 800,
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
          bgcolor: "var(--card-bg)",
          borderRadius: "var(--radius-card)",
          border:
            "1.5px dashed color-mix(in srgb, var(--accent-indigo) 40%, var(--border-default) 60%)",
          boxShadow:
            "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.08)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 2,
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
            borderBottom:
              "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)",
          }}
        >
          <TypeIconTile icon="mdi:plus" size={44} />
          <Box>
            <Typography sx={kickerSx}>Step 1 · Structure</Typography>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: "var(--font-jakarta)",
                fontWeight: 800,
                color: "var(--font-primary)",
              }}
            >
              Add section
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
                      type: e.target.value as "quiz" | "coding" | "subjective",
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
                      <IconWrapper icon="mdi:code-tags" size={20} color="var(--accent-indigo)" />
                      Coding problems
                    </Box>
                  </MenuItem>
                  <MenuItem value="subjective">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                      <IconWrapper icon="mdi:text-box-outline" size={20} color="var(--accent-indigo)" />
                      Written (subjective)
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

          {newSection.type !== "subjective" ? (
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
                helperText="Points for each easy question"
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
                helperText="Points for each medium question"
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
                helperText="Points for each hard question"
              />
            </Box>
          </FieldGroup>
          ) : null}

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
              helperText="Required. Learners see this as the section heading."
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
            hint="Optionally cap this section's time and set a minimum score to clear it."
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
              sx={primaryButtonSx}
            >
              Add section
            </Button>
          </Box>
        </Box>
      </Paper>

      {sections.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconWrapper icon="mdi:drag-vertical-variant" size={20} color="var(--font-tertiary)" />
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: "var(--font-jakarta)",
                fontWeight: 800,
                color: "var(--font-primary)",
              }}
            >
              Your sections
            </Typography>
            <Box
              component="span"
              sx={{
                px: 1,
                py: 0.4,
                borderRadius: 999,
                bgcolor:
                  "color-mix(in srgb, var(--accent-indigo) 12%, var(--card-bg) 88%)",
                color: "var(--accent-indigo)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {sections.length} total
            </Box>
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
            bgcolor: "var(--card-bg)",
            borderRadius: "16px",
            border:
              "1.5px dashed color-mix(in srgb, var(--accent-indigo) 40%, var(--border-default) 60%)",
            boxShadow:
              "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.08)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <TypeIconTile icon="mdi:layers-outline" size={56} />
          </Box>
          <Typography
            variant="subtitle1"
            sx={{
              fontFamily: "var(--font-jakarta)",
              fontWeight: 800,
              color: "var(--font-primary)",
              mb: 0.5,
            }}
          >
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

  const typeIcon =
    section.type === "quiz"
      ? "mdi:help-circle-outline"
      : section.type === "coding"
        ? "mdi:code-tags"
        : "mdi:text-box-outline";
  const typeLabel =
    section.type === "quiz"
      ? "Quiz section"
      : section.type === "coding"
        ? "Coding section"
        : "Written section";

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
        ...cardShellSx,
        ...(isDragging
          ? {
              border: "1.5px solid var(--accent-indigo)",
              boxShadow:
                "0 14px 32px -18px color-mix(in srgb, var(--font-primary) 40%, transparent)",
            }
          : {}),
        opacity: isDragging ? 0.95 : 1,
        transition: "box-shadow 0.2s ease, border-color 0.2s ease, opacity 0.2s ease",
        "&:hover": {
          boxShadow:
            "0 14px 32px -18px color-mix(in srgb, var(--font-primary) 40%, transparent)",
        },
      }}
    >
      {isEditing ? (
        <Box>
          <Box
            sx={{
              px: 2.5,
              pt: 2,
              pb: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              borderBottom:
                "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)",
            }}
          >
            <TypeIconTile icon="mdi:pencil-outline" />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={kickerSx}>Edit section</Typography>
              <Typography
                sx={{
                  fontFamily: "var(--font-jakarta)",
                  fontWeight: 800,
                  fontSize: "1.05rem",
                  color: "var(--font-primary)",
                }}
              >
                {section.title}
              </Typography>
            </Box>
          </Box>
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
                      type: e.target.value as "quiz" | "coding" | "subjective",
                    })
                  }
                  label="Section type"
                >
                  <MenuItem value="quiz">Quiz (MCQ)</MenuItem>
                  <MenuItem value="coding">Coding</MenuItem>
                  <MenuItem value="subjective">Written (subjective)</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </FieldGroup>
          <Stack spacing={2.75}>
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
          </Stack>
          {editData.type !== "subjective" ? (
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
                helperText="Points for each easy question"
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
                helperText="Points for each medium question"
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
                helperText="Points for each hard question"
              />
            </Box>
          </FieldGroup>
          ) : null}
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
            <Alert severity="error" sx={errorAlertSx}>
              This order number is already used by another section. Please choose
              a different order.
            </Alert>
          )}
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button variant="outlined" onClick={handleCancel} sx={secondaryButtonSx}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!editData.title.trim() || Boolean(editTimeLimitError)}
              sx={primaryButtonSx}
            >
              Save
            </Button>
          </Box>
        </Box>
        </Box>
      ) : (
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
              px: 2.5,
              pt: 2,
              pb: 1.75,
            }}
          >
            <TypeIconTile icon={typeIcon} />
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                <Typography sx={kickerSx}>{typeLabel}</Typography>
                <Typography
                  component="span"
                  sx={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "var(--accent-indigo)",
                  }}
                >
                  #{section.order}
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontFamily: "var(--font-jakarta)",
                  fontWeight: 800,
                  fontSize: "1.05rem",
                  mt: 0.25,
                  color: "var(--font-primary)",
                }}
              >
                {section.title}
              </Typography>
              {section.description ? (
                <Typography variant="body2" sx={{ color: "var(--font-secondary)", mt: 0.5 }}>
                  {section.description}
                </Typography>
              ) : null}
            </Box>
            <Box sx={{ display: "flex", gap: 0.75, alignItems: "center", flexShrink: 0 }}>
              <IconButton
                size="small"
                {...dragHandleProps}
                sx={{
                  ...cardActionButtonSx,
                  cursor: "grab",
                  "&:hover": {
                    color: "var(--accent-indigo)",
                    borderColor: "var(--accent-indigo)",
                    bgcolor:
                      "color-mix(in srgb, var(--accent-indigo) 8%, transparent)",
                  },
                }}
                aria-label="Drag to reorder"
              >
                <IconWrapper icon="mdi:drag" size={18} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setIsEditing(true)}
                sx={{
                  ...cardActionButtonSx,
                  "&:hover": {
                    color: "var(--accent-indigo)",
                    borderColor: "var(--accent-indigo)",
                    bgcolor:
                      "color-mix(in srgb, var(--accent-indigo) 8%, transparent)",
                  },
                }}
                aria-label="Edit section"
              >
                <IconWrapper icon="mdi:pencil" size={16} />
              </IconButton>
              <IconButton
                size="small"
                onClick={onDelete}
                sx={{
                  ...cardActionButtonSx,
                  "&:hover": {
                    color: "var(--error-500)",
                    borderColor:
                      "color-mix(in srgb, var(--error-500) 45%, var(--border-default) 55%)",
                    bgcolor:
                      "color-mix(in srgb, var(--error-500) 8%, transparent)",
                  },
                }}
                aria-label="Delete section"
              >
                <IconWrapper icon="mdi:delete-outline" size={16} />
              </IconButton>
            </Box>
          </Box>
          {section.type === "quiz" && (
            <Box
              sx={{
                display: "flex",
                alignItems: "stretch",
                borderTop: "1px solid var(--border-default)",
                borderBottom: "1px solid var(--border-default)",
                py: 1.25,
              }}
            >
              <PointsStat value={section.easyScore ?? 1} label="Easy pts" color="var(--success-500)" />
              <Box sx={{ width: "1px", my: -1.25, bgcolor: "var(--border-default)" }} />
              <PointsStat value={section.mediumScore ?? 2} label="Medium pts" color="var(--warning-500)" />
              <Box sx={{ width: "1px", my: -1.25, bgcolor: "var(--border-default)" }} />
              <PointsStat value={section.hardScore ?? 3} label="Hard pts" color="var(--error-500)" />
            </Box>
          )}
          {section.type === "coding" && (
            <Box
              sx={{
                display: "flex",
                alignItems: "stretch",
                borderTop: "1px solid var(--border-default)",
                borderBottom: "1px solid var(--border-default)",
                py: 1.25,
              }}
            >
              <PointsStat value={section.easyScore ?? 1} label="Easy pts" color="var(--success-500)" />
              <Box sx={{ width: "1px", my: -1.25, bgcolor: "var(--border-default)" }} />
              <PointsStat value={section.mediumScore ?? 2} label="Medium pts" color="var(--warning-500)" />
              <Box sx={{ width: "1px", my: -1.25, bgcolor: "var(--border-default)" }} />
              <PointsStat value={section.hardScore ?? 3} label="Hard pts" color="var(--error-500)" />
            </Box>
          )}
          <Box sx={{ px: 2.5, pt: 1.5, pb: 2, display: "flex", flexDirection: "column", gap: 1.25 }}>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {section.number_of_questions_to_show ? (
                <StatusChip
                  label={`Pool · show up to ${section.number_of_questions_to_show}`}
                  tone="info"
                  icon="mdi:filter-variant"
                />
              ) : null}
              {section.timeLimitMinutes != null && section.timeLimitMinutes > 0 && (
                <StatusChip
                  label={`${section.timeLimitMinutes} min cap`}
                  tone="neutral"
                  icon="mdi:timer-outline"
                />
              )}
              {section.sectionCutoffMarks != null &&
                String(section.sectionCutoffMarks).trim() !== "" && (
                  <StatusChip
                    label={`Cutoff ${section.sectionCutoffMarks}`}
                    tone="neutral"
                    icon="mdi:chart-bell-curve"
                  />
                )}
            </Box>
            {orderError && (
              <Alert severity="error" sx={errorAlertSx}>
                {orderError}
              </Alert>
            )}
            {savedTimeLimitError && (
              <Alert severity="error" sx={errorAlertSx}>
                {savedTimeLimitError}
              </Alert>
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
}
