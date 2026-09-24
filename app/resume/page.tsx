"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProfileLockBanner } from "@/components/common/ProfileLock";
import { useModuleLocked } from "@/lib/contexts/ProfileGateContext";
import { Box, CircularProgress } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { ResumeBuilder } from "@/components/profile/resume/ResumeBuilder";
import { ResumeHero } from "@/components/profile/resume/ResumeHero";
import { profileService, UserProfile } from "@/lib/services/profile.service";
import { buildResumeInitialData } from "@/lib/utils/buildResumeInitialData";

/**
 * `/resume?doc=<id>` opens that saved resume. The Saved resumes tab on /profile does its editing
 * in the builder beside it, so this is for links that arrive from anywhere else - and it lands on
 * the same `openDocumentId` the tab uses, rather than being a second way into the builder.
 */
function ResumePageBody() {
  const searchParams = useSearchParams();
  const docParam = Number(searchParams.get("doc"));
  const requestedDocumentId = Number.isInteger(docParam) && docParam > 0 ? docParam : null;
  const [documentToOpen, setDocumentToOpen] = useState<number | null>(requestedDocumentId);
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
          openDocumentId={documentToOpen}
          onDocumentOpened={() => setDocumentToOpen(null)}
        />
      )}
    </MainLayout>
  );
}

/**
 * Standalone Resume Builder route, reachable directly from the sidebar.
 * Leads with a dashboard-style hero, then the builder seeded from the user's
 * saved profile (same mapping as the /profile Resume tab); the builder still
 * works if the profile fetch fails.
 *
 * useSearchParams needs a Suspense boundary above it, or this route cannot be prerendered at all.
 * The fallback is the page's own spinner, which is what it showed while the profile loaded anyway.
 */
export default function ResumePage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      }
    >
      <ResumePageBody />
    </Suspense>
  );
}
