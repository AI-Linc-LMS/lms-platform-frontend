"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type {
  RoadmapGraph,
  RoadmapNode,
  RoadmapProgress,
} from "@/lib/services/roadmaps.service";

/**
 * The map.
 *
 * Deliberately CSS, not a graph library. roadmap.sh hand-places absolute pixel coordinates on a
 * fixed-width canvas (1097px for /frontend), which is why their map is not responsive and why
 * their contributors cannot edit topology at all. Our layout derives from (parent, order), so a
 * centre spine with branch cards gives the same visual read while staying responsive, inheriting
 * RTL from `dir`, and scrolling normally on a phone instead of fighting the page for pan
 * gestures.
 *
 * Colour follows roadmap.sh's one genuinely good rule: the node fill carries PROGRESS, so
 * hierarchy is expressed by size and weight only. Text decoration doubles the signal so state
 * survives for colour-blind readers.
 */

const STATE_STYLE = {
  done: { bg: "#ecfdf5", border: "#6ee7b7", text: "#065f46", deco: "line-through" },
  learning: { bg: "#f5f3ff", border: "#c4b5fd", text: "#5b21b6", deco: "underline" },
  skipped: { bg: "#f1f5f9", border: "#cbd5e1", text: "#64748b", deco: "line-through" },
  pending: { bg: "#ffffff", border: "#e6e8ef", text: "#0f172a", deco: "none" },
} as const;

function NodeCard({
  node,
  progress,
  onOpen,
}: {
  node: RoadmapNode;
  progress?: RoadmapProgress["nodes"][number];
  onOpen: () => void;
}) {
  const state = progress?.selfState ?? "pending";
  const style = STATE_STYLE[state];
  const verified = progress?.verifiedComplete;
  const units = progress ? `${progress.unitsComplete}/${progress.unitsTotal}` : null;

  return (
    <Box
      component="button"
      onClick={onOpen}
      sx={{
        appearance: "none",
        font: "inherit",
        cursor: "pointer",
        width: "100%",
        textAlign: "start",
        px: 1.75,
        py: 1.25,
        borderRadius: 2.5,
        bgcolor: style.bg,
        border: `1.5px solid ${style.border}`,
        transition: "transform .15s ease, box-shadow .15s ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 20px rgba(15,23,42,.08)" },
        "&:focus-visible": { outline: "2px solid #7c3aed", outlineOffset: 2 },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography
          sx={{
            flex: 1,
            fontSize: node.kind === "subtopic" ? 13 : 14.5,
            fontWeight: node.kind === "subtopic" ? 500 : 700,
            color: style.text,
            textDecoration: style.deco,
          }}
        >
          {node.title}
        </Typography>
        {verified && (
          <Icon icon="solar:verified-check-bold" width={17} color="#059669" aria-label="Verified complete" />
        )}
        {!node.isRequired && (
          <Chip label="Optional" size="small"
            sx={{ height: 18, fontSize: 10, bgcolor: "#f1f5f9", color: "#64748b" }} />
        )}
      </Stack>
      {units && progress!.unitsTotal > 0 && (
        <Typography sx={{ mt: 0.4, fontSize: 11, color: "#64748b" }}>
          {units} topics done
        </Typography>
      )}
    </Box>
  );
}

export function RoadmapSpine({
  graph,
  progress,
  onOpenNode,
}: {
  graph: RoadmapGraph;
  progress?: RoadmapProgress;
  onOpenNode: (node: RoadmapNode) => void;
}) {
  // Sections are the milestone nodes; everything else hangs off one of them by parentId.
  const sections = graph.nodes
    .filter((n) => n.kind === "milestone")
    .sort((a, b) => a.order - b.order);
  const childrenOf = (id: number) =>
    graph.nodes.filter((n) => n.parentId === id).sort((a, b) => a.order - b.order);

  // A roadmap with no milestones is still renderable: treat every root node as its own row.
  const orphans = graph.nodes
    .filter((n) => n.kind !== "milestone" && n.parentId === null)
    .sort((a, b) => a.order - b.order);

  return (
    <Box sx={{ position: "relative", py: 2 }}>
      {sections.map((section, i) => {
        const children = childrenOf(section.id);
        return (
          <Box key={section.id} sx={{ position: "relative", mb: 4 }}>
            {/* The connector. A pseudo-rail behind the content rather than a drawn node, so it
                cannot desynchronise from the actual structure the way roadmap.sh's decorative
                line-segment nodes do. */}
            {i < sections.length - 1 && (
              <Box
                aria-hidden
                sx={{
                  position: "absolute",
                  insetInlineStart: { xs: 15, md: "50%" },
                  top: 34,
                  bottom: -34,
                  width: 2,
                  bgcolor: "#e6e8ef",
                  transform: { md: "translateX(-50%)" },
                }}
              />
            )}

            <Stack
              direction="row"
              alignItems="center"
              spacing={1.25}
              sx={{
                position: "relative",
                justifyContent: { md: "center" },
                mb: 2,
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "#140b2b",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  flexShrink: 0,
                  zIndex: 1,
                }}
              >
                {i + 1}
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: 17, color: "#0f172a" }}>
                {section.title}
              </Typography>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gap: 1.25,
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                ml: { xs: 4.5, md: 0 },
                maxWidth: { md: 860 },
                mx: { md: "auto" },
              }}
            >
              {children.map((node) => (
                <NodeCard
                  key={node.id}
                  node={node}
                  progress={progress?.nodes?.[node.id]}
                  onOpen={() => onOpenNode(node)}
                />
              ))}
            </Box>
          </Box>
        );
      })}

      {orphans.length > 0 && (
        <Box
          sx={{
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            maxWidth: { md: 860 },
            mx: { md: "auto" },
          }}
        >
          {orphans.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              progress={progress?.nodes?.[node.id]}
              onOpen={() => onOpenNode(node)}
            />
          ))}
        </Box>
      )}

      {graph.legends.length > 0 && (
        <Stack
          direction="row"
          spacing={2}
          flexWrap="wrap"
          useFlexGap
          sx={{ mt: 3, justifyContent: "center" }}
        >
          {graph.legends.map((lg) => (
            <Stack key={lg.id} direction="row" alignItems="center" spacing={0.75}>
              <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: lg.color }} />
              <Typography sx={{ fontSize: 12, color: "#64748b" }}>{lg.label}</Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </Box>
  );
}
