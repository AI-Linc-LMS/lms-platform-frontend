"use client";

import {
  Box,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Paper,
} from "@mui/material";
import { useState, useEffect, useRef, useMemo, memo } from "react";
import { Job } from "@/lib/services/jobs.service";
import { IconWrapper } from "@/components/common/IconWrapper";

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
  const [searchQuery, setSearchQuery] = useState("");
  const jobsKeyRef = useRef<string>("");

  useEffect(() => {
    if (jobs.length === 0) {
      setAvailableSkills([]);
      return;
    }

    const jobsKey = `${jobs.length}-${jobs.map((j) => j.id).join(",")}`;
    if (jobsKeyRef.current === jobsKey) return;
    jobsKeyRef.current = jobsKey;

    const skillMap = new Map<string, string>();
    for (const job of jobs) {
      const tags = job.tags ?? [];
      for (const tag of tags) {
        if (tag && typeof tag === "string") {
          const trimmed = tag.trim();
          if (trimmed) {
            const normalized = trimmed.toLowerCase();
            if (!skillMap.has(normalized)) {
              skillMap.set(normalized, trimmed);
            } else if (/[A-Z]/.test(trimmed)) {
              const existing = skillMap.get(normalized)!;
              if (!/[A-Z]/.test(existing)) {
                skillMap.set(normalized, trimmed);
              }
            }
          }
        }
      }
    }

    const uniqueSkills = Array.from(skillMap.values());
    uniqueSkills.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    setAvailableSkills(uniqueSkills);
  }, [jobs]);

  const filteredSkills = useMemo(() => {
    if (!searchQuery.trim()) return availableSkills;
    const q = searchQuery.toLowerCase().trim();
    return availableSkills.filter((s) => s.toLowerCase().includes(q));
  }, [availableSkills, searchQuery]);

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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconWrapper icon="mdi:tag-multiple-outline" size={18} color="var(--accent-indigo)" />
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--font-primary)" }}
          >
            Skills & Tags
          </Typography>
          {availableSkills.length > 0 && (
            <Typography
              variant="caption"
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 1,
                backgroundColor: "color-mix(in srgb, var(--accent-indigo) 12%, transparent)",
                color: "var(--accent-indigo)",
                fontWeight: 500,
              }}
            >
              {availableSkills.length}
            </Typography>
          )}
        </Box>
        {selectedSkills.length > 0 && onClearAll && (
          <Button
            size="small"
            onClick={onClearAll}
            sx={{
              textTransform: "none",
              fontSize: "0.75rem",
              minWidth: "auto",
              px: 1,
              color: "var(--accent-indigo)",
              fontWeight: 500,
              "&:hover": {
                backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
              },
            }}
          >
            Clear
          </Button>
        )}
      </Box>

      {availableSkills.length > 0 && (
        <TextField
          fullWidth
          size="small"
          placeholder="Search skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            mb: 1.5,
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
              backgroundColor: "var(--card-bg)",
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "color-mix(in srgb, var(--accent-indigo) 45%, transparent)",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "var(--accent-indigo)",
                borderWidth: 1.5,
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconWrapper icon="mdi:magnify" size={18} color="var(--font-tertiary)" />
              </InputAdornment>
            ),
          }}
        />
      )}

      {selectedSkills.length > 0 && (
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75, fontWeight: 500 }}>
            Selected ({selectedSkills.length})
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {selectedSkills.map((skill) => (
              <Chip
                key={skill}
                label={skill}
                size="small"
                onDelete={() => handleSkillToggle(skill)}
                sx={{
                  backgroundColor: "var(--accent-indigo)",
                  color: "var(--font-light)",
                  fontWeight: 500,
                  "& .MuiChip-deleteIcon": {
                    color: "color-mix(in srgb, var(--font-light) 80%, transparent)",
                    "&:hover": { color: "var(--font-light)" },
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1.5,
          overflow: "hidden",
          backgroundColor: "var(--surface)",
        }}
      >
        <Box
          sx={{
            maxHeight: 280,
            overflowY: "auto",
            p: 1.5,
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "color-mix(in srgb, var(--accent-indigo) 25%, transparent)",
              borderRadius: "3px",
              "&:hover": {
                backgroundColor:
                  "color-mix(in srgb, var(--accent-indigo) 40%, transparent)",
              },
            },
          }}
        >
          {filteredSkills.length === 0 ? (
            <Box sx={{ py: 3, textAlign: "center" }}>
              <IconWrapper icon="mdi:tag-off-outline" size={32} color="var(--border-default)" />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {searchQuery.trim()
                  ? "No skills match your search"
                  : "No skills available"}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {filteredSkills.map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <Chip
                    key={skill}
                    label={skill}
                    size="small"
                    onClick={() => handleSkillToggle(skill)}
                    variant={isSelected ? "filled" : "outlined"}
                    sx={{
                      cursor: "pointer",
                      fontWeight: isSelected ? 600 : 500,
                      ...(isSelected
                        ? {
                            backgroundColor:
                              "color-mix(in srgb, var(--accent-indigo) 18%, transparent)",
                            color: "var(--accent-indigo)",
                            borderColor: "var(--accent-indigo)",
                          }
                        : {
                            borderColor: "var(--border-default)",
                            color: "var(--font-secondary)",
                            "&:hover": {
                              borderColor: "var(--accent-indigo)",
                              color: "var(--accent-indigo)",
                              backgroundColor: "color-mix(in srgb, var(--accent-indigo) 8%, transparent)",
                            },
                          }),
                    }}
                  />
                );
              })}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export const SkillsFilter = memo(SkillsFilterComponent);
SkillsFilter.displayName = "SkillsFilter";
