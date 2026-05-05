"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Box, Paper, Typography, Button, Chip, TextField } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
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
  onRemoveSection?: () => void;
}

export function SkillsSection({ profile, onSave, onRemoveSection }: SkillsSectionProps) {
  const { t } = useTranslation("common");
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
        border: "1px solid var(--border-default)",
        borderRadius: { xs: 1, sm: 2 },
        mb: { xs: 2, sm: 3 },
        boxShadow:
          "0 0 0 1px color-mix(in srgb, var(--border-default) 85%, transparent), 0 2px 4px color-mix(in srgb, var(--font-primary) 10%, transparent)",
        transition: "box-shadow 0.2s ease",
        "&:hover": {
          boxShadow:
            "0 0 0 1px color-mix(in srgb, var(--border-default) 85%, transparent), 0 4px 8px color-mix(in srgb, var(--font-primary) 14%, transparent)",
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
          sx={{ fontWeight: 600, color: "var(--font-primary)", fontSize: "1.25rem" }}
        >
          {t("profile.skills")}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {onRemoveSection && (
          <Button
            variant="text"
            size="small"
            startIcon={<IconWrapper icon="mdi:close" size={16} />}
            onClick={onRemoveSection}
            sx={{
              textTransform: "none",
              color: "var(--font-secondary)",
              fontWeight: 500,
              fontSize: "0.8125rem",
              "&:hover": {
                backgroundColor: "color-mix(in srgb, var(--error-500) 10%, transparent)",
                color: "var(--error-500)",
              },
            }}
          >
            Remove
          </Button>
        )}
        {!editing ? (
          <Button
            variant="text"
            size="small"
            startIcon={<IconWrapper icon="mdi:pencil" size={16} />}
            onClick={() => setEditing(true)}
            sx={{
              textTransform: "none",
              color: "var(--accent-indigo)",
              fontWeight: 600,
              fontSize: "0.9375rem",
              "&:hover": {
                backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
              },
              transition: "all 0.2s ease",
            }}
          >
            {t("profile.edit")}
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
                borderColor: "var(--border-default)",
                color: "var(--font-secondary)",
                borderRadius: 1.5,
                "&:hover": {
                  borderColor: "color-mix(in srgb, var(--border-default) 85%, var(--font-secondary))",
                  backgroundColor: "color-mix(in srgb, var(--surface) 80%, var(--background))",
                },
              }}
            >
              {t("profile.cancel")}
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleSave}
              disabled={saving}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: "var(--accent-indigo)",
                borderRadius: "24px",
                px: 2,
                "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
                transition: "all 0.2s ease",
              }}
            >
              {saving ? t("profile.saving") : t("profile.save")}
            </Button>
          </Box>
        )}
        </Box>
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
                    backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--background))",
                    color: "var(--font-primary)",
                    fontWeight: 500,
                    fontSize: "0.9375rem",
                    height: 36,
                    border: "1px solid var(--border-default)",
                    "& .MuiChip-deleteIcon": {
                      color: "var(--font-secondary)",
                      "&:hover": { color: "var(--font-primary)" },
                    },
                    "&:hover": {
                      backgroundColor: "color-mix(in srgb, var(--surface) 72%, var(--background))",
                    },
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
                borderColor: "var(--accent-indigo)",
                color: "var(--accent-indigo)",
                borderRadius: 1.5,
                "&:hover": {
                  backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                },
              }}
            >
              {t("profile.add")}
            </Button>
          </Box>
          <Typography
            variant="caption"
            sx={{ color: "var(--font-secondary)", fontSize: "0.75rem" }}
          >
            {t("profile.pressEnterToAddSkill")}
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
                    backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--background))",
                    color: "var(--font-primary)",
                    fontWeight: 500,
                    fontSize: "0.9375rem",
                    height: 36,
                    px: 1.5,
                    border: "1px solid var(--border-default)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "color-mix(in srgb, var(--surface) 72%, var(--background))",
                      borderColor: "color-mix(in srgb, var(--border-default) 85%, var(--font-secondary))",
                      transform: "translateY(-1px)",
                      boxShadow: "0 2px 4px color-mix(in srgb, var(--font-primary) 10%, transparent)",
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
                border: "1px dashed color-mix(in srgb, var(--border-default) 80%, var(--font-secondary))",
                borderRadius: 2,
                backgroundColor: "color-mix(in srgb, var(--surface) 80%, var(--background))",
              }}
            >
              <IconWrapper icon="mdi:code-tags" size={48} color="var(--font-tertiary)" />
              <Typography
                variant="body2"
                sx={{
                  color: "var(--font-secondary)",
                  mt: 2,
                  fontSize: "0.9375rem",
                  fontWeight: 500,
                }}
              >
                {t("profile.noSkillsYet")}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "var(--font-tertiary)",
                  mt: 0.5,
                  fontSize: "0.8125rem",
                  display: "block",
                }}
              >
                {t("profile.clickEditToAddSkills")}
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<IconWrapper icon="mdi:plus" size={18} />}
                onClick={() => {
                  setEditing(true);
                }}
                sx={{
                  mt: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  backgroundColor: "var(--accent-indigo)",
                  borderRadius: 2,
                  px: 2.5,
                  py: 1,
                  "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
                }}
              >
                {t("profile.add")} {t("profile.skills")}
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
}
