"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Container, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { SearchFilterBar } from "@/components/common/list";
import { Reveal } from "@/components/scorecard/shared";
import { RoadmapCard } from "@/components/roadmaps/RoadmapCard";
import { CompanyRoadmapCard } from "@/components/roadmaps/CompanyRoadmapCard";
import { RM } from "@/components/roadmaps/roadmapTokens";
import {
  roadmapKeys,
  roadmapsService,
  type RoadmapCard as Card,
} from "@/lib/services/roadmaps.service";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";

/**
 * The roadmap catalog.
 *
 * A category is not a flat filtered list, it is a curated set of editorial sections. That is
 * the one idea worth taking wholesale from roadmap.sh: the same roadmap appearing under several
 * headings is the feature, not a bug, because it optimises for the learner finding it from
 * wherever they started looking.
 *
 * Companies get a rail of their own ABOVE the category grid rather than a section inside it.
 * They are chosen by a different question -- "who am I interviewing with" rather than "what do
 * I want to learn" -- and a learner who arrives with a drive next week should not have to know
 * which category we filed Accenture under. They remain in the grid too, so nothing is reachable
 * from only one place.
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

  const companies = useMemo(
    () => (data?.roadmaps ?? []).filter((r) => r.kind === "company" && r.company),
    [data]
  );
  const visibleCompanies = companies.filter(matchesCard);

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

        {!isLoading && !isError && (data?.roadmaps?.length ?? 0) === 0 && (
          <Stack alignItems="center" spacing={1.5} sx={{ py: 8, textAlign: "center" }}>
            <Icon icon="solar:map-point-wave-bold-duotone" width={44} color="#cbd5e1" />
            <Typography sx={{ fontWeight: 700, color: "#0f172a" }}>
              No roadmaps yet
            </Typography>
            <Typography sx={{ fontSize: 14, color: "#64748b", maxWidth: 380 }}>
              Your institution has not published any roadmaps. Once they do, they will appear here.
            </Typography>
          </Stack>
        )}

        {/* Company rail. Hidden entirely when a tenant holds no company roadmaps, rather than
            rendered as an empty heading. */}
        {!isLoading && visibleCompanies.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Stack
              direction="row"
              alignItems="baseline"
              spacing={1.25}
              sx={{ mb: 1.5, flexWrap: "wrap" }}
            >
              <Box
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: 1.5,
                  border: RM.border,
                  boxShadow: RM.shadow(2),
                  bgcolor: "#c4b5fd",
                  display: "grid",
                  placeItems: "center",
                  color: RM.ink,
                  alignSelf: "center",
                }}
              >
                <Icon icon="solar:buildings-2-bold-duotone" width={15} />
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: 17, color: RM.ink }}>
                Prepare for a company
              </Typography>
              <Typography sx={{ fontSize: 13, color: "#64748b" }}>
                The real hiring process, round by round, with the questions that round asks.
              </Typography>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gap: 1.75,
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  sm: "repeat(3, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
                  xl: "repeat(5, minmax(0, 1fr))",
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

            <Box
              sx={{
                mt: 3.5,
                mb: 0.5,
                height: 1,
                bgcolor: "#e6e8ef",
              }}
            />
          </Box>
        )}

        {!isLoading && categories.length > 0 && (
          <Box
            sx={{
              mt: 2.5,
              display: "grid",
              gap: 3,
              gridTemplateColumns: { xs: "1fr", md: "220px minmax(0, 1fr)" },
            }}
          >
            {/* Category rail. Horizontal scroll on mobile rather than a dropdown, so the
                breadth of what is on offer is visible rather than hidden behind a tap. */}
            <Box
              data-tour-id="roadmap-categories"
              sx={{
                display: "flex",
                flexDirection: { xs: "row", md: "column" },
                gap: 0.5,
                overflowX: { xs: "auto", md: "visible" },
                pb: { xs: 1, md: 0 },
              }}
            >
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
                      whiteSpace: "nowrap",
                      px: 1.5,
                      py: 1,
                      borderRadius: 2,
                      bgcolor: isActive ? "#f1f5f9" : "transparent",
                      color: isActive ? "#0f172a" : "#475569",
                      fontWeight: isActive ? 700 : 500,
                      fontSize: 13.5,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 1.5,
                      "&:hover": { bgcolor: "#f8fafc" },
                    }}
                  >
                    <span>{c.title}</span>
                    <Box component="span" sx={{ color: "#94a3b8", fontWeight: 500 }}>
                      {count}
                    </Box>
                  </Box>
                );
              })}
            </Box>

            <Box>
              {active?.sections.map((section) => {
                const visible = section.roadmaps.filter(matches);
                if (!visible.length) return null;
                const isCompanySection = visible.every(
                  (slug) => bySlug[slug]?.kind === "company"
                );
                return (
                  <Box key={section.title} sx={{ mb: 3.5 }}>
                    <Typography
                      sx={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        letterSpacing: 0.6,
                        textTransform: "uppercase",
                        color: "#94a3b8",
                        mb: 1.25,
                      }}
                    >
                      {section.title}
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gap: 1.75,
                        gridTemplateColumns: isCompanySection
                          ? {
                              xs: "repeat(2, minmax(0, 1fr))",
                              sm: "repeat(3, minmax(0, 1fr))",
                              lg: "repeat(4, minmax(0, 1fr))",
                            }
                          : {
                              xs: "1fr",
                              sm: "repeat(2, minmax(0, 1fr))",
                              lg: "repeat(3, minmax(0, 1fr))",
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
                          <Reveal key={slug} delay={Math.min(idx, 8) * 0.06}>
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
            </Box>
          </Box>
        )}
      </Container>
    </PageShell>
  );
}
