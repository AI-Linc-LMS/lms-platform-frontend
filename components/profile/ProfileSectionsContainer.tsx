"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Box, Stack, Typography } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import { SectionAction } from "./theme/surfaces";
import { PANEL_RADIUS, PROFILE } from "./theme/profileTokens";
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
const PROFILE_HIDDEN_KEY = `profile_hidden_sections_${config.clientId}`;
const SECTION_ORDER: ProfileSectionId[] = [
  "skills",
  "experience",
  "education",
  "projects",
  "certifications",
  "achievements",
  "external_profiles",
];

/** Copy for the dashed placeholder a missing section renders as. Keyed by section id; the
 *  order shown follows SECTION_ORDER, and external_profiles is excluded because it is a
 *  links card rather than a section a student "writes". */
const SECTION_INVITE: Partial<
  Record<
    ProfileSectionId,
    { icon: string; titleKey: string; titleFallback: string; whyKey: string; whyFallback: string }
  >
> = {
  skills: {
    icon: "mdi:lightning-bolt-outline",
    titleKey: "profile.inviteSkills",
    titleFallback: "Add your skills",
    whyKey: "profile.inviteSkillsWhy",
    whyFallback: "Also improves how courses are matched to you",
  },
  experience: {
    icon: "mdi:briefcase-outline",
    titleKey: "profile.inviteExperience",
    titleFallback: "Add work experience",
    whyKey: "profile.inviteExperienceWhy",
    whyFallback: "The first thing a recruiter looks for",
  },
  education: {
    icon: "mdi:school-outline",
    titleKey: "profile.inviteEducation",
    titleFallback: "Add your education",
    whyKey: "profile.inviteEducationWhy",
    whyFallback: "Degree, college and graduation year",
  },
  projects: {
    icon: "mdi:folder-star-outline",
    titleKey: "profile.inviteProjects",
    titleFallback: "Add a project",
    whyKey: "profile.inviteProjectsWhy",
    whyFallback: "Show the work, not just the stack",
  },
  certifications: {
    icon: "mdi:certificate-outline",
    titleKey: "profile.inviteCertifications",
    titleFallback: "Add certifications",
    whyKey: "profile.inviteCertificationsWhy",
    whyFallback: "Including the ones you earned here",
  },
  achievements: {
    icon: "mdi:trophy-outline",
    titleKey: "profile.inviteAchievements",
    titleFallback: "Add achievements",
    whyKey: "profile.inviteAchievementsWhy",
    whyFallback: "Awards, ranks and competition wins",
  },
};

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

/**
 * Sections the student explicitly removed.
 *
 * This list has to exist separately. Visibility used to be
 * `union(savedList, sectionsThatHaveData)`, and a union cannot express a removal: dropping
 * "education" from the saved list did nothing, because the education entries still existed
 * on the server, so getSectionsWithData put it straight back on the next mount. Removing a
 * section appeared to work and silently undid itself on refresh, for every section that had
 * any content — which is every section worth removing.
 *
 * Hiding is a layout preference, not a delete: the entries are untouched and re-adding the
 * section brings them back intact.
 */
function loadHiddenSections(): ProfileSectionId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROFILE_HIDDEN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHiddenSections(sections: ProfileSectionId[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROFILE_HIDDEN_KEY, JSON.stringify(sections));
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
    const hidden = new Set(loadHiddenSections());
    // Union of "saved" and "has data", MINUS whatever was explicitly removed. The subtraction
    // is the whole fix: without it, any section holding data is re-added on every mount.
    const merged = Array.from(new Set([...(saved || []), ...withData]))
      .filter((id) => !hidden.has(id))
      .sort((a, b) => SECTION_ORDER.indexOf(a) - SECTION_ORDER.indexOf(b));
    setVisibleSections(merged);
    if (!saved || saved.length === 0) saveVisibleSections(merged);
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (profile) {
      initializeSections(profile);
    }
  }, [profile, initializeSections]);

  const handleAddSection = (id: ProfileSectionId) => {
    // Clear the removal first, or the section would vanish again on the next mount.
    saveHiddenSections(loadHiddenSections().filter((s) => s !== id));
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
    // Record the removal. Dropping it from the visible list alone is not enough: the section
    // still has data, so the next mount would union it straight back in.
    const hidden = loadHiddenSections();
    if (!hidden.includes(id)) saveHiddenSections([...hidden, id]);
  };

  if (!initialized) return null;

  /** The sections the hero's action cards can point at, in the order that matters to a
   *  recruiter. Anything here that is not currently visible renders as a dashed invitation
   *  so the hero always has a real scroll target, even for a brand-new profile. */
  const missingSections = SECTION_ORDER.filter(
    (id) => id !== "external_profiles" && !visibleSections.includes(id),
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <Box>
          <Typography sx={{ fontWeight: 800, color: PROFILE.ink, fontSize: "1.05rem", letterSpacing: "-0.3px" }}>
            {t("profile.sectionsTitle", { defaultValue: "Profile sections" })}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: PROFILE.inkFaint, mt: 0.25 }}>
            {t("profile.sectionsSubtitle", {
              defaultValue: "{{shown}} of {{total}} added",
              shown: visibleSections.length,
              total: SECTION_ORDER.length,
            })}
          </Typography>
        </Box>
        <SectionAction
          icon="mdi:plus"
          label={t("profile.addSection", { defaultValue: "Add section" })}
          onClick={() => setAddModalOpen(true)}
        />
      </Stack>

      {visibleSections.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <AnimatePresence mode="popLayout">
            {visibleSections.map((id) => (
              <motion.div
                key={id}
                id={`section-${id}`}
                style={{ scrollMarginTop: 104 }}
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

      {/* Dashed invitations for what is still missing. These are also the scroll targets the
          hero's action cards jump to, so "Add work experience" always lands somewhere real
          rather than scrolling to an element that was never rendered. */}
      {missingSections.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {missingSections.map((id) => {
            const meta = SECTION_INVITE[id];
            if (!meta) return null;
            return (
              <Box
                key={id}
                id={`section-${id}`}
                component="button"
                onClick={() => handleAddSection(id)}
                sx={{
                  scrollMarginTop: "104px",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  width: "100%",
                  textAlign: "start",
                  p: 2.25,
                  borderRadius: PANEL_RADIUS,
                  border: `1px dashed ${PROFILE.violetBorder}`,
                  bgcolor: "#fdfcff",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "border-color .15s, background .15s",
                  "&:hover": { borderColor: PROFILE.violetLight, bgcolor: PROFILE.violetSoft },
                  "&:focus-visible": {
                    outline: "none",
                    boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${PROFILE.violet}`,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: 2,
                    flexShrink: 0,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: PROFILE.violetSoft,
                    color: PROFILE.violet,
                  }}
                >
                  <IconWrapper icon={meta.icon} size={17} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#6d28d9", lineHeight: 1.2 }}>
                    {t(meta.titleKey, { defaultValue: meta.titleFallback })}
                  </Typography>
                  <Typography sx={{ fontSize: "0.72rem", color: PROFILE.inkFaint, mt: 0.25 }}>
                    {t(meta.whyKey, { defaultValue: meta.whyFallback })}
                  </Typography>
                </Box>
                <IconWrapper icon="mdi:plus" size={18} color={PROFILE.violet} />
              </Box>
            );
          })}
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
