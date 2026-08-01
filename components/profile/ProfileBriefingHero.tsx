"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import { Reveal } from "@/components/scorecard/shared";
import type { UserProfile } from "@/lib/services/profile.service";
import { calculateProfileCompletion } from "@/lib/utils/profileCompletion";
import { HeroActionCard, HeroCta, HeroPill, HeroShell } from "./theme/surfaces";
import { ON_DARK } from "./theme/profileTokens";

/**
 * The student profile hero.
 *
 * Mirrors components/dashboard/v2/AiBriefingHero: same gradient shell, same eyebrow pill,
 * same two-up action cards, same gradient CTA. The difference is what it is pointed at.
 * The dashboard hero coaches you through the week; this one coaches you through the profile.
 *
 * Deliberately NOT used on app/admin/profile/[id]. An admin inspecting a student should not
 * be told to finish someone else's profile, and the CTA would be meaningless there, so the
 * admin page has its own LinkedIn-style header instead of a content mode on this component.
 */

/**
 * Which gap to nag about first. calculateProfileCompletion returns missingFields in schema
 * order (required, then optional, then arrays), which puts "Phone Number" above "Experience".
 * For a page a recruiter reads, that order is wrong, so rank by what actually carries the
 * profile. The `label` values must match FIELD_LABELS in lib/utils/profileCompletion.ts.
 */
const NEXT_ACTIONS: {
  label: string;
  titleKey: string;
  titleFallback: string;
  subKey: string;
  subFallback: string;
  icon: string;
  anchor: string;
}[] = [
  {
    label: "Experience",
    titleKey: "profile.nextExperience",
    titleFallback: "Work experience",
    subKey: "profile.nextExperienceWhy",
    subFallback: "The first thing a recruiter looks for",
    icon: "mdi:briefcase-outline",
    anchor: "section-experience",
  },
  {
    label: "Skills",
    titleKey: "profile.nextSkills",
    titleFallback: "Skills",
    subKey: "profile.nextSkillsWhy",
    subFallback: "Also improves your course matching",
    icon: "mdi:lightning-bolt-outline",
    anchor: "section-skills",
  },
  {
    label: "Bio",
    titleKey: "profile.nextBio",
    titleFallback: "A short bio",
    subKey: "profile.nextBioWhy",
    subFallback: "Two lines on what you are building",
    icon: "mdi:text-account",
    anchor: "personal-information",
  },
  {
    label: "Education",
    titleKey: "profile.nextEducation",
    titleFallback: "Education",
    subKey: "profile.nextEducationWhy",
    subFallback: "Degree, college and graduation year",
    icon: "mdi:school-outline",
    anchor: "section-education",
  },
  {
    label: "Projects",
    titleKey: "profile.nextProjects",
    titleFallback: "Projects",
    subKey: "profile.nextProjectsWhy",
    subFallback: "Show the work, not just the stack",
    icon: "mdi:folder-star-outline",
    anchor: "section-projects",
  },
  {
    label: "Certifications",
    titleKey: "profile.nextCertifications",
    titleFallback: "Certifications",
    subKey: "profile.nextCertificationsWhy",
    subFallback: "Add the ones you earned here",
    icon: "mdi:certificate-outline",
    anchor: "section-certifications",
  },
  {
    label: "Achievements",
    titleKey: "profile.nextAchievements",
    titleFallback: "Achievements",
    subKey: "profile.nextAchievementsWhy",
    subFallback: "Awards, ranks and competition wins",
    icon: "mdi:trophy-outline",
    anchor: "section-achievements",
  },
  {
    label: "LinkedIn Profile",
    titleKey: "profile.nextLinkedin",
    titleFallback: "LinkedIn",
    subKey: "profile.nextLinkedinWhy",
    subFallback: "Usually the next link a recruiter opens",
    icon: "mdi:linkedin",
    anchor: "section-external_profiles",
  },
  {
    label: "GitHub Profile",
    titleKey: "profile.nextGithub",
    titleFallback: "GitHub",
    subKey: "profile.nextGithubWhy",
    subFallback: "Where your code lives",
    icon: "mdi:github",
    anchor: "section-external_profiles",
  },
  {
    label: "Portfolio Website",
    titleKey: "profile.nextPortfolio",
    titleFallback: "Portfolio site",
    subKey: "profile.nextPortfolioWhy",
    subFallback: "One link that shows everything",
    icon: "mdi:web",
    anchor: "section-external_profiles",
  },
  {
    label: "Phone Number",
    titleKey: "profile.nextPhone",
    titleFallback: "Phone number",
    subKey: "profile.nextPhoneWhy",
    subFallback: "So we can reach you about interviews",
    icon: "mdi:phone-outline",
    anchor: "personal-information",
  },
  {
    label: "College/University Name",
    titleKey: "profile.nextCollege",
    titleFallback: "Your college",
    subKey: "profile.nextCollegeWhy",
    subFallback: "Unlocks campus cohorts and drives",
    icon: "mdi:office-building-outline",
    anchor: "personal-information",
  },
];

interface ProfileBriefingHeroProps {
  profile: UserProfile;
  coverPhotoUrl?: string | null;
  /** Scrolls to a section anchor. The page owns the scrolling so the hero stays presentational. */
  onJumpTo: (anchorId: string) => void;
}

export function ProfileBriefingHero({ profile, coverPhotoUrl, onJumpTo }: ProfileBriefingHeroProps) {
  const { t } = useTranslation("common");

  const { percentage, missingFields } = useMemo(
    () => calculateProfileCompletion(profile),
    [profile],
  );

  const actions = useMemo(() => {
    const missing = new Set(missingFields);
    return NEXT_ACTIONS.filter((a) => missing.has(a.label)).slice(0, 2);
  }, [missingFields]);

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  const complete = percentage >= 100;
  const remaining = missingFields.length;

  const headline = complete
    ? t("profile.heroHeadlineComplete", { defaultValue: "Your profile is complete." })
    : t("profile.heroHeadline", {
        defaultValue: "Your profile is {{pct}}% complete. {{count}} fields left.",
        pct: percentage,
        count: remaining,
      });

  const sub = complete
    ? t("profile.heroSubComplete", {
        defaultValue: "Keep it current as you ship new work. Instructors and recruiters read this page.",
      })
    : t("profile.heroSub", {
        defaultValue:
          "Instructors and recruiters see this page when they open your name. Finishing it takes about 15 minutes.",
      });

  return (
    <Reveal>
      {/* #profile-strength is a load-bearing deep-link target, not decoration: the dashboard
          ProfileCompletionPanel, the dashboard ProfileCompletionReminder and ProfileLockModal
          all router.push("/profile#profile-strength"). It used to live on ProfileCompletionCard,
          which this hero absorbed, so the id moves here or those three links scroll nowhere. */}
      <HeroShell id="profile-strength" coverUrl={coverPhotoUrl || undefined} sx={{ mb: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <HeroPill icon="mdi:star-four-points" eyebrow>
            {t("profile.heroEyebrow", { defaultValue: "Your profile" })}
          </HeroPill>

          <Stack
            direction="row"
            spacing={1.25}
            alignItems="center"
            sx={{
              flexShrink: 0,
              px: 1.5,
              py: 0.75,
              borderRadius: 999,
              bgcolor: ON_DARK.fill,
              border: `1px solid ${ON_DARK.border}`,
            }}
          >
            <Typography sx={{ fontSize: "0.82rem", fontWeight: 900, color: "#fff" }}>{percentage}%</Typography>
            <LinearProgress
              variant="determinate"
              value={percentage}
              aria-label={t("profile.profileStrength")}
              sx={{
                width: 96,
                height: 6,
                borderRadius: 999,
                bgcolor: "rgba(255,255,255,0.18)",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 999,
                  background: "linear-gradient(90deg, #a855f7, #ec4899)",
                },
              }}
            />
          </Stack>
        </Stack>

        {name && (
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: 1.2,
              color: "rgba(255,255,255,0.7)",
              textTransform: "uppercase",
              mt: 2.25,
              mb: 1,
              '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
            }}
          >
            {name}
          </Typography>
        )}

        <Typography
          component="h1"
          sx={{
            fontWeight: 900,
            fontSize: { xs: "1.6rem", md: "2.1rem" },
            lineHeight: 1.15,
            letterSpacing: "-1.2px",
            maxWidth: 720,
          }}
        >
          {headline}
        </Typography>

        <Typography sx={{ fontSize: "0.9rem", color: ON_DARK.textSoft, mt: 1.25, maxWidth: 640, lineHeight: 1.55 }}>
          {sub}
        </Typography>

        {actions.length > 0 && (
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mt: 2.5 }}>
            {actions.map((a, i) => (
              <HeroActionCard
                key={a.label}
                eyebrow={
                  i === 0
                    ? t("profile.heroAddNext", { defaultValue: "Add next" })
                    : t("profile.heroAlsoMissing", { defaultValue: "Also missing" })
                }
                title={t(a.titleKey, { defaultValue: a.titleFallback })}
                sub={t(a.subKey, { defaultValue: a.subFallback })}
                icon={a.icon}
                onClick={() => onJumpTo(a.anchor)}
              />
            ))}
          </Stack>
        )}

        {!complete && (
          <Box sx={{ mt: 2.5 }}>
            <HeroCta
              icon="mdi:pencil-outline"
              onClick={() => onJumpTo(actions[0]?.anchor ?? "personal-information")}
            >
              {t("profile.heroCta", { defaultValue: "Finish your profile" })}
            </HeroCta>
          </Box>
        )}
      </HeroShell>
    </Reveal>
  );
}
