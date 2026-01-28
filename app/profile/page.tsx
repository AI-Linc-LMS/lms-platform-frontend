"use client";

import { useEffect, useState } from "react";
import { Box, Container, Tabs, Tab } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { CoverPhoto } from "@/components/profile/CoverPhoto";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileSummary } from "@/components/profile/ProfileSummary";
import { ProfileCompletionCard } from "@/components/profile/ProfileCompletionCard";
import { PersonalInformationCard } from "@/components/profile/PersonalInformationCard";
import { ExternalProfilesCard } from "@/components/profile/ExternalProfilesCard";
import { SkillsSection } from "@/components/profile/SkillsSection";
import { ExperienceSection } from "@/components/profile/ExperienceSection";
import { EducationSection } from "@/components/profile/EducationSection";
import { ProjectsSection } from "@/components/profile/ProjectsSection";
import { CertificationsSection } from "@/components/profile/CertificationsSection";
import { AchievementsSection } from "@/components/profile/AchievementsSection";
import { UserDetailsCard } from "@/components/profile/UserDetailsCard";
import { OrganizationsCard } from "@/components/profile/OrganizationsCard";
import { ActivityHeatmap } from "@/components/profile/ActivityHeatmap";
import { ResumeBuilder } from "@/components/profile/resume/ResumeBuilder";
import {
  profileService,
  UserProfile,
  HeatmapData,
} from "@/lib/services/profile.service";
import { useToast } from "@/components/common/Toast";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const { showToast } = useToast();
  const { clientInfo } = useClientInfo();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);

      // Load profile
      const profileData = await profileService.getUserProfile();
      setProfile(profileData);

      // Load activity heatmap
      try {
        const heatmap = await profileService.getUserActivityHeatmap();
        setHeatmapData(heatmap as any);
      } catch (error) {
        // Continue even if heatmap fails
      }
    } catch (error: any) {
      showToast("Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (updatedProfile: Partial<UserProfile>) => {
    try {
      const updated = await profileService.updateUserProfile(updatedProfile);
      setProfile(updated);
      showToast("Profile updated successfully", "success");
    } catch (error: any) {
      showToast("Failed to update profile", "error");
      throw error;
    }
  };

  if (!profile) {
    return (
      <MainLayout>
        <Container maxWidth="lg">
          <Box sx={{ py: 8, textAlign: "center" }}>
            <Box sx={{ color: "#6b7280" }}>Profile not found</Box>
          </Box>
        </Container>
      </MainLayout>
    );
  }

  const location = profile.city && profile.state 
    ? `${profile.city}, ${profile.state}` 
    : profile.city || profile.state || "";

  return (
    <MainLayout>
      <Box
        sx={{
          width: "100%",
          backgroundColor: "#f9fafb",
          minHeight: "100vh",
          pb: 4,
        }}
      >
        {/* Cover Photo - Full Width Banner */}
        <Box
          sx={{
            width: "100%",
            position: "relative",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: "1400px",
              mx: "auto",
            }}
          >
            <CoverPhoto 
              coverPhotoUrl={profile.cover_photo_url}
              onEditCover={async (file: File) => {
                try {
                  const result = await profileService.uploadCoverPhoto(file);
                  await handleSaveProfile({ cover_photo_url: result.cover_photo_url });
                  showToast("Cover photo updated successfully", "success");
                } catch (error: any) {
                  showToast(error.message || "Failed to upload cover photo", "error");
                  throw error;
                }
              }}
            />
          </Box>
        </Box>

        {/* Profile Header Container */}
        <Box
          sx={{
            width: "100%",
            maxWidth: "1400px",
            mx: "auto",
            px: { xs: 1, sm: 2, md: 4 },
            backgroundColor: "#ffffff",
            position: "relative",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <ProfileHeader
            userName={profile.first_name + " " + profile.last_name}
            profilePicUrl={profile.profile_picture}
            role={profile.role || "Student"}
            headline={profile.headline}
            location={location}
            onEditProfilePic={async (file: File) => {
              try {
                const result = await profileService.uploadProfilePicture(file);
                await handleSaveProfile({ profile_picture: result.profile_picture });
                showToast("Profile picture updated successfully", "success");
              } catch (error: any) {
                showToast(error.message || "Failed to upload profile picture", "error");
                throw error;
              }
            }}
            onEditHeadline={async (newHeadline: string) => {
              await handleSaveProfile({ headline: newHeadline });
            }}
          />
        </Box>

        {/* Main Content */}
        <Box
          sx={{
            width: "100%",
            maxWidth: "1400px",
            mx: "auto",
            px: { xs: 1, sm: 2, md: 4 },
            pt: { xs: 2, sm: 3 },
          }}
        >
          <Container maxWidth={false} disableGutters>

          {/* Tabs */}
          <Box 
            sx={{ 
              borderBottom: 1, 
              borderColor: "rgba(0,0,0,0.08)", 
              mb: { xs: 2, sm: 3 },
              backgroundColor: "#ffffff",
              borderRadius: { xs: 0, sm: "8px 8px 0 0" },
              px: { xs: 1, sm: 2, md: 3 },
              boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.08)",
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                  minHeight: { xs: 44, sm: 48 },
                  color: "#666666",
                  px: { xs: 1.5, sm: 2 },
                  "&.Mui-selected": {
                    color: "#0a66c2",
                  },
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "#0a66c2",
                  height: 3,
                },
              }}
            >
              <Tab label="Profile" />
              <Tab label="Resume" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          {activeTab === 0 && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "360px 1fr" },
                gap: { xs: 2, sm: 3 },
                alignItems: "start",
              }}
            >
              {/* Left Sidebar */}
              <Box
                sx={{
                  position: { xs: "static", lg: "sticky" },
                  top: { lg: 24 },
                  alignSelf: "flex-start",
                  order: { xs: 2, lg: 1 },
                }}
              >
                {/* User Details */}
                <UserDetailsCard
                  username={profile.username}
                  emailAddress={profile.email}
                  socialLinks={profile.social_links}
                  externalProfiles={{
                    portfolio_website_url: profile.portfolio_website_url,
                    leetcode_url: profile.leetcode_url,
                    hackerrank_url: profile.hackerrank_url,
                    kaggle_url: profile.kaggle_url,
                    medium_url: profile.medium_url,
                  }}
                />

                {/* Organizations */}
                <OrganizationsCard
                  organizations={
                    clientInfo
                      ? [
                          {
                            id: 1,
                            name: clientInfo.name || "AI-Linc Learning",
                            role: "Student",
                            joinedDate: "Jan 1, 2024",
                          },
                        ]
                      : []
                  }
                />

                {/* Activity Heatmap */}
                <ActivityHeatmap heatmapData={heatmapData} />
              </Box>

              {/* Right Column - Main Content */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                  order: { xs: 1, lg: 2 },
                }}
              >
                {/* Profile Summary */}
                <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                  <ProfileSummary
                    profile={profile}
                    onSave={handleSaveProfile}
                  />
                </Box>

                {/* Profile Completion Card */}
                <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                  <ProfileCompletionCard
                    profile={profile}
                    onCompleteProfile={() => {
                      // Scroll to first empty section or personal info
                      const personalInfoCard = document.getElementById("personal-information");
                      if (personalInfoCard) {
                        personalInfoCard.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                  />
                </Box>

                {/* Personal Information */}
                <Box id="personal-information" sx={{ mb: { xs: 2, sm: 3 } }}>
                  <PersonalInformationCard
                    profile={profile}
                    onSave={handleSaveProfile}
                  />
                </Box>

                {/* External Profiles */}
                <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                  <ExternalProfilesCard
                    profile={profile}
                    onSave={handleSaveProfile}
                  />
                </Box>

                {/* Skills */}
                <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                  <SkillsSection
                    profile={profile}
                    onSave={handleSaveProfile}
                  />
                </Box>

                {/* Experience */}
                <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                  <ExperienceSection
                    profile={profile}
                    onSave={handleSaveProfile}
                  />
                </Box>

                {/* Education */}
                <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                  <EducationSection
                    profile={profile}
                    onSave={handleSaveProfile}
                  />
                </Box>

                {/* Projects */}
                <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                  <ProjectsSection
                    profile={profile}
                    onSave={handleSaveProfile}
                  />
                </Box>

                {/* Certifications */}
                <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                  <CertificationsSection
                    profile={profile}
                    onSave={handleSaveProfile}
                  />
                </Box>

                {/* Achievements */}
                <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                  <AchievementsSection
                    profile={profile}
                    onSave={handleSaveProfile}
                  />
                </Box>
              </Box>
            </Box>
          )}

          {activeTab === 1 && (
            <ResumeBuilder
              initialData={{
                basicInfo: {
                  firstName: profile.first_name,
                  lastName: profile.last_name,
                  professionalTitle: "",
                  email: profile.email,
                  phone: profile.phone_number,
                  location: "",
                  photo: profile.profile_picture,
                  summary: profile.bio,
                },
              }}
            />
          )}
          </Container>
        </Box>
      </Box>
    </MainLayout>
  );
}
