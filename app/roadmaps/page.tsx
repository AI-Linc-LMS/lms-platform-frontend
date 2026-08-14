"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Container, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { RoadmapIndex } from "@/components/roadmaps/RoadmapIndex";
import { Surface } from "@/components/roadmaps/surfaces";
import { CreateCourseBar } from "@/components/roadmaps/CreateCourseBar";
import { ForgeProgressDialog } from "@/components/roadmaps/ForgeProgressDialog";
import {
  ForgeUnavailableError,
  forgeService,
  roadmapKeys,
  roadmapsService,
  type ForgeJob,
  type RoadmapCard as Card,
} from "@/lib/services/roadmaps.service";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";

/**
 * The roadmap catalog.
 *
 * Built on the assessment-management language: CSS custom-property tokens (so it inherits
 * tenant theming), a segmented tab track for the taxonomy, and hairline surfaces. Depth comes
 * from the surface ladder, never from drop shadows, and no card lifts or blurs a backdrop on
 * hover -- see `components/roadmaps/surfaces.tsx` for the two rules.
 *
 * Categories are TABS rather than a left rail. The rail cost 220px of the widest content on
 * the page to render six words, and it competed with the sidebar immediately beside it.
 *
 * Companies sit in their own section at the END. They answer a different question ("who am I
 * interviewing with") than the rest of the catalog ("what do I want to learn"), so they are
 * kept separate rather than filed under a category; but the catalog is a learning surface
 * first, so the skills come before the recruiters.
 *
 * There is no stat row. "9 roadmaps / 9 companies / 468 steps" restated what the page below
 * already shows and pushed the actual content down a screen.
 */
export default function RoadmapsPage() {
  const { push, prefetch } = useInstantNavigation();

  const { data, isLoading, isError } = useQuery({
    queryKey: roadmapKeys.catalog,
    queryFn: roadmapsService.catalog,
    staleTime: 5 * 60 * 1000,
  });

  const bySlug = useMemo(
    () => Object.fromEntries((data?.roadmaps ?? []).map((r) => [r.slug, r])),
    [data]
  );

  const categories = data?.categories ?? [];
  // Always the "all" view: the taxonomy tabs are gone, so every section is on one page.
  const active = categories.find((c) => c.slug === "all") ?? categories[0];

  const all = data?.roadmaps ?? [];


  const [job, setJob] = useState<ForgeJob | null>(null);
  const [building, setBuilding] = useState(false);
  const [forgeError, setForgeError] = useState<string | null>(null);

  const createFromPrompt = async (prompt: string) => {
    setForgeError(null);
    setBuilding(true);
    try {
      setJob(await forgeService.create({ prompt }));
    } catch (err) {
      // A 422 is the expected "we have nothing for that" answer, not a crash: it carries a
      // sentence written for the learner, so show it rather than a generic failure.
      setForgeError(
        err instanceof ForgeUnavailableError
          ? err.message
          : "Something went wrong starting that build."
      );
    } finally {
      setBuilding(false);
    }
  };


  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Learn"
        title="Roadmaps"
        description="Pick a path and follow it. Every step is a verified topic you can practise and be scored on."
        accent="purple"
        icon="solar:map-point-wave-bold-duotone"
        guideKey="roadmaps"
      />

      <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, md: 3 }, pb: { xs: "180px", md: "132px" } }}>
        {isLoading && (
          <Typography sx={{ mt: 4, color: "var(--font-tertiary)" }}>
            Loading roadmaps...
          </Typography>
        )}

        {isError && (
          <Typography sx={{ mt: 4, color: "var(--accent-red)" }}>
            We could not load the roadmaps. Please try again.
          </Typography>
        )}

        {!isLoading && !isError && all.length === 0 && (
          <Surface sx={{ mt: 2.5 }}>
            <Stack alignItems="center" spacing={1.5} sx={{ py: 6, textAlign: "center" }}>
              <Icon
                icon="solar:map-point-wave-linear"
                width={40}
                color="var(--font-tertiary)"
              />
              <Typography sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
                No roadmaps yet
              </Typography>
              <Typography
                sx={{ fontSize: "0.85rem", color: "var(--font-tertiary)", maxWidth: 380 }}
              >
                Your institution has not published any roadmaps. Once they do, they will appear
                here.
              </Typography>
            </Stack>
          </Surface>
        )}

        {/* Every path on one screen. Sections keep the editorial grouping; the entries
            themselves are single rows, so the whole catalogue is visible without scrolling. */}
        {!isLoading &&
          active?.sections.map((section) => {
            const entries = section.roadmaps
              .map((slug) => bySlug[slug])
              .filter(Boolean) as Card[];
            if (!entries.length) return null;
            const isCompanySection = entries.every((r) => r.kind === "company");
            return (
              <RoadmapIndex
                key={section.title}
                title={section.title}
                icon={
                  isCompanySection
                    ? "solar:buildings-2-linear"
                    : "solar:layers-minimalistic-linear"
                }
                roadmaps={entries}
                onOpen={(slug) => push(`/roadmaps/${slug}`)}
                onHover={(slug) => prefetch(`/roadmaps/${slug}`)}
              />
            );
          })}

        {forgeError && (
          <Typography
            sx={{ mt: 2, fontSize: "0.88rem", color: "var(--accent-red)", textAlign: "center" }}
          >
            {forgeError}
          </Typography>
        )}

        {!isLoading && all.length > 0 && (
          <CreateCourseBar
            roadmaps={all}
            busy={building}
            onSubmit={createFromPrompt}
            onPickRoadmap={(slug) => push(`/roadmaps/${slug}`)}
          />
        )}
      </Container>

      <ForgeProgressDialog job={job} open={Boolean(job)} onClose={() => setJob(null)} />
    </PageShell>
  );
}
