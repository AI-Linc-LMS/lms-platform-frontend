"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import { MainLayout } from "@/components/layout/MainLayout";
import { CoverPhoto } from "@/components/profile/CoverPhoto";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileSummary } from "@/components/profile/ProfileSummary";
import { UserDetailsCard } from "@/components/profile/UserDetailsCard";
import { AdminProfileSectionsReadOnly } from "@/components/admin/AdminProfileSectionsReadOnly";
import { ProfilePanel, ProfileSectionHeader, StatTile } from "@/components/profile/theme/surfaces";
import {
  PANEL_BORDER,
  PANEL_RADIUS,
  PANEL_SHADOW,
  PROFILE,
  STAT_ACCENT,
} from "@/components/profile/theme/profileTokens";
import { calculateProfileCompletion } from "@/lib/utils/profileCompletion";
import { adminProfileService } from "@/lib/services/admin/admin-profile.service";
import { useToast } from "@/components/common/Toast";
import type { UserProfile } from "@/lib/services/profile.service";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";

export default function AdminProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const { clientInfo } = useClientInfo();
  const studentId = params?.id ? Number(params.id) : null;

  const [profile, setProfile] = useState<(UserProfile & { id?: number }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [studentId]);

  const loadProfile = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const data = await adminProfileService.getStudentProfile(studentId);
      setProfile(data);
    } catch {
      showToast(t("profile.failedToLoad"), "error");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout fullWidthContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
            width: "100%",
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Was #0a66c2, a hardcoded LinkedIn blue that appeared nowhere else in the product. */}
            <CircularProgress size={48} sx={{ color: PROFILE.violet }} />
          </motion.div>
        </Box>
      </MainLayout>
    );
  }

  if (!profile || !studentId) {
    return (
      <MainLayout fullWidthContent>
        <Box sx={{ py: 12, textAlign: "center", px: 2 }}>
          <Typography sx={{ color: "var(--font-secondary)", fontSize: "1rem" }}>
            {t("profile.notFound")}
          </Typography>
          <Button
            onClick={() => router.back()}
            sx={{ mt: 2 }}
          >
            {t("common.back")}
          </Button>
        </Box>
      </MainLayout>
    );
  }

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

  return (
    <MainLayout fullWidthContent>
      {/* Same palette scope as the student page. This view deliberately keeps the LinkedIn
          shape (cover, then overlapping avatar, then facts) rather than the student page's
          completion hero: an admin inspecting someone else's profile should not be coached
          to finish it, and a "Finish your profile" CTA would be meaningless here. */}
      <Box
        className="profile-surface"
        sx={{
          width: "100%",
          minHeight: "100vh",
          bgcolor: PROFILE.canvas,
          pb: 6,
          px: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 },
          pt: 2,
        }}
      >
        <Button
          startIcon={<IconWrapper icon="mdi:arrow-left" size={18} />}
          onClick={() => router.back()}
          sx={{
            textTransform: "none",
            color: PROFILE.inkMuted,
            fontWeight: 700,
            fontSize: "0.8125rem",
            borderRadius: 999,
            mb: 2,
            px: 1.5,
            "&:hover": { backgroundColor: "#eef2f7" },
          }}
        >
          {t("common.back")}
        </Button>

        {/* Cover, then avatar. One card so the photo, the name and the read-only badge read
            as a single object instead of three stacked full-bleed bands. */}
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
              <IconWrapper icon="mdi:eye-outline" size={13} />
              {t("profile.adminReadOnly", { defaultValue: "Read only" })}
            </Box>
          </Box>
          <ProfileHeader
            userName={`${profile.first_name} ${profile.last_name}`}
            profilePicUrl={profile.profile_picture}
            role={profile.role || t("profile.student")}
            headline={profile.headline ?? undefined}
            location={location}
          />
        </Box>

        {/* Read-only signal row. The student sees these as things to finish; an admin sees
            them as facts about the student, so they render as stat tiles, not as a nag. */}
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
            <AdminProfileInfoCard profile={profile} />
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
            {clientInfo && (
              <ProfilePanel>
                <ProfileSectionHeader
                  icon="mdi:office-building-outline"
                  title={t("profile.organization", { defaultValue: "Organization" })}
                />
                <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: PROFILE.ink }}>
                  {clientInfo.name || "AI-Linc Learning"}
                </Typography>
              </ProfilePanel>
            )}
          </Stack>
        </Box>
      </Box>
    </MainLayout>
  );
}

function AdminProfileInfoCard({
  profile,
}: {
  profile: UserProfile;
}) {
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
              sx={{
                color: PROFILE.inkFaint,
                fontSize: "0.68rem",
                fontWeight: 700,
                letterSpacing: 0.2,
              }}
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
