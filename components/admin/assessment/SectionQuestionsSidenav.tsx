"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Section } from "./MultipleSectionsSection";
import { IconWrapper } from "@/components/common/IconWrapper";

type SectionKind = "quiz" | "coding" | "subjective";

interface SectionQuestionsSidenavProps {
  sections: Section[];
  selectedSectionId: string | "";
  onSectionSelect: (sectionId: string) => void;
  /** Optional: renders a "+ Add section" row that jumps back to the sections builder. */
  onAddSection?: () => void;
  sectionQuestionCounts: Record<string, number>;
  sectionCodingCounts: Record<string, number>;
  sectionSubjectiveCounts: Record<string, number>;
}

const TYPE_META: Record<
  SectionKind,
  { label: string; icon: string; emptyHint: string; accent: string }
> = {
  quiz: {
    label: "Quiz",
    icon: "mdi:help-circle-outline",
    emptyHint: "Add a quiz block in Assessment Details to list sections here.",
    accent: "var(--accent-indigo)",
  },
  coding: {
    label: "Coding",
    icon: "mdi:code-tags",
    emptyHint: "Add a coding block in Assessment Details to list sections here.",
    accent: "var(--success-500)",
  },
  subjective: {
    label: "Written",
    icon: "mdi:text-box-outline",
    emptyHint: "Add a written block in Assessment Details to list sections here.",
    accent: "var(--accent-purple)",
  },
};

export function SectionQuestionsSidenav({
  sections,
  selectedSectionId,
  onSectionSelect,
  onAddSection,
  sectionQuestionCounts,
  sectionCodingCounts,
  sectionSubjectiveCounts,
}: SectionQuestionsSidenavProps) {
  const quizSections = sections
    .filter((s) => s.type === "quiz")
    .sort((a, b) => a.order - b.order);
  const codingSections = sections
    .filter((s) => s.type === "coding")
    .sort((a, b) => a.order - b.order);
  const subjectiveSections = sections
    .filter((s) => s.type === "subjective")
    .sort((a, b) => a.order - b.order);

  const getInitialType = (): SectionKind | null => {
    if (selectedSectionId) {
      const currentSection = sections.find((s) => s.id === selectedSectionId);
      if (currentSection && currentSection.type !== "subjective") {
        return currentSection.type;
      }
      if (currentSection?.type === "subjective") {
        return "subjective";
      }
    }
    if (quizSections.length > 0) return "quiz";
    if (codingSections.length > 0) return "coding";
    if (subjectiveSections.length > 0) return "subjective";
    return null;
  };

  const [sectionType, setSectionType] = useState<SectionKind | null>(getInitialType);

  useEffect(() => {
    if (selectedSectionId) {
      const currentSection = sections.find((s) => s.id === selectedSectionId);
      if (currentSection && currentSection.type !== sectionType) {
        setSectionType(currentSection.type as SectionKind);
      }
    }
  }, [selectedSectionId, sections, sectionType]);

  const handleTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: SectionKind | null
  ) => {
    if (newType !== null && newType !== sectionType) {
      setSectionType(newType);
      if (newType === "quiz" && quizSections.length > 0) {
        onSectionSelect(quizSections[0].id);
      } else if (newType === "coding" && codingSections.length > 0) {
        onSectionSelect(codingSections[0].id);
      } else if (newType === "subjective" && subjectiveSections.length > 0) {
        onSectionSelect(subjectiveSections[0].id);
      } else {
        onSectionSelect("");
      }
    }
  };

  const displaySections =
    sectionType === "quiz"
      ? quizSections
      : sectionType === "coding"
        ? codingSections
        : subjectiveSections;

  const displayCounts =
    sectionType === "quiz"
      ? sectionQuestionCounts
      : sectionType === "coding"
        ? sectionCodingCounts
        : sectionSubjectiveCounts;

  const kindLabel = sectionType ? TYPE_META[sectionType].label : "";
  const kindIcon = sectionType ? TYPE_META[sectionType].icon : "mdi:view-dashboard-outline";
  const kindAccent = sectionType ? TYPE_META[sectionType].accent : "var(--ai-violet)";

  const countLabel =
    sectionType === "quiz"
      ? "questions"
      : sectionType === "coding"
        ? "problems"
        : "prompts";

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        maxWidth: "100%",
        height: { xs: "auto", sm: "calc(100vh - 120px)" },
        position: { xs: "relative", sm: "sticky" },
        top: { xs: 0, sm: 20 },
        maxHeight: { xs: "none", sm: "calc(100vh - 120px)" },
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        borderRadius: "var(--radius-card)",
        border: "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)",
        boxShadow: "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.08)",
        bgcolor: "var(--card-bg)",
      }}
    >
      {/* Header — "Live outline" gradient band (mockup) */}
      <Box
        sx={{
          p: 2,
          background: "var(--gradient-ai)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            bgcolor: "color-mix(in srgb, #fff 18%, transparent)",
          }}
        >
          <IconWrapper icon="mdi:file-tree-outline" size={20} color="#fff" />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontFamily: "var(--font-jakarta)",
              fontWeight: 800,
              fontSize: "1.02rem",
              lineHeight: 1.25,
            }}
          >
            Live outline
          </Typography>
          <Typography sx={{ fontSize: "0.78rem", opacity: 0.88, lineHeight: 1.35 }}>
            Updates as you build
          </Typography>
        </Box>
      </Box>

      {/* Type switcher — compact segmented pills */}
      <Box
        sx={{
          px: 1.5,
          py: 1.5,
          flexShrink: 0,
          borderBottom: "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)",
        }}
      >
        <ToggleButtonGroup
          value={sectionType}
          exclusive
          onChange={handleTypeChange}
          aria-label="section type"
          fullWidth
          size="small"
          sx={{
            p: 0.5,
            gap: 0.5,
            borderRadius: 999,
            border: "1px solid var(--border-default)",
            bgcolor: "var(--surface)",
            maxWidth: "100%",
            "& .MuiToggleButtonGroup-grouped": {
              border: "none !important",
              borderRadius: "999px !important",
              mx: 0,
              my: 0,
              flex: 1,
              minWidth: 0,
              px: 0.75,
              py: 0.55,
              fontWeight: 700,
              fontSize: "0.74rem",
              textTransform: "none",
              whiteSpace: "nowrap",
              overflow: "hidden",
              color: "var(--font-secondary)",
              bgcolor: "transparent",
              transition: "background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease",
              "&:hover": {
                bgcolor: "color-mix(in srgb, var(--ai-violet) 8%, transparent)",
                color: "var(--ai-violet)",
              },
              "&.Mui-disabled": {
                border: "none !important",
                opacity: 0.4,
              },
              "&.Mui-selected": {
                bgcolor: "var(--card-bg)",
                color: "var(--ai-violet)",
                boxShadow: "0 1px 2px rgba(16,24,40,0.1), 0 1px 3px rgba(16,24,40,0.08)",
                "&:hover": { bgcolor: "var(--card-bg)", color: "var(--ai-violet)" },
              },
            },
          }}
        >
          <ToggleButton value="quiz" aria-label="quiz sections" disabled={quizSections.length === 0}>
            Quiz · {quizSections.length}
          </ToggleButton>
          <ToggleButton value="coding" aria-label="coding sections" disabled={codingSections.length === 0}>
            Code · {codingSections.length}
          </ToggleButton>
          <ToggleButton value="subjective" aria-label="written sections" disabled={subjectiveSections.length === 0}>
            Written · {subjectiveSections.length}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {sectionType && displaySections.length > 0 && (
        <>
          <Box sx={{ px: 2, pt: 1.5, pb: 0.5, flexShrink: 0 }}>
            <Typography
              sx={{
                fontSize: "0.72rem",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--font-tertiary)",
              }}
            >
              {kindLabel} sections
            </Typography>
          </Box>
          <List sx={{ p: 1.25, pt: 0.75, overflowY: "auto", overflowX: "hidden", flex: 1 }}>
            {displaySections.map((section) => {
              const count = displayCounts[section.id] ?? 0;
              const isSelected = selectedSectionId === section.id;
              return (
                <ListItem key={section.id} disablePadding sx={{ mb: 0.75 }}>
                  <ListItemButton
                    selected={isSelected}
                    onClick={() => onSectionSelect(section.id)}
                    sx={{
                      px: 1.25,
                      py: 1.1,
                      gap: 1.25,
                      alignItems: "center",
                      cursor: "pointer",
                      borderRadius: "12px",
                      border: "1px solid",
                      borderColor: isSelected
                        ? "var(--ai-violet)"
                        : "color-mix(in srgb, var(--border-default) 55%, transparent)",
                      bgcolor: isSelected
                        ? "color-mix(in srgb, var(--ai-violet) 7%, var(--card-bg) 93%)"
                        : "var(--card-bg)",
                      boxShadow: isSelected
                        ? "0 0 0 1px color-mix(in srgb, var(--ai-violet) 55%, transparent)"
                        : "none",
                      transition:
                        "background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
                      "&:hover": {
                        borderColor: "var(--ai-violet)",
                        bgcolor: isSelected
                          ? "color-mix(in srgb, var(--ai-violet) 7%, var(--card-bg) 93%)"
                          : "color-mix(in srgb, var(--ai-violet) 4%, var(--card-bg) 96%)",
                      },
                      "&.Mui-selected": {
                        bgcolor: "color-mix(in srgb, var(--ai-violet) 7%, var(--card-bg) 93%)",
                        "&:hover": {
                          bgcolor: "color-mix(in srgb, var(--ai-violet) 7%, var(--card-bg) 93%)",
                        },
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        flexShrink: 0,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: `color-mix(in srgb, ${kindAccent} 12%, var(--card-bg) 88%)`,
                      }}
                    >
                      <IconWrapper icon={kindIcon} size={18} color={kindAccent} />
                    </Box>
                    <ListItemText
                      sx={{ my: 0, minWidth: 0 }}
                      primary={
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isSelected ? 700 : 600,
                            color: "var(--font-primary)",
                            fontSize: "0.88rem",
                            lineHeight: 1.35,
                            wordBreak: "break-word",
                          }}
                        >
                          {section.title?.trim() || "Untitled section"}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="caption"
                          component="span"
                          sx={{
                            color: "var(--font-tertiary)",
                            display: "block",
                            mt: 0.25,
                            lineHeight: 1.3,
                          }}
                        >
                          {count} {countLabel}
                        </Typography>
                      }
                    />
                    <Box
                      component="span"
                      title={`${count} ${countLabel}`}
                      sx={{
                        flexShrink: 0,
                        minWidth: 26,
                        height: 22,
                        px: 0.9,
                        borderRadius: 999,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        bgcolor:
                          count > 0
                            ? `color-mix(in srgb, ${kindAccent} 14%, var(--card-bg) 86%)`
                            : "color-mix(in srgb, var(--font-tertiary) 12%, var(--card-bg) 88%)",
                        color: count > 0 ? kindAccent : "var(--font-tertiary)",
                      }}
                    >
                      {count}
                    </Box>
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </>
      )}

      {sectionType && displaySections.length === 0 && (
        <Box
          sx={{
            p: 3,
            textAlign: "center",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.25,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: "color-mix(in srgb, var(--ai-violet) 10%, var(--card-bg) 90%)",
            }}
          >
            <IconWrapper icon="mdi:folder-open-outline" size={24} color="var(--ai-violet)" />
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
            No {kindLabel.toLowerCase()} sections yet
          </Typography>
          <Typography
            variant="body2"
            sx={{ maxWidth: 260, lineHeight: 1.5, color: "var(--font-secondary)" }}
          >
            {sectionType ? TYPE_META[sectionType].emptyHint : ""}
          </Typography>
        </Box>
      )}

      {sections.length === 0 && (
        <Box
          sx={{
            p: 3,
            textAlign: "center",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.25,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: "color-mix(in srgb, var(--ai-violet) 10%, var(--card-bg) 90%)",
            }}
          >
            <IconWrapper icon="mdi:layers-off-outline" size={24} color="var(--ai-violet)" />
          </Box>
          <Typography
            variant="body2"
            sx={{ maxWidth: 280, lineHeight: 1.5, color: "var(--font-secondary)" }}
          >
            No sections on this assessment. Go back to <strong>Assessment Details</strong> and add at least one
            quiz, coding, or written block.
          </Typography>
        </Box>
      )}

      {onAddSection ? (
        <Box sx={{ px: 2, pb: 2, pt: sections.length === 0 ? 0 : 1 }}>
          <Box
            onClick={onAddSection}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onAddSection();
              }
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.75,
              py: 1.3,
              borderRadius: "12px",
              border: "1.5px dashed color-mix(in srgb, var(--font-tertiary) 55%, transparent)",
              color: "var(--font-secondary)",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
              userSelect: "none",
              transition: "border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease",
              "&:hover": {
                borderColor: "var(--ai-violet)",
                color: "var(--ai-violet)",
                bgcolor: "color-mix(in srgb, var(--ai-violet) 5%, transparent)",
              },
            }}
          >
            <IconWrapper icon="mdi:plus" size={18} /> Add section
          </Box>
        </Box>
      ) : null}
    </Paper>
  );
}
