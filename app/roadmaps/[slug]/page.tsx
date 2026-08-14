"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { useQuery } from "@tanstack/react-query";
import { Box, Container, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { RoadmapSpine } from "@/components/roadmaps/RoadmapSpine";
import { ForgeProgressDialog } from "@/components/roadmaps/ForgeProgressDialog";
import { RoadmapFaqs } from "@/components/roadmaps/RoadmapFaqs";
import { CompanyHiringProcess } from "@/components/roadmaps/CompanyHiringProcess";
import { CompanyQuickStats } from "@/components/roadmaps/CompanyQuickStats";
import {
  ForgeUnavailableError,
  forgeService,
  roadmapKeys,
  roadmapsService,
  type ForgeJob,
  type RoadmapNode,
  type RoadmapProgress,
  type SelfState,
} from "@/lib/services/roadmaps.service";

/**
 * One roadmap.
 *
 * The graph and the progress overlay are two queries on purpose: the graph is identical for
 * every learner in the tenant and cached hard, the overlay is per learner and invalidated on
 * every state write.
 */

export default function RoadmapDetailPage() {
  const params = useParams();
  const slug = String(params?.slug ?? "");
  const { push } = useInstantNavigation();
  const [job, setJob] = useState<ForgeJob | null>(null);
  const [forgeError, setForgeError] = useState<string | null>(null);

  /**
   * Clicking a step now BUILDS a course from it rather than opening a reading drawer.
   *
   * The roadmap is a place to choose what to learn; the learning happens in an adaptive course
   * assembled from the same verified material the node already points at. A milestone is not a
   * unit of study, so only trackable nodes are actionable.
   */
  const buildFromNode = async (node: RoadmapNode) => {
    if (!node.isTrackable) return;
    setForgeError(null);
    try {
      setJob(await forgeService.create({ nodeId: node.id }));
    } catch (err) {
      setForgeError(
        err instanceof ForgeUnavailableError
          ? err.message
          : "Something went wrong starting that build."
      );
    }
  };

  const graphQuery = useQuery({
    queryKey: roadmapKeys.graph(slug),
    queryFn: () => roadmapsService.graph(slug),
    enabled: Boolean(slug),
    staleTime: 30 * 60 * 1000,
  });

  const graph = graphQuery.data;

  if (graphQuery.isError) {
    return (
      <PageShell>
        <Container sx={{ py: 8, textAlign: "center" }}>
          <Icon icon="solar:map-point-wave-bold-duotone" width={44} color="#cbd5e1" />
          <Typography sx={{ mt: 1.5, fontWeight: 700, color: "#0f172a" }}>
            Roadmap not found
          </Typography>
          <Typography sx={{ mt: 0.5, fontSize: 14, color: "#64748b" }}>
            It may not be published for your institution.
          </Typography>
        </Container>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Roadmap"
        title={graph?.pageTitle ?? "Roadmap"}
        description={graph?.summary}
        accent="purple"
        icon="solar:map-point-wave-bold-duotone"
      />

      <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, md: 3 } }}>
        {graphQuery.isLoading && (
          <Typography sx={{ py: 4, color: "#64748b" }}>Loading roadmap...</Typography>
        )}

        {/* Company preamble: the format and the funnel, above the map. A candidate needs to
            know what the process IS before a map of it means anything.

            Full width and stacked, NOT a main-plus-rail split: the stats are short values and
            the funnel is a handful of stages, so a 300px rail beside them left most of the
            page empty. */}
        {graph?.company && (
          <Stack spacing={2.5} sx={{ mb: 3 }}>
            <CompanyQuickStats
              company={graph.company}
              content={graph.content}
            />
            <CompanyHiringProcess
              stages={graph.company.hiringProcess}
              syllabus={graph.company.syllabus}
            />
          </Stack>
        )}

        {graph && (
          <RoadmapSpine
            graph={graph}
            onOpenNode={buildFromNode}
            onOpenRoadmap={(s) => push(`/roadmaps/${s}`)}
          />
        )}

        {forgeError && (
          <Typography
            sx={{ mt: 2, fontSize: "0.88rem", color: "var(--accent-red)", textAlign: "center" }}
          >
            {forgeError}
          </Typography>
        )}

        {graph?.faqs && graph.faqs.length > 0 && <RoadmapFaqs faqs={graph.faqs} />}
      </Container>

      <ForgeProgressDialog job={job} open={Boolean(job)} onClose={() => setJob(null)} />
    </PageShell>
  );
}
