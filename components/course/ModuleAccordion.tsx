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
  moduleIndex: number;
  modules: Module[];
  currentWeek: number;
  previousWeekModules: Module[];

  isExpanded: boolean;
  onToggle: () => void;

  contentLockEnabled: boolean;
  lockThresholdValue: number;

  courseId: number;
  onNavigate: (submoduleId: number) => void;
  getSubmoduleContentCount: (submodule: any) => number;
}

export function ModuleAccordion({
  module,
  moduleIndex,
  modules,
  currentWeek,
  previousWeekModules,
  isExpanded,
  onToggle,
  courseId,
  contentLockEnabled,
  lockThresholdValue,
  onNavigate,
  getSubmoduleContentCount,
}: ModuleAccordionProps) {
  /* ---------------- content count ---------------- */
  const totalSubmoduleLectures =
    module.submodules?.reduce(
      (sum, sub) => sum + getSubmoduleContentCount(sub),
      0
    ) || 0;

  const hasContent = totalSubmoduleLectures > 0;

  /* ---------------- locking logic ---------------- */
  // Lock if: content locking is enabled, current week > 1, and previous week's completion < threshold
  // Calculate previous week's average completion percentage
  const getPreviousWeekCompletion = () => {
    if (previousWeekModules.length === 0) return 100; // No previous week = unlocked
    
    // Calculate average completion of all modules in previous week
    const totalCompletion = previousWeekModules.reduce(
      (sum, mod) => sum + (mod.completion_percentage ?? 0),
      0
    );
    return previousWeekModules.length > 0 
      ? totalCompletion / previousWeekModules.length 
      : 100;
  };

  const previousWeekCompletion = getPreviousWeekCompletion();
  
  const isLocked =
    contentLockEnabled &&
    currentWeek > 1 &&
    previousWeekCompletion < lockThresholdValue;

  return (
    <Accordion
      expanded={!isLocked && isExpanded && hasContent}
      onChange={!isLocked && hasContent ? onToggle : undefined}
      disabled={isLocked || !hasContent}
      sx={{
        boxShadow: "none",
        border: "1px solid #e5e7eb",
        borderRadius: 1,
        mb: 1.5,
        "&:before": { display: "none" },
        "&.Mui-disabled": {
          backgroundColor: "#f9fafb",
          opacity: 0.8,
          "& .MuiAccordionSummary-content": {
            opacity: "1 !important",
          },
        },
      }}
    >
      <AccordionSummary
        expandIcon={
          isLocked ? (
            <IconWrapper
              icon="mdi:lock-outline"
              size={20}
              color="#9ca3af"
            />
          ) : (
            <IconWrapper
              icon={isExpanded ? "mdi:chevron-up" : "mdi:chevron-down"}
              size={28}
              color="#6b7280"
            />
          )
        }
        sx={{
          px: { xs: 1.5, md: 2 },
          py: { xs: 1.25, md: 1.5 },
          "& .MuiAccordionSummary-content": { margin: 0 },
        }}
      >
        <Box sx={{ flex: 1 }}>
          {/* -------- Title Row -------- */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "flex-start", md: "center" },
              gap: { xs: 0.5, md: 2 },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              {/* Completion icon */}
              {module.completion_percentage === 100 && (
                <IconWrapper
                  icon="mdi:check-circle-outline"
                  size={22}
                  color="#10b981"
                />
              )}

              {/* Lock icon near title */}
              {isLocked && (
                <IconWrapper
                  icon="mdi:lock-outline"
                  size={18}
                  color="#9ca3af"
                />
              )}

              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: "0.95rem", md: "1rem" },
                  lineHeight: 1.3,
                  color: "#1a1f2e",
                }}
              >
                {module.title}
              </Typography>

              {module.completion_percentage > 0 && (
                <Chip
                  label={`${module.completion_percentage.toFixed(0)}%`}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: "0.65rem",
                    backgroundColor:
                      module.completion_percentage === 100
                        ? "#d1fae5"
                        : "#e0e7ff",
                    color:
                      module.completion_percentage === 100
                        ? "#065f46"
                        : "#6366f1",
                  }}
                />
              )}
            </Box>

            <Typography
              variant="body2"
              sx={{
                fontSize: "0.8rem",
                color: "#6b7280",
              }}
            >
              {totalSubmoduleLectures} items
            </Typography>
          </Box>

          {/* -------- Lock Message -------- */}
          {isLocked && (
            <Typography
              variant="caption"
              sx={{
                mt: 0.5,
                display: "block",
                color: "#ef4444",
                fontSize: "0.7rem",
                opacity:"1 !important"
              }}
            >
              Complete week {currentWeek-1} (≥ {lockThresholdValue}%) to unlock
            </Typography>
          )}

          {/* -------- Progress Bar -------- */}
          {module.completion_percentage > 0 && !isLocked && (
            <Box
              sx={{
                mt: 1,
                width: "100%",
                maxWidth: { xs: "100%", md: 280 },
              }}
            >
              <Box
                sx={{
                  height: 4,
                  backgroundColor: "#e5e7eb",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: `${module.completion_percentage}%`,
                    height: "100%",
                    backgroundColor:
                      module.completion_percentage === 100
                        ? "#10b981"
                        : "#6366f1",
                    transition: "width 0.3s ease",
                  }}
                />
              </Box>
            </Box>
          )}
        </Box>
      </AccordionSummary>

      <AccordionDetails
        sx={{
          px: { xs: 1.5, md: 2 },
          pb: 2,
          pt: 0,
        }}
      >
        {module.submodules?.length ? (
          <Box>
            {module.submodules.map((submodule) => (
              <SubmoduleItem
                key={submodule.id}
                submodule={submodule}
                module={module}
                courseId={courseId}
                onNavigate={!isLocked ? onNavigate : () => {}}
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
