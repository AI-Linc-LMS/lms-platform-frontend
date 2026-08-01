"use client";

import { useTranslation } from "react-i18next";
import { Box, Stack, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { CoverPhoto } from "./CoverPhoto";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileSummary } from "./ProfileSummary";
import { UserDetailsCard } from "./UserDetailsCard";
import { AdminProfileSectionsReadOnly } from "@/components/admin/AdminProfileSectionsReadOnly";
import { ProfilePanel, ProfileSectionHeader, StatTile } from "./theme/surfaces";
import { PANEL_BORDER, PANEL_RADIUS, PANEL_SHADOW, PROFILE, STAT_ACCENT } from "./theme/profileTokens";
import { calculateProfileCompletion } from "@/lib/utils/profileCompletion";
import type { UserProfile } from "@/lib/services/profile.service";

/**
 * The read-only rendering of a profile: cover, then the avatar overlapping it, then the
 * facts. LinkedIn's shape, on the dashboard's palette.
 *
 * ONE component with two callers, deliberately:
 *  - app/admin/profile/[id]  — an admin inspecting a student
 *  - app/profile/preview     — a student checking their own public view
 *
 * The student asked to see "exactly" how their profile looks to other people. Two lookalike
 * components would answer that on the day they were written and then drift; sharing the
 * render makes the answer true by construction. The only differences are the badge wording
 * and whether the completion stat row is shown, both of which are chrome around the same
 * profile, not the profile itself.
 *
 * Note this deliberately does NOT use ProfileBriefingHero. That hero coaches you to finish
 * your profile, which is meaningless when you are looking at someone else's, and misleading
 * in a preview that is supposed to show what other people see.
 */

export interface PublicProfileViewProps {
  profile: UserProfile;
  /** "admin" adds the completion stat row; "preview" keeps it to what a viewer would see. */
  variant: "admin" | "preview";
  /** Organization name, when the caller has client context. */
  organizationName?: string;
}

export function PublicProfileView({ profile, variant, organizationName }: PublicProfileViewProps) {
  const { t } = useTranslation("common");

  const location =
    profile.city && profile.state
      ? `${profile.city}, ${profile.state}`
      : profile.city || profile.state || "";

  const completion = calculateProfileCompletion(profile);
  const sectionsFilled = [
    profile.skills,
    profile.experience,
    profile.education,
    profile.projects,
    profile.certifications,
    profile.achievements,
  ].filter((s) => Array.isArray(s) && s.length > 0).length;

  const badge =
    variant === "admin"
      ? { icon: "mdi:eye-outline", label: t("profile.adminReadOnly", { defaultValue: "Read only" }) }
      : {
          icon: "mdi:earth",
          label: t("profile.publicViewBadge", { defaultValue: "Public view" }),
        };

  return (
    <>
      {/* Cover, then avatar. One card so the photo, the name and the badge read as a single
          object instead of three stacked full-bleed bands. */}
      <Box
        sx={{
          borderRadius: PANEL_RADIUS,
          border: PANEL_BORDER,
          bgcolor: PROFILE.surface,
          boxShadow: PANEL_SHADOW,
          overflow: "hidden",
          mb: 2.5,
        }}
      >
        <Box sx={{ position: "relative" }}>
          <CoverPhoto coverPhotoUrl={profile.cover_photo_url ?? undefined} />
          <Box
            sx={{
              position: "absolute",
              top: 14,
              insetInlineEnd: 16,
              px: 1.25,
              py: 0.5,
              borderRadius: 999,
              bgcolor: "rgba(255,255,255,0.92)",
              color: PROFILE.ink,
              fontSize: "0.68rem",
              fontWeight: 800,
              letterSpacing: 0.4,
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <IconWrapper icon={badge.icon} size={13} />
            {badge.label}
          </Box>
        </Box>
        {/* No edit callbacks passed, so ProfileHeader renders without any edit affordance. */}
        <ProfileHeader
          userName={`${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()}
          profilePicUrl={profile.profile_picture}
          role={profile.role || t("profile.student")}
          headline={profile.headline ?? undefined}
          location={location}
        />
      </Box>

      {variant === "admin" && (
        // Facts about the student, for an admin. A student looking at their own public view
        // does not need this: it is internal chrome, not something a viewer sees.
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(4,1fr)" },
            gap: 1.5,
            mb: 2.5,
          }}
        >
          <StatTile
            label={t("profile.profileStrength")}
            value={`${completion.percentage}%`}
            sub={`${completion.completedFields}/${completion.totalFields} ${t("profile.completed").toLowerCase()}`}
            icon="mdi:account-check-outline"
            accent={STAT_ACCENT.violet}
          />
          <StatTile
            label={t("profile.sectionsFilled", { defaultValue: "Sections filled" })}
            value={`${sectionsFilled}`}
            sub={t("profile.ofSix", { defaultValue: "of 6" })}
            icon="mdi:view-list-outline"
            accent={STAT_ACCENT.amber}
          />
          <StatTile
            label={t("profile.skillsListed", { defaultValue: "Skills listed" })}
            value={`${profile.skills?.length ?? 0}`}
            icon="mdi:lightning-bolt-outline"
            accent={STAT_ACCENT.blue}
          />
          <StatTile
            label={t("profile.experienceEntries", { defaultValue: "Experience" })}
            value={`${profile.experience?.length ?? 0}`}
            sub={t("profile.entries", { defaultValue: "entries" })}
            icon="mdi:briefcase-outline"
            accent={STAT_ACCENT.green}
          />
        </Box>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1fr) 390px" },
          gap: 2.5,
          alignItems: "start",
        }}
      >
        <Stack spacing={2.5} sx={{ minWidth: 0, order: { xs: 2, lg: 1 } }}>
          <ProfileSummary profile={profile} readOnly />
          <ReadOnlyInfoCard profile={profile} />
          <AdminProfileSectionsReadOnly profile={profile} />
        </Stack>

        <Stack spacing={2.5} sx={{ minWidth: 0, order: { xs: 1, lg: 2 } }}>
          <UserDetailsCard
            username={profile.username}
            emailAddress={profile.email}
            socialLinks={{
              github: profile.social_links?.github || "",
              linkedin: profile.social_links?.linkedin || "",
            }}
            externalProfiles={{
              portfolio_website_url: profile.portfolio_website_url ?? undefined,
              leetcode_url: profile.leetcode_url ?? undefined,
              hackerrank_url: profile.hackerrank_url ?? undefined,
              kaggle_url: profile.kaggle_url ?? undefined,
              medium_url: profile.medium_url ?? undefined,
            }}
          />
          {organizationName && (
            <ProfilePanel>
              <ProfileSectionHeader
                icon="mdi:office-building-outline"
                title={t("profile.organization", { defaultValue: "Organization" })}
              />
              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: PROFILE.ink }}>
                {organizationName}
              </Typography>
            </ProfilePanel>
          )}
        </Stack>
      </Box>
    </>
  );
}

/** The education and contact block, read-only. Empty fields say so rather than showing "-". */
function ReadOnlyInfoCard({ profile }: { profile: UserProfile }) {
  const { t } = useTranslation("common");
  const fields = [
    { label: t("profile.collegeName"), value: profile.college_name },
    { label: t("profile.degreeType"), value: profile.degree_type },
    { label: t("profile.branch"), value: profile.branch },
    { label: t("profile.graduationYear"), value: profile.graduation_year },
    { label: t("profile.phoneNumber"), value: profile.phone_number },
    { label: t("profile.dateOfBirth"), value: profile.date_of_birth },
  ];
  const filled = fields.filter((f) => f.value).length;

  return (
    <ProfilePanel>
      <ProfileSectionHeader
        icon="mdi:account-details-outline"
        title={t("profile.personalInformation")}
        subtitle={t("profile.fieldsFilled", {
          defaultValue: "{{filled}} of {{total}} filled",
          filled,
          total: fields.length,
        })}
      />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          gap: 2.25,
        }}
      >
        {fields.map(({ label, value }) => (
          <Box key={label}>
            <Typography
              sx={{ color: PROFILE.inkFaint, fontSize: "0.68rem", fontWeight: 700, letterSpacing: 0.2 }}
            >
              {label}
            </Typography>
            <Typography
              sx={{
                color: value ? PROFILE.ink : "#cbd5e1",
                fontWeight: value ? 500 : 400,
                fontSize: "0.875rem",
                mt: 0.4,
                display: "block",
              }}
            >
              {value || t("profile.notAddedYet", { defaultValue: "Not added yet" })}
            </Typography>
          </Box>
        ))}
      </Box>
    </ProfilePanel>
  );
}
