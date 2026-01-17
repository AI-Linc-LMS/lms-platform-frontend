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
  Chip,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Section } from "./MultipleSectionsSection";

interface SectionQuestionsSidenavProps {
  sections: Section[];
  selectedSectionId: string | "";
  onSectionSelect: (sectionId: string) => void;
  // Question counts per section
  sectionQuestionCounts: Record<string, number>;
  sectionCodingCounts: Record<string, number>;
}

export function SectionQuestionsSidenav({
  sections,
  selectedSectionId,
  onSectionSelect,
  sectionQuestionCounts,
  sectionCodingCounts,
}: SectionQuestionsSidenavProps) {
  const quizSections = sections
    .filter((s) => s.type === "quiz")
    .sort((a, b) => a.order - b.order);
  const codingSections = sections
    .filter((s) => s.type === "coding")
    .sort((a, b) => a.order - b.order);

  // Initialize section type based on available sections or selected section
  const getInitialType = (): "quiz" | "coding" | null => {
    // If a section is selected, use its type
    if (selectedSectionId) {
      const currentSection = sections.find((s) => s.id === selectedSectionId);
      if (currentSection) {
        return currentSection.type;
      }
    }
    // Otherwise, default to first available type
    if (quizSections.length > 0) {
      return "quiz";
    } else if (codingSections.length > 0) {
      return "coding";
    }
    return null;
  };

  const [sectionType, setSectionType] = useState<"quiz" | "coding" | null>(
    getInitialType
  );

  // Update section type when selected section changes
  useEffect(() => {
    if (selectedSectionId) {
      const currentSection = sections.find((s) => s.id === selectedSectionId);
      if (currentSection && currentSection.type !== sectionType) {
        setSectionType(currentSection.type);
      }
    }
  }, [selectedSectionId, sections, sectionType]);

  const handleTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: "quiz" | "coding" | null
  ) => {
    if (newType !== null && newType !== sectionType) {
      setSectionType(newType);
      // Auto-select first section of the new type
      if (newType === "quiz" && quizSections.length > 0) {
        onSectionSelect(quizSections[0].id);
      } else if (newType === "coding" && codingSections.length > 0) {
        onSectionSelect(codingSections[0].id);
      } else {
        onSectionSelect("");
      }
    }
  };

  const displaySections = sectionType === "quiz" ? quizSections : codingSections;
  const displayCounts =
    sectionType === "quiz" ? sectionQuestionCounts : sectionCodingCounts;
  const sectionColor = sectionType === "quiz" ? "#6366f1" : "#10b981";
  const sectionBgColor = sectionType === "quiz" ? "#eef2ff" : "#d1fae5";
  const sectionHoverColor = sectionType === "quiz" ? "#e0e7ff" : "#a7f3d0";

  return (
    <Paper
      sx={{
        width: "100%",
        height: { xs: "auto", sm: "calc(100vh - 120px)" },
        position: { xs: "relative", sm: "sticky" },
        top: { xs: 0, sm: 20 },
        maxHeight: { xs: "none", sm: "calc(100vh - 120px)" },
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ p: 2, bgcolor: "#6366f1", color: "white" }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Sections
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
          Select a section to add questions
        </Typography>
      </Box>

      {/* Type Selector */}
      <Box sx={{ p: 2, borderBottom: "1px solid #e5e7eb" }}>
        <ToggleButtonGroup
          value={sectionType}
          exclusive
          onChange={handleTypeChange}
          aria-label="section type"
          fullWidth
          size="small"
        >
          <ToggleButton
            value="quiz"
            aria-label="quiz sections"
            disabled={quizSections.length === 0}
            sx={{
              flex: 1,
              borderColor: "#e5e7eb",
              "&.Mui-selected": {
                bgcolor: "#6366f1",
                color: "white",
                "&:hover": {
                  bgcolor: "#4f46e5",
                },
              },
            }}
          >
            Quiz ({quizSections.length})
          </ToggleButton>
          <ToggleButton
            value="coding"
            aria-label="coding sections"
            disabled={codingSections.length === 0}
            sx={{
              flex: 1,
              borderColor: "#e5e7eb",
              "&.Mui-selected": {
                bgcolor: "#10b981",
                color: "white",
                "&:hover": {
                  bgcolor: "#059669",
                },
              },
            }}
          >
            Coding ({codingSections.length})
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Sections List */}
      {sectionType && displaySections.length > 0 && (
        <>
          <Box
            sx={{
              p: 1.5,
              bgcolor: sectionBgColor,
              flexShrink: 0,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: sectionColor,
              }}
            >
              {sectionType === "quiz" ? "Quiz" : "Coding"} Sections
            </Typography>
          </Box>
          <List 
            sx={{ 
              p: 0,
              overflow: "auto",
              flex: 1,
            }}
          >
            {displaySections.map((section) => {
              const count = displayCounts[section.id] || 0;
              const isSelected = selectedSectionId === section.id;
              return (
                <ListItem 
                  key={section.id} 
                  disablePadding
                  sx={{
                    mb: 0.5,
                  }}
                >
                  <ListItemButton
                    selected={isSelected}
                    onClick={() => {
                      onSectionSelect(section.id);
                    }}
                    sx={{
                      px: 2,
                      py: 1.5,
                      cursor: "pointer",
                      borderRadius: 1,
                      mx: 1,
                      borderLeft: isSelected
                        ? `4px solid ${sectionColor}`
                        : "4px solid transparent",
                      bgcolor: isSelected ? sectionBgColor : "transparent",
                      "&:hover": {
                        bgcolor: isSelected ? sectionHoverColor : "#f3f4f6",
                        borderLeft: `4px solid ${sectionColor}`,
                        transform: "translateX(2px)",
                      },
                      transition: "all 0.15s ease-in-out",
                      "&.Mui-selected": {
                        bgcolor: sectionBgColor,
                        borderLeft: `4px solid ${sectionColor}`,
                        "&:hover": {
                          bgcolor: sectionHoverColor,
                        },
                      },
                      "&:active": {
                        transform: "translateX(0px)",
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: isSelected ? 600 : 500,
                              color: isSelected ? sectionColor : "#111827",
                              fontSize: "0.875rem",
                            }}
                          >
                            {section.title}
                          </Typography>
                          {count > 0 && (
                            <Chip
                              label={count}
                              size="small"
                              sx={{
                                height: 22,
                                minWidth: 22,
                                bgcolor: sectionColor,
                                color: "white",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                "& .MuiChip-label": {
                                  px: 0.75,
                                },
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography
                          variant="caption"
                          sx={{ color: "#6b7280", mt: 0.5, display: "block" }}
                        >
                          Order: {section.order}
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
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            No {sectionType === "quiz" ? "quiz" : "coding"} sections available
          </Typography>
        </Box>
      )}

      {sections.length === 0 && (
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            No sections available
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

