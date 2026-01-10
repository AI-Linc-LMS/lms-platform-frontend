"use client";

import {
  Box,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { Module } from "@/lib/services/courses.service";
import { SubmoduleItem } from "./SubmoduleItem";

interface ModuleAccordionProps {
  module: Module;
  isExpanded: boolean;
  onToggle: () => void;
  courseId: number;
  onNavigate: (submoduleId: number) => void;
  getSubmoduleContentCount: (submodule: any) => number;
}

export function ModuleAccordion({
  module,
  isExpanded,
  onToggle,
  courseId,
  onNavigate,
  getSubmoduleContentCount,
}: ModuleAccordionProps) {
  const totalSubmoduleLectures =
    module.submodules?.reduce(
      (sum, sub) => sum + getSubmoduleContentCount(sub),
      0
    ) || 0;

  const hasContent = totalSubmoduleLectures > 0;

  return (
    <Accordion
      expanded={isExpanded && hasContent}
      onChange={hasContent ? onToggle : undefined}
      disabled={!hasContent}
      sx={{
        boxShadow: "none",
        border: "1px solid #e5e7eb",
        borderRadius: 1,
        mb: 1.5,
        "&:before": { display: "none" },
        "&.Mui-expanded": {
          margin: 0,
          marginBottom: 1.5,
        },
        "&.Mui-disabled": {
          backgroundColor: "#f9fafb",
          opacity: 0.6,
          cursor: "not-allowed",
        },
      }}
    >
      <AccordionSummary
        expandIcon={
          <IconWrapper
            icon={isExpanded ? "mdi:chevron-up" : "mdi:chevron-down"}
            size={32}
            color="#6b7280"
          />
        }
        sx={{
          px: 2,
          py: 1.5,
          "& .MuiAccordionSummary-content": {
            margin: 0,
            "&.Mui-expanded": {
              margin: 0,
            },
          },
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 0.5,
            }}
          >
            {module.completion_percentage === 100 && (
              <IconWrapper
                icon="mdi:check-circle-outline"
                size={28}
                color="#10b981"
              />
            )}
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, color: "#1a1f2e" }}
            >
              {module.title}
            </Typography>
            {module.completion_percentage !== undefined &&
              module.completion_percentage !== null &&
              module.completion_percentage > 0 && (
                <Chip
                  label={`${(module.completion_percentage ?? 0).toFixed(0)}%`}
                  size="small"
                  sx={{
                    backgroundColor:
                      module.completion_percentage === 100
                        ? "#d1fae5"
                        : "#e0e7ff",
                    color:
                      module.completion_percentage === 100
                        ? "#065f46"
                        : "#6366f1",
                    fontSize: "0.7rem",
                    height: 20,
                    fontWeight: 600,
                  }}
                />
              )}
          </Box>
          <Typography
            variant="body2"
            sx={{ color: "#6b7280", fontSize: "0.875rem" }}
          >
            {totalSubmoduleLectures} items
          </Typography>
          {module.completion_percentage > 0 && (
            <Box sx={{ mt: 1, width: "100%", maxWidth: 300 }}>
              <Box
                sx={{
                  width: "100%",
                  height: 4,
                  backgroundColor: "#e5e7eb",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: `${module.completion_percentage ?? 0}%`,
                    height: "100%",
                    backgroundColor:
                      module.completion_percentage === 100
                        ? "#10b981"
                        : "#6366f1",
                    borderRadius: 2,
                    transition: "width 0.3s ease",
                  }}
                />
              </Box>
            </Box>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
        {module.submodules && module.submodules.length > 0 ? (
          <Box>
            {module.submodules.map((submodule) => (
              <SubmoduleItem
                key={submodule.id}
                submodule={submodule}
                module={module}
                courseId={courseId}
                onNavigate={onNavigate}
              />
            ))}
          </Box>
        ) : (
          <Typography variant="body2" sx={{ color: "#9ca3af" }}>
            No submodules available
          </Typography>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
