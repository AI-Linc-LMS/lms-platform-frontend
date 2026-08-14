"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Container, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { RoadmapSpine } from "@/components/roadmaps/RoadmapSpine";
import { RoadmapNodeDrawer } from "@/components/roadmaps/RoadmapNodeDrawer";
import { RoadmapFaqs } from "@/components/roadmaps/RoadmapFaqs";
import { CompanyHiringProcess } from "@/components/roadmaps/CompanyHiringProcess";
import { CompanyQuickStats } from "@/components/roadmaps/CompanyQuickStats";
import {
  roadmapKeys,
  roadmapsService,
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
  const queryClient = useQueryClient();
  const { push } = useInstantNavigation();
  const [openNode, setOpenNode] = useState<RoadmapNode | null>(null);

  const graphQuery = useQuery({
    queryKey: roadmapKeys.graph(slug),
    queryFn: () => roadmapsService.graph(slug),
    enabled: Boolean(slug),
    staleTime: 30 * 60 * 1000,
  });

  const progressQuery = useQuery({
    queryKey: roadmapKeys.progress(slug),
    queryFn: () => roadmapsService.progress(slug),
    enabled: Boolean(slug),
    staleTime: 30 * 1000,
  });

  const setState = useMutation({
    mutationFn: ({ nodeId, state }: { nodeId: number; state: SelfState }) =>
      roadmapsService.setNodeState(slug, nodeId, state),
    // Optimistic: marking a node is a pure annotation, so a round-trip before the UI reacts
    // makes bulk self-assessment feel broken.
    onMutate: async ({ nodeId, state }) => {
      await queryClient.cancelQueries({ queryKey: roadmapKeys.progress(slug) });
      const previous = queryClient.getQueryData<RoadmapProgress>(roadmapKeys.progress(slug));
      if (previous) {
        // Marking a SPINE step cascades to the branches it rolls up (the server does the same),
        // so the optimistic view has to cascade too or the bar jumps when the response lands.
        const cascade = (graphQuery.data?.nodes ?? [])
          .filter((n) => n.parentId === nodeId && n.isTrackable)
          .map((n) => n.id);
        const nodes = { ...previous.nodes };
        for (const id of [nodeId, ...cascade]) {
          if (nodes[id]) nodes[id] = { ...nodes[id], selfState: state };
        }
        // Only LEAF nodes are in the server's denominator, so counting spine nodes here made the
        // optimistic bar disagree with the value that arrived a moment later. `isLeaf` is the
        // discriminator the server already sends for exactly this.
        const declared = Object.values(nodes).filter((n) => n.isLeaf !== false);
        const done = declared.filter((n) => n.selfState === "done").length;
        const skipped = declared.filter((n) => n.selfState === "skipped").length;
        queryClient.setQueryData<RoadmapProgress>(roadmapKeys.progress(slug), {
          ...previous,
          nodes,
          done,
          skipped,
          coverage: previous.total ? (done + skipped) / previous.total : 0,
          // mastery is intentionally NOT recomputed here: it is derived from real submissions
          // on the server and no client action may move it.
        });
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(roadmapKeys.progress(slug), ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: roadmapKeys.progress(slug) });
    },
  });

  const graph = graphQuery.data;
  const progress = progressQuery.data;

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
              mastery={progress?.mastery}
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
            progress={progress}
            onOpenNode={setOpenNode}
            onSetNodeState={(node, state) => setState.mutate({ nodeId: node.id, state })}
            onOpenRoadmap={(s) => push(`/roadmaps/${s}`)}
          />
        )}

        {graph?.faqs && graph.faqs.length > 0 && <RoadmapFaqs faqs={graph.faqs} />}
      </Container>

      <RoadmapNodeDrawer
        slug={slug}
        node={openNode}
        selfState={(openNode && progress?.nodes?.[openNode.id]?.selfState) || "pending"}
        onClose={() => setOpenNode(null)}
        onSetState={(state) =>
          openNode && setState.mutate({ nodeId: openNode.id, state })
        }
      />
    </PageShell>
  );
}
