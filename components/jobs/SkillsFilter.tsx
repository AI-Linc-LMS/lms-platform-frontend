"use client";

import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Button,
} from "@mui/material";
import { useState, useEffect, useRef, memo } from "react";
import { Job } from "@/lib/services/jobs.service";

interface SkillsFilterProps {
  jobs: Job[];
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
  onClearAll?: () => void;
}

const SkillsFilterComponent = ({
  jobs,
  selectedSkills,
  onSkillsChange,
  onClearAll,
}: SkillsFilterProps) => {
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const jobsRef = useRef<Job[]>([]);

  // Optimized skill extraction - only runs when jobs actually change
  useEffect(() => {
    // Check if jobs actually changed (by length and first job ID)
    const jobsChanged =
      jobsRef.current.length !== jobs.length ||
      (jobs.length > 0 &&
        jobsRef.current.length > 0 &&
        jobsRef.current[0]?.id !== jobs[0]?.id);

    if (processingRef.current || jobs.length === 0 || !jobsChanged) {
      return;
    }

    // Update jobs ref
    jobsRef.current = jobs;

    // Clear any pending processing
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsProcessing(true);

    // Debounce skill extraction
    timeoutRef.current = setTimeout(() => {
      processingRef.current = true;

      // Use requestIdleCallback for non-blocking processing
      const processSkills = () => {
        const skillSet = new Set<string>();
        const skillMap = new Map<string, string>(); // normalized -> original

        // Process in smaller batches with yield points
        const BATCH_SIZE = 50; // Smaller batches for better responsiveness
        let currentIndex = 0;

        const processBatch = () => {
          const startTime = performance.now();
          const endIndex = Math.min(currentIndex + BATCH_SIZE, jobs.length);

          // Process batch
          for (let i = currentIndex; i < endIndex; i++) {
            const job = jobs[i];
            if (job.tags && Array.isArray(job.tags)) {
              for (const tag of job.tags) {
                if (tag && typeof tag === "string") {
                  const trimmed = tag.trim();
                  if (trimmed) {
                    const normalized = trimmed.toLowerCase();
                    if (!skillMap.has(normalized)) {
                      skillMap.set(normalized, trimmed);
                    } else {
                      const existing = skillMap.get(normalized)!;
                      // Prefer capitalized versions
                      if (/[A-Z]/.test(trimmed) && !/[A-Z]/.test(existing)) {
                        skillMap.set(normalized, trimmed);
                      }
                    }
                  }
                }
              }
            }
          }

          currentIndex = endIndex;

          // Yield to browser if processing takes too long or more jobs to process
          const elapsed = performance.now() - startTime;
          if (currentIndex < jobs.length && elapsed < 16) {
            // Continue in same frame if under 16ms
            processBatch();
          } else if (currentIndex < jobs.length) {
            // Yield to browser
            requestIdleCallback(processBatch, { timeout: 100 });
          } else {
            // All done, sort and set state
            const uniqueSkills = Array.from(skillMap.values());
            uniqueSkills.sort((a, b) =>
              a.toLowerCase().localeCompare(b.toLowerCase())
            );
            setAvailableSkills(uniqueSkills);
            processingRef.current = false;
            setIsProcessing(false);
          }
        };

        // Start processing with requestIdleCallback
        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
          requestIdleCallback(processBatch, { timeout: 100 });
        } else {
          // Fallback for browsers without requestIdleCallback
          setTimeout(() => processBatch(), 0);
        }
      };

      // Delay initial processing to avoid blocking
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        requestIdleCallback(processSkills, { timeout: 200 });
      } else {
        setTimeout(processSkills, 200);
      }
    }, 300); // Increased debounce to 300ms

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [jobs]);

  const handleSkillToggle = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      onSkillsChange(selectedSkills.filter((s) => s !== skill));
    } else {
      onSkillsChange([...selectedSkills, skill]);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 600, fontSize: "0.875rem" }}
        >
          Skills/Tags
        </Typography>
        {selectedSkills.length > 0 && onClearAll && (
          <Button
            size="small"
            onClick={onClearAll}
            sx={{
              textTransform: "none",
              fontSize: "0.75rem",
              minWidth: "auto",
              px: 1,
              color: "#6366f1",
              "&:hover": {
                backgroundColor: "rgba(99, 102, 241, 0.08)",
              },
            }}
          >
            Clear All
          </Button>
        )}
      </Box>
      <Box
        sx={{
          maxHeight: 300,
          overflowY: "auto",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            borderRadius: "3px",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.3)",
            },
          },
        }}
      >
        {isProcessing ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: "0.8rem", fontStyle: "italic" }}
          >
            Loading skills...
          </Typography>
        ) : availableSkills.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: "0.8rem", fontStyle: "italic" }}
          >
            No skills available
          </Typography>
        ) : (
          availableSkills.map((skill) => (
            <FormControlLabel
              key={skill}
              control={
                <Checkbox
                  checked={selectedSkills.includes(skill)}
                  onChange={() => handleSkillToggle(skill)}
                  size="small"
                  sx={{
                    color: "#6366f1",
                    "&.Mui-checked": {
                      color: "#6366f1",
                    },
                    py: 0.25,
                  }}
                />
              }
              label={
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.875rem",
                    color: selectedSkills.includes(skill)
                      ? "#1a1f2e"
                      : "text.secondary",
                    fontWeight: selectedSkills.includes(skill) ? 500 : 400,
                  }}
                >
                  {String(skill)}
                </Typography>
              }
              sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                m: 0,
                py: 0.5,
                px: 1,
                borderRadius: 1,
                "&:hover": {
                  backgroundColor: "rgba(99, 102, 241, 0.05)",
                },
                "& .MuiFormControlLabel-label": {
                  flex: 1,
                },
              }}
            />
          ))
        )}
      </Box>
    </Box>
  );
};

export const SkillsFilter = memo(SkillsFilterComponent);
SkillsFilter.displayName = "SkillsFilter";
