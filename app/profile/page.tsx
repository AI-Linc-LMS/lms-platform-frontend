"use client";

import { useCallback, useEffect, useState } from "react";
import { loadProfileCache, saveProfileCache } from "@/lib/utils/profile-cache";
import { useTranslation } from "react-i18next";
import { Box, CircularProgress, Stack } from "@mui/material";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProfileBriefingHero } from "@/components/profile/ProfileBriefingHero";
import { PublicPreviewCard } from "@/components/profile/PublicPreviewCard";
import { ProfileSummary } from "@/components/profile/ProfileSummary";
import { PersonalInformationCard } from "@/components/profile/PersonalInformationCard";
import { ProfileSectionsContainer } from "@/components/profile/ProfileSectionsContainer";
import { UserDetailsCard } from "@/components/profile/UserDetailsCard";
import { OrganizationsCard } from "@/components/profile/OrganizationsCard";
import { ActivityHeatmap } from "@/components/profile/ActivityHeatmap";
import { SavedResumesSection } from "@/components/profile/SavedResumesSection";
import { ResumeBuilder } from "@/components/profile/resume/ResumeBuilder";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { useModuleLocked } from "@/lib/contexts/ProfileGateContext";
import { PROFILE } from "@/components/profile/theme/profileTokens";
import { buildResumeInitialData } from "@/lib/utils/buildResumeInitialData";
import {
  profileService,
  UserProfile,
  UserProfileUpdate,
  HeatmapData,
} from "@/lib/services/profile.service";
import { useToast } from "@/components/common/Toast";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";

function isEmptyValue(val: unknown): boolean {
  if (val === undefined || val === null || val === "") return true;
  if (Array.isArray(val) && val.length === 0) return true;
  return false;
}

function loadLocalProfile(): Partial<UserProfile> {
  return loadProfileCache<UserProfile>();
}

function saveLocalProfile(data: Partial<UserProfileUpdate>) {
  saveProfileCache<UserProfileUpdate>(data);
}

function mergeWithLocalFallback(apiProfile: UserProfile): UserProfile {
  const local = loadLocalProfile();
  const merged = { ...apiProfile } as Record<string, unknown>;
  for (const [key, value] of Object.entries(local)) {
    if (isEmptyValue(merged[key]) && !isEmptyValue(value)) {
      merged[key] = value;
    }
  }
  return merged as unknown as UserProfile;
}

export default function ProfilePage() {
  const { t } = useTranslation("common");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  /** Same fields as GET user-profile; no localStorage merge - used for profile strength % to match dashboard. */
  const [profileFromApi, setProfileFromApi] = useState<UserProfile | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData>({});
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { clientInfo } = useClientInfo();
  // Same gate as /resume: the builder stays editable, only Save and PDF lock.
  const { showLock: resumeLocked } = useModuleLocked("resume");

  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const profileData = await profileService.getUserProfile();
      setProfileFromApi(profileData);
      setProfile(mergeWithLocalFallback(profileData));

      try {
        const heatmap = await profileService.getUserActivityHeatmap();
        setHeatmapData(heatmap.heatmap_data ?? {});
      } catch {
        // Continue even if heatmap fails
      }
    } catch {
      showToast(t("profile.failedToLoad"), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    void loadProfileData();
  }, [loadProfileData]);

  useEffect(() => {
    if (!loading && typeof window !== "undefined" && window.location.hash) {
      setTimeout(() => {
        const id = window.location.hash.substring(1);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 500);
    }
  }, [loading]);

  /**
   * Target of the hero's action cards. Switches to the Profile tab first: the resume tabs
   * are kept mounted but display:none, and scrollIntoView on a display:none element is a
   * silent no-op, so jumping from the Resume tab would otherwise do nothing at all.
   */
  const jumpTo = useCallback((anchorId: string) => {
    setActiveTab(0);
    requestAnimationFrame(() => {
      const el = document.getElementById(anchorId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const handleSaveProfile = async (updatedProfile: UserProfileUpdate) => {
    saveLocalProfile(updatedProfile);

    try {
      const apiResponse = await profileService.updateUserProfile(updatedProfile);
      setProfileFromApi((prev) => {
        const base = prev ?? ({} as UserProfile);
        const result = { ...base, ...updatedProfile } as UserProfile;
        for (const [key, val] of Object.entries(apiResponse)) {
          if (!isEmptyValue(val)) {
            (result as unknown as Record<string, unknown>)[key] = val;
          }
        }
        result.profile_picture = result.profile_picture ?? "";
        return result;
      });
      setProfile((prev) => {
        if (!prev) return { ...updatedProfile, ...apiResponse } as UserProfile;
        const result = { ...prev, ...updatedProfile };
        for (const [key, val] of Object.entries(apiResponse)) {
          if (!isEmptyValue(val)) {
            (result as unknown as Record<string, unknown>)[key] = val;
          }
        }
        result.profile_picture = result.profile_picture ?? "";
        return result as UserProfile;
      });
      showToast(t("profile.updatedSuccess"), "success");
    } catch {
      setProfile((prev) => {
        if (!prev) return null;
        const merged = { ...prev, ...updatedProfile };
        merged.profile_picture = merged.profile_picture ?? "";
        return merged as UserProfile;
      });
      showToast(t("profile.savedLocally"), "info");
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
            <CircularProgress size={48} sx={{ color: PROFILE.violet }} />
          </motion.div>
        </Box>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout fullWidthContent>
        <Box sx={{ py: 12, textAlign: "center", px: 2 }}>
          <Box sx={{ color: "var(--font-secondary)", fontSize: "1rem" }}>{t("profile.notFound")}</Box>
        </Box>
      </MainLayout>
    );
  }

  const location =
    profile.city && profile.state
      ? `${profile.city}, ${profile.state}`
      : profile.city || profile.state || "";

  const userName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();

  return (
    <MainLayout fullWidthContent>
      {/* .profile-surface re-points --accent-indigo and friends to the dashboard palette for
          this subtree only. See the block at the end of app/globals.css. */}
      <Box
        className="profile-surface"
        sx={{
          width: "100%",
          minHeight: "100vh",
          bgcolor: PROFILE.canvas,
          pb: 6,
          px: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 },
          pt: { xs: 2.5, md: 3.5 },
        }}
      >
        <ProfileBriefingHero
          profile={profileFromApi ?? profile}
          coverPhotoUrl={profile.cover_photo_url}
          onJumpTo={jumpTo}
        />

        <ProfileTabs value={activeTab} onChange={setActiveTab} />

        {/* All panels stay mounted so switching tabs does not refetch or re-render the
            resume builder. jumpTo() flips back to tab 0 before scrolling, because
            scrollIntoView on a display:none subtree silently does nothing. */}
        <Box sx={{ display: activeTab === 0 ? "block" : "none", width: "100%" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1fr) 390px" },
              gap: 2.5,
              alignItems: "start",
            }}
          >
            <Stack spacing={2.5} sx={{ minWidth: 0, order: { xs: 2, lg: 1 } }}>
              <ProfileSummary profile={profile} onSave={handleSaveProfile} />
              <Box id="personal-information" sx={{ scrollMarginTop: "104px" }}>
                <PersonalInformationCard profile={profile} onSave={handleSaveProfile} />
              </Box>
              <ProfileSectionsContainer profile={profile} onSave={handleSaveProfile} />
              <ActivityHeatmap heatmapData={heatmapData} />
            </Stack>

            <Stack spacing={2.5} sx={{ minWidth: 0, order: { xs: 1, lg: 2 } }}>
              <PublicPreviewCard
                userName={userName}
                role={profile.role || t("profile.student")}
                headline={profile.headline ?? undefined}
                location={location}
                profilePicUrl={profile.profile_picture}
                coverPhotoUrl={profile.cover_photo_url ?? undefined}
                onEditProfilePicUrl={async (url: string) => {
                  await handleSaveProfile({ profile_picture: url || null });
                  showToast(
                    url ? t("profile.profilePictureUpdated") : t("profile.profilePictureCleared"),
                    "success",
                  );
                }}
                onUploadProfilePic={async (file: File) => {
                  const { profile_picture } = await profileService.uploadProfilePicture(file);
                  setProfile((prev) => (prev ? { ...prev, profile_picture } : prev));
                  showToast(t("profile.profilePictureUpdated"), "success");
                }}
                onEditCoverUrl={async (url: string) => {
                  await handleSaveProfile({ cover_photo_url: url || null });
                  showToast(
                    url ? t("profile.coverPhotoUpdated") : t("profile.coverPhotoCleared"),
                    "success",
                  );
                }}
                onUploadCover={async (file: File) => {
                  // The endpoint writes the column itself and returns a permanent URL of ours,
                  // so there is no separate save step and nothing that can expire.
                  const { cover_photo_url } = await profileService.uploadCoverPhoto(file);
                  setProfile((prev) => (prev ? { ...prev, cover_photo_url } : prev));
                  showToast(t("profile.coverPhotoUpdated"), "success");
                }}
                onEditHeadline={async (newHeadline: string) => {
                  await handleSaveProfile({ headline: newHeadline.trim() || null });
                }}
              />

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

              <OrganizationsCard
                organizations={
                  clientInfo
                    ? [
                        {
                          id: 1,
                          name: clientInfo.name || "AI-Linc Learning",
                          role: t("profile.student"),
                          joinedDate: "Jan 1, 2024",
                        },
                      ]
                    : []
                }
              />
            </Stack>
          </Box>
        </Box>

        <Box sx={{ display: activeTab === 1 ? "block" : "none", width: "100%" }}>
          <ResumeBuilder initialData={buildResumeInitialData(profile)} lockExports={resumeLocked} />
        </Box>

        <Box sx={{ display: activeTab === 2 ? "block" : "none", width: "100%" }}>
          <SavedResumesSection isActive={activeTab === 2} />
        </Box>
      </Box>
    </MainLayout>
  );
}
