"use client";

import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { motion } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";

export type ProfileSectionId =
  | "skills"
  | "experience"
  | "education"
  | "projects"
  | "certifications"
  | "achievements"
  | "external_profiles";

const SECTION_CONFIG: {
  id: ProfileSectionId;
  icon: string;
  titleKey: string;
  emptyKey: string;
  hintKey: string;
}[] = [
  {
    id: "skills",
    icon: "mdi:code-tags",
    titleKey: "profile.skills",
    emptyKey: "profile.noSkillsYet",
    hintKey: "profile.clickEditToAddSkills",
  },
  {
    id: "experience",
    icon: "mdi:briefcase",
    titleKey: "profile.experience",
    emptyKey: "profile.noExperienceYet",
    hintKey: "profile.clickEditToAddExperience",
  },
  {
    id: "education",
    icon: "mdi:school",
    titleKey: "profile.education",
    emptyKey: "profile.noEducationYet",
    hintKey: "profile.clickEditToAddEducation",
  },
  {
    id: "projects",
    icon: "mdi:folder-multiple",
    titleKey: "profile.projects",
    emptyKey: "profile.noProjectsYet",
    hintKey: "profile.clickEditToAddProjects",
  },
  {
    id: "certifications",
    icon: "mdi:certificate",
    titleKey: "profile.certifications",
    emptyKey: "profile.noCertificationsYet",
    hintKey: "profile.clickEditToAddCertifications",
  },
  {
    id: "achievements",
    icon: "mdi:trophy",
    titleKey: "profile.achievements",
    emptyKey: "profile.noAchievementsYet",
    hintKey: "profile.clickEditToAddAchievements",
  },
  {
    id: "external_profiles",
    icon: "mdi:link-variant",
    titleKey: "profile.externalProfiles",
    emptyKey: "profile.noExternalProfilesYet",
    hintKey: "profile.clickEditToAddExternalProfiles",
  },
];

interface AddSectionModalProps {
  open: boolean;
  onClose: () => void;
  addedSectionIds: ProfileSectionId[];
  onAddSection: (id: ProfileSectionId) => void;
}

export function AddSectionModal({
  open,
  onClose,
  addedSectionIds,
  onAddSection,
}: AddSectionModalProps) {
  const { t } = useTranslation("common");

  const availableSections = SECTION_CONFIG.filter(
    (s) => !addedSectionIds.includes(s.id)
  );

  const handleSelect = (id: ProfileSectionId) => {
    onAddSection(id);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 3 },
          boxShadow: "0 24px 64px color-mix(in srgb, var(--font-primary) 20%, transparent)",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2.5, sm: 3 },
          py: 2,
          borderBottom: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
          backgroundColor: "var(--surface)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--accent-indigo) 14%, transparent) 0%, color-mix(in srgb, var(--accent-indigo) 8%, transparent) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper
              icon="mdi:plus-box-multiple-outline"
              size={26}
              color="var(--accent-indigo)"
            />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "var(--font-primary)",
                fontSize: "1.25rem",
              }}
            >
              Add Section
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "var(--font-secondary)", fontSize: "0.8125rem", mt: 0.25 }}
            >
              Choose a section to add to your profile
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="close">
          <IconWrapper icon="mdi:close" size={22} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {availableSections.length === 0 ? (
          <Box
            sx={{
              py: 6,
              px: 3,
              textAlign: "center",
            }}
          >
            <IconWrapper
              icon="mdi:check-circle-outline"
              size={56}
              color="var(--success-500)"
            />
            <Typography
              variant="body1"
              sx={{
                mt: 2,
                color: "var(--font-secondary)",
                fontWeight: 500,
              }}
            >
              All sections have been added
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 0.5,
                color: "var(--font-tertiary)",
              }}
            >
              Remove a section to add it again from here
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {availableSections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ListItemButton
                  onClick={() => handleSelect(section.id)}
                  sx={{
                    py: 2,
                    px: { xs: 2.5, sm: 3 },
                    "&:hover": {
                      backgroundColor: "color-mix(in srgb, var(--accent-indigo) 8%, transparent)",
                    },
                    borderBottom:
                      index < availableSections.length - 1
                        ? "1px solid color-mix(in srgb, var(--font-primary) 8%, transparent)"
                        : "none",
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 44,
                      mr: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconWrapper
                        icon={section.icon}
                        size={24}
                        color="var(--accent-indigo)"
                      />
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 600,
                          color: "var(--font-primary)",
                          fontSize: "1rem",
                        }}
                      >
                        {t(section.titleKey)}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        sx={{
                          color: "var(--font-secondary)",
                          fontSize: "0.8125rem",
                          mt: 0.25,
                        }}
                      >
                        {t(section.emptyKey)} — {t(section.hintKey)}
                      </Typography>
                    }
                  />
                  <IconWrapper
                    icon="mdi:plus"
                    size={22}
                    color="var(--accent-indigo)"
                    style={{ marginLeft: 8 }}
                  />
                </ListItemButton>
              </motion.div>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}
