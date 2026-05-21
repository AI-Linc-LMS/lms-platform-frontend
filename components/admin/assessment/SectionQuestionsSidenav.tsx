"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
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
  sectionQuestionCounts: Record<string, number>;
  sectionCodingCounts: Record<string, number>;
  sectionSubjectiveCounts: Record<string, number>;
}

const TYPE_META: Record<
  SectionKind,
  { label: string; icon: string; emptyHint: string }
> = {
  quiz: {
    label: "Quiz",
    icon: "mdi:help-circle-outline",
    emptyHint: "Add a quiz block in Assessment Details to list sections here.",
  },
  coding: {
    label: "Coding",
    icon: "mdi:code-tags",
    emptyHint: "Add a coding block in Assessment Details to list sections here.",
  },
  subjective: {
    label: "Written",
    icon: "mdi:text-box-outline",
    emptyHint: "Add a written block in Assessment Details to list sections here.",
  },
};

export function SectionQuestionsSidenav({
  sections,
  selectedSectionId,
  onSectionSelect,
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

  const palette = useMemo(() => {
    if (sectionType === "quiz") {
      return {
        accent: "var(--accent-indigo)",
        accentDark: "var(--accent-indigo-dark)",
        selectedBg: "color-mix(in srgb, var(--accent-indigo) 16%, var(--card-bg))",
        listBanner: "color-mix(in srgb, var(--accent-indigo) 10%, var(--surface))",
        chipMuted: "color-mix(in srgb, var(--accent-indigo) 22%, var(--surface))",
        hoverList: "color-mix(in srgb, var(--accent-indigo) 8%, var(--card-bg))",
        borderSoft: "color-mix(in srgb, var(--accent-indigo) 22%, transparent)",
      };
    }
    if (sectionType === "coding") {
      return {
        accent: "var(--success-500)",
        accentDark: "color-mix(in srgb, var(--success-500) 78%, var(--font-dark))",
        selectedBg: "color-mix(in srgb, var(--success-500) 14%, var(--card-bg))",
        listBanner: "color-mix(in srgb, var(--success-500) 10%, var(--surface))",
        chipMuted: "color-mix(in srgb, var(--success-500) 22%, var(--surface))",
        hoverList: "color-mix(in srgb, var(--success-500) 8%, var(--card-bg))",
        borderSoft: "color-mix(in srgb, var(--success-500) 28%, transparent)",
      };
    }
    return {
      accent: "var(--accent-purple)",
      accentDark: "color-mix(in srgb, var(--accent-purple) 82%, var(--font-dark))",
      selectedBg: "color-mix(in srgb, var(--accent-purple) 12%, var(--card-bg))",
      listBanner: "color-mix(in srgb, var(--accent-purple) 8%, var(--surface))",
      chipMuted: "color-mix(in srgb, var(--accent-purple) 18%, var(--surface))",
      hoverList: "color-mix(in srgb, var(--accent-purple) 7%, var(--card-bg))",
      borderSoft: "color-mix(in srgb, var(--accent-purple) 28%, transparent)",
    };
  }, [sectionType]);

  const kindLabel = sectionType ? TYPE_META[sectionType].label : "";
  const kindIcon = sectionType ? TYPE_META[sectionType].icon : "mdi:view-dashboard-outline";

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
        height: { xs: "auto", sm: "calc(100vh - 120px)" },
        position: { xs: "relative", sm: "sticky" },
        top: { xs: 0, sm: 20 },
        maxHeight: { xs: "none", sm: "calc(100vh - 120px)" },
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        border: "1px solid color-mix(in srgb, var(--accent-indigo) 12%, var(--border-default))",
        boxShadow:
          "0 4px 24px color-mix(in srgb, var(--font-primary) 6%, transparent), 0 1px 0 color-mix(in srgb, var(--font-light) 40%, transparent)",
        bgcolor: "var(--card-bg)",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.25,
          py: 2,
          background: `linear-gradient(
            135deg,
            var(--accent-indigo-dark) 0%,
            var(--accent-indigo) 48%,
            color-mix(in srgb, var(--accent-purple) 35%, var(--accent-indigo)) 100%
          )`,
          color: "var(--font-light)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              bgcolor: "color-mix(in srgb, var(--font-light) 14%, transparent)",
              border: "1px solid color-mix(in srgb, var(--font-light) 22%, transparent)",
            }}
          >
            <IconWrapper icon="mdi:layers-triple-outline" size={24} color="var(--font-light)" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="overline"
              sx={{
                letterSpacing: "0.12em",
                fontWeight: 700,
                opacity: 0.92,
                fontSize: "0.68rem",
                lineHeight: 1.2,
                display: "block",
              }}
            >
              Assessment structure
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.25, mt: 0.35 }}>
              Sections
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.75, lineHeight: 1.45, fontSize: "0.8125rem" }}>
              Pick a section type, then choose a block to attach questions or prompts.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Type toggles */}
      <Box
        sx={{
          px: 1.5,
          py: 1.5,
          borderBottom: "1px solid var(--border-default)",
          bgcolor: "color-mix(in srgb, var(--surface) 55%, var(--card-bg))",
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
            gap: 0.75,
            flexWrap: "wrap",
            "& .MuiToggleButtonGroup-grouped": {
              border: "1px solid var(--border-default) !important",
              borderRadius: "10px !important",
              mx: 0,
              my: 0,
              flex: "1 1 28%",
              minWidth: 0,
              py: 1,
              fontWeight: 700,
              fontSize: "0.75rem",
              letterSpacing: "0.04em",
              textTransform: "none",
              color: "var(--font-secondary)",
              bgcolor: "var(--card-bg)",
              transition: "background-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease",
              "&:hover": {
                bgcolor: "color-mix(in srgb, var(--surface) 70%, var(--card-bg))",
              },
              "&.Mui-disabled": {
                opacity: 0.45,
              },
            },
            "& .MuiToggleButton-root.Mui-selected": {
              color: "var(--font-light) !important",
              boxShadow: "0 4px 12px color-mix(in srgb, var(--font-primary) 12%, transparent)",
            },
          }}
        >
          <ToggleButton
            value="quiz"
            aria-label="quiz sections"
            disabled={quizSections.length === 0}
            sx={{
              "&.Mui-selected": {
                bgcolor: "var(--accent-indigo) !important",
                borderColor: "var(--accent-indigo-dark) !important",
                "&:hover": { bgcolor: "var(--accent-indigo-dark) !important" },
              },
            }}
          >
            Quiz · {quizSections.length}
          </ToggleButton>
          <ToggleButton
            value="coding"
            aria-label="coding sections"
            disabled={codingSections.length === 0}
            sx={{
              "&.Mui-selected": {
                bgcolor: "var(--success-500) !important",
                borderColor: "color-mix(in srgb, var(--success-500) 70%, var(--font-dark)) !important",
                "&:hover": {
                  bgcolor: "color-mix(in srgb, var(--success-500) 88%, var(--font-dark)) !important",
                },
              },
            }}
          >
            Code · {codingSections.length}
          </ToggleButton>
          <ToggleButton
            value="subjective"
            aria-label="written sections"
            disabled={subjectiveSections.length === 0}
            sx={{
              "&.Mui-selected": {
                bgcolor: "var(--accent-purple) !important",
                borderColor: "color-mix(in srgb, var(--accent-purple) 75%, var(--font-dark)) !important",
                "&:hover": {
                  bgcolor: "color-mix(in srgb, var(--accent-purple) 88%, var(--font-dark)) !important",
                },
              },
            }}
          >
            Written · {subjectiveSections.length}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {sectionType && displaySections.length > 0 && (
        <>
          <Box
            sx={{
              px: 2,
              py: 1.25,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              bgcolor: palette.listBanner,
              borderBottom: `1px solid ${palette.borderSoft}`,
            }}
          >
            <IconWrapper icon={kindIcon} size={20} color={palette.accent} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  color: palette.accentDark,
                  letterSpacing: "0.02em",
                  lineHeight: 1.3,
                }}
              >
                {kindLabel} sections
              </Typography>
              <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mt: 0.15 }}>
                {displaySections.length} block{displaySections.length === 1 ? "" : "s"} · choose one to edit
              </Typography>
            </Box>
          </Box>
          <List sx={{ p: 1.25, overflow: "auto", flex: 1, bgcolor: "var(--card-bg)" }}>
            {displaySections.map((section) => {
              const count = displayCounts[section.id] ?? 0;
              const isSelected = selectedSectionId === section.id;
              return (
                <ListItem key={section.id} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    selected={isSelected}
                    onClick={() => onSectionSelect(section.id)}
                    sx={{
                      px: 1.75,
                      py: 1.35,
                      cursor: "pointer",
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: isSelected ? palette.borderSoft : "var(--border-default)",
                      bgcolor: isSelected ? palette.selectedBg : "var(--surface)",
                      boxShadow: isSelected
                        ? `0 0 0 1px ${palette.borderSoft}, 0 6px 18px color-mix(in srgb, var(--font-primary) 6%, transparent)`
                        : "none",
                      "&:hover": {
                        bgcolor: isSelected ? palette.selectedBg : palette.hoverList,
                        borderColor: palette.borderSoft,
                      },
                      transition: "background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
                      "&.Mui-selected": {
                        bgcolor: palette.selectedBg,
                        "&:hover": { bgcolor: palette.selectedBg },
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 4,
                        alignSelf: "stretch",
                        borderRadius: 1,
                        flexShrink: 0,
                        mr: 1.5,
                        bgcolor: isSelected ? palette.accent : "color-mix(in srgb, var(--font-tertiary) 35%, transparent)",
                        transition: "background-color 0.18s ease",
                      }}
                    />
                    <ListItemText
                      sx={{ my: 0 }}
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: 1,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: isSelected ? 700 : 600,
                              color: isSelected ? palette.accentDark : "var(--font-primary)",
                              fontSize: "0.9rem",
                              lineHeight: 1.4,
                              wordBreak: "break-word",
                            }}
                          >
                            {section.title?.trim() || "Untitled section"}
                          </Typography>
                          <Chip
                            label={count}
                            size="small"
                            title={`${count} ${countLabel}`}
                            variant={count > 0 ? "filled" : "outlined"}
                            sx={{
                              height: 24,
                              minWidth: 28,
                              flexShrink: 0,
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              borderColor: palette.borderSoft,
                              ...(count > 0
                                ? {
                                    bgcolor: palette.accent,
                                    color: "var(--font-light)",
                                    "& .MuiChip-label": { px: 0.85 },
                                  }
                                : {
                                    bgcolor: palette.chipMuted,
                                    color: "var(--font-secondary)",
                                    "& .MuiChip-label": { px: 0.85 },
                                  }),
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Typography
                          variant="caption"
                          component="span"
                          sx={{
                            color: "var(--font-secondary)",
                            mt: 0.75,
                            display: "block",
                            fontWeight: 500,
                          }}
                        >
                          Order {section.order}
                          <Box component="span" sx={{ mx: 0.75, opacity: 0.5 }}>
                            ·
                          </Box>
                          {count} {countLabel}
                        </Typography>
                      }
                    />
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
            bgcolor: "color-mix(in srgb, var(--surface) 40%, var(--card-bg))",
          }}
        >
          <IconWrapper icon="mdi:folder-open-outline" size={40} color="var(--font-tertiary)" />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
            No {kindLabel.toLowerCase()} sections yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 260, lineHeight: 1.5 }}>
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
          <IconWrapper icon="mdi:layers-off-outline" size={40} color="var(--font-tertiary)" />
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280, lineHeight: 1.5 }}>
            No sections on this assessment. Go back to <strong>Assessment Details</strong> and add at least one
            quiz, coding, or written block.
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
