"use client";

import { Box, Paper, Typography, Chip, Tooltip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { SkillStats } from "@/lib/services/assessment.service";

interface EnhancedSkillsTagsProps {
  strongSkills: SkillStats[] | string[];
  weakSkills: SkillStats[] | string[];
}

// Helper function to clean skill names
const cleanSkillName = (skill: string): string => {
  // Remove brackets, quotes, and extra whitespace
  return skill
    .replace(/^\[?['"]?/g, "")
    .replace(/['"]?\]?$/g, "")
    .replace(/['"]/g, "")
    .trim();
};

// Helper function to check if it's a SkillStats object
const isSkillStats = (skill: SkillStats | string): skill is SkillStats => {
  if (typeof skill === "string") return false;
  if (skill === null || skill === undefined) return false;
  if (Array.isArray(skill)) return false;
  return typeof skill === "object" && "skill" in skill && typeof (skill as any).skill === "string";
};

// Helper function to get skill name
const getSkillName = (skill: SkillStats | string): string => {
  try {
    if (typeof skill === "string") {
      return cleanSkillName(skill);
    }
    if (isSkillStats(skill)) {
      return cleanSkillName(skill.skill);
    }
    // Fallback: try to extract skill name from object
    if (typeof skill === "object" && skill !== null && !Array.isArray(skill)) {
      const skillObj = skill as any;
      if (skillObj.skill && typeof skillObj.skill === "string") {
        return cleanSkillName(skillObj.skill);
      }
      // Try other possible property names
      if (skillObj.name && typeof skillObj.name === "string") {
        return cleanSkillName(skillObj.name);
      }
      if (skillObj.title && typeof skillObj.title === "string") {
        return cleanSkillName(skillObj.title);
      }
      // Last resort: return a default string
      return "Unknown Skill";
    }
    // For any other case, return a safe default
    return "Unknown Skill";
  } catch (error) {
    // If anything goes wrong, return a safe default
    return "Unknown Skill";
  }
};

// Helper function to get skill stats
const getSkillStats = (skill: SkillStats | string) => {
  if (isSkillStats(skill)) {
    return {
      accuracy: skill.accuracy_percent,
      rating: skill.rating_out_of_5,
      total: skill.total,
      correct: skill.correct,
      incorrect: skill.incorrect,
    };
  }
  return null;
};

export function EnhancedSkillsTags({
  strongSkills,
  weakSkills,
}: EnhancedSkillsTagsProps) {
  // Filter and validate skills arrays
  const validStrongSkills = Array.isArray(strongSkills) 
    ? strongSkills.filter(skill => skill !== null && skill !== undefined)
    : [];
  
  const validWeakSkills = Array.isArray(weakSkills)
    ? weakSkills.filter(skill => skill !== null && skill !== undefined)
    : [];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
        gap: 3,
        mb: 3,
      }}
    >
      {/* Skills You Shine In */}
      <Paper
        elevation={0}
        sx={{
          p: 3.5,
          border: "1px solid #d1fae5",
          borderRadius: 3,
          background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 20px rgba(16, 185, 129, 0.1)",
            borderColor: "#10b981",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 2.5,
          }}
        >
          <IconWrapper icon="mdi:star-circle" size={24} color="#10b981" />
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#1f2937",
                mb: 0.25,
              }}
            >
              Skills You Shine In
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#6b7280",
                fontSize: "0.75rem",
              }}
            >
              Your strongest areas
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          {validStrongSkills.length > 0 ? (
            validStrongSkills.map((skill, index) => {
              const skillName = String(getSkillName(skill) || "Unknown Skill");
              const stats = getSkillStats(skill);
              const chip = (
                <Chip
                  key={index}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <span>{skillName}</span>
                      {stats && (
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{
                            ml: 0.5,
                            fontWeight: 600,
                            fontSize: "0.6875rem",
                          }}
                        >
                          ({stats.accuracy.toFixed(0)}%)
                        </Typography>
                      )}
                    </Box>
                  }
                  icon={<IconWrapper icon="mdi:check" size={16} />}
                  sx={{
                    backgroundColor: "#d1fae5",
                    color: "#065f46",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    height: 36,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "#a7f3d0",
                      transform: "scale(1.05)",
                    },
                    "& .MuiChip-icon": {
                      color: "#10b981",
                    },
                  }}
                />
              );

              if (stats) {
                return (
                  <Tooltip
                    key={index}
                    title={
                      <Box>
                        <Typography variant="caption" sx={{ display: "block", mb: 0.5 }}>
                          Accuracy: {stats.accuracy.toFixed(1)}%
                        </Typography>
                        <Typography variant="caption" sx={{ display: "block", mb: 0.5 }}>
                          Rating: {stats.rating.toFixed(1)}/5.0
                        </Typography>
                        <Typography variant="caption" sx={{ display: "block" }}>
                          {stats.correct} correct, {stats.incorrect} incorrect out of {stats.total}
                        </Typography>
                      </Box>
                    }
                    arrow
                  >
                    {chip}
                  </Tooltip>
                );
              }
              return chip;
            })
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: "#6b7280",
                fontStyle: "italic",
              }}
            >
              No strong skills identified yet
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Skills That Need Attention */}
      <Paper
        elevation={0}
        sx={{
          p: 3.5,
          border: "1px solid #fef3c7",
          borderRadius: 3,
          background: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)",
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 20px rgba(245, 158, 11, 0.1)",
            borderColor: "#f59e0b",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 2.5,
          }}
        >
          <IconWrapper icon="mdi:target" size={24} color="#f59e0b" />
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#1f2937",
                mb: 0.25,
              }}
            >
              Skills That Need Attention
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#6b7280",
                fontSize: "0.75rem",
              }}
            >
              Areas for improvement
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          {validWeakSkills.length > 0 ? (
            validWeakSkills.map((skill, index) => {
              const skillName = String(getSkillName(skill) || "Unknown Skill");
              const stats = getSkillStats(skill);
              const chip = (
                <Chip
                  key={index}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <span>{skillName}</span>
                      {stats && (
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{
                            ml: 0.5,
                            fontWeight: 600,
                            fontSize: "0.6875rem",
                          }}
                        >
                          ({stats.accuracy.toFixed(0)}%)
                        </Typography>
                      )}
                    </Box>
                  }
                  icon={<IconWrapper icon="mdi:alert" size={16} />}
                  sx={{
                    backgroundColor: "#fef3c7",
                    color: "#92400e",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    height: 36,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "#fde68a",
                      transform: "scale(1.05)",
                    },
                    "& .MuiChip-icon": {
                      color: "#f59e0b",
                    },
                  }}
                />
              );

              if (stats) {
                return (
                  <Tooltip
                    key={index}
                    title={
                      <Box>
                        <Typography variant="caption" sx={{ display: "block", mb: 0.5 }}>
                          Accuracy: {stats.accuracy.toFixed(1)}%
                        </Typography>
                        <Typography variant="caption" sx={{ display: "block", mb: 0.5 }}>
                          Rating: {stats.rating.toFixed(1)}/5.0
                        </Typography>
                        <Typography variant="caption" sx={{ display: "block" }}>
                          {stats.correct} correct, {stats.incorrect} incorrect out of {stats.total}
                        </Typography>
                      </Box>
                    }
                    arrow
                  >
                    {chip}
                  </Tooltip>
                );
              }
              return chip;
            })
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: "#6b7280",
                fontStyle: "italic",
              }}
            >
              No weak areas identified
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

