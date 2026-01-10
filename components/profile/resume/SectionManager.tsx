"use client";

import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Collapse,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

export interface Section {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  component: React.ReactNode;
}

interface SectionManagerProps {
  sections: Section[];
  onSectionsChange: (sections: Section[]) => void;
}

export function SectionManager({ sections, onSectionsChange }: SectionManagerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("basicInfo");

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSections = [...sections];
    const draggedSection = newSections[draggedIndex];
    newSections.splice(draggedIndex, 1);
    newSections.splice(index, 0, draggedSection);

    setDraggedIndex(index);
    onSectionsChange(newSections);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const toggleSection = (sectionId: string, enabled: boolean) => {
    const newSections = sections.map((section) =>
      section.id === sectionId ? { ...section, enabled } : section
    );
    onSectionsChange(newSections);
  };

  const toggleExpand = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <Box>
      {/* Sections Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          border: "1px solid #e5e7eb",
          borderRadius: 2,
          backgroundColor: "#f9fafb",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <IconWrapper icon="mdi:view-grid" color="#6366f1" size={20} />
          <Typography sx={{ fontWeight: 600, color: "#1f2937" }}>
            Sections
          </Typography>
        </Box>
        <Typography sx={{ fontSize: "0.75rem", color: "#6b7280" }}>
          Drag to reorder • Toggle to show/hide
        </Typography>
      </Paper>

      {/* Draggable Sections */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {sections.map((section, index) => (
          <Paper
            key={section.id}
            elevation={0}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            sx={{
              border: section.enabled ? "2px solid #6366f1" : "1px solid #e5e7eb",
              borderRadius: 2,
              overflow: "hidden",
              cursor: "grab",
              opacity: draggedIndex === index ? 0.5 : 1,
              transition: "all 0.2s",
              backgroundColor: section.enabled ? "#ffffff" : "#f9fafb",
              "&:active": {
                cursor: "grabbing",
              },
            }}
          >
            {/* Section Header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 2,
                backgroundColor: section.enabled ? "#f9fafb" : "#ffffff",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <IconWrapper icon="mdi:drag-horizontal-variant" size={20} color="#9ca3af" />
                <IconWrapper icon={section.icon} size={20} color={section.enabled ? "#6366f1" : "#9ca3af"} />
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: section.enabled ? "#1f2937" : "#9ca3af",
                  }}
                >
                  {section.name}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={section.enabled}
                      onChange={(e) => toggleSection(section.id, e.target.checked)}
                      size="small"
                    />
                  }
                  label=""
                  sx={{ m: 0 }}
                />
                
                {section.enabled && (
                  <IconButton
                    size="small"
                    onClick={() => toggleExpand(section.id)}
                  >
                    <IconWrapper
                      icon={expandedSection === section.id ? "mdi:chevron-up" : "mdi:chevron-down"}
                      size={20}
                    />
                  </IconButton>
                )}
              </Box>
            </Box>

            {/* Section Content */}
            <Collapse in={section.enabled && expandedSection === section.id}>
              <Box sx={{ p: 2, pt: 0 }}>
                {section.component}
              </Box>
            </Collapse>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}

