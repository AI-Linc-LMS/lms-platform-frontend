"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, CircularProgress } from "@mui/material";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { CoverPhoto } from "@/components/profile/CoverPhoto";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileSummary } from "@/components/profile/ProfileSummary";
import { ProfileCompletionCard } from "@/components/profile/ProfileCompletionCard";
import { PersonalInformationCard } from "@/components/profile/PersonalInformationCard";
import { ProfileSectionsContainer } from "@/components/profile/ProfileSectionsContainer";
import { UserDetailsCard } from "@/components/profile/UserDetailsCard";
import { OrganizationsCard } from "@/components/profile/OrganizationsCard";
import { ActivityHeatmap } from "@/components/profile/ActivityHeatmap";
import { SavedResumesSection } from "@/components/profile/SavedResumesSection";
import { ResumeBuilder } from "@/components/profile/resume/ResumeBuilder";
import {
  profileService,
  UserProfile,
  UserProfileUpdate,
  HeatmapData,
} from "@/lib/services/profile.service";
import { useToast } from "@/components/common/Toast";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { config } from "@/lib/config";
import { IconWrapper } from "@/components/common/IconWrapper";

const PROFILE_LOCAL_KEY_PREFIX = "user_profile_extra";

function getProfileLocalKey(): string {
  return `${PROFILE_LOCAL_KEY_PREFIX}_${config.clientId}`;
}

function isEmptyValue(val: unknown): boolean {
  if (val === undefined || val === null || val === "") return true;
  if (Array.isArray(val) && val.length === 0) return true;
  return false;
}

function loadLocalProfile(): Partial<UserProfile> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(getProfileLocalKey());
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalProfile(data: Partial<UserProfileUpdate>) {
  if (typeof window === "undefined") return;
  try {
    const existing = loadLocalProfile();
    localStorage.setItem(getProfileLocalKey(), JSON.stringify({ ...existing, ...data }));
  } catch {
    // storage unavailable
  }
}

function mergeWithLocalFallback(apiProfile: UserProfile): UserProfile {
  const local = loadLocalProfile();
  const merged = { ...apiProfile };
  for (const [key, value] of Object.entries(local)) {
    if (isEmptyValue((merged as any)[key]) && !isEmptyValue(value)) {
      (merged as any)[key] = value;
    }
  }
  return merged;
}

export default function ProfilePage() {
  const { t } = useTranslation("common");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData>({});
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { clientInfo } = useClientInfo();

  const handleTabChange = (_event: React.SyntheticEvent | null, newValue: number) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const profileData = await profileService.getUserProfile();
      setProfile(mergeWithLocalFallback(profileData));

      try {
        const heatmap = await profileService.getUserActivityHeatmap();
        setHeatmapData(heatmap as any);
      } catch {
        // Continue even if heatmap fails
      }
    } catch {
      showToast(t("profile.failedToLoad"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (updatedProfile: UserProfileUpdate) => {
    saveLocalProfile(updatedProfile);

    try {
      const apiResponse = await profileService.updateUserProfile(updatedProfile);
      setProfile((prev) => {
        if (!prev) return { ...updatedProfile, ...apiResponse } as UserProfile;
        const result = { ...prev, ...updatedProfile };
        for (const [key, val] of Object.entries(apiResponse)) {
          if (!isEmptyValue(val)) {
            (result as any)[key] = val;
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
            <CircularProgress size={48} sx={{ color: "#0a66c2" }} />
          </motion.div>
        </Box>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout fullWidthContent>
        <Box sx={{ py: 12, textAlign: "center", px: 2 }}>
          <Box sx={{ color: "#6b7280", fontSize: "1rem" }}>{t("profile.notFound")}</Box>
        </Box>
      </MainLayout>
    );
  }

  const location = profile.city && profile.state
    ? `${profile.city}, ${profile.state}`
    : profile.city || profile.state || "";

  return (
    <MainLayout fullWidthContent>
      <Box
        sx={{
          width: "100%",
          minHeight: "100vh",
          background: "linear-gradient(180deg, #f1f5f9 0%, #f8fafc 24%, #ffffff 100%)",
          pb: 6,
        }}
      >
        {/* Hero: Cover + Profile - Full Width */}
        <Box sx={{ width: "100%", position: "relative" }}>
          <CoverPhoto
            coverPhotoUrl={profile.cover_photo_url ?? undefined}
            onEditCoverUrl={async (url: string) => {
              await handleSaveProfile({ cover_photo_url: url || null });
              showToast(url ? t("profile.coverPhotoUpdated") : t("profile.coverPhotoCleared"), "success");
            }}
          />
          <Box
            sx={{
              width: "100%",
              px: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 },
              pt: 0,
              pb: 3,
              backgroundColor: "#ffffff",
              borderBottom: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <ProfileHeader
              userName={profile.first_name + " " + profile.last_name}
              profilePicUrl={profile.profile_picture}
              role={profile.role || t("profile.student")}
              headline={profile.headline ?? undefined}
              location={location}
              onEditProfilePicUrl={async (url: string) => {
                await handleSaveProfile({ profile_picture: url || null });
                showToast(url ? t("profile.profilePictureUpdated") : t("profile.profilePictureCleared"), "success");
              }}
              onEditHeadline={async (newHeadline: string) => {
                await handleSaveProfile({ headline: newHeadline.trim() || null });
              }}
            />
          </Box>
        </Box>

        {/* Tab Switcher + Content */}
        <Box
          sx={{
            width: "100%",
            px: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 },
            pt: 3,
            pb: 1,
          }}
        >
          {/* Tab toggle - single line, equal segments */}
          <Box
            sx={{
              display: "flex",
              width: "100%",
              minWidth: 320,
              mb: 2,
              p: 0.5,
              backgroundColor: "#f1f5f9",
              borderRadius: "12px",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flex: 1,
                position: "relative",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              {/* Sliding pill */}
              <motion.div
                style={{
                  position: "absolute",
                  top: 4,
                  bottom: 4,
                  left: 4,
                  width: "calc(33.333% - 6px)",
                  borderRadius: "8px",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                }}
                animate={{
                  left:
                    activeTab === 0
                      ? 4
                      : activeTab === 1
                        ? "calc(33.333% + 2px)"
                        : "calc(66.666% + 4px)",
                }}
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
              {[
                { id: 0, icon: "mdi:account-circle-outline", label: t("profile.tabProfile") },
                { id: 1, icon: "mdi:file-document-outline", label: t("profile.tabResume") },
                { id: 2, icon: "mdi:file-document-multiple-outline", label: t("profile.tabSavedResume") },
              ].map((tab) => (
                <Box
                  key={tab.id}
                  component="button"
                  onClick={() => handleTabChange(null, tab.id)}
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    py: 1.25,
                    px: 1.5,
                    border: "none",
                    borderRadius: "8px",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    position: "relative",
                    zIndex: 1,
                    minWidth: 0,
                    whiteSpace: "nowrap",
                    transition: "color 0.2s ease",
                    color: activeTab === tab.id ? "#0a66c2" : "#64748b",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    "&:hover": {
                      color: activeTab === tab.id ? "#0a66c2" : "#475569",
                    },
                    "&:active": {
                      transform: "scale(0.99)",
                    },
                  }}
                >
                  <IconWrapper
                    icon={tab.icon}
                    size={18}
                    color={activeTab === tab.id ? "#0a66c2" : "#64748b"}
                  />
                  <span>{tab.label}</span>
                </Box>
              ))}
            </Box>
          </Box>

          {/* All panels kept mounted to avoid re-renders on tab switch */}
          <Box
            sx={{
              width: "100%",
              "@keyframes tabFadeIn": {
                from: { opacity: 0.6 },
                to: { opacity: 1 },
              },
            }}
          >
            <Box
              sx={{
                display: activeTab === 0 ? "block" : "none",
                width: "100%",
                pt: 1,
                animation: activeTab === 0 ? "tabFadeIn 0.2s ease-out" : "none",
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", xl: "340px 1fr" },
                  gap: { xs: 3, lg: 4 },
                  alignItems: "start",
                }}
              >
                  {/* Sidebar */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                      order: { xs: 2, xl: 1 },
                    }}
                  >
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
                  </Box>

                  {/* Main Content - Full width for Activity & Resumes */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                      order: { xs: 1, xl: 2 },
                      minWidth: 0,
                    }}
                  >
                    <ProfileSummary profile={profile} onSave={handleSaveProfile} />
                    <ProfileCompletionCard
                      profile={profile}
                      onCompleteProfile={() => {
                        const el = document.getElementById("personal-information");
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                    />
                    <ActivityHeatmap heatmapData={heatmapData} />
                    <Box id="personal-information">
                      <PersonalInformationCard profile={profile} onSave={handleSaveProfile} />
                    </Box>
                    <ProfileSectionsContainer profile={profile} onSave={handleSaveProfile} />
                  </Box>
                </Box>
            </Box>

            <Box
              sx={{
                display: activeTab === 1 ? "block" : "none",
                width: "100%",
                pt: 1,
                animation: activeTab === 1 ? "tabFadeIn 0.2s ease-out" : "none",
              }}
            >
              <ResumeBuilder
                  initialData={{
                    basicInfo: {
                      firstName: profile.first_name,
                      lastName: profile.last_name,
                      professionalTitle: profile.headline ?? "",
                      email: profile.email,
                      phone: profile.phone_number,
                      location: [profile.city, profile.state].filter(Boolean).join(", "),
                      photo: profile.profile_picture,
                      summary: profile.bio ?? "",
                      github: profile.social_links?.github ?? "",
                      linkedin: profile.social_links?.linkedin ?? "",
                      portfolio: profile.portfolio_website_url ?? "",
                      leetcode: profile.leetcode_url ?? "",
                      hackerrank: profile.hackerrank_url ?? "",
                      kaggle: profile.kaggle_url ?? "",
                      medium: profile.medium_url ?? "",
                    },
                    workExperience: profile.experience?.map((exp, i) => ({
                      id: exp.id ?? String(i + 1),
                      position: exp.position,
                      company: exp.company,
                      location: exp.location ?? "",
                      startDate: exp.start_date,
                      endDate: exp.end_date ?? "",
                      current: exp.current,
                      description: exp.description ? exp.description.split("\n").filter(Boolean) : [],
                    })),
                    education: profile.education?.map((edu, i) => ({
                      id: edu.id ?? String(i + 1),
                      degree: [edu.degree, edu.field_of_study].filter(Boolean).join(" in "),
                      institution: edu.institution,
                      location: "",
                      startDate: edu.start_date ?? "",
                      endDate: edu.end_date ?? "",
                      gpa: edu.gpa ?? "",
                      description: edu.description ?? "",
                    })),
                    skills: profile.skills?.map((s, i) => ({
                      id: s.id ?? String(i + 1),
                      name: s.name,
                    })),
                    projects: profile.projects?.map((p, i) => ({
                      id: p.id ?? String(i + 1),
                      name: p.name,
                      description: p.description,
                      technologies: p.technologies ?? [],
                      link: p.url ?? "",
                    })),
                    certifications: profile.certifications?.map((c, i) => ({
                      id: c.id ?? String(i + 1),
                      name: c.name,
                      issuer: c.issuing_organization,
                      date: c.issue_date,
                      link: c.credential_url ?? "",
                    })),
                  }}
              />
            </Box>

            <Box
              sx={{
                display: activeTab === 2 ? "block" : "none",
                width: "100%",
                pt: 1,
                animation: activeTab === 2 ? "tabFadeIn 0.2s ease-out" : "none",
              }}
            >
              <SavedResumesSection isActive={activeTab === 2} />
            </Box>
          </Box>
        </Box>
      </Box>
    </MainLayout>
  );
}
