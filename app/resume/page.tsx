"use client";

import { useEffect, useState } from "react";
import { ProfileLockBanner } from "@/components/common/ProfileLock";
import { useModuleLocked } from "@/lib/contexts/ProfileGateContext";
import { Box, CircularProgress } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { ResumeBuilder } from "@/components/profile/resume/ResumeBuilder";
import { ResumeHero } from "@/components/profile/resume/ResumeHero";
import { profileService, UserProfile } from "@/lib/services/profile.service";
import { buildResumeInitialData } from "@/lib/utils/buildResumeInitialData";

/**
 * Standalone Resume Builder route, reachable directly from the sidebar.
 * Leads with a dashboard-style hero, then the builder seeded from the user's
 * saved profile (same mapping as the /profile Resume tab); the builder still
 * works if the profile fetch fails.
 */
export default function ResumePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { showLock, reportError: reportProfileLock } = useModuleLocked("resume");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await profileService.getUserProfile();
        if (alive) setProfile(data);
      } catch (err) {
        // Was swallowed entirely, which is part of why nothing appeared on this page at all.
        reportProfileLock(err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // No early return any more. Building a resume is exactly the work that fills a profile in,
  // so blocking the builder to demand a complete profile had the dependency backwards. The
  // builder stays fully usable; only Save and PDF are gated, which is where the profile
  // actually matters because that is what leaves the product.

  return (
    <MainLayout fullWidthContent>
      <ResumeHero />

      {showLock && <ProfileLockBanner moduleLabel="Resume" />}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ResumeBuilder
          initialData={profile ? buildResumeInitialData(profile) : undefined}
          lockExports={showLock}
        />
      )}
    </MainLayout>
  );
}
