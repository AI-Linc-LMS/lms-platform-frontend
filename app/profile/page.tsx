"use client";

import { useCallback, useEffect, useState } from "react";
import { discardStrandedProfile, readStrandedProfile } from "@/lib/utils/profile-cache";
import { readProfileSaveError } from "@/lib/utils/profileSaveError";
import { StrandedProfileNotice } from "@/components/profile/StrandedProfileNotice";
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

/** A stranded value is worth offering only where it differs from what the server holds. */
function strandedAgainst(apiProfile: UserProfile): Partial<UserProfileUpdate> | null {
  const local = readStrandedProfile<UserProfileUpdate>();
  if (!local) return null;
  const server = apiProfile as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(local)) {
    // Only plain scalars. A stranded `experience` array would have to be reconciled entry by
    // entry against what is stored, and guessing at that is how work gets overwritten.
    if (typeof value !== "string" && typeof value !== "number") continue;
    if (isEmptyValue(value)) continue;
    if (String(server[key] ?? "") === String(value)) continue;
    out[key] = value;
  }
  return Object.keys(out).length ? (out as Partial<UserProfileUpdate>) : null;
}

export default function ProfilePage() {
  const { t } = useTranslation("common");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  /** Exactly what GET user-profile last returned: what is actually ON the server, which is what
   * the profile strength percentage is measured against. `profile` also carries edits that a
   * failed save left on screen for the learner to retry, and those are not saved facts. */
  const [profileFromApi, setProfileFromApi] = useState<UserProfile | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData>({});
  const [activeTab, setActiveTab] = useState(0);
  /**
   * The document the Saved resumes tab has asked the builder to open, and the builder's answer.
   *
   * Edit lives on the list and opening lives in the builder, so the request crosses the two tabs
   * through here. Both tabs stay mounted, which is what makes this work at all: switching to the
   * Resume tab hands the builder the id rather than throwing away whatever is in it.
   */
  const [documentToOpen, setDocumentToOpen] = useState<number | null>(null);
  const [openDocumentId, setOpenDocumentId] = useState<number | null>(null);
  /** Bumped when the list changes, so the builder reloads its own copy of it. */
  const [documentsToken, setDocumentsToken] = useState(0);
  /**
   * Edits an older build wrote to this browser and never got onto the server.
   *
   * Read once, shown, never merged. See StrandedProfileNotice and lib/utils/profile-cache.ts.
   */
  const [stranded, setStranded] = useState<Partial<UserProfileUpdate> | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { clientInfo } = useClientInfo();
  // Same gate as /resume: the builder stays editable, only Save and PDF lock.
  const { showLock: resumeLocked } = useModuleLocked("resume");

  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true);
      // In parallel: the heatmap was serialized behind the profile fetch for
      // no reason, doubling this page's time-to-content.
      const [profileResult, heatmapResult] = await Promise.allSettled([
        profileService.getUserProfile(),
        profileService.getUserActivityHeatmap(),
      ]);
      if (profileResult.status === "rejected") throw profileResult.reason;
      const profileData = profileResult.value;
      setProfileFromApi(profileData);
      // The server's answer, and nothing else. This used to be merged with a localStorage
      // copy of the learner's edits, which made data the server had never accepted keep
      // looking saved for as long as they stayed in this browser.
      setProfile(profileData);
      if (heatmapResult.status === "fulfilled") {
        setHeatmapData(heatmapResult.value.heatmap_data ?? {});
      }
      setStranded(strandedAgainst(profileData));
      // Heatmap failure is non-fatal, same as before.
    } catch {
      showToast(t("profile.failedToLoad"), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    void loadProfileData();
  }, [loadProfileData]);

  /**
   * `?tab=saved` opens this page on the Saved resumes tab. The Resume builder links here with
   * it, so "where are my saved resumes" is answerable with a link rather than an instruction.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "saved") setActiveTab(2);
    else if (tab === "resume") setActiveTab(1);
  }, []);

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

  /**
   * Save to the server. There is no second place for this to go.
   *
   * What it used to do: write the learner's edits to `localStorage` FIRST, unconditionally, then
   * try the server, and on failure say "Profile saved locally" as an *info* toast and swallow the
   * error. Nothing ever told the learner their work was not on their account, the next page load
   * merged the local copy back over the API profile so it kept looking saved, and the section
   * that asked for the save saw a resolved promise and closed its editor.
   *
   * What it does now: one destination, the truth reported either way, and the error re-thrown so
   * the section that asked can keep its editor open and point at the field the server named. The
   * typed values stay on screen - in React state, not persisted - so the learner can fix and
   * retry rather than lose what they wrote.
   */
  const handleSaveProfile = async (updatedProfile: UserProfileUpdate) => {
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
    } catch (error) {
      // Keep what they typed on screen. Losing a learner's text to report a failure would be a
      // worse bug than the one being reported - but this is React state only, and `profileFromApi`
      // still says what the server actually holds.
      setProfile((prev) => {
        if (!prev) return null;
        const merged = { ...prev, ...updatedProfile };
        merged.profile_picture = merged.profile_picture ?? "";
        return merged as UserProfile;
      });
      const { message } = readProfileSaveError(error, t("profile.saveFailed"));
      showToast(t("profile.saveFailedWithReason", { reason: message }), "error");
      // Re-thrown: the section knows which fields it just sent, so it is the one that can keep
      // its editor open and mark them. Swallowing it here is what made every editor close on a
      // save that never happened.
      throw error;
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
          // MainLayout already reserves 72px at the bottom of a phone for the fixed nav.
          // Adding another 48px here left the page ending in 120px of nothing.
          pb: { xs: 1, md: 6 },
          px: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 },
          pt: { xs: 2.5, md: 3.5 },
          /**
           * Every section on this page edits something, and each one opens with a
           * `size="small"` Button or IconButton - 30px and 34px respectively. The audit
           * counted 15 targets under 40px. Rather than repeat a breakpoint in a dozen
           * section components, the surface states its own floor once: on a phone a
           * control you have to hit is at least 40px in both directions. Above `sm`
           * nothing here applies, so the desktop layout is untouched.
           */
          "@media (max-width:599.95px)": {
            "& .MuiButton-sizeSmall": { minHeight: 40, paddingTop: "6px", paddingBottom: "6px" },
            "& .MuiIconButton-sizeSmall": { minWidth: 40, minHeight: 40 },
            // Only chips you can press (or delete). A display-only badge is not a target and
            // keeps its authored height.
            "& .MuiChip-sizeSmall.MuiChip-clickable, & .MuiChip-sizeSmall.MuiChip-deletable": { height: 32 },
          },
        }}
      >
        <ProfileBriefingHero
          profile={profileFromApi ?? profile}
          coverPhotoUrl={profile.cover_photo_url}
          onJumpTo={jumpTo}
        />

        {stranded && (
          <StrandedProfileNotice
            fields={Object.entries(stranded).map(([key, value]) => ({
              key,
              label: key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()),
              value: String(value),
            }))}
            onSave={async () => {
              try {
                await handleSaveProfile(stranded as UserProfileUpdate);
                discardStrandedProfile();
                setStranded(null);
              } catch {
                // handleSaveProfile has already said what the server refused. The notice stays,
                // and so does the stored copy, so nothing is lost by a save that did not work.
              }
            }}
            onDiscard={() => {
              discardStrandedProfile();
              setStranded(null);
            }}
          />
        )}

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
          <ResumeBuilder
            initialData={buildResumeInitialData(profile)}
            lockExports={resumeLocked}
            openDocumentId={documentToOpen}
            onDocumentOpened={() => setDocumentToOpen(null)}
            onOpenDocumentChange={setOpenDocumentId}
            documentsToken={documentsToken}
            onShowSavedResumes={() => setActiveTab(2)}
          />
        </Box>

        <Box sx={{ display: activeTab === 2 ? "block" : "none", width: "100%" }}>
          <SavedResumesSection
            isActive={activeTab === 2}
            openDocumentId={openDocumentId}
            onEditDocument={(id) => {
              // Tab first, then the id: the builder reads it in an effect, and it must be on a
              // visible tab by then or the learner watches nothing happen.
              setActiveTab(1);
              setDocumentToOpen(id);
            }}
            onDocumentsChanged={() => setDocumentsToken((v) => v + 1)}
          />
        </Box>
      </Box>
    </MainLayout>
  );
}
