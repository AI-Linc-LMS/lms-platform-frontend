"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, Paper, Typography } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import { AddSectionModal, ProfileSectionId } from "./AddSectionModal";
import { SkillsSection } from "./SkillsSection";
import { ExperienceSection } from "./ExperienceSection";
import { EducationSection } from "./EducationSection";
import { ProjectsSection } from "./ProjectsSection";
import { CertificationsSection } from "./CertificationsSection";
import { AchievementsSection } from "./AchievementsSection";
import { ExternalProfilesCard } from "./ExternalProfilesCard";
import { UserProfile } from "@/lib/services/profile.service";
import { config } from "@/lib/config";

const PROFILE_SECTIONS_KEY = `profile_visible_sections_${config.clientId}`;
const SECTION_ORDER: ProfileSectionId[] = [
  "skills",
  "experience",
  "education",
  "projects",
  "certifications",
  "achievements",
  "external_profiles",
];

function getSectionsWithData(profile: UserProfile): ProfileSectionId[] {
  const result: ProfileSectionId[] = [];
  if (profile.skills && profile.skills.length > 0) result.push("skills");
  if (profile.experience && profile.experience.length > 0)
    result.push("experience");
  if (profile.education && profile.education.length > 0)
    result.push("education");
  if (profile.projects && profile.projects.length > 0) result.push("projects");
  if (profile.certifications && profile.certifications.length > 0)
    result.push("certifications");
  if (profile.achievements && profile.achievements.length > 0)
    result.push("achievements");
  const hasExternal =
    profile.portfolio_website_url ||
    profile.leetcode_url ||
    profile.hackerrank_url ||
    profile.kaggle_url ||
    profile.medium_url;
  if (hasExternal) result.push("external_profiles");
  return result;
}

function loadVisibleSections(): ProfileSectionId[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_SECTIONS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return null;
  } catch {
    return null;
  }
}

function saveVisibleSections(sections: ProfileSectionId[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify(sections));
  } catch {
    // ignore
  }
}

interface ProfileSectionsContainerProps {
  profile: UserProfile;
  onSave: (updatedProfile: Partial<UserProfile>) => Promise<void>;
}

export function ProfileSectionsContainer({
  profile,
  onSave,
}: ProfileSectionsContainerProps) {
  const { t } = useTranslation("common");
  const [visibleSections, setVisibleSections] = useState<ProfileSectionId[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const initializeSections = useCallback((profileData: UserProfile) => {
    const saved = loadVisibleSections();
    const withData = getSectionsWithData(profileData);
    const merged = Array.from(
      new Set([...(saved || []), ...withData])
    ).sort(
      (a, b) => SECTION_ORDER.indexOf(a) - SECTION_ORDER.indexOf(b)
    );
    if (merged.length > 0) {
      setVisibleSections(merged);
      if (!saved || saved.length === 0) saveVisibleSections(merged);
    } else {
      setVisibleSections([]);
    }
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (profile) {
      initializeSections(profile);
    }
  }, [profile, initializeSections]);

  const handleAddSection = (id: ProfileSectionId) => {
    if (visibleSections.includes(id)) return;
    const next = [...visibleSections, id].sort(
      (a, b) =>
        SECTION_ORDER.indexOf(a) - SECTION_ORDER.indexOf(b)
    );
    setVisibleSections(next);
    saveVisibleSections(next);
  };

  const handleRemoveSection = (id: ProfileSectionId) => {
    const next = visibleSections.filter((s) => s !== id);
    setVisibleSections(next);
    saveVisibleSections(next);
  };

  if (!initialized) return null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Add Section button + empty state */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: "#111827",
            fontSize: "1.125rem",
          }}
        >
          Profile Sections
        </Typography>
        <Button
          variant="outlined"
          startIcon={<IconWrapper icon="mdi:plus" size={20} />}
          onClick={() => setAddModalOpen(true)}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.9375rem",
            px: 2.5,
            py: 1.25,
            borderRadius: 2,
            borderColor: "#0a66c2",
            color: "#0a66c2",
            "&:hover": {
              borderColor: "#004182",
              backgroundColor: "rgba(10, 102, 194, 0.06)",
            },
          }}
        >
          Add Section
        </Button>
      </Box>

      {visibleSections.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            border: "2px dashed #e2e8f0",
            borderRadius: 3,
            backgroundColor: "#f8fafc",
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, rgba(10, 102, 194, 0.08) 0%, rgba(10, 102, 194, 0.04) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <IconWrapper
              icon="mdi:format-list-bulleted"
              size={40}
              color="#0a66c2"
            />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#1e293b",
              fontSize: "1.125rem",
              mb: 0.5,
            }}
          >
            No sections added yet
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#64748b",
              fontSize: "0.9375rem",
              mb: 2,
              maxWidth: 360,
              mx: "auto",
              lineHeight: 1.6,
            }}
          >
            Add Skills, Experience, Education, Projects, Certifications, or
            Achievements to build your profile
          </Typography>
          <Button
            variant="contained"
            startIcon={<IconWrapper icon="mdi:plus" size={20} />}
            onClick={() => setAddModalOpen(true)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              py: 1.25,
              borderRadius: 2,
              backgroundColor: "#0a66c2",
              "&:hover": { backgroundColor: "#004182" },
            }}
          >
            Add Section
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <AnimatePresence mode="popLayout">
            {visibleSections.map((id, index) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                transition={{ duration: 0.25 }}
              >
                {id === "skills" && (
                  <SkillsSection
                    profile={profile}
                    onSave={onSave}
                    onRemoveSection={() => handleRemoveSection("skills")}
                  />
                )}
                {id === "experience" && (
                  <ExperienceSection
                    profile={profile}
                    onSave={onSave}
                    onRemoveSection={() => handleRemoveSection("experience")}
                  />
                )}
                {id === "education" && (
                  <EducationSection
                    profile={profile}
                    onSave={onSave}
                    onRemoveSection={() => handleRemoveSection("education")}
                  />
                )}
                {id === "projects" && (
                  <ProjectsSection
                    profile={profile}
                    onSave={onSave}
                    onRemoveSection={() => handleRemoveSection("projects")}
                  />
                )}
                {id === "certifications" && (
                  <CertificationsSection
                    profile={profile}
                    onSave={onSave}
                    onRemoveSection={() => handleRemoveSection("certifications")}
                  />
                )}
                {id === "achievements" && (
                  <AchievementsSection
                    profile={profile}
                    onSave={onSave}
                    onRemoveSection={() => handleRemoveSection("achievements")}
                  />
                )}
                {id === "external_profiles" && (
                  <ExternalProfilesCard
                    profile={profile}
                    onSave={onSave}
                    onRemoveSection={() => handleRemoveSection("external_profiles")}
                  />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>
      )}

      <AddSectionModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        addedSectionIds={visibleSections}
        onAddSection={handleAddSection}
      />
    </Box>
  );
}
