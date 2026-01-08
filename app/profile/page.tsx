"use client";

import { useEffect, useState } from "react";
import { Box, Container, Tabs, Tab } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { Loading } from "@/components/common/Loading";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { PersonalInformationCard } from "@/components/profile/PersonalInformationCard";
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

  if (loading) {
    return (
      <MainLayout>
        <Loading fullScreen />
      </MainLayout>
    );
  }

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

  return (
    <MainLayout>
      <Box
        sx={{
          width: "100%",
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2, sm: 3 },
          maxWidth: "1400px",
          mx: "auto",
        }}
      >
        <Container maxWidth="lg" disableGutters>
          {/* Profile Header */}
          <ProfileHeader
            userName={profile.first_name + " " + profile.last_name}
            profilePicUrl={profile.profile_picture}
            role={profile.role || "Student"}
          />

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "1rem",
                  minHeight: 48,
                  color: "#6b7280",
                  "&.Mui-selected": {
                    color: "#6366f1",
                  },
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "#6366f1",
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
                gridTemplateColumns: { xs: "1fr", md: "300px 1fr" },
                gap: 3,
              }}
            >
              {/* Left Column */}
              <Box>
                {/* User Details */}
                <UserDetailsCard
                  username={profile.username}
                  emailAddress={profile.email}
                  socialLinks={profile.social_links}
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
              </Box>

              {/* Right Column */}
              <Box>
                {/* Personal Information */}
                <PersonalInformationCard
                  profile={profile}
                  onSave={handleSaveProfile}
                />

                {/* Activity Heatmap */}
                <ActivityHeatmap heatmapData={heatmapData} />
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
    </MainLayout>
  );
}
