"use client";

/**
 * TEMPORARY geometry-verification fixture (routable twin of app/__geom, which Next.js treats as a
 * private folder because of the leading underscore and therefore never routes).
 * Mounts the real RoadmapSpine with a deterministic synthetic graph so a headless browser can
 * measure the drawn trail against the node boxes. Deleted after verification.
 */

import { Box, Container } from "@mui/material";
import { RoadmapSpine } from "@/components/roadmaps/RoadmapSpine";
import type {
  RoadmapGraph,
  RoadmapProgress,
  SelfState,
} from "@/lib/services/roadmaps.service";

const LONG =
  "Understanding the browser rendering pipeline and how layout, paint and composite interact";
const MED = "Server side rendering and hydration";
const SHORT_TITLES = ["Git", "npm", "CSS", "DNS", "TCP"];

/** leaf counts per step position: 0, 1, 2, 3, 5 */
const LEAF_COUNTS = [0, 1, 2, 3, 5];

const SECTION_TITLES = [
  "Internet",
  "HTML",
  "CSS",
  "JavaScript",
  "Version Control Systems",
  "Web Security Knowledge",
  "Build Tools and Module Bundlers",
];

function titleFor(kind: "step" | "leaf", s: number, t: number, b = 0) {
  const pick = (s * 5 + t * 3 + b) % 5;
  if (kind === "step") {
    if (pick === 0) return SHORT_TITLES[(s + t) % SHORT_TITLES.length];
    if (pick === 1) return LONG;
    if (pick === 2) return MED;
    return `Step ${s + 1}.${t + 1} Fundamentals`;
  }
  if (pick === 0) return SHORT_TITLES[(s + b) % SHORT_TITLES.length];
  if (pick === 1) return LONG;
  if (pick === 2) return "Content Delivery Networks";
  if (pick === 3) return "Web Vitals";
  return `Leaf ${b + 1}`;
}

function bigGraph(): RoadmapGraph {
  const nodes: RoadmapGraph["nodes"] = [];
  const edges: RoadmapGraph["edges"] = [];
  let id = 1;
  for (let s = 0; s < 7; s++) {
    const sectionId = id++;
    nodes.push({
      id: sectionId,
      slug: `sec-${s}`,
      title: SECTION_TITLES[s],
      kind: "milestone",
      order: nodes.length,
      parentId: null,
      isRequired: true,
      isTrackable: false,
      legendId: null,
    });
    for (let t = 0; t < 5; t++) {
      const stepId = id++;
      nodes.push({
        id: stepId,
        slug: `step-${s}-${t}`,
        title: titleFor("step", s, t),
        kind: "topic",
        order: nodes.length,
        parentId: sectionId,
        isRequired: !(t === 4 && s % 2 === 0),
        isTrackable: true,
        legendId: null,
      });
      const n = LEAF_COUNTS[t];
      for (let b = 0; b < n; b++) {
        nodes.push({
          id: id++,
          slug: `br-${s}-${t}-${b}`,
          title: titleFor("leaf", s, t, b),
          kind: "subtopic",
          order: nodes.length,
          parentId: stepId,
          isRequired: true,
          isTrackable: true,
          legendId: null,
        });
      }
    }
  }
  const steps = nodes.filter((n) => n.kind === "topic");
  edges.push({ from: steps[0].id, to: steps[7].id, kind: "depends" });
  edges.push({ from: steps[2].id, to: steps[11].id, kind: "depends" });
  return {
    slug: "frontend",
    cardTitle: "Frontend",
    pageTitle: "Frontend Developer",
    kind: "role",
    summary: "",
    version: 1,
    nodes,
    edges,
    legends: [{ id: 1, label: "Core path", color: "#7c3aed" }],
    related: [],
    faqs: [],
  };
}

function progressFor(g: RoadmapGraph): RoadmapProgress {
  const nodes: RoadmapProgress["nodes"] = {};
  g.nodes.forEach((n, i) => {
    const state: SelfState =
      i % 9 === 0 ? "done" : i % 13 === 0 ? "skipped" : i % 17 === 0 ? "learning" : "pending";
    nodes[n.id] = {
      selfState: state,
      isLeaf: n.kind === "subtopic",
      verifiedComplete: i % 23 === 0,
      unitsComplete: 1,
      unitsTotal: 1,
      hasContentGap: false,
    };
  });
  return {
    total: 100,
    done: 12,
    skipped: 4,
    learning: 3,
    mastered: 5,
    coverage: 0.16,
    mastery: 0.05,
    contentGaps: 0,
    nodes,
  };
}

const GRAPH = bigGraph();
const PROGRESS = progressFor(GRAPH);

export default function GeomVerifyPage() {
  return (
    <Box sx={{ bgcolor: "#fbfbfd", minHeight: "100vh", py: 3 }} data-geom-root="1">
      <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, md: 3 } }}>
        <RoadmapSpine graph={GRAPH} progress={PROGRESS} onOpenNode={() => {}} />
      </Container>
    </Box>
  );
}
