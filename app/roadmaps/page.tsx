"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Container, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { SearchFilterBar, SegmentedTabs } from "@/components/common/list";
import { Reveal } from "@/components/scorecard/shared";
import { RoadmapCard } from "@/components/roadmaps/RoadmapCard";
import { CompanyRoadmapCard } from "@/components/roadmaps/CompanyRoadmapCard";
import { SectionHeading, Surface } from "@/components/roadmaps/surfaces";
import {
  roadmapKeys,
  roadmapsService,
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
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");

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
  const active = categories.find((c) => c.slug === category) ?? categories[0];

  const q = query.trim().toLowerCase();
  const matchesCard = (r?: Card) => {
    if (!q) return true;
    if (!r) return false;
    // Company name is matched explicitly: "tcs" must find a roadmap whose title is "TCS
    // Placement Preparation" and whose summary may never repeat the name.
    return (
      r.pageTitle.toLowerCase().includes(q) ||
      r.summary.toLowerCase().includes(q) ||
      (r.company?.displayName ?? "").toLowerCase().includes(q)
    );
  };
  const matches = (slug: string) => matchesCard(bySlug[slug]);

  const all = data?.roadmaps ?? [];
  const companies = useMemo(() => all.filter((r) => r.kind === "company" && r.company), [all]);

  const onAllView = (active?.slug ?? "all") === "all";
  const visibleCompanies = onAllView ? companies.filter(matchesCard) : [];
  const claimed = new Set(visibleCompanies.map((r) => r.slug));

  const tabs = categories.map((c) => ({
    value: c.slug,
    label: c.title,
    count: new Set(c.sections.flatMap((s) => s.roadmaps)).size,
  }));

  const companyGrid = {
    xs: "repeat(2, minmax(0, 1fr))",
    sm: "repeat(3, minmax(0, 1fr))",
    lg: "repeat(4, minmax(0, 1fr))",
    xl: "repeat(5, minmax(0, 1fr))",
  };
  const roadmapGrid = {
    xs: "repeat(2, minmax(0, 1fr))",
    sm: "repeat(3, minmax(0, 1fr))",
    lg: "repeat(4, minmax(0, 1fr))",
    xl: "repeat(5, minmax(0, 1fr))",
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

      <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, md: 3 } }}>
        <Stack spacing={1.5} sx={{ mb: 1 }}>
          <SearchFilterBar
            search={query}
            onSearchChange={setQuery}
            searchPlaceholder="Search roadmaps and companies"
          />
          {tabs.length > 1 && (
            <Box data-tour-id="roadmap-categories">
              <SegmentedTabs tabs={tabs} value={active?.slug ?? "all"} onChange={setCategory} />
            </Box>
          )}
        </Stack>

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

        {!isLoading &&
          active?.sections.map((section) => {
            const visible = section.roadmaps
              .filter(matches)
              .filter((slug) => !claimed.has(slug));
            if (!visible.length) return null;
            const isCompanySection = visible.every((slug) => bySlug[slug]?.kind === "company");
            return (
              <Box key={section.title} sx={{ mt: 3 }}>
                <SectionHeading
                  icon={
                    isCompanySection
                      ? "solar:buildings-2-linear"
                      : "solar:layers-minimalistic-linear"
                  }
                  title={section.title}
                  count={visible.length}
                />
                <Box
                  sx={{
                    display: "grid",
                    gap: 1.5,
                    gridTemplateColumns: isCompanySection ? companyGrid : roadmapGrid,
                  }}
                >
                  {visible.map((slug, idx) => {
                    const roadmap = bySlug[slug];
                    if (!roadmap) return null;
                    const Component =
                      roadmap.kind === "company" && roadmap.company
                        ? CompanyRoadmapCard
                        : RoadmapCard;
                    return (
                      <Reveal key={slug} delay={Math.min(idx, 8) * 0.04}>
                        <Component
                          roadmap={roadmap}
                          onOpen={() => push(`/roadmaps/${slug}`)}
                          onHover={() => prefetch(`/roadmaps/${slug}`)}
                        />
                      </Reveal>
                    );
                  })}
                </Box>
              </Box>
            );
          })}

        {visibleCompanies.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <SectionHeading
              icon="solar:buildings-2-linear"
              title="Prepare for a company"
              count={visibleCompanies.length}
              noun="company"
            />
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: companyGrid }}>
              {visibleCompanies.map((roadmap, idx) => (
                <Reveal key={roadmap.slug} delay={Math.min(idx, 8) * 0.04}>
                  <CompanyRoadmapCard
                    roadmap={roadmap}
                    onOpen={() => push(`/roadmaps/${roadmap.slug}`)}
                    onHover={() => prefetch(`/roadmaps/${roadmap.slug}`)}
                  />
                </Reveal>
              ))}
            </Box>
          </Box>
        )}
      </Container>
    </PageShell>
  );
}
