"use client";

import { Box, Paper, Typography, Button, Chip, TextField } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useState, useEffect } from "react";
import { UserProfile } from "@/lib/services/profile.service";

function normalizeToStringArray(raw: any): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: any) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && item.name) return item.name;
      return null;
    })
    .filter(Boolean) as string[];
}

interface SkillsSectionProps {
  profile: UserProfile;
  onSave: (updatedProfile: Partial<UserProfile>) => Promise<void>;
}

export function SkillsSection({ profile, onSave }: SkillsSectionProps) {
  const [skills, setSkills] = useState<string[]>(normalizeToStringArray(profile.skills));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (!editing) {
      const fromProfile = normalizeToStringArray(profile.skills);
      if (fromProfile.length > 0) {
        setSkills(fromProfile);
      }
    }
  }, [profile.skills, editing]);

  const handleAddSkill = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkills((prev) => [...prev, trimmed]);
    }
    setInputValue("");
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // API expects skills as array of { id?: string, name: string }; send full array to replace
      await onSave({
        skills: skills.map((name) => ({ name })),
      });
      setEditing(false);
    } catch {
      // handled by parent
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSkills(normalizeToStringArray(profile.skills));
    setEditing(false);
    setInputValue("");
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: { xs: 1, sm: 2 },
        mb: { xs: 2, sm: 3 },
        boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.08)",
        transition: "box-shadow 0.2s ease",
        "&:hover": {
          boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.12)",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2.5,
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: "#000000", fontSize: "1.25rem" }}
        >
          Skills
        </Typography>
        {!editing ? (
          <Button
            variant="text"
            size="small"
            startIcon={<IconWrapper icon="mdi:pencil" size={16} />}
            onClick={() => setEditing(true)}
            sx={{
              textTransform: "none",
              color: "#0a66c2",
              fontWeight: 600,
              fontSize: "0.9375rem",
              "&:hover": { backgroundColor: "rgba(10, 102, 194, 0.08)" },
              transition: "all 0.2s ease",
            }}
          >
            Edit
          </Button>
        ) : (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleCancel}
              disabled={saving}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderColor: "#e5e7eb",
                color: "#6b7280",
                borderRadius: 1.5,
                "&:hover": { borderColor: "#d1d5db", backgroundColor: "#f9fafb" },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleSave}
              disabled={saving}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: "#0a66c2",
                borderRadius: "24px",
                px: 2,
                "&:hover": { backgroundColor: "#004182" },
                transition: "all 0.2s ease",
              }}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </Box>
        )}
      </Box>

      {editing ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {skills.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {skills.map((skill) => (
                <Chip
                  key={skill}
                  label={skill}
                  onDelete={() => handleRemoveSkill(skill)}
                  sx={{
                    borderRadius: "16px",
                    backgroundColor: "#f3f2ef",
                    color: "#000000",
                    fontWeight: 500,
                    fontSize: "0.9375rem",
                    height: 36,
                    border: "1px solid rgba(0,0,0,0.08)",
                    "& .MuiChip-deleteIcon": {
                      color: "#666666",
                      "&:hover": { color: "#000000" },
                    },
                    "&:hover": { backgroundColor: "#e9e7e3" },
                  }}
                />
              ))}
            </Box>
          )}
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a skill and press Enter"
              size="small"
              fullWidth
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
            />
            <Button
              variant="outlined"
              onClick={handleAddSkill}
              disabled={!inputValue.trim()}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                minWidth: 70,
                borderColor: "#0a66c2",
                color: "#0a66c2",
                borderRadius: 1.5,
                "&:hover": { backgroundColor: "rgba(10,102,194,0.08)" },
              }}
            >
              Add
            </Button>
          </Box>
          <Typography
            variant="caption"
            sx={{ color: "#6b7280", fontSize: "0.75rem" }}
          >
            Press Enter or click Add to add a skill
          </Typography>
        </Box>
      ) : (
        <Box>
          {skills.length > 0 ? (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
              {skills.map((skill) => (
                <Chip
                  key={skill}
                  label={skill}
                  sx={{
                    borderRadius: "16px",
                    backgroundColor: "#f3f2ef",
                    color: "#000000",
                    fontWeight: 500,
                    fontSize: "0.9375rem",
                    height: 36,
                    px: 1.5,
                    border: "1px solid rgba(0,0,0,0.08)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "#e9e7e3",
                      borderColor: "rgba(0,0,0,0.12)",
                      transform: "translateY(-1px)",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                    },
                  }}
                />
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                textAlign: "center",
                py: 4,
                px: 2,
                border: "1px dashed rgba(0,0,0,0.12)",
                borderRadius: 2,
                backgroundColor: "#f9fafb",
              }}
            >
              <IconWrapper icon="mdi:code-tags" size={48} color="#9ca3af" />
              <Typography
                variant="body2"
                sx={{ color: "#666666", mt: 2, fontSize: "0.9375rem", fontWeight: 500 }}
              >
                No skills added yet
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#9ca3af", mt: 0.5, fontSize: "0.8125rem" }}
              >
                Click Edit to add your skills
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
}
