"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Container, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { SearchFilterBar } from "@/components/common/list";
import { Reveal } from "@/components/scorecard/shared";
import { PanelCard, SectionHeader, StatBox } from "@/components/dashboard/v2/parts";
import { RoadmapCard } from "@/components/roadmaps/RoadmapCard";
import { CompanyRoadmapCard } from "@/components/roadmaps/CompanyRoadmapCard";
import {
  roadmapKeys,
  roadmapsService,
  type RoadmapCard as Card,
} from "@/lib/services/roadmaps.service";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";

/**
 * The roadmap catalog.
 *
 * Built from the dashboard's own primitives -- `PanelCard`, `SectionHeader`, `StatBox`, and its
 * main-plus-rail grid -- so the two surfaces read as one product rather than as two designs.
 * The previous version was a bare grid on white, which is why it looked unfinished next to
 * every other page.
 *
 * A category is not a flat filtered list, it is a curated set of editorial sections: the same
 * roadmap appearing under several headings is the feature, because it optimises for the learner
 * finding it from wherever they started looking.
 *
 * Companies get a panel of their own ABOVE the rest. They answer a different question ("who am
 * I interviewing with") than the rest of the catalog ("what do I want to learn"), and a learner
 * with a drive next week should not have to know which category we filed Accenture under.
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
    // Company name is searched explicitly: "tcs" must find the TCS roadmap even though the
    // page title is "TCS Placement Preparation" and the summary may never repeat the name.
    return (
      r.pageTitle.toLowerCase().includes(q) ||
      r.summary.toLowerCase().includes(q) ||
      (r.company?.displayName ?? "").toLowerCase().includes(q)
    );
  };
  const matches = (slug: string) => matchesCard(bySlug[slug]);

  const all = data?.roadmaps ?? [];
  const companies = useMemo(() => all.filter((r) => r.kind === "company" && r.company), [all]);

  // The company panel is their home on the "all" view only. Once a learner picks a category the
  // grid below is what they are reading, so the panel would be the same cards twice on screen.
  const onAllView = (active?.slug ?? "all") === "all";
  const visibleCompanies = onAllView ? companies.filter(matchesCard) : [];
  const panelSlugs = new Set(visibleCompanies.map((r) => r.slug));

  const totalTopics = all.reduce((n, r) => n + (r.topicCount || 0), 0);

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
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 340px" },
            gap: 2.5,
            alignItems: "start",
          }}
        >
          {/* ---------------------------------------------------------------- main */}
          <Box sx={{ minWidth: 0 }}>
            <SearchFilterBar
              search={query}
              onSearchChange={setQuery}
              searchPlaceholder="Search roadmaps and companies"
            />

            {isLoading && (
              <Typography sx={{ mt: 4, color: "#64748b" }}>Loading roadmaps...</Typography>
            )}

            {isError && (
              <Typography sx={{ mt: 4, color: "#b91c1c" }}>
                We could not load the roadmaps. Please try again.
              </Typography>
            )}

            {!isLoading && !isError && all.length === 0 && (
              <PanelCard sx={{ mt: 2.5 }}>
                <Stack alignItems="center" spacing={1.5} sx={{ py: 6, textAlign: "center" }}>
                  <Icon icon="solar:map-point-wave-bold-duotone" width={44} color="#cbd5e1" />
                  <Typography sx={{ fontWeight: 800, color: "#0f172a" }}>
                    No roadmaps yet
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: "#64748b", maxWidth: 380 }}>
                    Your institution has not published any roadmaps. Once they do, they will
                    appear here.
                  </Typography>
                </Stack>
              </PanelCard>
            )}

            {visibleCompanies.length > 0 && (
              <PanelCard sx={{ mt: 2.5 }}>
                <SectionHeader
                  icon="solar:buildings-2-bold-duotone"
                  title="Prepare for a company"
                  subtitle="The real hiring process, round by round, with the questions that round asks"
                  gradient="linear-gradient(135deg, #0ea5e9, #6366f1)"
                />
                <Box
                  sx={{
                    display: "grid",
                    gap: 1.5,
                    gridTemplateColumns: {
                      xs: "repeat(2, minmax(0, 1fr))",
                      md: "repeat(3, minmax(0, 1fr))",
                      xl: "repeat(4, minmax(0, 1fr))",
                    },
                  }}
                >
                  {visibleCompanies.map((roadmap, idx) => (
                    <Reveal key={roadmap.slug} delay={Math.min(idx, 8) * 0.05}>
                      <CompanyRoadmapCard
                        roadmap={roadmap}
                        onOpen={() => push(`/roadmaps/${roadmap.slug}`)}
                        onHover={() => prefetch(`/roadmaps/${roadmap.slug}`)}
                      />
                    </Reveal>
                  ))}
                </Box>
              </PanelCard>
            )}

            {!isLoading &&
              active?.sections.map((section) => {
                const visible = section.roadmaps
                  .filter(matches)
                  .filter((slug) => !panelSlugs.has(slug));
                if (!visible.length) return null;
                const isCompanySection = visible.every(
                  (slug) => bySlug[slug]?.kind === "company"
                );
                return (
                  <PanelCard key={section.title}>
                    <SectionHeader
                      icon={
                        isCompanySection
                          ? "solar:buildings-2-bold-duotone"
                          : "solar:layers-minimalistic-bold-duotone"
                      }
                      title={section.title}
                      subtitle={`${visible.length} ${visible.length === 1 ? "roadmap" : "roadmaps"}`}
                    />
                    <Box
                      sx={{
                        display: "grid",
                        gap: 1.5,
                        gridTemplateColumns: isCompanySection
                          ? {
                              xs: "repeat(2, minmax(0, 1fr))",
                              md: "repeat(3, minmax(0, 1fr))",
                              xl: "repeat(4, minmax(0, 1fr))",
                            }
                          : {
                              xs: "1fr",
                              sm: "repeat(2, minmax(0, 1fr))",
                              xl: "repeat(3, minmax(0, 1fr))",
                            },
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
                          <Reveal key={slug} delay={Math.min(idx, 8) * 0.05}>
                            <Component
                              roadmap={roadmap}
                              onOpen={() => push(`/roadmaps/${slug}`)}
                              onHover={() => prefetch(`/roadmaps/${slug}`)}
                            />
                          </Reveal>
                        );
                      })}
                    </Box>
                  </PanelCard>
                );
              })}
          </Box>

          {/* ---------------------------------------------------------------- rail */}
          {!isLoading && all.length > 0 && (
            <Stack spacing={2} sx={{ position: { lg: "sticky" }, top: { lg: 16 } }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 1.5,
                }}
              >
                <StatBox
                  label="Roadmaps"
                  value={all.length}
                  icon="solar:map-point-wave-bold-duotone"
                  accent="#7c3aed"
                />
                <StatBox
                  label="Companies"
                  value={companies.length}
                  icon="solar:buildings-2-bold-duotone"
                  accent="#0ea5e9"
                />
                {/* Spans the row: three real numbers beat four tiles where one is a slogan.
                    A "Practice: Scored" tile was filling this slot with a label dressed as a
                    statistic, which is the exact thing the company stat panel exists to avoid. */}
                <Box sx={{ gridColumn: "1 / -1" }}>
                  <StatBox
                    label="Steps"
                    value={totalTopics.toLocaleString()}
                    sub="verified topics you can be scored on"
                    icon="solar:checklist-minimalistic-bold-duotone"
                    accent="#059669"
                  />
                </Box>
              </Box>

              <PanelCard sx={{ mb: 0 }} data-tour-id="roadmap-categories">
                <SectionHeader
                  icon="solar:widget-4-bold-duotone"
                  title="Browse by category"
                  subtitle="The same roadmap can sit under several"
                />
                <Stack spacing={0.25}>
                  {categories.map((c) => {
                    const count = new Set(c.sections.flatMap((s) => s.roadmaps)).size;
                    const isActive = c.slug === active?.slug;
                    return (
                      <Box
                        key={c.slug}
                        component="button"
                        onClick={() => setCategory(c.slug)}
                        sx={{
                          appearance: "none",
                          font: "inherit",
                          cursor: "pointer",
                          border: "none",
                          textAlign: "start",
                          width: "100%",
                          px: 1.25,
                          py: 1,
                          borderRadius: 2,
                          bgcolor: isActive ? "#f5f3ff" : "transparent",
                          color: isActive ? "#5b21b6" : "#475569",
                          fontWeight: isActive ? 800 : 500,
                          fontSize: 13.5,
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 1.5,
                          "&:hover": { bgcolor: isActive ? "#f5f3ff" : "#f8fafc" },
                        }}
                      >
                        <span>{c.title}</span>
                        <Box
                          component="span"
                          sx={{ color: isActive ? "#7c3aed" : "#94a3b8", fontWeight: 700 }}
                        >
                          {count}
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </PanelCard>
            </Stack>
          )}
        </Box>
      </Container>
    </PageShell>
  );
}
