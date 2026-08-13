"use client";

/**
 * TEMPORARY tab-order / geometry probe. Deleted after verification.
 *
 * Mounts the REAL RoadmapSpine with the same graph shape the committed test calls
 * "shaped like the shipped Frontend roadmap" (5 sections x 5 steps x 6 branches), with
 * globally unique titles so a headless browser can map DOM/tab order onto measured boxes.
 */

import { Box, Container } from "@mui/material";
import { RoadmapSpine } from "@/components/roadmaps/RoadmapSpine";
import type { RoadmapGraph, RoadmapProgress } from "@/lib/services/roadmaps.service";

function bigGraph(): RoadmapGraph {
  const nodes: RoadmapGraph["nodes"] = [];
  const edges: RoadmapGraph["edges"] = [];
  let id = 1;
  for (let s = 0; s < 5; s++) {
    const sectionId = id++;
    nodes.push({
      id: sectionId, slug: `sec-${s}`, title: `Section ${s + 1}`, kind: "milestone",
      order: nodes.length, parentId: null, isRequired: true, isTrackable: false, legendId: null,
    });
    for (let t = 0; t < 5; t++) {
      const stepId = id++;
      nodes.push({
        id: stepId, slug: `step-${s}-${t}`, title: `S${s}T${t}`, kind: "topic",
        order: nodes.length, parentId: sectionId, isRequired: t < 4, isTrackable: true,
        legendId: null,
      });
      for (let b = 0; b < 6; b++) {
        nodes.push({
          id: id++, slug: `br-${s}-${t}-${b}`, title: `S${s}T${t}L${b}`, kind: "subtopic",
          order: nodes.length, parentId: stepId, isRequired: true, isTrackable: true,
          legendId: null,
        });
      }
    }
  }
  const steps = nodes.filter((n) => n.kind === "topic");
  edges.push({ from: steps[0].id, to: steps[7].id, kind: "depends" });
  return {
    slug: "frontend", cardTitle: "Frontend", pageTitle: "Frontend Developer", kind: "role",
    summary: "", version: 1, nodes, edges,
    legends: [{ id: 1, label: "Core path", color: "#7c3aed" }],
    related: [], faqs: [],
  };
}

function progressFor(g: RoadmapGraph): RoadmapProgress {
  const nodes: RoadmapProgress["nodes"] = {};
  g.nodes.forEach((n, i) => {
    nodes[n.id] = {
      selfState: i % 7 === 0 ? "done" : i % 11 === 0 ? "skipped" : "pending",
      isLeaf: n.kind === "subtopic",
      verifiedComplete: i % 13 === 0,
      unitsComplete: 1, unitsTotal: 1, hasContentGap: false,
    };
  });
  return {
    total: 100, done: 12, skipped: 4, learning: 3, mastered: 5,
    coverage: 0.16, mastery: 0.05, contentGaps: 0, nodes,
  };
}

const GRAPH = bigGraph();
const PROGRESS = progressFor(GRAPH);

export default function GeomProbePage() {
  return (
    <Box sx={{ bgcolor: "#fbfbfd", minHeight: "100vh", py: 3 }} data-geom-root="1">
      <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, md: 3 } }}>
        <RoadmapSpine graph={GRAPH} progress={PROGRESS} onOpenNode={() => {}} />
      </Container>
    </Box>
  );
}
