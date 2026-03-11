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
          <IconWrapper icon="mdi:tag-multiple-outline" size={18} color="#6366f1" />
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, fontSize: "0.875rem", color: "#0f172a" }}
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
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                color: "#6366f1",
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
              color: "#6366f1",
              fontWeight: 500,
              "&:hover": {
                backgroundColor: "rgba(99, 102, 241, 0.08)",
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
              backgroundColor: "#fff",
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(99, 102, 241, 0.4)",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#6366f1",
                borderWidth: 1.5,
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconWrapper icon="mdi:magnify" size={18} color="#94a3b8" />
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
                  backgroundColor: "#6366f1",
                  color: "#fff",
                  fontWeight: 500,
                  "& .MuiChip-deleteIcon": {
                    color: "rgba(255,255,255,0.8)",
                    "&:hover": { color: "#fff" },
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
          backgroundColor: "#fafafa",
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
              backgroundColor: "rgba(99, 102, 241, 0.2)",
              borderRadius: "3px",
              "&:hover": {
                backgroundColor: "rgba(99, 102, 241, 0.35)",
              },
            },
          }}
        >
          {filteredSkills.length === 0 ? (
            <Box sx={{ py: 3, textAlign: "center" }}>
              <IconWrapper icon="mdi:tag-off-outline" size={32} color="#cbd5e1" />
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
                            backgroundColor: "rgba(99, 102, 241, 0.15)",
                            color: "#6366f1",
                            borderColor: "#6366f1",
                          }
                        : {
                            borderColor: "#e2e8f0",
                            color: "#64748b",
                            "&:hover": {
                              borderColor: "#6366f1",
                              color: "#6366f1",
                              backgroundColor: "rgba(99, 102, 241, 0.06)",
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
