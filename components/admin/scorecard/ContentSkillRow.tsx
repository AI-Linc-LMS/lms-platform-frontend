"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Chip } from "@mui/material";
import { motion } from "framer-motion";
import { alpha } from "@mui/material/styles";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { ContentMappingItem, SkillItem } from "@/lib/services/admin/admin-scorecard.service";
import type { AdminContentType } from "@/lib/utils/admin-scorecard-content-tree";

const TYPE_ICONS: Record<string, string> = {
  videos: "mdi:video",
  articles: "mdi:file-document",
  mcqs: "mdi:format-list-checks",
  coding_problems: "mdi:code-braces",
  assessments: "mdi:clipboard-check",
};

export function ContentSkillRow({
  item,
  skills,
  contentType,
  updating,
  onUpdate,
  hideLocation,
}: {
  item: ContentMappingItem;
  skills: SkillItem[];
  contentType: AdminContentType;
  updating: boolean;
  onUpdate: (skillIds: number[]) => void;
  hideLocation?: boolean;
}) {
  const [selectedIds, setSelectedIds] = useState<number[]>(item.skill_ids);

  useEffect(() => {
    setSelectedIds(item.skill_ids);
  }, [item.skill_ids]);

  const handleChange = (skillId: number, checked: boolean) => {
    const next = checked ? [...selectedIds, skillId] : selectedIds.filter((id) => id !== skillId);
    setSelectedIds(next);
    onUpdate(next);
  };

  const locations = item.locations ?? [];
  const locationBreadcrumb = hideLocation
    ? []
    : locations
        .map((loc) => [loc.course_name, loc.module_title, loc.submodule_title].filter(Boolean).join(" › "))
        .filter(Boolean);
  const typeIcon = TYPE_ICONS[contentType] ?? "mdi:file";
  const skillCount = selectedIds.length;

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          bgcolor: skillCount > 0 ? "primary.main" : "transparent",
          opacity: 0.6,
        },
        "&:hover": {
          borderColor: "primary.main",
          bgcolor: (t) => alpha(t.palette.primary.main, 0.03),
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, mb: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0, pl: 0.5, display: "flex", alignItems: "flex-start", gap: 0.75 }}>
          <Box sx={{ flexShrink: 0, color: "text.secondary", mt: 0.25 }}>
            <IconWrapper icon={typeIcon} size={18} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.4 }} title={item.title}>
              {item.title.length > 60 ? `${item.title.slice(0, 60)}…` : item.title}
            </Typography>
            {locationBreadcrumb.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, lineHeight: 1.3 }} title={locationBreadcrumb.join("; ")}>
                {locationBreadcrumb.length === 1
                  ? locationBreadcrumb[0]
                  : `${locationBreadcrumb[0]} (+${locationBreadcrumb.length - 1} more)`}
              </Typography>
            )}
          </Box>
        </Box>
        {skillCount > 0 && (
          <Chip label={skillCount} size="small" color="primary" sx={{ fontWeight: 600, minWidth: 28, height: 24, flexShrink: 0 }} />
        )}
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
        {skills.map((s) => (
          <Chip
            key={s.id}
            label={s.name}
            size="small"
            color={selectedIds.includes(s.id) ? "primary" : "default"}
            variant={selectedIds.includes(s.id) ? "filled" : "outlined"}
            onClick={() => handleChange(s.id, !selectedIds.includes(s.id))}
            disabled={updating}
            sx={{
              cursor: updating ? "default" : "pointer",
              fontWeight: 500,
              transition: "all 0.15s",
              "&:hover": { transform: updating ? "none" : "scale(1.02)" },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
