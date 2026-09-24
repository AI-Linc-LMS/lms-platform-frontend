"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Container, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { RoadmapSpine } from "@/components/roadmaps/RoadmapSpine";
import { ForgeProgressDialog } from "@/components/roadmaps/ForgeProgressDialog";
import { BuildCourseDrawer } from "@/components/roadmaps/BuildCourseDrawer";
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
  const queryClient = useQueryClient();
  const [job, setJob] = useState<ForgeJob | null>(null);
  const [forgeError, setForgeError] = useState<string | null>(null);
  // The node the learner is CONSIDERING. Clicking opens the drawer to read about it; building is
  // a second, explicit action, because one click on a map you are still reading should not start
  // writing rows.
  const [pending, setPending] = useState<RoadmapNode | null>(null);
  const [building, setBuilding] = useState(false);

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
    setBuilding(true);
    try {
      const created = await forgeService.create({ nodeId: node.id });
      setJob(created);
      setPending(null);
      // The map now carries a mark per step, so it has to learn about this build. Without this
      // the learner who just built a course would come back to an unmarked step and be offered
      // the same build again - which is the bug this whole change is about, one reload later.
      queryClient.invalidateQueries({ queryKey: roadmapKeys.owned(slug) });
    } catch (err) {
      setForgeError(
        err instanceof ForgeUnavailableError
          ? err.message
          : "Something went wrong starting that build."
      );
    } finally {
      setBuilding(false);
    }
  };

  const graphQuery = useQuery({
    queryKey: roadmapKeys.graph(slug),
    queryFn: () => roadmapsService.graph(slug),
    enabled: Boolean(slug),
    staleTime: 30 * 60 * 1000,
  });

  const graph = graphQuery.data;

  /**
   * Which steps the learner already has a course for.
   *
   * ONE request for the whole map, never one per node - the biggest shipped map is 210 steps.
   * Separate from the graph because the graph is identical for every learner in the tenant and
   * cached for half an hour; this is per learner and changes the moment they build something.
   */
  const ownedQuery = useQuery({
    queryKey: roadmapKeys.owned(slug),
    queryFn: () => roadmapsService.owned(slug),
    enabled: Boolean(slug),
    staleTime: 60 * 1000,
  });
  const owned = ownedQuery.data?.nodes;

  /**
   * What a click does.
   *
   * A step you already have goes STRAIGHT to the course. The mark on the node has already said
   * "this is yours", so re-stating it in a dialog after the click is the redundancy the report
   * was about: the learner was being asked "Create a course on this?", pressing yes, and being
   * told no. Everything else still opens the reading drawer, because building is a real
   * commitment and one click on a map you are still reading should not start writing rows.
   *
   * The dialog's "you already have this" branch STAYS in place. It is still reachable - a build
   * started in another tab, a free-text build from the search bar, an overlay that has not
   * refetched - and in those cases it is the honest thing to show.
   */
  const openNode = (node: RoadmapNode) => {
    if (!node.isTrackable) return;
    const mine = owned?.[node.id];
    if (mine) {
      push(`/adaptive-courses/${mine.courseId}`);
      return;
    }
    setPending(node);
  };

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
            owned={owned}
            onOpenNode={openNode}
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

      <BuildCourseDrawer
        slug={slug}
        node={pending}
        busy={building}
        onClose={() => setPending(null)}
        onBuild={buildFromNode}
      />

      <ForgeProgressDialog job={job} open={Boolean(job)} onClose={() => setJob(null)} />
    </PageShell>
  );
}
